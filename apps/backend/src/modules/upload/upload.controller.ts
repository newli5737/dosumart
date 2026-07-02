import { Controller, Get, UseGuards } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/auth.decorators';

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController {
  constructor() {
    cloudinary.config({
      cloud_name: 'dn00btmpw',
      api_key: '819511482585566',
      api_secret: 'wWMd4AjXJvUPEwCG5_nrFWHD2qc',
    });
  }

  @Get('signature')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  getSignature() {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, upload_preset: 'dosumart' },
      'wWMd4AjXJvUPEwCG5_nrFWHD2qc'
    );
    
    return {
      timestamp,
      signature,
      api_key: '819511482585566',
      cloud_name: 'dn00btmpw',
      upload_preset: 'dosumart'
    };
  }
}
