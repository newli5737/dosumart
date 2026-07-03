import { Routes, Route, Navigate } from 'react-router-dom';
import { Spinner, useAuth, AccessDeniedPage } from '@dosumart/ui';
import LoginPage from './features/auth/LoginPage';
import SalesPage from './features/sales/SalesPage';

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
        title="Không có quyền POS"
        description="Chỉ tài khoản thu ngân hoặc quản trị mới được dùng POS."
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
    <Routes>
      <Route path="/" element={<SalesPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
