import { Link } from 'react-router-dom';
import { formatCurrency } from '@dosumart/utils';
import { Button, EmptyState } from '@dosumart/ui';
import { useLocalCartStore } from '@dosumart/stores';

export default function CartPage() {
  const { items, updateQuantity, removeItem, total } = useLocalCartStore();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-8">
        <h1 className="text-2xl font-semibold">Giỏ hàng</h1>
        <EmptyState
          title="Giỏ hàng trống"
          description="Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm."
          action={
            <Link to="/san-pham">
              <Button>Xem sản phẩm</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8">
      <h1 className="text-2xl font-semibold">Giỏ hàng</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-4 rounded-[10px] border border-gray-200 bg-white p-4">
              {item.image && (
                <img src={item.image} alt="" className="h-20 w-20 rounded-[10px] object-cover" />
              )}
              <div className="flex-1">
                <h3 className="text-sm font-medium">{item.productName}</h3>
                <p className="mt-1 text-sm text-[#2563EB]">{formatCurrency(item.price)}</p>
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex items-center rounded-[10px] border border-gray-300">
                    <button className="h-8 w-8" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>−</button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button className="h-8 w-8" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>+</button>
                  </div>
                  <button className="text-sm text-[#DC2626]" onClick={() => removeItem(item.variantId)}>
                    Xóa
                  </button>
                </div>
              </div>
              <p className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
        <div className="h-fit rounded-[10px] border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Tóm tắt đơn hàng</h2>
          <div className="mt-4 flex justify-between text-sm">
            <span>Tạm tính</span>
            <span className="font-semibold">{formatCurrency(total())}</span>
          </div>
          <Link to="/thanh-toan" className="mt-6 block">
            <Button className="w-full" size="lg">Tiến hành thanh toán</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
