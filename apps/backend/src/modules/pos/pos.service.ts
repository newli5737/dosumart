import { Injectable, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderChannel, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { OrderCreatedEvent } from '../orders/orders.service';
import { generateUniqueOrderCode } from '../../shared/utils/order-code.util';

@Injectable()
export class PosService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private eventEmitter: EventEmitter2,
  ) {}

  async openShift(cashierId: string, openingCash: number) {
    const existing = await this.prisma.shift.findFirst({
      where: { cashierId, closedAt: null },
    });
    if (existing) {
      throw new BadRequestException({ code: 'SHIFT_OPEN', message: 'Ca làm việc đang mở' });
    }
    const shift = await this.prisma.shift.create({
      data: { cashierId, openingCash },
    });
    return { data: shift };
  }

  async closeShift(cashierId: string, closingCash: number, note?: string) {
    const shift = await this.prisma.shift.findFirst({
      where: { cashierId, closedAt: null },
      include: { orders: { where: { paymentMethod: PaymentMethod.CASH } } },
    });
    if (!shift) {
      throw new BadRequestException({ code: 'NO_SHIFT', message: 'Không có ca làm việc đang mở' });
    }

    const cashSales = shift.orders.reduce((s, o) => s + Number(o.total), 0);
    const expectedCash = Number(shift.openingCash) + cashSales;

    const updated = await this.prisma.shift.update({
      where: { id: shift.id },
      data: { closingCash, expectedCash, note, closedAt: new Date() },
    });

    return {
      data: {
        ...updated,
        openingCash: Number(updated.openingCash),
        closingCash: Number(updated.closingCash),
        expectedCash: Number(updated.expectedCash),
        difference: closingCash - Number(expectedCash),
      },
    };
  }

  async getCurrentShift(cashierId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: { cashierId, closedAt: null },
      include: { orders: true },
    });
    return { data: shift };
  }

  async createPosOrder(cashierId: string, data: {
    items: Array<{ variantId: string; quantity: number }>;
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    discount?: number;
    couponCode?: string;
    customerId?: string;
    note?: string;
  }) {
    const shift = await this.prisma.shift.findFirst({ where: { cashierId, closedAt: null } });
    if (!shift) {
      throw new BadRequestException({ code: 'NO_SHIFT', message: 'Vui lòng mở ca trước khi bán hàng' });
    }

    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: data.items.map((i) => i.variantId) }, deletedAt: null },
      include: { product: true },
    });

    let subtotal = 0;
    const orderItems = data.items.map((item) => {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) throw new BadRequestException({ code: 'INVALID_VARIANT', message: 'Sản phẩm không hợp lệ' });
      const price = Number(variant.price);
      const lineTotal = price * item.quantity;
      subtotal += lineTotal;
      return {
        variantId: item.variantId,
        productName: variant.product.name,
        sku: variant.sku,
        price,
        costPrice: variant.costPrice ? Number(variant.costPrice) : null,
        quantity: item.quantity,
        lineTotal,
      };
    });

    const discount = data.discount || 0;
    const total = subtotal - discount;
    let cashReceived = data.cashReceived;
    let changeAmount: number | undefined;

    if (data.paymentMethod === PaymentMethod.CASH) {
      if (!cashReceived || cashReceived < total) {
        throw new BadRequestException({ code: 'INSUFFICIENT_CASH', message: 'Tiền khách đưa không đủ' });
      }
      changeAmount = cashReceived - total;
    }

    const isQr = data.paymentMethod === PaymentMethod.BANK_TRANSFER;
    const code = await generateUniqueOrderCode(this.prisma);

    const order = await this.prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          code,
          userId: data.customerId,
          channel: OrderChannel.POS,
          status: isQr ? OrderStatus.PENDING : OrderStatus.COMPLETED,
          paymentMethod: data.paymentMethod,
          paymentStatus: isQr ? PaymentStatus.UNPAID : PaymentStatus.PAID,
          subtotal,
          discount,
          total,
          cashReceived,
          changeAmount,
          couponCode: data.couponCode,
          note: data.note,
          cashierId,
          shiftId: shift.id,
          items: { create: orderItems },
        },
        include: { items: true },
      });
    });

    await this.inventoryService.deductForOrder(
      data.items,
      order.id,
      cashierId,
    );

    this.eventEmitter.emit('order.created', new OrderCreatedEvent(order.id));

    return {
      data: {
        ...order,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        total: Number(order.total),
        cashReceived: order.cashReceived ? Number(order.cashReceived) : null,
        changeAmount: order.changeAmount ? Number(order.changeAmount) : null,
        items: order.items.map((i) => ({
          ...i,
          price: Number(i.price),
          lineTotal: Number(i.lineTotal),
        })),
      },
    };
  }

  async holdOrder(cashierId: string, orderId: string) {
    await this.prisma.order.update({
      where: { id: orderId, cashierId },
      data: { isHeld: true },
    });
    return { message: 'Đã giữ đơn hàng' };
  }

  async getPrintData(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        shift: { include: { cashier: { select: { fullName: true } } } },
      },
    });
    if (!order) throw new BadRequestException({ code: 'NOT_FOUND', message: 'Không tìm thấy đơn hàng' });

    const settings = await this.prisma.storeSetting.findMany();
    const storeMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    return {
      data: {
        store: storeMap,
        order: {
          code: order.code,
          createdAt: order.createdAt,
          cashier: order.shift?.cashier?.fullName,
          items: order.items.map((i) => ({
            productName: i.productName,
            sku: i.sku,
            quantity: i.quantity,
            price: Number(i.price),
            lineTotal: Number(i.lineTotal),
          })),
          subtotal: Number(order.subtotal),
          discount: Number(order.discount),
          total: Number(order.total),
          cashReceived: order.cashReceived ? Number(order.cashReceived) : null,
          changeAmount: order.changeAmount ? Number(order.changeAmount) : null,
          paymentMethod: order.paymentMethod,
        },
      },
    };
  }
}
