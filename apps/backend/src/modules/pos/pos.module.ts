import { Module } from '@nestjs/common';
import { PosService } from './pos.service';
import { PosController } from './pos.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [InventoryModule, ProductsModule, OrdersModule],
  controllers: [PosController],
  providers: [PosService],
})
export class PosModule {}
