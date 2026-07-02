import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ProductsService } from './products.service';
import { Public, Roles } from '../../shared/decorators/auth.decorators';
import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class VariantDto {
  @IsString() sku: string;
  @IsOptional() @IsString() barcode?: string;
  attributes: Record<string, string>;
  @IsNumber() price: number;
  @IsOptional() @IsNumber() costPrice?: number;
  @IsOptional() @IsNumber() initialStock?: number;
}

class CreateProductDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsString() categoryId: string;
  @IsOptional() @IsString() brandId?: string;
  @IsOptional() @IsArray() images?: string[];
  @IsNumber() basePrice: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @ValidateNested({ each: true }) @Type(() => VariantDto) variants?: VariantDto[];
}

@ApiTags('Sản phẩm')
@Controller()
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Public()
  @Get('products')
  findAll(@Query() query: Record<string, string>) {
    return this.productsService.findAll({
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
      search: query.search,
      category: query.category,
      brand: query.brand,
      sort: query.sort,
      featured: query.featured === 'true',
    });
  }

  @Public()
  @Get('products/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const product = await this.productsService.findBySlug(slug);
    if (!product) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy sản phẩm' });
    }
    return { data: product };
  }

  @Get('admin/products')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
  adminFindAll(@Query() query: Record<string, string>) {
    return this.productsService.adminFindAll({
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
      search: query.search,
      status: query.status,
    });
  }

  @Post('admin/products')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch('admin/products/:id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
  update(@Param('id') id: string, @Body() dto: Partial<CreateProductDto>) {
    return this.productsService.update(id, dto);
  }

  @Delete('admin/products/:id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  delete(@Param('id') id: string) {
    return this.productsService.softDelete(id);
  }
}
