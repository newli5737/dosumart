import { Injectable, BadRequestException } from '@nestjs/common';
import { InventoryTransactionType } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { paginate, paginationMeta } from '../../shared/dto/pagination.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async adjustStock(data: {
    variantId: string;
    type: InventoryTransactionType;
    quantity: number;
    note?: string;
    createdBy?: string;
    warehouseId?: string;
    supplierId?: string;
    unitCost?: number;
  }) {
    const warehouse = data.warehouseId
      ? await this.prisma.warehouse.findFirst({ where: { id: data.warehouseId, deletedAt: null } })
      : await this.getDefaultWarehouse();

    if (!warehouse) {
      throw new BadRequestException({ code: 'NO_WAREHOUSE', message: 'Không tìm thấy kho' });
    }

    const qty = data.type === 'EXPORT' || data.type === 'SALE'
      ? -Math.abs(data.quantity)
      : Math.abs(data.quantity);

    return this.prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { warehouseId_variantId: { warehouseId: warehouse.id, variantId: data.variantId } },
      });

      const currentQty = inventory?.quantity ?? 0;
      const newQty = currentQty + qty;

      if (newQty < 0) {
        throw new BadRequestException({
          code: 'INSUFFICIENT_STOCK',
          message: `Không đủ tồn kho. Hiện có: ${currentQty}`,
        });
      }

      await tx.inventoryTransaction.create({
        data: {
          warehouseId: warehouse.id,
          variantId: data.variantId,
          type: data.type,
          quantity: qty,
          note: data.note,
          createdBy: data.createdBy,
          supplierId: data.supplierId,
          unitCost: data.unitCost,
        },
      });

      if (data.type === 'IMPORT' && data.unitCost != null) {
        await tx.productVariant.update({
          where: { id: data.variantId },
          data: { costPrice: data.unitCost },
        });
      }

      await tx.inventory.upsert({
        where: { warehouseId_variantId: { warehouseId: warehouse.id, variantId: data.variantId } },
        create: { warehouseId: warehouse.id, variantId: data.variantId, quantity: newQty },
        update: { quantity: newQty },
      });

      return { data: { variantId: data.variantId, quantity: newQty } };
    });
  }

  async deductForOrder(
    items: Array<{ variantId: string; quantity: number }>,
    referenceId: string,
    createdBy?: string,
    warehouseId?: string,
  ) {
    const warehouse = warehouseId
      ? await this.prisma.warehouse.findFirst({ where: { id: warehouseId } })
      : await this.getDefaultWarehouse();

    if (!warehouse) throw new BadRequestException({ code: 'NO_WAREHOUSE', message: 'Không tìm thấy kho' });

    return this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const inventory = await tx.inventory.findUnique({
          where: { warehouseId_variantId: { warehouseId: warehouse!.id, variantId: item.variantId } },
        });
        const currentQty = inventory?.quantity ?? 0;
        if (currentQty < item.quantity) {
          throw new BadRequestException({
            code: 'INSUFFICIENT_STOCK',
            message: `Sản phẩm không đủ tồn kho (còn ${currentQty})`,
          });
        }
        const newQty = currentQty - item.quantity;
        await tx.inventoryTransaction.create({
          data: {
            warehouseId: warehouse!.id,
            variantId: item.variantId,
            type: 'SALE',
            quantity: -item.quantity,
            referenceId,
            createdBy,
          },
        });
        await tx.inventory.update({
          where: { warehouseId_variantId: { warehouseId: warehouse!.id, variantId: item.variantId } },
          data: { quantity: newQty },
        });
      }
    });
  }

  async getStockLogs(query: { page?: number; limit?: number; variantId?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const { skip, take } = paginate(page, limit);

    const where = query.variantId ? { variantId: query.variantId } : {};
    const [items, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          variant: { include: { product: { select: { name: true } } } },
          warehouse: { select: { name: true, code: true } },
          supplier: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.inventoryTransaction.count({ where }),
    ]);

    return {
      data: items.map((i) => ({
        id: i.id,
        variantId: i.variantId,
        sku: i.variant.sku,
        productName: i.variant.product.name,
        warehouse: i.warehouse.name,
        quantity: i.quantity,
        type: i.type,
        unitCost: i.unitCost ? Number(i.unitCost) : null,
        supplier: i.supplier ? { id: i.supplier.id, name: i.supplier.name } : null,
        note: i.note,
        createdAt: i.createdAt,
      })),
      meta: paginationMeta(total, page, limit),
    };
  }

  async findSuppliers() {
    const items = await this.prisma.supplier.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
    return { data: items };
  }

  async createSupplier(data: {
    name: string;
    code: string;
    phone?: string;
    email?: string;
    address?: string;
    contactName?: string;
  }) {
    const item = await this.prisma.supplier.create({ data });
    return { data: item };
  }

  async updateSupplier(id: string, data: Partial<{
    name: string;
    phone: string;
    email: string;
    address: string;
    contactName: string;
    isActive: boolean;
  }>) {
    const item = await this.prisma.supplier.update({ where: { id }, data });
    return { data: item };
  }

  async getInventoryReport() {
    const items = await this.prisma.inventory.findMany({
      include: {
        variant: {
          include: { product: { select: { name: true, isActive: true } } },
        },
        warehouse: { select: { name: true } },
      },
    });

    return {
      data: items.map((i) => ({
        variantId: i.variantId,
        sku: i.variant.sku,
        productName: i.variant.product.name,
        warehouse: i.warehouse.name,
        quantity: i.quantity,
        lowStockAt: i.variant.lowStockAt,
        isLowStock: i.quantity <= i.variant.lowStockAt,
      })),
    };
  }

  private async getDefaultWarehouse() {
    const code = process.env.DEFAULT_WAREHOUSE_CODE || 'WH-MAIN';
    return this.prisma.warehouse.findFirst({ where: { code, deletedAt: null } });
  }
}
