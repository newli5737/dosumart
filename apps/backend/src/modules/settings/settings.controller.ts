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
    const v = (row?.value ?? {}) as Record<string, unknown>;
    const sepay = (v.sepay ?? {}) as Record<string, string>;
    return {
      data: {
        name: (v.name as string) ?? 'DoSuMart',
        branchName: (v.branchName as string) ?? '',
        address: (v.address as string) ?? '',
        phone: (v.phone as string) ?? '',
        hotline: (v.hotline as string) ?? (v.phone as string) ?? '',
        email: (v.email as string) ?? '',
        taxCode: (v.taxCode as string) ?? '',
        logo: (v.logo as string) ?? '/dosumart.svg',
        website: (v.website as string) ?? 'mart.dosutech.site',
        sepay: {
          accountNumber: sepay.accountNumber ?? '',
          bankCode: sepay.bankCode ?? 'MBBank',
          accountHolder: sepay.accountHolder ?? '',
          storeName: sepay.storeName ?? (v.name as string) ?? 'DoSuMart',
        },
      },
    };
  }
}
