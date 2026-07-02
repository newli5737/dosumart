import { Controller, Get, Post, Body } from '@nestjs/common';
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
}
