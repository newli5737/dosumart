import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CategoriesService, BrandsService } from './categories.service';
import { Public, Roles } from '../../shared/decorators/auth.decorators';
import { IsString, IsOptional } from 'class-validator';

class NameDto { @IsString() name: string; }
class CategoryDto {
  @IsString() name: string;
  @IsOptional() @IsString() parentId?: string;
}

@ApiTags('Danh mục & Thương hiệu')
@Controller()
export class CategoriesController {
  constructor(
    private categoriesService: CategoriesService,
    private brandsService: BrandsService,
  ) {}

  @Public()
  @Get('categories')
  findCategories() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get('brands')
  findBrands() {
    return this.brandsService.findAll();
  }

  @Post('admin/categories')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
  createCategory(@Body() dto: CategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch('admin/categories/:id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
  updateCategory(@Param('id') id: string, @Body() dto: CategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete('admin/categories/:id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  deleteCategory(@Param('id') id: string) {
    return this.categoriesService.softDelete(id);
  }

  @Post('admin/brands')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
  createBrand(@Body() dto: NameDto) {
    return this.brandsService.create(dto);
  }

  @Patch('admin/brands/:id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
  updateBrand(@Param('id') id: string, @Body() dto: NameDto) {
    return this.brandsService.update(id, dto);
  }

  @Delete('admin/brands/:id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  deleteBrand(@Param('id') id: string) {
    return this.brandsService.softDelete(id);
  }
}
