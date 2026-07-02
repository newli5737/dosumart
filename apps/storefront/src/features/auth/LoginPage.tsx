import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, Lock, LogIn } from 'lucide-react';
import { authApi } from '@dosumart/api';
import { AUTH_QUERY_KEY } from '@dosumart/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.login(email, password);
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      navigate('/');
    } catch {
      setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl flex">
        <div className="hidden w-1/2 bg-gradient-to-br from-orange-400 to-[#f97316] p-12 text-white lg:flex lg:flex-col lg:justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/dn00btmpw/image/upload/v1782982295/d0ocynjittjuki4jpjco.jpg')] bg-cover bg-center opacity-30 mix-blend-overlay" />
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/30">
              <ArrowLeft className="h-4 w-4" />
              Về trang chủ
            </Link>
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold leading-tight">Chào mừng<br/>trở lại!</h2>
            <p className="mt-4 text-lg text-orange-50">
              Khám phá hàng ngàn sản phẩm tiện ích cho cuộc sống hàng ngày tại DoSuMart.
            </p>
          </div>
        </div>

        <div className="w-full p-8 sm:p-12 lg:w-1/2">
          <div className="text-center lg:text-left">
            <img src="/dosumart.png" alt="DoSuMart" className="mx-auto h-12 w-auto lg:mx-0" />
            <h2 className="mt-8 text-2xl font-bold tracking-tight text-gray-900">Đăng nhập tài khoản</h2>
            <p className="mt-2 text-sm text-gray-600">
              Chưa có tài khoản?{' '}
              <Link to="/dang-ky" className="font-semibold text-[#f97316] hover:text-[#ea580c] transition-colors">
                Đăng ký ngay
              </Link>
            </p>
          </div>

          <form className="mt-10 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="relative mt-1 rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-10 pr-3 text-sm text-gray-900 transition-colors focus:border-[#f97316] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#f97316]"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                <div className="relative mt-1 rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-10 pr-3 text-sm text-gray-900 transition-colors focus:border-[#f97316] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#f97316]"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-[#f97316] focus:ring-[#f97316]"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-semibold text-[#f97316] hover:text-[#ea580c]">
                  Quên mật khẩu?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-xl bg-[#f97316] py-3 px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#ea580c] disabled:opacity-60 transition-colors"
            >
              <LogIn className="mr-2 h-5 w-5" />
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
