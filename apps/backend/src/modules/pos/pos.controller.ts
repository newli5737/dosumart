import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role, PaymentMethod } from '@prisma/client';
import { PosService } from './pos.service';
import { ProductsService } from '../products/products.service';
import { Roles, CurrentUser } from '../../shared/decorators/auth.decorators';
import { IsNumber, IsEnum, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PosItemDto {
  @IsString() variantId: string;
  @IsNumber() quantity: number;
}

class PosOrderDto {
  @ValidateNested({ each: true }) @Type(() => PosItemDto) items: PosItemDto[];
  @IsEnum(PaymentMethod) paymentMethod: PaymentMethod;
  @IsOptional() @IsNumber() cashReceived?: number;
  @IsOptional() @IsNumber() discount?: number;
  @IsOptional() @IsString() couponCode?: string;
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsString() note?: string;
}

@ApiTags('POS')
@Controller('pos')
@ApiBearerAuth()
@Roles(Role.CASHIER, Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
export class PosController {
  constructor(
    private posService: PosService,
    private productsService: ProductsService,
  ) {}

  @Post('shifts/open')
  openShift(@CurrentUser() user: { id: string }, @Body('openingCash') openingCash: number) {
    return this.posService.openShift(user.id, openingCash);
  }

  @Post('shifts/close')
  closeShift(
    @CurrentUser() user: { id: string },
    @Body() body: { closingCash: number; note?: string },
  ) {
    return this.posService.closeShift(user.id, body.closingCash, body.note);
  }

  @Get('shifts/current')
  currentShift(@CurrentUser() user: { id: string }) {
    return this.posService.getCurrentShift(user.id);
  }

  @Post('orders')
  createOrder(@CurrentUser() user: { id: string }, @Body() dto: PosOrderDto) {
    return this.posService.createPosOrder(user.id, dto);
  }

  @Post('orders/:id/hold')
  holdOrder(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.posService.holdOrder(user.id, id);
  }

  @Post('orders/:id/print')
  printOrder(@Param('id') id: string) {
    return this.posService.getPrintData(id);
  }

  @Get('products/search')
  async searchProducts(@Query() query: Record<string, string>) {
    const data = await this.productsService.searchForPos(query.q, query.barcode);
    return { data };
  }
}
