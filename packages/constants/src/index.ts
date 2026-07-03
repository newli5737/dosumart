export const STOREFRONT_URL = 'https://mart.dosutech.site';

export type AuthClient = 'admin' | 'pos' | 'store';

export const ROLES_BY_AUTH_CLIENT: Record<AuthClient, string[]> = {
  admin: ['ADMIN', 'SUPER_ADMIN', 'STAFF'],
  pos: ['CASHIER', 'STAFF', 'ADMIN', 'SUPER_ADMIN'],
  store: ['CUSTOMER'],
};

export const DEFAULT_API_URL = 'http://localhost:3000/api';

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang xử lý',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Trả hàng',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng',
  BANK_TRANSFER: 'Chuyển khoản',
  CASH: 'Tiền mặt',
  CARD: 'Thẻ',
  E_WALLET: 'Ví điện tử',
  GATEWAY: 'Cổng thanh toán',
};

export const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: 'Khách hàng',
  CASHIER: 'Thu ngân',
  STAFF: 'Nhân viên',
  ADMIN: 'Quản trị',
  SUPER_ADMIN: 'Chủ hệ thống',
};

export const COLORS = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#374151',
  primary: '#2563EB',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
};
