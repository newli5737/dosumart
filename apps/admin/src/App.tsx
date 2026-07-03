import { Routes, Route, Navigate } from 'react-router-dom';
import { Spinner, useAuth, AccessDeniedPage } from '@dosumart/ui';
import AdminLayout from './components/layout/AdminLayout';
import DashboardPage from './features/dashboard/DashboardPage';
import ProductsPage from './features/products/ProductsPage';
import OrdersPage from './features/orders/OrdersPage';
import InventoryPage from './features/inventory/InventoryPage';
import CustomersPage from './features/customers/CustomersPage';
import SalesPage from './features/sales/SalesPage';
import CatalogPage from './features/catalog/CatalogPage';
import CouponsPage from './features/coupons/CouponsPage';
import ReportsPage from './features/reports/ReportsPage';
import LoginPage from './features/auth/LoginPage';

function AppRoutes() {
  const { isAuthenticated, isLoading, accessDenied } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <AccessDeniedPage
        title="Không có quyền Admin"
        description="Tài khoản thu ngân hoặc khách hàng không được truy cập trang quản trị. Vui lòng dùng POS hoặc đăng xuất."
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/dang-nhap" />} />
      </Routes>
    );
  }

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/ban-hang" element={<SalesPage />} />
        <Route path="/san-pham" element={<ProductsPage />} />
        <Route path="/danh-muc" element={<CatalogPage />} />
        <Route path="/don-hang" element={<OrdersPage />} />
        <Route path="/kho-hang" element={<InventoryPage />} />
        <Route path="/khuyen-mai" element={<CouponsPage />} />
        <Route path="/bao-cao" element={<ReportsPage />} />
        <Route path="/khach-hang" element={<CustomersPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AdminLayout>
  );
}

export default function App() {
  return <AppRoutes />;
}
