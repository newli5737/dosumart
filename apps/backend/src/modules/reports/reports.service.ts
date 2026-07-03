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

  async profitBySupplier() {
    const txs = await this.prisma.inventoryTransaction.findMany({
      where: { type: 'IMPORT', supplierId: { not: null } },
      include: { supplier: { select: { id: true, name: true, code: true } } },
    });

    const map = new Map<string, {
      supplier: { id: string; name: string; code: string };
      importQty: number;
      importValue: number;
      transactionCount: number;
    }>();

    for (const tx of txs) {
      if (!tx.supplierId || !tx.supplier) continue;
      const qty = Math.abs(tx.quantity);
      const value = qty * Number(tx.unitCost || 0);
      const existing = map.get(tx.supplierId);
      if (existing) {
        existing.importQty += qty;
        existing.importValue += value;
        existing.transactionCount += 1;
      } else {
        map.set(tx.supplierId, {
          supplier: tx.supplier,
          importQty: qty,
          importValue: value,
          transactionCount: 1,
        });
      }
    }

    return {
      data: Array.from(map.values())
        .map((r) => ({ ...r, importValue: Math.round(r.importValue) }))
        .sort((a, b) => b.importValue - a.importValue),
    };
  }

  async productMargins() {
    const variants = await this.prisma.productVariant.findMany({
      where: { deletedAt: null, product: { deletedAt: null } },
      include: {
        product: { select: { name: true, isActive: true } },
        inventories: { select: { quantity: true } },
      },
      orderBy: { product: { name: 'asc' } },
    });

    return {
      data: variants.map((v) => {
        const price = Number(v.price);
        const cost = Number(v.costPrice || 0);
        const stock = v.inventories.reduce((s, i) => s + i.quantity, 0);
        const profit = price - cost;
        const marginPct = price > 0 ? Math.round((profit / price) * 100) : 0;
        return {
          variantId: v.id,
          productName: v.product.name,
          sku: v.sku,
          price,
          costPrice: cost,
          profit,
          marginPct,
          stock,
          isActive: v.product.isActive,
        };
      }),
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
