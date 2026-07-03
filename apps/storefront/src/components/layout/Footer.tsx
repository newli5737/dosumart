import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, Headphones, RotateCcw } from 'lucide-react';

const perks = [
  { icon: Truck, title: 'Giao hàng nhanh', desc: '2–4 ngày toàn quốc' },
  { icon: ShieldCheck, title: 'Hàng chính hãng', desc: 'Cam kết 100% authentic' },
  { icon: RotateCcw, title: 'Đổi trả dễ dàng', desc: 'Trong vòng 7 ngày' },
  { icon: Headphones, title: 'Hỗ trợ 24/7', desc: 'Hotline 028 1234 5678' },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-800 bg-[#111827] text-gray-300">
      <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <img src="/dosumart.png" alt="DoSuMart" className="h-12 w-auto brightness-0 invert" />
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              Tạp hóa Việt trực tuyến — nhu yếu phẩm, gia vị, đồ uống chính hãng. Giao hàng nhanh, giá bình dân.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Danh mục</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link to="/san-pham?category=thuc-pham" className="transition-colors hover:text-[#f97316]">Thực phẩm khô</Link></li>
              <li><Link to="/san-pham?category=gia-vi" className="transition-colors hover:text-[#f97316]">Gia vị</Link></li>
              <li><Link to="/san-pham?category=do-uong" className="transition-colors hover:text-[#f97316]">Đồ uống</Link></li>
              <li><Link to="/san-pham?category=an-vat" className="transition-colors hover:text-[#f97316]">Đồ ăn vặt</Link></li>
              <li><Link to="/san-pham?category=hoa-pham" className="transition-colors hover:text-[#f97316]">Hóa mỹ phẩm</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Hỗ trợ</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-400">
              <li>Chính sách đổi trả trong 7 ngày</li>
              <li>Miễn phí ship đơn từ 500.000đ</li>
              <li>Thanh toán COD & chuyển khoản</li>
              <li><Link to="/dang-nhap" className="transition-colors hover:text-[#f97316]">Tài khoản & đơn hàng</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Liên hệ</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-400">
              <li>123 Nguyễn Huệ, Quận 1, TP.HCM</li>
              <li>Hotline: 028 1234 5678</li>
              <li>Email: hotro@dosumart.vn</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} DoSuMart — Tạp Hóa Việt. Bảo lưu mọi quyền.
        </div>
      </div>
    </footer>
  );
}

export function TrustBar() {
  return (
    <section className="border-y border-gray-100 bg-white">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4 md:py-10">
        {perks.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#f97316]">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111827]">{title}</p>
              <p className="mt-0.5 text-xs text-[#6b7280]">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
