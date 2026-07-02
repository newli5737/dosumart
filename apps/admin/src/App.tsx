import { Routes, Route, Navigate } from 'react-router-dom';
import { Spinner, useAuth } from '@dosumart/ui';
import AdminLayout from './components/layout/AdminLayout';
import DashboardPage from './features/dashboard/DashboardPage';
import ProductsPage from './features/products/ProductsPage';
import OrdersPage from './features/orders/OrdersPage';
import InventoryPage from './features/inventory/InventoryPage';
import CustomersPage from './features/customers/CustomersPage';
import LoginPage from './features/auth/LoginPage';

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
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
        <Route path="/san-pham" element={<ProductsPage />} />
        <Route path="/don-hang" element={<OrdersPage />} />
        <Route path="/kho-hang" element={<InventoryPage />} />
        <Route path="/khach-hang" element={<CustomersPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AdminLayout>
  );
}

export default function App() {
  return <AppRoutes />;
}
