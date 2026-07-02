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
    <footer className="mt-24 border-t border-gray-200 bg-[#111827] text-gray-300">
      <div className="mx-auto max-w-[1440px] px-4 py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <img src="/dosumart.png" alt="DoSuMart" className="h-12 w-auto brightness-0 invert" />
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              Đối tác gia công phần mềm & chuyển đổi số — website từ 4 triệu, SaaS ERP/LMS/HR có demo.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Danh mục</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link to="/san-pham?category=thoi-trang" className="hover:text-white transition-colors">Thời trang</Link></li>
              <li><Link to="/san-pham?category=dien-tu" className="hover:text-white transition-colors">Điện tử</Link></li>
              <li><Link to="/san-pham?category=gia-dung" className="hover:text-white transition-colors">Gia dụng</Link></li>
              <li><Link to="/san-pham?category=my-pham" className="hover:text-white transition-colors">Mỹ phẩm</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Hỗ trợ</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><span className="text-gray-400">Chính sách đổi trả</span></li>
              <li><span className="text-gray-400">Vận chuyển & giao hàng</span></li>
              <li><span className="text-gray-400">Thanh toán</span></li>
              <li><span className="text-gray-400">Liên hệ</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Liên hệ</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-400">
              <li>Số 03, Ngách 72/59 Đường Tây Mỗ, Phường Tây Mỗ, TP Hà Nội</li>
              <li>Hotline: 0346 437 915</li>
              <li>Email: support@dosutech.site</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} DoSuMart. Bảo lưu mọi quyền.
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-orange-50 text-[#f97316]">
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
