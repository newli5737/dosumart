import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { OrderListeners } from './orders.listeners';

@Module({
  imports: [InventoryModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderListeners],
  exports: [OrdersService],
})
export class OrdersModule {}
