import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  User,
  Phone,
  CreditCard,
  CheckCircle2,
  ShoppingBag,
  ChevronRight,
  Lock,
  Truck,
} from 'lucide-react';
import { cartApi, ordersApi } from '@dosumart/api';
import { useLocalCartStore } from '@dosumart/stores';
import { formatCurrency } from '@dosumart/utils';
import { useAuth } from '@dosumart/ui';

const FREE_SHIP_MIN = 500_000;
const SHIPPING_FEE = 30_000;

const inputCls =
  'h-12 w-full rounded-xl border border-gray-200 bg-[#fafafa] px-4 text-sm text-[#111827] placeholder:text-gray-400 transition-colors focus:border-[#f97316] focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100';

function CheckoutSteps({ current }: { current: 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Giỏ hàng', done: true },
    { n: 2, label: 'Thanh toán', active: current === 2 },
    { n: 3, label: 'Hoàn tất', active: current === 3 },
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
          {i < steps.length - 1 && (
            <ChevronRight className="h-4 w-4 text-gray-300" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function CheckoutPage() {
  const { items, total, clear } = useLocalCartStore();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [address, setAddress] = useState({
    recipient: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    detail: '',
  });

  if (items.length === 0) {
    navigate('/gio-hang');
    return null;
  }

  const subtotal = total();
  const shippingFee = subtotal >= FREE_SHIP_MIN ? 0 : SHIPPING_FEE;
  const grandTotal = subtotal + shippingFee;
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  const set = (key: keyof typeof address, value: string) =>
    setAddress((a) => ({ ...a, [key]: value }));

  const handleCheckout = async () => {
    if (!address.recipient.trim() || !address.phone.trim() || !address.detail.trim()) {
      setError('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng.');
      return;
    }
    if (!isAuthenticated) {
      navigate('/dang-nhap');
      return;
    }
    setError('');
    setLoading(true);
    try {
      for (const item of items) {
        await cartApi.addItem(item.variantId, item.quantity);
      }
      await ordersApi.checkout({
        paymentMethod: 'COD',
        shippingAddress: address,
        shippingFee,
      });
      clear();
      navigate('/tai-khoan');
    } catch {
      setError('Không thể đặt hàng. Vui lòng kiểm tra đăng nhập và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f4f6f8] px-4 py-8">
      <div className="mx-auto max-w-[1100px]">
        <CheckoutSteps current={2} />

        <div className="mb-6 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-[#111827]">Thanh toán</h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            Hoàn tất thông tin để đặt hàng · {itemCount} sản phẩm
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
          {/* Form */}
          <div className="space-y-6 lg:col-span-3">
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                  <MapPin className="h-5 w-5 text-[#f97316]" />
                </div>
                <div>
                  <h2 className="font-bold text-[#111827]">Địa chỉ giao hàng</h2>
                  <p className="text-xs text-[#9ca3af]">Thông tin người nhận hàng</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[#374151]">
                    <User className="h-3.5 w-3.5 text-[#9ca3af]" />
                    Người nhận <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={inputCls}
                    placeholder="Họ và tên người nhận"
                    value={address.recipient}
                    onChange={(e) => set('recipient', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[#374151]">
                    <Phone className="h-3.5 w-3.5 text-[#9ca3af]" />
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={inputCls}
                    placeholder="09xx xxx xxx"
                    value={address.phone}
                    onChange={(e) => set('phone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#374151]">
                    Tỉnh / Thành phố
                  </label>
                  <input
                    className={inputCls}
                    placeholder="VD: TP. Hồ Chí Minh"
                    value={address.province}
                    onChange={(e) => set('province', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#374151]">
                    Quận / Huyện
                  </label>
                  <input
                    className={inputCls}
                    placeholder="VD: Quận 1"
                    value={address.district}
                    onChange={(e) => set('district', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#374151]">
                    Phường / Xã
                  </label>
                  <input
                    className={inputCls}
                    placeholder="VD: Phường Bến Nghé"
                    value={address.ward}
                    onChange={(e) => set('ward', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-[#374151]">
                    Địa chỉ chi tiết <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={inputCls}
                    placeholder="Số nhà, tên đường, tòa nhà..."
                    value={address.detail}
                    onChange={(e) => set('detail', e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                  <CreditCard className="h-5 w-5 text-[#16a34a]" />
                </div>
                <div>
                  <h2 className="font-bold text-[#111827]">Phương thức thanh toán</h2>
                  <p className="text-xs text-[#9ca3af]">Chọn cách thanh toán phù hợp</p>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-4 rounded-xl border-2 border-[#f97316] bg-orange-50/50 p-4">
                <input type="radio" name="payment" defaultChecked className="mt-1 accent-[#f97316]" />
                <div className="flex-1">
                  <p className="font-semibold text-[#111827]">Thanh toán khi nhận hàng (COD)</p>
                  <p className="mt-1 text-sm text-[#6b7280]">
                    Thanh toán bằng tiền mặt khi shipper giao hàng tận nơi
                  </p>
                </div>
                <Truck className="h-5 w-5 shrink-0 text-[#f97316]" />
              </label>
            </section>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                  <ShoppingBag className="h-5 w-5 text-[#f97316]" />
                </div>
                <h2 className="font-bold text-[#111827]">Đơn hàng của bạn</h2>
              </div>

              <ul className="max-h-64 space-y-3 overflow-y-auto pr-1">
                {items.map((item) => (
                  <li key={item.variantId} className="flex gap-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-lg border border-gray-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                        <ShoppingBag className="h-5 w-5 text-[#f97316]" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium text-[#111827]">
                        {item.productName}
                      </p>
                      <p className="mt-0.5 text-xs text-[#9ca3af]">SL: {item.quantity}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-[#111827]">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-5 space-y-2.5 border-t border-gray-100 pt-5 text-sm">
                <div className="flex justify-between text-[#6b7280]">
                  <span>Tạm tính</span>
                  <span className="font-medium text-[#111827]">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#6b7280]">
                  <span>Phí vận chuyển</span>
                  <span className={`font-medium ${shippingFee === 0 ? 'text-[#16a34a]' : 'text-[#111827]'}`}>
                    {shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex justify-between border-t border-gray-100 pt-4">
                <span className="text-base font-bold text-[#111827]">Tổng cộng</span>
                <span className="text-xl font-bold text-[#f97316]">{formatCurrency(grandTotal)}</span>
              </div>

              {error && (
                <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              {!isAuthenticated && (
                <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Bạn cần{' '}
                  <Link to="/dang-nhap" className="font-semibold underline">
                    đăng nhập
                  </Link>{' '}
                  để đặt hàng
                </p>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#f97316] py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-200 transition-colors hover:bg-[#ea580c] disabled:opacity-60"
              >
                {loading ? (
                  'Đang xử lý...'
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Xác nhận đặt hàng
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs text-[#9ca3af]">
                Bằng việc đặt hàng, bạn đồng ý với điều khoản sử dụng của DoSuMart
              </p>

              <Link
                to="/gio-hang"
                className="mt-4 block text-center text-sm font-medium text-[#6b7280] hover:text-[#f97316]"
              >
                ← Quay lại giỏ hàng
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
