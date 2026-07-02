import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async revenue(from?: string, to?: string, groupBy = 'day') {
    const where: Record<string, unknown> = {};
    if (from || to) {
      where.date = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }

    const items = await this.prisma.dailySales.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return {
      data: items.map((i) => ({
        date: i.date,
        channel: i.channel,
        orderCount: i.orderCount,
        revenue: Number(i.revenue),
        profit: Number(i.profit),
        groupBy,
      })),
    };
  }

  async topProducts(limit = 10) {
    const items = await this.prisma.orderItem.groupBy({
      by: ['productName', 'sku'],
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    return {
      data: items.map((i) => ({
        productName: i.productName,
        sku: i.sku,
        quantitySold: i._sum.quantity,
        revenue: Number(i._sum.lineTotal),
      })),
    };
  }
}

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = {
      role: 'CUSTOMER' as const,
      deletedAt: null,
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
