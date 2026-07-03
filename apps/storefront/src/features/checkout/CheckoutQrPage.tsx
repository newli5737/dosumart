import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QrCode, CheckCircle2, ChevronRight } from 'lucide-react';
import { settingsApi } from '@dosumart/api';
import { QrPaymentPanel } from '@dosumart/ui';
import type { SepayConfig } from '@dosumart/utils';

type QrState = {
  orderId: string;
  orderCode: string;
  total: number;
};

function CheckoutSteps() {
  const steps = [
    { n: 1, label: 'Giỏ hàng', done: true },
    { n: 2, label: 'Thanh toán', done: true },
    { n: 3, label: 'Hoàn tất', active: true },
  ];

  return (
    <div className="mb-8 flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((step, i) => (
        <div key={step.n} className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                step.done
                  ? 'bg-[#16a34a] text-white'
                  : step.active
                    ? 'bg-[#f97316] text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step.done ? <CheckCircle2 className="h-4 w-4" /> : step.n}
            </div>
            <span
              className={`hidden text-sm font-medium sm:block ${
                step.done || step.active ? 'text-[#111827]' : 'text-[#9ca3af]'
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-gray-300" />}
        </div>
      ))}
    </div>
  );
}

export default function CheckoutQrPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as QrState | null;

  const { data: storeRes, isLoading } = useQuery({
    queryKey: ['store-settings'],
    queryFn: settingsApi.getStore,
    staleTime: 5 * 60_000,
  });

  if (!state?.orderCode || !state?.total) {
    navigate('/thanh-toan', { replace: true });
    return null;
  }

  const sepay = storeRes?.data?.sepay as SepayConfig | undefined;

  return (
    <div className="min-h-full bg-[#f4f6f8] px-4 py-8">
      <div className="mx-auto max-w-lg">
        <CheckoutSteps />

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <QrCode className="h-5 w-5 text-[#f97316]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#111827]">Thanh toán chuyển khoản</h1>
              <p className="text-sm text-[#6b7280]">
                Mã đơn: <span className="font-mono font-semibold">{state.orderCode}</span>
              </p>
            </div>
          </div>

          {isLoading ? (
            <p className="py-12 text-center text-sm text-gray-500">Đang tải mã QR...</p>
          ) : sepay?.accountNumber ? (
            <QrPaymentPanel
              orderCode={state.orderCode}
              amount={state.total}
              sepay={sepay}
              hint="Quét mã QR hoặc chuyển khoản thủ công. Đơn hàng sẽ được xử lý sau khi chúng tôi xác nhận thanh toán."
            />
          ) : (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Chưa cấu hình tài khoản SePay. Vui lòng liên hệ hotline để được hỗ trợ thanh toán.
            </p>
          )}

          <div className="mt-6 space-y-2">
            <Link
              to="/tai-khoan"
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#f97316] text-sm font-semibold text-white hover:bg-[#ea580c]"
            >
              Xem đơn hàng của tôi
            </Link>
            <Link
              to="/"
              className="block text-center text-sm font-medium text-[#6b7280] hover:text-[#f97316]"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
