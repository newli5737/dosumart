import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@dosumart/api';
import type { User } from '@dosumart/types';
import type { Role } from '@dosumart/types';

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessDenied: boolean;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  /** Nếu set — chỉ các role này được coi là đã đăng nhập trong app */
  allowedRoles?: Role[];
}) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: authApi.me,
    retry: false,
    staleTime: 60_000,
  });

  const rawUser = !isError && data?.data ? (data.data as User) : null;
  const roleAllowed =
    !rawUser || !allowedRoles?.length || allowedRoles.includes(rawUser.role as Role);
  const user = roleAllowed ? rawUser : null;
  const accessDenied = !!rawUser && !roleAllowed;

  const refetchAuth = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
    }
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      accessDenied,
      refetch: refetchAuth,
      logout,
    }),
    [user, isLoading, accessDenied, refetchAuth, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
