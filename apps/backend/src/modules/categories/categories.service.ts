import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const items = await this.prisma.category.findMany({
      where: { deletedAt: null },
      include: { children: { where: { deletedAt: null } } },
      orderBy: { name: 'asc' },
    });
    const roots = items.filter((c) => !c.parentId);
    return { data: roots };
  }

  async create(data: { name: string; parentId?: string }) {
    const slug = slugify(data.name);
    const item = await this.prisma.category.create({
      data: { name: data.name, slug: `${slug}-${Date.now().toString(36)}`, parentId: data.parentId },
    });
    return { data: item };
  }

  async update(id: string, data: { name?: string; parentId?: string }) {
    const item = await this.prisma.category.update({ where: { id }, data });
    return { data: item };
  }

  async softDelete(id: string) {
    await this.prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Đã xóa danh mục' };
  }
}

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const items = await this.prisma.brand.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
    return { data: items };
  }

  async create(data: { name: string }) {
    const slug = slugify(data.name);
    const item = await this.prisma.brand.create({
      data: { name: data.name, slug: `${slug}-${Date.now().toString(36)}` },
    });
    return { data: item };
  }

  async update(id: string, data: { name: string }) {
    const item = await this.prisma.brand.update({ where: { id }, data });
    return { data: item };
  }

  async softDelete(id: string) {
    await this.prisma.brand.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Đã xóa thương hiệu' };
  }
}
