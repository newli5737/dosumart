import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../shared/database/prisma.service';
import {
  accessCookieName,
  LEGACY_ACCESS_COOKIE,
  parseAuthClient,
} from '../auth-client.util';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: { cookies?: Record<string, string>; headers?: Record<string, string | string[]> }) => {
          const raw = request?.headers?.['x-auth-client'];
          const client = parseAuthClient(Array.isArray(raw) ? raw[0] : raw);
          const scoped = request?.cookies?.[accessCookieName(client)];
          if (scoped) return scoped;
          if (client === 'store') return request?.cookies?.[LEGACY_ACCESS_COOKIE] ?? null;
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET') || 'default-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, isActive: true },
      select: { id: true, email: true, fullName: true, role: true, phone: true },
    });
    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Phiên đăng nhập không hợp lệ',
      });
    }
    return user;
  }
}
