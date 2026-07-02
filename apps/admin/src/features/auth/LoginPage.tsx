import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Mail, Lock, ArrowRight, Shield, BarChart3, Package } from 'lucide-react';
import { authApi } from '@dosumart/api';
import { AUTH_QUERY_KEY } from '@dosumart/ui';

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

const features = [
  { icon: BarChart3, text: 'Báo cáo doanh thu theo thời gian thực' },
  { icon: Package, text: 'Quản lý sản phẩm, kho hàng tập trung' },
  { icon: Shield, text: 'Phân quyền an toàn cho nhân viên' },
];

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'STAFF'];

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@dosumart.vn', password: '123456' },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setError('');
    try {
      const res = await authApi.login(data.email, data.password);
      if (!ADMIN_ROLES.includes(res.data?.user?.role)) {
        await authApi.logout();
        setError('Tài khoản không có quyền truy cập Admin.');
        return;
      }
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      navigate('/');
    } catch {
      setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[45%] overflow-hidden bg-[#111827] lg:flex lg:flex-col lg:justify-between p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-orange-900/30 via-transparent to-green-900/20" />
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#f97316]/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-[#16a34a]/10 blur-3xl" />

        <div className="relative">
          <img src="/dosumart.png" alt="DoSuMart" className="h-14 w-auto brightness-0 invert" />
        </div>

        <div className="relative">
          <h1 className="text-3xl font-bold leading-tight text-white">
            Trung tâm điều hành
            <span className="block text-[#f97316]">DoSuMart</span>
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-400">
            Quản lý toàn bộ hoạt động bán hàng — sản phẩm, đơn hàng, kho và khách hàng trên một nền tảng.
          </p>

          <ul className="mt-10 space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-gray-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/10">
                  <Icon className="h-4 w-4 text-[#f97316]" />
                </div>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-gray-600">© {new Date().getFullYear()} DoSuMart</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-[#f3f4f6] p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <img src="/dosumart.png" alt="DoSuMart" className="h-12 w-auto" />
          </div>

          <div className="rounded-[10px] border border-gray-200/80 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[#111827]">Đăng nhập</h2>
            <p className="mt-1 text-sm text-[#6b7280]">Nhập thông tin tài khoản quản trị</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#374151]">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="admin@dosumart.vn"
                    {...register('email')}
                    className="h-11 w-full rounded-[10px] border border-gray-200 bg-[#fafafa] pl-10 pr-4 text-sm transition-colors focus:border-[#f97316] focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-[#dc2626]">{errors.email.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#374151]">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    className="h-11 w-full rounded-[10px] border border-gray-200 bg-[#fafafa] pl-10 pr-4 text-sm transition-colors focus:border-[#f97316] focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                {errors.password && <p className="mt-1 text-xs text-[#dc2626]">{errors.password.message}</p>}
              </div>

              {error && (
                <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#dc2626]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#f97316] text-sm font-semibold text-white transition-colors hover:bg-[#ea580c] disabled:opacity-60"
              >
                {isSubmitting ? 'Đang đăng nhập...' : (
                  <>Đăng nhập <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
