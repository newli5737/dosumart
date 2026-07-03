import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './features/home/HomePage';
import ProductsPage from './features/products/ProductsPage';
import ProductDetailPage from './features/products/ProductDetailPage';
import CartPage from './features/cart/CartPage';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import AccountPage from './features/account/AccountPage';
import CheckoutPage from './features/checkout/CheckoutPage';
import CheckoutQrPage from './features/checkout/CheckoutQrPage';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/san-pham" element={<ProductsPage />} />
          <Route path="/san-pham/:slug" element={<ProductDetailPage />} />
          <Route path="/gio-hang" element={<CartPage />} />
          <Route path="/thanh-toan" element={<CheckoutPage />} />
          <Route path="/thanh-toan/qr" element={<CheckoutQrPage />} />
          <Route path="/dang-nhap" element={<LoginPage />} />
          <Route path="/dang-ky" element={<RegisterPage />} />
          <Route path="/tai-khoan" element={<AccountPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
