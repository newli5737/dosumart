import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from './orders.service';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class OrderListeners {
  private readonly logger = new Logger(OrderListeners.name);

  constructor(private prisma: PrismaService) {}

  @OnEvent('order.created')
  async handleOrderCreated(event: OrderCreatedEvent) {
    this.logger.log(`Đơn hàng mới: ${event.orderId}`);
    const order = await this.prisma.order.findUnique({ where: { id: event.orderId } });
    if (!order) return;

    const date = new Date(order.createdAt);
    date.setHours(0, 0, 0, 0);

    await this.prisma.dailySales.upsert({
      where: { date_channel: { date, channel: order.channel } },
      create: {
        date,
        channel: order.channel,
        orderCount: 1,
        revenue: order.total,
        profit: 0,
      },
      update: {
        orderCount: { increment: 1 },
        revenue: { increment: order.total },
      },
    });
  }

  @OnEvent('order.status.changed')
  handleStatusChanged(payload: { orderId: string; status: string }) {
    this.logger.log(`Đơn ${payload.orderId} → ${payload.status}`);
  }
}
