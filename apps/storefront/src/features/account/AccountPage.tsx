import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Package,
  LogOut,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Receipt,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { ordersApi } from '@dosumart/api';
import { formatCurrency, formatDate } from '@dosumart/utils';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@dosumart/constants';
import { Button, Badge, Spinner, useAuth } from '@dosumart/ui';
import type { Order } from '@dosumart/types';

type Tab = 'orders' | 'profile';

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'error' {
  if (status === 'COMPLETED') return 'success';
  if (status === 'PENDING' || status === 'CONFIRMED' || status === 'PROCESSING') return 'warning';
  if (status === 'CANCELLED' || status === 'RETURNED') return 'error';
  return 'default';
}

function OrderCard({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50">
          <Package className="h-5 w-5 text-[#f97316]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-[#111827]">{order.code}</p>
            <Badge variant={statusVariant(order.status)}>
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-[#6b7280]">
            {formatDate(order.createdAt)} · {itemCount} sản phẩm · {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <p className="text-lg font-bold text-[#f97316]">{formatCurrency(order.total)}</p>
          {open ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {open && order.items?.length > 0 && (
        <div className="border-t border-gray-100 bg-[#fafafa] px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
            Chi tiết sản phẩm
          </p>
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <p className="font-medium text-[#111827]">{item.productName}</p>
                  <p className="text-xs text-[#9ca3af]">
                    {item.sku} × {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-[#374151]">
                  {formatCurrency(item.lineTotal)}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1.5 border-t border-gray-200 pt-4 text-sm">
            <div className="flex justify-between text-[#6b7280]">
              <span>Tạm tính</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.shippingFee > 0 && (
              <div className="flex justify-between text-[#6b7280]">
                <span>Phí vận chuyển</span>
                <span>{formatCurrency(order.shippingFee)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-[#111827]">
              <span>Tổng cộng</span>
              <span className="text-[#f97316]">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('orders');

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.list(),
    enabled: isAuthenticated,
  });

  const orderList: Order[] = orders?.data || [];
  const totalSpent = orderList
    .filter((o) => o.status === 'COMPLETED')
    .reduce((s, o) => s + Number(o.total), 0);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f4f6f8] px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
            <User className="h-8 w-8 text-[#f97316]" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-[#111827]">Chào mừng bạn!</h1>
          <p className="mt-2 text-sm text-[#6b7280]">
            Đăng nhập để xem đơn hàng, theo dõi giao hàng và quản lý tài khoản.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/dang-nhap">
              <Button className="w-full bg-[#f97316] hover:bg-[#ea580c] sm:w-auto">
                Đăng nhập
              </Button>
            </Link>
            <Link to="/dang-ky">
              <Button variant="secondary" className="w-full sm:w-auto">
                Tạo tài khoản
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#f4f6f8]">
        <Spinner />
      </div>
    );
  }

  const initial = user?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'K';

  const navItems: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: 'orders', label: 'Đơn hàng của tôi', icon: Package },
    { id: 'profile', label: 'Thông tin cá nhân', icon: User },
  ];

  return (
    <div className="min-h-full bg-[#f4f6f8]">
      {/* Profile hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#f97316] via-[#fb923c] to-[#ea580c]">
        <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/dn00btmpw/image/upload/v1782982295/d0ocynjittjuki4jpjco.jpg')] bg-cover bg-center opacity-10" />
        <div className="relative mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:py-12">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-3xl font-bold text-white shadow-lg backdrop-blur-sm ring-2 ring-white/30">
              {initial}
            </div>
            <div className="text-white">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Thành viên DoSuMart
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl">{user?.fullName}</h1>
              <p className="mt-1 text-orange-100">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                <Receipt className="h-5 w-5 text-[#f97316]" />
              </div>
              <div>
                <p className="text-xs text-[#9ca3af]">Tổng đơn hàng</p>
                <p className="text-xl font-bold text-[#111827]">{orderList.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <ShoppingBag className="h-5 w-5 text-[#16a34a]" />
              </div>
              <div>
                <p className="text-xs text-[#9ca3af]">Đã chi tiêu</p>
                <p className="text-xl font-bold text-[#111827]">{formatCurrency(totalSpent)}</p>
              </div>
            </div>
          </div>
          <div className="col-span-2 hidden rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-white p-5 shadow-sm lg:col-span-1 lg:block">
            <p className="text-sm font-medium text-[#374151]">Tiếp tục mua sắm</p>
            <p className="mt-1 text-xs text-[#9ca3af]">Hàng ngàn sản phẩm đang chờ bạn</p>
            <Link
              to="/san-pham"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#f97316] hover:text-[#ea580c]"
            >
              Xem sản phẩm <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="h-fit rounded-2xl border border-gray-100 bg-white p-3 shadow-sm lg:sticky lg:top-24">
            <nav className="space-y-1">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    tab === id
                      ? 'bg-[#f97316] text-white shadow-md shadow-orange-200'
                      : 'text-[#374151] hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
            <div className="mt-3 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          </aside>

          {/* Main content */}
          <div>
            {tab === 'profile' && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-lg font-bold text-[#111827]">Thông tin cá nhân</h2>
                <p className="mt-1 text-sm text-[#9ca3af]">Quản lý thông tin tài khoản của bạn</p>

                <div className="mt-8 space-y-6">
                  <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-[#fafafa] p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                      <User className="h-5 w-5 text-[#f97316]" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-[#9ca3af]">Họ và tên</p>
                      <p className="mt-1 text-base font-semibold text-[#111827]">{user?.fullName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-[#fafafa] p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                      <Mail className="h-5 w-5 text-[#f97316]" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-[#9ca3af]">Email</p>
                      <p className="mt-1 text-base font-semibold text-[#111827]">{user?.email}</p>
                    </div>
                  </div>

                  {user?.phone && (
                    <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-[#fafafa] p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                        <Phone className="h-5 w-5 text-[#f97316]" />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-[#9ca3af]">Số điện thoại</p>
                        <p className="mt-1 text-base font-semibold text-[#111827]">{user.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'orders' && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#111827]">Lịch sử đơn hàng</h2>
                    <p className="mt-1 text-sm text-[#9ca3af]">
                      {orderList.length > 0
                        ? `${orderList.length} đơn hàng`
                        : 'Theo dõi trạng thái đơn hàng của bạn'}
                    </p>
                  </div>
                  <Link to="/san-pham" className="hidden sm:block">
                    <Button className="bg-[#f97316] hover:bg-[#ea580c]">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Mua thêm
                    </Button>
                  </Link>
                </div>

                {ordersLoading ? (
                  <Spinner />
                ) : orderList.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
                      <Package className="h-8 w-8 text-[#f97316]" />
                    </div>
                    <h3 className="mt-6 text-lg font-semibold text-[#111827]">Chưa có đơn hàng nào</h3>
                    <p className="mt-2 text-sm text-[#6b7280]">
                      Hãy khám phá sản phẩm và đặt hàng đầu tiên của bạn nhé!
                    </p>
                    <Link to="/san-pham" className="mt-6 inline-block">
                      <Button className="bg-[#f97316] hover:bg-[#ea580c]">
                        Đi chợ ngay
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderList.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
