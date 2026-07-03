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
import {
  type AuthClient,
  accessCookieName,
  refreshCookieName,
  parseAuthClient,
  LEGACY_ACCESS_COOKIE,
  LEGACY_REFRESH_COOKIE,
} from './auth-client.util';

@ApiTags('Xác thực')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken, 'store');
    return { data: { user: result.user }, message: 'Đăng ký thành công' };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const client = parseAuthClient(dto.client ?? this.clientFromRequest(req));
    const result = await this.authService.login({ ...dto, client });
    this.setAuthCookies(res, result.accessToken, result.refreshToken, client);
    return { data: { user: result.user }, message: 'Đăng nhập thành công' };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const client = this.clientFromRequest(req);
    const refreshKey = refreshCookieName(client);
    const token =
      req.cookies?.[refreshKey] ||
      req.cookies?.[LEGACY_REFRESH_COOKIE] ||
      req.body?.refreshToken;
    const result = await this.authService.refresh(token);
    this.setAuthCookies(res, result.accessToken, result.refreshToken, client);
    return { data: { message: 'Refresh thành công' } };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const client = this.clientFromRequest(req);
    const refreshKey = refreshCookieName(client);
    const token = req.cookies?.[refreshKey] || req.cookies?.[LEGACY_REFRESH_COOKIE];
    await this.authService.logout(token);
    this.clearAuthCookies(res, client);
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

  private clientFromRequest(req: Request): AuthClient {
    const header = req.headers['x-auth-client'];
    const value = Array.isArray(header) ? header[0] : header;
    return parseAuthClient(value);
  }

  private cookieBaseOptions(): CookieOptions {
    const isProd = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    };
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    client: AuthClient,
  ) {
    const base = this.cookieBaseOptions();
    res.cookie(accessCookieName(client), accessToken, {
      ...base,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie(refreshCookieName(client), refreshToken, {
      ...base,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // Xóa cookie legacy / cookie app khác khi đăng nhập lại
    this.clearLegacyCookies(res);
    (['admin', 'pos', 'store'] as AuthClient[])
      .filter((c) => c !== client)
      .forEach((c) => this.clearClientCookies(res, c));
  }

  private clearAuthCookies(res: Response, client: AuthClient) {
    this.clearClientCookies(res, client);
    this.clearLegacyCookies(res);
  }

  private clearClientCookies(res: Response, client: AuthClient) {
    const base = this.cookieBaseOptions();
    res.clearCookie(accessCookieName(client), base);
    res.clearCookie(refreshCookieName(client), base);
  }

  private clearLegacyCookies(res: Response) {
    const base = this.cookieBaseOptions();
    res.clearCookie(LEGACY_ACCESS_COOKIE, base);
    res.clearCookie(LEGACY_REFRESH_COOKIE, base);
    const legacyDomain = process.env.COOKIE_DOMAIN;
    if (legacyDomain) {
      const legacyOpts = { ...base, domain: legacyDomain };
      res.clearCookie(LEGACY_ACCESS_COOKIE, legacyOpts);
      res.clearCookie(LEGACY_REFRESH_COOKIE, legacyOpts);
    }
  }
}
