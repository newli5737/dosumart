import { Controller, Post, Get, Patch, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role, InventoryTransactionType } from '@prisma/client';
import { InventoryService } from './inventory.service';
import { Roles, CurrentUser } from '../../shared/decorators/auth.decorators';
import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean } from 'class-validator';

class AdjustStockDto {
  @IsString() variantId: string;
  @IsEnum(InventoryTransactionType) type: InventoryTransactionType;
  @IsNumber() quantity: number;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsString() warehouseId?: string;
  @IsOptional() @IsString() supplierId?: string;
  @IsOptional() @IsNumber() unitCost?: number;
}

class SupplierDto {
  @IsString() name: string;
  @IsString() code: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() contactName?: string;
}

class UpdateSupplierDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@ApiTags('Kho hàng')
@Controller('admin')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Post('variants/:variantId/stock')
  adjustStock(
    @Param('variantId') variantId: string,
    @Body() dto: Omit<AdjustStockDto, 'variantId'>,
    @CurrentUser() user: { id: string },
  ) {
    return this.inventoryService.adjustStock({ ...dto, variantId, createdBy: user.id });
  }

  @Get('stock-logs')
  getLogs(@Query() query: Record<string, string>) {
    return this.inventoryService.getStockLogs({
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
      variantId: query.variantId,
    });
  }

  @Get('reports/inventory')
  getInventoryReport() {
    return this.inventoryService.getInventoryReport();
  }

  @Get('reports/inventory-by-supplier')
  getStockBySupplier() {
    return this.inventoryService.getStockBySupplier();
  }

  @Get('suppliers')
  listSuppliers() {
    return this.inventoryService.findSuppliers();
  }

  @Post('suppliers')
  createSupplier(@Body() dto: SupplierDto) {
    return this.inventoryService.createSupplier(dto);
  }

  @Patch('suppliers/:id')
  updateSupplier(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.inventoryService.updateSupplier(id, dto);
  }
}
