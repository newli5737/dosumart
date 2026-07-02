import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ordersApi } from '@dosumart/api';
import { formatCurrency, formatDate } from '@dosumart/utils';
import { ORDER_STATUS_LABELS } from '@dosumart/constants';
import { Button, Badge, Spinner, useAuth } from '@dosumart/ui';
import type { Order } from '@dosumart/types';

export default function AccountPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  const { data: orders } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.list(),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-[#374151]">Vui lòng đăng nhập để xem tài khoản</p>
        <Link to="/dang-nhap" className="mt-4 inline-block">
          <Button>Đăng nhập</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) return <Spinner />;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tài khoản</h1>
        <Button variant="secondary" onClick={handleLogout}>Đăng xuất</Button>
      </div>

      <div className="mt-6 rounded-[10px] border border-gray-200 bg-white p-6">
        <p className="text-sm text-[#374151]">Họ tên</p>
        <p className="font-medium">{user?.fullName}</p>
        <p className="mt-4 text-sm text-[#374151]">Email</p>
        <p className="font-medium">{user?.email}</p>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Lịch sử đơn hàng</h2>
      <div className="mt-4 space-y-3">
        {(orders?.data || []).length === 0 ? (
          <p className="text-sm text-[#374151]">Chưa có đơn hàng nào</p>
        ) : (
          (orders?.data || []).map((order: Order) => (
            <div key={order.id} className="flex items-center justify-between rounded-[10px] border border-gray-200 bg-white p-4">
              <div>
                <p className="text-sm font-medium">{order.code}</p>
                <p className="text-xs text-[#374151]">{formatDate(order.createdAt)}</p>
              </div>
              <div className="text-right">
                <Badge>{ORDER_STATUS_LABELS[order.status]}</Badge>
                <p className="mt-1 text-sm font-semibold">{formatCurrency(order.total)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
