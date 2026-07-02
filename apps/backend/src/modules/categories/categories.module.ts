import { Module } from '@nestjs/common';
import { CategoriesService, BrandsService } from './categories.service';
import { CategoriesController } from './categories.controller';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, BrandsService],
  exports: [CategoriesService, BrandsService],
})
export class CategoriesModule {}
