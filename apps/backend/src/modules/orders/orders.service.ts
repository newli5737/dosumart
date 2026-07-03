import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderChannel, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { paginate, paginationMeta } from '../../shared/dto/pagination.dto';

export class OrderCreatedEvent {
  constructor(public readonly orderId: string) {}
}

function generateOrderCode() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DH${date}${rand}`;
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true, inventories: true },
            },
          },
        },
      },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              variant: { include: { product: true, inventories: true } },
            },
          },
        },
      });
    }
    return { data: this.mapCart(cart) };
  }

  async addCartItem(userId: string, variantId: string, quantity: number) {
    const cart = await this.ensureCart(userId);
    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });
    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      await this.prisma.cartItem.create({ data: { cartId: cart.id, variantId, quantity } });
    }
    return this.getCart(userId);
  }

  async updateCartItem(userId: string, itemId: string, quantity: number) {
    const cart = await this.ensureCart(userId);
    const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy sản phẩm trong giỏ' });
    if (quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    }
    return this.getCart(userId);
  }

  async removeCartItem(userId: string, itemId: string) {
    const cart = await this.ensureCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    return this.getCart(userId);
  }

  async checkout(userId: string, data: {
    paymentMethod: PaymentMethod;
    shippingAddress?: Record<string, string>;
    couponCode?: string;
    shippingFee?: number;
  }) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { variant: { include: { product: true } } } } },
    });
    if (!cart?.items.length) {
      throw new BadRequestException({ code: 'EMPTY_CART', message: 'Giỏ hàng trống' });
    }

    let subtotal = 0;
    const orderItems = cart.items.map((item) => {
      const price = Number(item.variant.price);
      const lineTotal = price * item.quantity;
      subtotal += lineTotal;
      return {
        variantId: item.variantId,
        productName: item.variant.product.name,
        sku: item.variant.sku,
        price,
        costPrice: item.variant.costPrice ? Number(item.variant.costPrice) : null,
        quantity: item.quantity,
        lineTotal,
      };
    });

    const discount = await this.calcDiscount(data.couponCode, subtotal);
    const shippingFee = data.shippingFee || 0;
    const tax = 0;
    const total = subtotal - discount + shippingFee + tax;

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          code: generateOrderCode(),
          userId,
          channel: OrderChannel.ONLINE,
          status: OrderStatus.PENDING,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentMethod === PaymentMethod.COD ? PaymentStatus.UNPAID : PaymentStatus.UNPAID,
          subtotal,
          discount,
          tax,
          shippingFee,
          total,
          couponCode: data.couponCode,
          shippingAddress: data.shippingAddress,
          items: { create: orderItems },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });

    await this.inventoryService.deductForOrder(
      orderItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      order.id,
      userId,
    );

    this.eventEmitter.emit('order.created', new OrderCreatedEvent(order.id));
    return { data: order };
  }

  async findUserOrders(userId: string, page = 1, limit = 20) {
    const { skip, take } = paginate(page, limit);
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId, deletedAt: null },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.order.count({ where: { userId, deletedAt: null } }),
    ]);
    return { data: items.map(this.mapOrder), meta: paginationMeta(total, page, limit) };
  }

  async findById(id: string, userId?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, deletedAt: null, ...(userId && { userId }) },
      include: { items: true, user: { select: { fullName: true, email: true, phone: true } } },
    });
    if (!order) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy đơn hàng' });
    return { data: this.mapOrder(order) };
  }

  async cancel(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId, deletedAt: null },
      include: { items: true },
    });
    if (!order) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy đơn hàng' });
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException({ code: 'CANNOT_CANCEL', message: 'Không thể hủy đơn hàng này' });
    }
    await this.prisma.order.update({ where: { id }, data: { status: OrderStatus.CANCELLED } });
    return { message: 'Đã hủy đơn hàng' };
  }

  async adminFindAll(query: { page?: number; limit?: number; status?: string; channel?: string; from?: string; to?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const { skip, take } = paginate(page, limit);
    const where: Record<string, unknown> = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.channel) where.channel = query.channel;
    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from && { gte: new Date(query.from) }),
        ...(query.to && { lte: new Date(query.to) }),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { items: true, user: { select: { fullName: true, email: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { data: items.map(this.mapOrder), meta: paginationMeta(total, page, limit) };
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
    this.eventEmitter.emit('order.status.changed', { orderId: id, status });
    return { data: this.mapOrder(order) };
  }

  async bulkUpdateStatus(ids: string[], status: OrderStatus) {
    await this.prisma.order.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { status },
    });
    ids.forEach((id) => this.eventEmitter.emit('order.status.changed', { orderId: id, status }));
    return { data: { updated: ids.length, status } };
  }

  private async ensureCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) cart = await this.prisma.cart.create({ data: { userId } });
    return cart;
  }

  private async calcDiscount(couponCode: string | undefined, subtotal: number) {
    if (!couponCode) return 0;
    const coupon = await this.prisma.coupon.findFirst({
      where: { code: couponCode, isActive: true, deletedAt: null, startAt: { lte: new Date() }, endAt: { gte: new Date() } },
    });
    if (!coupon || Number(coupon.minOrderValue) > subtotal) return 0;
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return 0;
    const value = Number(coupon.value);
    const discount = coupon.type === 'PERCENT' ? (subtotal * value) / 100 : value;
    await this.prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
    return Math.min(discount, subtotal);
  }

  private mapCart(cart: {
    id: string;
    items: Array<{
      id: string;
      quantity: number;
      variant: {
        id: string;
        sku: string;
        price: unknown;
        attributes: unknown;
        product: { name: string; images: string[] };
        inventories: Array<{ quantity: number }>;
      };
    }>;
  }) {
    return {
      id: cart.id,
      items: cart.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        variant: {
          id: item.variant.id,
          sku: item.variant.sku,
          price: Number(item.variant.price),
          attributes: item.variant.attributes,
          stock: item.variant.inventories.reduce((s, i) => s + i.quantity, 0),
          product: item.variant.product,
        },
        lineTotal: Number(item.variant.price) * item.quantity,
      })),
      total: cart.items.reduce((s, i) => s + Number(i.variant.price) * i.quantity, 0),
    };
  }

  private mapOrder(order: {
    id: string;
    code: string;
    status: string;
    channel: string;
    paymentMethod: string;
    paymentStatus: string;
    subtotal: unknown;
    discount: unknown;
    tax: unknown;
    shippingFee: unknown;
    total: unknown;
    createdAt: Date;
    items: Array<{
      id: string;
      productName: string;
      sku: string;
      price: unknown;
      quantity: number;
      lineTotal: unknown;
    }>;
    user?: { fullName: string; email: string } | null;
  }) {
    return {
      ...order,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      tax: Number(order.tax),
      shippingFee: Number(order.shippingFee),
      total: Number(order.total),
      items: order.items.map((i) => ({
        ...i,
        price: Number(i.price),
        lineTotal: Number(i.lineTotal),
      })),
    };
  }
}
