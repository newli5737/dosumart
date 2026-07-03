import { formatCurrency } from '@dosumart/utils';
import { buildVietQrImageUrl, type SepayConfig } from '@dosumart/utils';

export function QrPaymentPanel({
  orderCode,
  amount,
  sepay,
  onConfirm,
  confirming,
  showConfirm = false,
  hint,
}: {
  orderCode: string;
  amount: number;
  sepay: SepayConfig;
  onConfirm?: () => void;
  confirming?: boolean;
  showConfirm?: boolean;
  hint?: string;
}) {
  const qrUrl = buildVietQrImageUrl({
    account: sepay.accountNumber,
    bank: sepay.bankCode,
    amount,
    description: orderCode,
    template: 'compact',
    showInfo: true,
    fullAcc: true,
    accountHolder: sepay.accountHolder,
    storeName: sepay.storeName,
  });

  return (
    <div className="text-center">
      <img
        src={qrUrl}
        alt="QR thanh toán chuyển khoản"
        className="mx-auto max-w-[280px] rounded-xl border border-gray-200 bg-white p-2 shadow-sm"
      />
      <div className="mt-4 space-y-2 text-sm">
        <p>
          Số tiền: <strong className="text-lg text-[#f97316]">{formatCurrency(amount)}</strong>
        </p>
        <p>
          Nội dung CK: <strong className="font-mono tracking-wider">{orderCode}</strong>
        </p>
        <p className="text-xs text-gray-500">
          {sepay.bankCode} · {sepay.accountNumber} · {sepay.accountHolder}
        </p>
        {hint && <p className="text-xs text-amber-700">{hint}</p>}
      </div>
      {showConfirm && onConfirm && (
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirming}
          className="mt-4 h-11 w-full rounded-xl bg-[#16a34a] text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
        >
          {confirming ? 'Đang xác nhận...' : 'Đã nhận tiền — Hoàn tất'}
        </button>
      )}
    </div>
  );
}
