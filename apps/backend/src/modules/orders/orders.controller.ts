import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role, OrderStatus, PaymentMethod } from '@prisma/client';
import { OrdersService } from './orders.service';
import { Roles, CurrentUser } from '../../shared/decorators/auth.decorators';
import { IsString, IsNumber, IsEnum, IsOptional, IsObject } from 'class-validator';

class CartItemDto {
  @IsString() variantId: string;
  @IsNumber() quantity: number;
}

class CheckoutDto {
  @IsEnum(PaymentMethod) paymentMethod: PaymentMethod;
  @IsOptional() @IsObject() shippingAddress?: Record<string, string>;
  @IsOptional() @IsString() couponCode?: string;
  @IsOptional() @IsNumber() shippingFee?: number;
}

class UpdateStatusDto {
  @IsEnum(OrderStatus) status: OrderStatus;
}

@ApiTags('Đơn hàng & Giỏ hàng')
@Controller()
@ApiBearerAuth()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get('cart')
  @Roles(Role.CUSTOMER)
  getCart(@CurrentUser() user: { id: string }) {
    return this.ordersService.getCart(user.id);
  }

  @Post('cart/items')
  @Roles(Role.CUSTOMER)
  addItem(@CurrentUser() user: { id: string }, @Body() dto: CartItemDto) {
    return this.ordersService.addCartItem(user.id, dto.variantId, dto.quantity);
  }

  @Patch('cart/items/:id')
  @Roles(Role.CUSTOMER)
  updateItem(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body('quantity') quantity: number) {
    return this.ordersService.updateCartItem(user.id, id, quantity);
  }

  @Delete('cart/items/:id')
  @Roles(Role.CUSTOMER)
  removeItem(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.ordersService.removeCartItem(user.id, id);
  }

  @Post('orders')
  @Roles(Role.CUSTOMER)
  checkout(@CurrentUser() user: { id: string }, @Body() dto: CheckoutDto) {
    return this.ordersService.checkout(user.id, dto);
  }

  @Get('orders')
  @Roles(Role.CUSTOMER)
  myOrders(@CurrentUser() user: { id: string }, @Query() query: Record<string, string>) {
    return this.ordersService.findUserOrders(user.id, Number(query.page) || 1, Number(query.limit) || 20);
  }

  @Get('orders/:id')
  getOrder(@CurrentUser() user: { id: string; role: Role }, @Param('id') id: string) {
    return this.ordersService.findById(id, user.role === Role.CUSTOMER ? user.id : undefined);
  }

  @Patch('orders/:id/cancel')
  @Roles(Role.CUSTOMER)
  cancel(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.ordersService.cancel(id, user.id);
  }

  @Get('admin/orders')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
  adminOrders(@Query() query: Record<string, string>) {
    return this.ordersService.adminFindAll({
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
      status: query.status,
      channel: query.channel,
      from: query.from,
      to: query.to,
    });
  }

  @Patch('admin/orders/:id/status')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.ordersService.updateStatus(id, dto.status);
  }
}
