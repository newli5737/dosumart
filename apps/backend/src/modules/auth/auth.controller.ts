import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Res,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Response, Request, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  AddressDto,
} from './dto/auth.dto';
import { Public, CurrentUser } from '../../shared/decorators/auth.decorators';
import { Role } from '@prisma/client';
import { Roles } from '../../shared/decorators/auth.decorators';

@ApiTags('Xác thực')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { data: { user: result.user }, message: 'Đăng ký thành công' };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { data: { user: result.user }, message: 'Đăng nhập thành công' };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const result = await this.authService.refresh(token);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { data: { message: 'Refresh thành công' } };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refreshToken;
    await this.authService.logout(token);
    this.clearAuthCookies(res);
    return { message: 'Đăng xuất thành công' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  me(@CurrentUser() user: { id: string }) {
    return this.authService.me(user.id);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF, Role.CASHIER)
  changePassword(@CurrentUser() user: { id: string }, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto);
  }

  @Get('addresses')
  @Roles(Role.CUSTOMER)
  getAddresses(@CurrentUser() user: { id: string }) {
    return this.authService.getAddresses(user.id);
  }

  @Post('addresses')
  @Roles(Role.CUSTOMER)
  createAddress(@CurrentUser() user: { id: string }, @Body() dto: AddressDto) {
    return this.authService.upsertAddress(user.id, dto);
  }

  @Patch('addresses/:id')
  @Roles(Role.CUSTOMER)
  updateAddress(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: AddressDto,
  ) {
    return this.authService.upsertAddress(user.id, dto, id);
  }

  @Delete('addresses/:id')
  @Roles(Role.CUSTOMER)
  deleteAddress(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.authService.deleteAddress(user.id, id);
  }

  private cookieBaseOptions(): CookieOptions {
    const isProd = process.env.NODE_ENV === 'production';
    const domain = process.env.COOKIE_DOMAIN || undefined;
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      ...(domain ? { domain } : {}),
    };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, {
      ...this.cookieBaseOptions(),
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      ...this.cookieBaseOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearAuthCookies(res: Response) {
    const opts = this.cookieBaseOptions();
    res.clearCookie('accessToken', opts);
    res.clearCookie('refreshToken', opts);
  }
}

