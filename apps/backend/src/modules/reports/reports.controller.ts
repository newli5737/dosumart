import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ReportsService, CustomersService } from './reports.service';
import { Roles } from '../../shared/decorators/auth.decorators';

@ApiTags('Báo cáo & Khách hàng')
@Controller('admin')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF)
export class ReportsController {
  constructor(
    private reportsService: ReportsService,
    private customersService: CustomersService,
  ) {}

  @Get('reports/revenue')
  revenue(@Query() query: Record<string, string>) {
    return this.reportsService.revenue(query.from, query.to, query.groupBy);
  }

  @Get('reports/top-products')
  topProducts(@Query('limit') limit?: string) {
    return this.reportsService.topProducts(Number(limit) || 10);
  }

  @Get('reports/profit-by-supplier')
  profitBySupplier() {
    return this.reportsService.profitBySupplier();
  }

  @Get('reports/product-margins')
  productMargins() {
    return this.reportsService.productMargins();
  }

  @Get('customers')
  customers(@Query() query: Record<string, string>) {
    return this.customersService.findAll(
      Number(query.page) || 1,
      Number(query.limit) || 20,
      query.search,
    );
  }
}
