export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

const ORDER_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Mã đơn 8 ký tự in hoa — dùng làm nội dung chuyển khoản SePay/VietQR */
export function generateOrderCode(length = 8): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ORDER_CODE_CHARS[Math.floor(Math.random() * ORDER_CODE_CHARS.length)];
  }
  return code;
}

export type VietQrParams = {
  account: string;
  bank: string;
  amount?: number;
  description?: string;
  template?: '' | 'compact' | 'qronly' | 'standee';
  showInfo?: boolean;
  download?: boolean;
  fullAcc?: boolean;
  accountHolder?: string;
  storeName?: string;
};

/** Tạo link ảnh QR VietQR (SePay) */
export function buildVietQrImageUrl(params: VietQrParams): string {
  const q = new URLSearchParams();
  q.set('acc', params.account);
  q.set('bank', params.bank);
  if (params.amount != null && params.amount > 0) {
    q.set('amount', String(Math.round(params.amount)));
  }
  if (params.description) q.set('des', params.description);
  q.set('template', params.template ?? 'compact');
  q.set('showinfo', String(params.showInfo ?? true));
  if (params.download) q.set('download', 'true');
  q.set('fullacc', String(params.fullAcc ?? true));
  if (params.accountHolder) q.set('holder', params.accountHolder);
  if (params.storeName) q.set('store', params.storeName);
  return `https://vietqr.app/img?${q.toString()}`;
}

export type SepayConfig = {
  accountNumber: string;
  bankCode: string;
  accountHolder: string;
  storeName?: string;
};
