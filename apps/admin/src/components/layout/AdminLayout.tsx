import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Users,
  Store,
  LogOut,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@dosumart/ui';
import {
  SidebarProvider,
  useSidebar,
} from '../../contexts/SidebarContext';

const navItems: { to: string; label: string; icon: LucideIcon; external?: string }[] = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/san-pham', label: 'Sản phẩm', icon: Package },
  { to: '/don-hang', label: 'Đơn hàng', icon: ShoppingCart },
  { to: '/kho-hang', label: 'Kho hàng', icon: Warehouse },
  { to: '/khach-hang', label: 'Khách hàng', icon: Users },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { collapsed } = useSidebar();

  const handleLogout = async () => {
    await logout();
    navigate('/dang-nhap');
  };

  const initial = user?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A';

  return (
    <>
      <nav className="flex-1 space-y-1.5 p-3">
        <p className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500 transition-opacity ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
          Menu
        </p>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={collapsed ? label : undefined}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white shadow-lg shadow-orange-900/25'
                  : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                {!collapsed && <span className="truncate">{label}</span>}
                {collapsed && (
                  <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block">
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
        <a
          href="https://pos-mart.dosutech.site"
          target="_blank"
          rel="noreferrer"
          title={collapsed ? 'Bán hàng POS' : undefined}
          className={`group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-gray-400 transition-all hover:bg-green-500/10 hover:text-green-400 ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <Store className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="truncate">Bán hàng (POS)</span>}
        </a>
      </nav>

      <div className="space-y-1 border-t border-white/[0.08] p-3">
        {!collapsed && user && (
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#f97316] to-[#ea580c] text-sm font-bold text-white">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user.fullName || 'Quản trị viên'}</p>
              <p className="truncate text-[11px] text-gray-500">{user.email}</p>
            </div>
          </div>
        )}

        <a
          href="https://mart.dosutech.site"
          target="_blank"
          rel="noreferrer"
          title={collapsed ? 'Xem cửa hàng' : undefined}
          className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <ExternalLink className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && 'Xem cửa hàng'}
        </a>
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? 'Đăng xuất' : undefined}
          className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400 ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && 'Đăng xuất'}
        </button>
      </div>
    </>
  );
}

function Sidebar() {
  const { collapsed, mobileOpen, setMobileOpen, toggle } = useSidebar();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.06] bg-gradient-to-b from-[#0f172a] via-[#111827] to-[#0f172a] text-gray-300 shadow-2xl transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className={`flex shrink-0 items-center border-b border-white/[0.08] ${collapsed ? 'min-h-[68px] flex-col justify-center gap-1.5 px-2 py-3' : 'h-[68px] gap-3 px-5'}`}>
          <img src="/dosumart.png" alt="DoSuMart" className={`brightness-0 invert ${collapsed ? 'h-7 w-7 object-contain' : 'h-9 w-auto'}`} />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">DoSuMart</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-orange-400/80">Quản trị</p>
            </div>
          )}
          <button
            type="button"
            onClick={toggle}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white lg:flex"
            title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}

function MobileBar() {
  const location = useLocation();
  const { setMobileOpen } = useSidebar();
  const title = navItems.find((n) => n.to === location.pathname)?.label || 'Quản trị';

  return (
    <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:hidden">
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 shadow-sm"
        aria-label="Mở menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <span className="text-sm font-semibold text-[#111827]">{title}</span>
    </div>
  );
}

function LayoutBody({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const marginClass = collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]';

  return (
    <div className={`ml-0 flex min-h-screen flex-col transition-[margin-left] duration-300 ease-in-out ${marginClass}`}>
      <MobileBar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px] animate-fade-in">{children}</div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="admin-shell min-h-screen">
        <Sidebar />
        <LayoutBody>{children}</LayoutBody>
      </div>
    </SidebarProvider>
  );
}
