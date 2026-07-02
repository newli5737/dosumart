import { Routes, Route, Navigate } from 'react-router-dom';
import { Spinner, useAuth } from '@dosumart/ui';
import LoginPage from './features/auth/LoginPage';
import SalesPage from './features/sales/SalesPage';

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
    <Routes>
      <Route path="/" element={<SalesPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
