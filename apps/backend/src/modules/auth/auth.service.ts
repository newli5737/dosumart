import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  AddressDto,
} from './dto/auth.dto';
import {
  type AuthClient,
  isRoleAllowedForClient,
  parseAuthClient,
} from './auth-client.util';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_EXISTS',
        message: 'Email đã được sử dụng',
      });
    }

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        fullName: dto.fullName,
        phone: dto.phone,
        role: Role.CUSTOMER,
        cart: { create: {} },
      },
      select: { id: true, email: true, fullName: true, role: true },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null, isActive: true },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email hoặc mật khẩu không đúng',
      });
    }

    const client = parseAuthClient(dto.client);
    if (!isRoleAllowedForClient(user.role, client)) {
      throw new UnauthorizedException({
        code: 'FORBIDDEN_CLIENT',
        message: 'Tài khoản không có quyền truy cập ứng dụng này',
      });
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date() || stored.user.deletedAt) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH',
        message: 'Refresh token không hợp lệ',
      });
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.issueTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
    );
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    return { message: 'Đăng xuất thành công' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Không tìm thấy người dùng',
      });
    }
    return user;
  }

  async forgotPassword(_dto: ForgotPasswordDto) {
    return { message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi' };
  }

  async resetPassword(_dto: ResetPasswordDto) {
    return { message: 'Đặt lại mật khẩu thành công' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user || !(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new UnauthorizedException({
        code: 'INVALID_PASSWORD',
        message: 'Mật khẩu hiện tại không đúng',
      });
    }
    const hashed = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { message: 'Đổi mật khẩu thành công' };
  }

  async getAddresses(userId: string) {
    const items = await this.prisma.address.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return { data: items };
  }

  async upsertAddress(userId: string, dto: AddressDto, addressId?: string) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, deletedAt: null },
        data: { isDefault: false },
      });
    }
    if (addressId) {
      const existing = await this.prisma.address.findFirst({
        where: { id: addressId, userId, deletedAt: null },
      });
      if (!existing) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy địa chỉ' });
      }
      const item = await this.prisma.address.update({
        where: { id: addressId },
        data: { ...dto },
      });
      return { data: item };
    }
    const count = await this.prisma.address.count({ where: { userId, deletedAt: null } });
    const item = await this.prisma.address.create({
      data: { userId, ...dto, isDefault: dto.isDefault ?? count === 0 },
    });
    return { data: item };
  }

  async deleteAddress(userId: string, addressId: string) {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy địa chỉ' });
    }
    await this.prisma.address.update({
      where: { id: addressId },
      data: { deletedAt: new Date() },
    });
    return { message: 'Đã xóa địa chỉ' };
  }

  private async issueTokens(userId: string, email: string, role: Role) {
    const accessToken = this.jwt.sign(
      { sub: userId, email, role },
      {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES', '15m'),
      },
    );

    const refreshToken = randomBytes(48).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { userId, token: refreshToken, expiresAt },
    });

    return { accessToken, refreshToken };
  }
}
