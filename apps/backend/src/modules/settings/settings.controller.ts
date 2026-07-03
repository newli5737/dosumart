import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../shared/database/prisma.service';
import { Public } from '../../shared/decorators/auth.decorators';

@ApiTags('Cài đặt')
@Controller('settings')
export class SettingsController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('store')
  async getStore() {
    const row = await this.prisma.storeSetting.findUnique({ where: { key: 'store' } });
    const v = (row?.value ?? {}) as Record<string, string>;
    return {
      data: {
        name: v.name ?? 'DoSuMart',
        branchName: v.branchName ?? '',
        address: v.address ?? '',
        phone: v.phone ?? '',
        hotline: v.hotline ?? v.phone ?? '',
        email: v.email ?? '',
        taxCode: v.taxCode ?? '',
        logo: v.logo ?? '/dosumart.svg',
        website: v.website ?? 'mart.dosutech.site',
      },
    };
  }
}
