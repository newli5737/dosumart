import { useAuth } from './AuthProvider';

export function AccessDeniedPage({
  title = 'Không có quyền truy cập',
  description = 'Tài khoản của bạn không được phép sử dụng ứng dụng này.',
}: {
  title?: string;
  description?: string;
}) {
  const { logout, user } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f4f6] p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
          ⛔
        </div>
        <h1 className="text-xl font-bold text-[#111827]">{title}</h1>
        <p className="mt-2 text-sm text-[#6b7280]">{description}</p>
        {user && (
          <p className="mt-3 text-xs text-[#9ca3af]">
            Đang đăng nhập: {user.fullName} ({user.email})
          </p>
        )}
        <button
          type="button"
          onClick={() => logout()}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#111827] px-6 text-sm font-semibold text-white hover:bg-black"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
