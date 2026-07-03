import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role, CouponType } from '@prisma/client';
import { CouponsService } from './coupons.service';
import { Roles } from '../../shared/decorators/auth.decorators';
import { IsString, IsEnum, IsNumber, IsOptional, IsDateString } from 'class-validator';

class CreateCouponDto {
  @IsString() code: string;
  @IsEnum(CouponType) type: CouponType;
  @IsNumber() value: number;
  @IsOptional() @IsNumber() minOrderValue?: number;
  @IsOptional() @IsNumber() usageLimit?: number;
  @IsDateString() startAt: string;
  @IsDateString() endAt: string;
}

@ApiTags('Khuyến mãi')
@Controller('admin/coupons')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  @Get()
  findAll() {
    return this.couponsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: { isActive?: boolean; usageLimit?: number; endAt?: string }) {
    return this.couponsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.couponsService.softDelete(id);
  }
}
