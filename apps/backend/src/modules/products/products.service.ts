import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { paginate, paginationMeta } from '../../shared/dto/pagination.dto';

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    brand?: string;
    sort?: string;
    featured?: boolean;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const { skip, take } = paginate(page, limit);

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      isActive: true,
      ...(query.featured && { isFeatured: true }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { slug: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...(query.category && { category: { slug: query.category } }),
      ...(query.brand && { brand: { slug: query.brand } }),
    };

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sort === 'price_asc') orderBy = { basePrice: 'asc' };
    if (query.sort === 'price_desc') orderBy = { basePrice: 'desc' };
    if (query.sort === 'newest') orderBy = { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          variants: {
            where: { deletedAt: null },
            include: { inventories: true },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: items.map((p) => this.mapProduct(p)),
      meta: paginationMeta(total, page, limit),
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null, isActive: true },
      include: {
        category: true,
        brand: true,
        variants: {
          where: { deletedAt: null },
          include: { inventories: true },
        },
        reviews: {
          where: { deletedAt: null },
          include: { user: { select: { fullName: true } } },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    return product ? this.mapProduct(product) : null;
  }

  async adminFindAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const { skip, take } = paginate(page, limit);

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { slug: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...(query.status === 'active' && { isActive: true }),
      ...(query.status === 'inactive' && { isActive: false }),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          brand: true,
          variants: { where: { deletedAt: null }, include: { inventories: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: items.map((p) => this.mapProduct(p)),
      meta: paginationMeta(total, page, limit),
    };
  }

  async create(data: {
    name: string;
    description?: string;
    categoryId: string;
    brandId?: string;
    images?: string[];
    basePrice: number;
    isActive?: boolean;
    isFeatured?: boolean;
    variants?: Array<{
      sku: string;
      barcode?: string;
      attributes: Record<string, string>;
      price: number;
      costPrice?: number;
      initialStock?: number;
    }>;
  }) {
    const slug = slugify(data.name) + '-' + Date.now().toString(36);
    const warehouse = await this.getDefaultWarehouse();

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          categoryId: data.categoryId,
          brandId: data.brandId,
          images: data.images || [],
          basePrice: data.basePrice,
          isActive: data.isActive ?? true,
          isFeatured: data.isFeatured ?? false,
        },
      });

      const variants = data.variants?.length
        ? data.variants
        : [{
            sku: `${slug}-default`,
            attributes: {},
            price: data.basePrice,
            initialStock: 0,
          }];

      for (const v of variants) {
        const variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: v.sku,
            barcode: v.barcode,
            attributes: v.attributes,
            price: v.price,
            costPrice: v.costPrice,
          },
        });

        if (v.initialStock && v.initialStock > 0) {
          await tx.inventory.create({
            data: { warehouseId: warehouse.id, variantId: variant.id, quantity: v.initialStock },
          });
          await tx.inventoryTransaction.create({
            data: {
              warehouseId: warehouse.id,
              variantId: variant.id,
              type: 'IMPORT',
              quantity: v.initialStock,
              note: 'Tồn kho ban đầu',
            },
          });
        } else {
          await tx.inventory.create({
            data: { warehouseId: warehouse.id, variantId: variant.id, quantity: 0 },
          });
        }
      }

      return this.findById(product.id);
    });
  }

  async update(id: string, data: Partial<{
    name: string;
    description: string;
    categoryId: string;
    brandId: string;
    images: string[];
    basePrice: number;
    isActive: boolean;
    isFeatured: boolean;
  }>) {
    await this.prisma.product.update({
      where: { id },
      data: { ...data, ...(data.name && { slug: undefined }) },
    });
    return this.findById(id);
  }

  async softDelete(id: string) {
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { message: 'Đã xóa sản phẩm' };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        brand: true,
        variants: { where: { deletedAt: null }, include: { inventories: true } },
      },
    });
    return product ? this.mapProduct(product) : null;
  }

  async searchForPos(q?: string, barcode?: string) {
    const where: Prisma.ProductVariantWhereInput = { deletedAt: null, product: { deletedAt: null, isActive: true } };
    if (barcode) where.barcode = barcode;
    if (q) {
      where.OR = [
        { sku: { contains: q, mode: 'insensitive' } },
        { barcode: { contains: q, mode: 'insensitive' } },
        { product: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const variants = await this.prisma.productVariant.findMany({
      where,
      take: 20,
      include: {
        product: { include: { category: true } },
        inventories: true,
      },
    });

    return variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      barcode: v.barcode,
      price: Number(v.price),
      attributes: v.attributes,
      stock: v.inventories.reduce((s, i) => s + i.quantity, 0),
      product: {
        id: v.product.id,
        name: v.product.name,
        images: v.product.images,
      },
    }));
  }

  private mapProduct(product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    images: string[];
    basePrice: Prisma.Decimal;
    isActive: boolean;
    isFeatured: boolean;
    category?: { id: string; name: string; slug: string } | null;
    brand?: { id: string; name: string; slug: string } | null;
    variants?: Array<{
      id: string;
      sku: string;
      barcode: string | null;
      attributes: Prisma.JsonValue;
      price: Prisma.Decimal;
      costPrice: Prisma.Decimal | null;
      inventories: Array<{ quantity: number }>;
    }>;
    reviews?: unknown[];
  }) {
    return {
      ...product,
      basePrice: Number(product.basePrice),
      variants: product.variants?.map((v) => ({
        ...v,
        price: Number(v.price),
        costPrice: v.costPrice ? Number(v.costPrice) : null,
        stock: v.inventories.reduce((s, i) => s + i.quantity, 0),
      })),
    };
  }

  private async getDefaultWarehouse() {
    const code = process.env.DEFAULT_WAREHOUSE_CODE || 'WH-MAIN';
    let warehouse = await this.prisma.warehouse.findFirst({ where: { code, deletedAt: null } });
    if (!warehouse) {
      let branch = await this.prisma.branch.findFirst({ where: { deletedAt: null } });
      if (!branch) {
        branch = await this.prisma.branch.create({
          data: { name: 'Chi nhánh chính', code: 'BR-MAIN' },
        });
      }
      warehouse = await this.prisma.warehouse.create({
        data: { name: 'Kho chính', code, branchId: branch.id, isDefault: true },
      });
    }
    return warehouse;
  }
}
