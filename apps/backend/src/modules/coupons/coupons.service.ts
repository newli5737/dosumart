import { Injectable } from '@nestjs/common';
import { CouponType } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const items = await this.prisma.coupon.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return { data: items.map((c) => ({ ...c, value: Number(c.value), minOrderValue: Number(c.minOrderValue) })) };
  }

  async create(data: {
    code: string;
    type: CouponType;
    value: number;
    minOrderValue?: number;
    usageLimit?: number;
    startAt: string;
    endAt: string;
  }) {
    const item = await this.prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        type: data.type,
        value: data.value,
        minOrderValue: data.minOrderValue || 0,
        usageLimit: data.usageLimit,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
      },
    });
    return { data: item };
  }
}
