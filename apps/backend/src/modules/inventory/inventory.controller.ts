import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role, InventoryTransactionType } from '@prisma/client';
import { InventoryService } from './inventory.service';
import { Roles, CurrentUser } from '../../shared/decorators/auth.decorators';
import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

class AdjustStockDto {
  @IsString() variantId: string;
  @IsEnum(InventoryTransactionType) type: InventoryTransactionType;
  @IsNumber() quantity: number;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsString() warehouseId?: string;
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
}
