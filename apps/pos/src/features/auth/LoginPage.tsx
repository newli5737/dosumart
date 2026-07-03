import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Mail, Lock, ArrowRight, ScanBarcode, Receipt, Zap } from 'lucide-react';
import { authApi } from '@dosumart/api';
import { AUTH_QUERY_KEY } from '@dosumart/ui';

const features = [
  { icon: ScanBarcode, text: 'Quét mã vạch, tìm sản phẩm nhanh' },
  { icon: Receipt, text: 'In hóa đơn tự động sau thanh toán' },
  { icon: Zap, text: 'Phím tắt F2/F4 cho thao tác siêu tốc' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('thungan@dosumart.vn');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.login(email, password);
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      navigate('/');
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      if (code === 'FORBIDDEN_CLIENT') {
        setError('Tài khoản không có quyền truy cập POS.');
      } else {
        setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[45%] overflow-hidden bg-[#0f172a] lg:flex lg:flex-col lg:justify-between p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-green-900/30 via-transparent to-orange-900/20" />
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#16a34a]/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-[#f97316]/10 blur-3xl" />

        <div className="relative">
          <img src="/dosumart.png" alt="DoSuMart" className="h-14 w-auto brightness-0 invert" />
        </div>

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#16a34a]">Point of Sale</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-white">
            Bán hàng tại quầy
            <span className="block text-[#16a34a]">DoSuMart POS</span>
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-400">
            Hệ thống thu ngân chuyên nghiệp — quét mã, thanh toán, in bill trong vài giây.
          </p>

          <ul className="mt-10 space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-gray-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="h-4 w-4 text-[#16a34a]" />
                </div>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-gray-600">© {new Date().getFullYear()} DoSuMart</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-[#f1f5f9] p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <img src="/dosumart.png" alt="DoSuMart" className="h-12 w-auto" />
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div className="mb-1 inline-flex rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-[#16a34a]">
              Thu ngân
            </div>
            <h2 className="mt-3 text-2xl font-bold text-[#111827]">Đăng nhập POS</h2>
            <p className="mt-1 text-sm text-[#6b7280]">Nhập tài khoản thu ngân để bắt đầu ca</p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#374151]">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="thungan@dosumart.vn"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-[#fafafa] pl-10 pr-4 text-sm transition-colors focus:border-[#16a34a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#374151]">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-[#fafafa] pl-10 pr-4 text-sm transition-colors focus:border-[#16a34a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#dc2626]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#16a34a] to-[#22c55e] text-sm font-semibold text-white shadow-md shadow-green-200 transition-all hover:from-[#15803d] hover:to-[#16a34a] disabled:opacity-60"
              >
                {loading ? 'Đang đăng nhập...' : (
                  <>Bắt đầu ca <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
