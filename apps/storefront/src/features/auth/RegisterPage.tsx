import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, Lock, User, UserPlus } from 'lucide-react';
import { authApi } from '@dosumart/api';
import { AUTH_QUERY_KEY } from '@dosumart/ui';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.register({ email, password, fullName: name });
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      navigate('/');
    } catch {
      setError('Không thể tạo tài khoản. Email có thể đã được sử dụng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-row-reverse">
        {/* Right Side: Image/Banner (Reversed for Register) */}
        <div className="hidden w-1/2 bg-gradient-to-bl from-green-500 to-[#16a34a] p-12 text-white lg:flex lg:flex-col lg:justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay" />
          <div className="relative z-10 text-right">
            <Link to="/" className="inline-flex flex-row-reverse items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/30">
              <ArrowLeft className="h-4 w-4 rotate-180" />
              Về trang chủ
            </Link>
          </div>
          <div className="relative z-10 text-right">
            <h2 className="text-4xl font-extrabold leading-tight">Đăng ký<br/>thành viên!</h2>
            <p className="mt-4 text-lg text-green-50">
              Nhận ngay mã giảm giá 50k cho đơn hàng đầu tiên khi tạo tài khoản DoSuMart.
            </p>
          </div>
        </div>

        {/* Left Side: Form */}
        <div className="w-full p-8 sm:p-12 lg:w-1/2">
          <div className="text-center lg:text-left">
            <img src="/dosumart.png" alt="DoSuMart" className="mx-auto h-12 w-auto lg:mx-0" />
            <h2 className="mt-8 text-2xl font-bold tracking-tight text-gray-900">Tạo tài khoản mới</h2>
            <p className="mt-2 text-sm text-gray-600">
              Đã có tài khoản?{' '}
              <Link to="/dang-nhap" className="font-semibold text-[#16a34a] hover:text-[#15803d] transition-colors">
                Đăng nhập
              </Link>
            </p>
          </div>

          <form className="mt-10 space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                <div className="relative mt-1 rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-10 pr-3 text-sm text-gray-900 transition-colors focus:border-[#16a34a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#16a34a]"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

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
                    className="block w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-10 pr-3 text-sm text-gray-900 transition-colors focus:border-[#16a34a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#16a34a]"
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
                    className="block w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-10 pr-3 text-sm text-gray-900 transition-colors focus:border-[#16a34a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#16a34a]"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-xl bg-[#16a34a] py-3 px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#15803d] disabled:opacity-60 transition-colors"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                {loading ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
              </button>
            </div>
            
            <p className="text-center text-xs text-gray-500">
              Bằng việc đăng ký, bạn đồng ý với <a href="#" className="text-[#16a34a] hover:underline">Điều khoản dịch vụ</a> và <a href="#" className="text-[#16a34a] hover:underline">Chính sách bảo mật</a> của chúng tôi.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
