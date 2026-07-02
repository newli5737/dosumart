import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartApi, ordersApi } from '@dosumart/api';
import { useLocalCartStore } from '@dosumart/stores';
import { formatCurrency } from '@dosumart/utils';
import { Button, Input, useAuth } from '@dosumart/ui';

export default function CheckoutPage() {
  const { items, total, clear } = useLocalCartStore();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/dang-nhap');
      return;
    }
    setLoading(true);
    try {
      for (const item of items) {
        await cartApi.addItem(item.variantId, item.quantity);
      }
      await ordersApi.checkout({
        paymentMethod: 'COD',
        shippingAddress: address,
        shippingFee: 30000,
      });
      clear();
      navigate('/tai-khoan');
    } catch {
      alert('Không thể đặt hàng. Vui lòng kiểm tra đăng nhập và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8">
      <h1 className="text-2xl font-semibold">Thanh toán</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Địa chỉ giao hàng</h2>
          <Input placeholder="Người nhận" value={address.recipient} onChange={(e) => setAddress({ ...address, recipient: e.target.value })} />
          <Input placeholder="Số điện thoại" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
          <Input placeholder="Tỉnh/Thành phố" value={address.province} onChange={(e) => setAddress({ ...address, province: e.target.value })} />
          <Input placeholder="Quận/Huyện" value={address.district} onChange={(e) => setAddress({ ...address, district: e.target.value })} />
          <Input placeholder="Phường/Xã" value={address.ward} onChange={(e) => setAddress({ ...address, ward: e.target.value })} />
          <Input placeholder="Địa chỉ chi tiết" value={address.detail} onChange={(e) => setAddress({ ...address, detail: e.target.value })} />
        </div>
        <div className="h-fit rounded-[10px] border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Đơn hàng</h2>
          {items.map((item) => (
            <div key={item.variantId} className="mt-3 flex justify-between text-sm">
              <span>{item.productName} x{item.quantity}</span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="mt-4 flex justify-between border-t pt-4 text-sm">
            <span>Phí vận chuyển</span>
            <span>{formatCurrency(30000)}</span>
          </div>
          <div className="mt-2 flex justify-between font-semibold">
            <span>Tổng cộng</span>
            <span className="text-[#2563EB]">{formatCurrency(total() + 30000)}</span>
          </div>
          <p className="mt-4 text-sm text-[#374151]">Phương thức: Thanh toán khi nhận hàng (COD)</p>
          <Button className="mt-6 w-full" size="lg" onClick={handleCheckout} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
          </Button>
        </div>
      </div>
    </div>
  );
}
