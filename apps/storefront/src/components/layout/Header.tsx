import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useLocalCartStore } from '@dosumart/stores';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@dosumart/api';
import { useAuth } from '@dosumart/ui';
import type { Category } from '@dosumart/types';

export default function Header() {
  const items = useLocalCartStore((s) => s.items);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/san-pham?search=${encodeURIComponent(search.trim())}`);
      setMobileOpen(false);
    }
  };

  const displayName = user?.fullName?.split(' ').pop() || user?.email?.split('@')[0] || 'Tài khoản';

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
      <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-green-50">
        <div className="mx-auto flex max-w-[1440px] items-center justify-center px-4 py-2 text-center text-xs text-[#374151] md:text-sm">
          <span className="font-medium text-[#f97316]">Miễn phí vận chuyển</span>
          <span className="mx-2 text-gray-300">|</span>
          <span>Đơn từ 500.000đ · Giao hàng 2–4 ngày · Đổi trả trong 7 ngày</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4">
        <div className="flex h-[96px] items-center gap-4 md:gap-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <img src="/dosumart.png" alt="DoSuMart" className="h-20 w-auto object-contain" />
          </Link>

          <form onSubmit={handleSearch} className="hidden flex-1 md:block">
            <div className="relative max-w-xl">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Tìm sản phẩm, thương hiệu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-[10px] border border-gray-200 bg-[#fafafa] pl-10 pr-4 text-sm transition-colors focus:border-[#f97316] focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </form>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            <div
              className="relative"
              onMouseEnter={() => setCatOpen(true)}
              onMouseLeave={() => setCatOpen(false)}
            >
              <button className="flex h-10 items-center gap-1 rounded-[10px] px-4 text-sm font-medium text-[#374151] hover:bg-gray-50 hover:text-[#111827]">
                <Menu className="h-4 w-4" />
                Danh mục
              </button>
              {catOpen && (
                <div className="absolute left-0 top-full z-50 w-56 pt-2">
                  <div className="overflow-hidden rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
                    {(categories?.data || []).map((cat: Category) => (
                      <Link
                        key={cat.id}
                        to={`/san-pham?category=${cat.slug}`}
                        className="block rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-[#f97316]"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <NavLink to="/san-pham">Sản phẩm</NavLink>
            <NavLink to="/gio-hang" badge={count}>
              Giỏ hàng
            </NavLink>
            {user ? (
              <NavLink to="/tai-khoan" icon={<User className="h-4 w-4" />}>
                {displayName}
              </NavLink>
            ) : (
              <NavLink to="/dang-nhap" icon={<User className="h-4 w-4" />}>
                Đăng nhập
              </NavLink>
            )}
          </nav>

          <Link
            to="/gio-hang"
            className="relative flex h-10 w-10 items-center justify-center rounded-[10px] border border-gray-200 transition-colors hover:border-[#f97316] hover:bg-orange-50 md:hidden"
          >
            <ShoppingBag className="h-5 w-5 text-[#374151]" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#f97316] text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-gray-200 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
          <form onSubmit={handleSearch} className="mb-4">
            <input
              type="search"
              placeholder="Tìm sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-[10px] border border-gray-200 px-4 text-sm"
            />
          </form>
          <div className="flex flex-col gap-1">
            <Link to="/san-pham" className="rounded-[10px] px-3 py-2.5 text-sm font-medium" onClick={() => setMobileOpen(false)}>
              Sản phẩm
            </Link>
            <Link to="/gio-hang" className="rounded-[10px] px-3 py-2.5 text-sm font-medium" onClick={() => setMobileOpen(false)}>
              Giỏ hàng ({count})
            </Link>
            {user ? (
              <Link to="/tai-khoan" className="rounded-[10px] px-3 py-2.5 text-sm font-medium" onClick={() => setMobileOpen(false)}>
                {displayName}
              </Link>
            ) : (
              <Link to="/dang-nhap" className="rounded-[10px] px-3 py-2.5 text-sm font-medium" onClick={() => setMobileOpen(false)}>
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({
  to,
  children,
  badge,
  icon,
}: {
  to: string;
  children: React.ReactNode;
  badge?: number;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="relative flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-gray-50 hover:text-[#111827]"
    >
      {icon}
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f97316] px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
