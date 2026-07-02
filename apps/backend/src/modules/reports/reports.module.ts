import { Module } from '@nestjs/common';
import { ReportsService, CustomersService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, CustomersService],
})
export class ReportsModule {}
