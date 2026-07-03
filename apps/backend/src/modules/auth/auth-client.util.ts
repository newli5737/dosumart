import { Role } from '@prisma/client';

export type AuthClient = 'admin' | 'pos' | 'store';

const ROLES_BY_CLIENT: Record<AuthClient, Role[]> = {
  admin: [Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF],
  pos: [Role.CASHIER, Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN],
  store: [Role.CUSTOMER],
};

export function parseAuthClient(value: unknown): AuthClient {
  if (value === 'admin' || value === 'pos' || value === 'store') return value;
  return 'store';
}

export function isRoleAllowedForClient(role: Role, client: AuthClient): boolean {
  return ROLES_BY_CLIENT[client].includes(role);
}

export function accessCookieName(client: AuthClient): string {
  return `dm_${client}_access`;
}

export function refreshCookieName(client: AuthClient): string {
  return `dm_${client}_refresh`;
}

export const LEGACY_ACCESS_COOKIE = 'accessToken';
export const LEGACY_REFRESH_COOKIE = 'refreshToken';
