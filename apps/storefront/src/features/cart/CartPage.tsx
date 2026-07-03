import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Minus, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@dosumart/utils';
import { EmptyState } from '@dosumart/ui';
import { useLocalCartStore } from '@dosumart/stores';

const FREE_SHIP_MIN = 500_000;

export default function CartPage() {
  const { items, updateQuantity, removeItem, total } = useLocalCartStore();
  const subtotal = total();
  const remaining = Math.max(0, FREE_SHIP_MIN - subtotal);

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] bg-[#f4f6f8] px-4 py-12">
        <div className="mx-auto max-w-lg rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
            <ShoppingBag className="h-8 w-8 text-[#f97316]" />
          </div>
          <EmptyState
            title="Giỏ hàng trống"
            description="Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm."
            action={
              <Link
                to="/san-pham"
                className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#f97316] px-6 text-sm font-semibold text-white hover:bg-[#ea580c]"
              >
                Xem sản phẩm
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f4f6f8] px-4 py-8">
      <div className="mx-auto max-w-[1440px]">
        <h1 className="text-2xl font-bold text-[#111827]">Giỏ hàng</h1>
        <p className="mt-1 text-sm text-[#6b7280]">{items.length} sản phẩm trong giỏ</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => (
              <div
                key={item.variantId}
                className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-xl border border-gray-100 object-cover sm:h-24 sm:w-24"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-orange-50 sm:h-24 sm:w-24">
                    <ShoppingBag className="h-8 w-8 text-[#f97316]" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-[#111827]">{item.productName}</h3>
                  <p className="mt-1 text-sm font-semibold text-[#f97316]">
                    {formatCurrency(item.price)}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <div className="flex items-center rounded-xl border border-gray-200 bg-[#fafafa]">
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center text-gray-600 hover:text-[#111827]"
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        aria-label="Giảm số lượng"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center text-gray-600 hover:text-[#111827]"
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        aria-label="Tăng số lượng"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
                      onClick={() => removeItem(item.variantId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Xóa
                    </button>
                  </div>
                </div>
                <p className="shrink-0 text-base font-bold text-[#111827]">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#111827]">Tóm tắt đơn hàng</h2>

              {remaining > 0 ? (
                <p className="mt-3 rounded-xl bg-orange-50 px-3 py-2 text-xs text-[#ea580c]">
                  Mua thêm {formatCurrency(remaining)} để được miễn phí vận chuyển
                </p>
              ) : (
                <p className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-xs text-green-700">
                  Bạn được miễn phí vận chuyển!
                </p>
              )}

              <div className="mt-5 space-y-3 border-b border-gray-100 pb-5 text-sm">
                <div className="flex justify-between text-[#6b7280]">
                  <span>Tạm tính ({items.reduce((s, i) => s + i.quantity, 0)} sp)</span>
                  <span className="font-medium text-[#111827]">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#6b7280]">
                  <span>Phí vận chuyển</span>
                  <span className="font-medium text-[#111827]">
                    {subtotal >= FREE_SHIP_MIN ? 'Miễn phí' : 'Tính khi thanh toán'}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex justify-between">
                <span className="font-semibold text-[#111827]">Tổng cộng</span>
                <span className="text-xl font-bold text-[#f97316]">{formatCurrency(subtotal)}</span>
              </div>

              <Link
                to="/thanh-toan"
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f97316] text-base font-semibold text-white shadow-md shadow-orange-200 transition-colors hover:bg-[#ea580c]"
              >
                Tiến hành thanh toán
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                to="/san-pham"
                className="mt-3 block text-center text-sm font-medium text-[#6b7280] hover:text-[#f97316]"
              >
                ← Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
