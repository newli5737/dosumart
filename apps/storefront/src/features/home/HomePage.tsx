import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBasket, CupSoda, Flame, Candy, SprayCan, Sparkles, ChevronRight, ChevronLeft, Clock } from 'lucide-react';
import { productsApi, categoriesApi } from '@dosumart/api';
import ProductCard, { ProductCardSkeleton } from '../../components/product/ProductCard';
import { TrustBar } from '../../components/layout/Footer';
import type { Product, Category } from '@dosumart/types';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const categoryIcons: Record<string, React.ElementType> = {
  'thuc-pham': ShoppingBasket,
  'gia-vi': Flame,
  'do-uong': CupSoda,
  'an-vat': Candy,
  'hoa-pham': SprayCan,
};

const BANNERS = [
  {
    id: 1,
    image: 'https://res.cloudinary.com/dn00btmpw/image/upload/v1782982295/d0ocynjittjuki4jpjco.jpg',
    tag: 'Siêu thị thu nhỏ',
    title: 'Tạp Hóa Việt',
    subtitle: 'Tiện lợi mỗi ngày',
    desc: 'Hàng ngàn sản phẩm nhu yếu phẩm, gia vị, đồ uống chính hãng. Giao hàng thần tốc trong ngày.',
    link: '/san-pham',
    btnText: 'Đi chợ ngay'
  },
  {
    id: 2,
    image: 'https://res.cloudinary.com/dn00btmpw/image/upload/v1782982299/wvaktc01edu6gltawozq.jpg',
    tag: 'Đậm đà hương vị',
    title: 'Gia vị',
    subtitle: 'Bếp nhà Việt',
    desc: 'Nước mắm Nam Ngư, Tương ớt Chinsu, Hạt nêm Knorr... Đầy đủ gia vị cho mâm cơm tròn vị.',
    link: '/san-pham?category=gia-vi',
    btnText: 'Xem gian hàng'
  }
];

export default function HomePage() {
  const [currentBanner, setCurrentBanner] = useState(0);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const { data: featured, isLoading: loadingFeatured } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsApi.list({ featured: true, limit: 10 }),
  });

  const { data: newest, isLoading: loadingNew } = useQuery({
    queryKey: ['products', 'new'],
    queryFn: () => productsApi.list({ sort: 'newest', limit: 10 }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  });

  const cats = categories?.data || [];
  const catThucPham = cats.find((c: Category) => c.slug === 'thuc-pham') || cats[0];
  const catGiaVi = cats.find((c: Category) => c.slug === 'gia-vi') || cats[1];
  const catDoUong = cats.find((c: Category) => c.slug === 'do-uong') || cats[2];
  const catAnVat = cats.find((c: Category) => c.slug === 'an-vat') || cats[3];

  return (
    <div className="bg-[#f4f6f8]">
      {/* Hero Section with Parallax */}
      <section className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden bg-black">
        <AnimatePresence initial={false}>
          <motion.div
            key={currentBanner}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
            style={{ y: y1 }}
          >
            <motion.img
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 6, ease: 'linear' }}
              src={BANNERS[currentBanner].image}
              alt={BANNERS[currentBanner].title}
              className="h-full w-full object-contain md:object-cover md:object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-[1440px] px-8 md:px-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBanner}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.5 }}
                className="max-w-xl text-white"
              >
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5" />
                  {BANNERS[currentBanner].tag}
                </div>
                <h1 className="text-5xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl">
                  {BANNERS[currentBanner].title}
                  <span className="mt-2 block text-[#f97316]">
                    {BANNERS[currentBanner].subtitle}
                  </span>
                </h1>
                <p className="mt-6 max-w-lg text-base leading-relaxed text-gray-200 md:text-lg">
                  {BANNERS[currentBanner].desc}
                </p>
                <div className="mt-8">
                  <Link
                    to={BANNERS[currentBanner].link}
                    className="inline-flex h-14 items-center gap-3 rounded-full bg-[#f97316] px-8 text-base font-bold text-white transition-all hover:scale-105 hover:bg-[#ea580c] hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                  >
                    {BANNERS[currentBanner].btnText}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Slider Controls */}
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-3 z-10">
          {BANNERS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentBanner(idx)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                currentBanner === idx ? "w-10 bg-[#f97316]" : "w-2 bg-white/50 hover:bg-white"
              )}
            />
          ))}
        </div>
      </section>

      {/* Marquee Brands */}
      <div className="border-y border-gray-200 bg-white py-8 overflow-hidden">
        <div className="flex w-max animate-[marquee_20s_linear_infinite] items-center gap-16 px-8 transition-all duration-500">
          {[1, 2].map((loop) => (
            <div key={loop} className="flex items-center gap-20 font-black tracking-tighter">
              <span className="text-[#E31837] text-4xl uppercase">MASAN</span>
              <span className="text-[#DA251D] text-4xl italic">Acecook</span>
              <span className="text-[#005B9F] text-4xl font-serif">VINAMILK</span>
              <span className="text-[#0055A5] text-4xl">SABECO</span>
              <span className="text-[#E3000F] text-4xl">CHINSU</span>
              <span className="text-[#ED1C24] text-4xl italic">Hảo Hảo</span>
              <span className="text-[#0033A0] text-4xl font-serif">Unilever</span>
            </div>
          ))}
        </div>
      </div>

      <TrustBar />

      {/* Categories Bento Grid */}
      <section className="mx-auto max-w-[1440px] px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-[#111827]">Khám phá Gian hàng</h2>
          <p className="mt-2 text-gray-500">Đầy đủ mặt hàng cho cuộc sống hàng ngày</p>
        </div>

        {cats.length >= 4 && (
          <div className="grid h-auto grid-cols-1 gap-4 md:h-[500px] md:grid-cols-4 md:grid-rows-2">
            {/* Bento Item 1: Large (Thực phẩm) */}
            {catThucPham && (
              <Link to={`/san-pham?category=${catThucPham.slug}`} className="group relative col-span-1 overflow-hidden rounded-3xl bg-black shadow-sm md:col-span-2 md:row-span-2">
                <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/dn00btmpw/image/upload/v1782982306/ufzrvdgmptoovbnpomx1.jpg')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 transition-opacity group-hover:opacity-90" />
                <div className="absolute bottom-0 left-0 p-8 text-white">
                  <ShoppingBasket className="mb-3 h-10 w-10 text-orange-400" />
                  <h3 className="text-3xl font-bold">{catThucPham.name}</h3>
                  <p className="mt-2 text-orange-100">Gạo, mì, phở, miến...</p>
                </div>
              </Link>
            )}

            {/* Bento Item 2: Medium (Gia vị) */}
            {catGiaVi && (
              <Link to={`/san-pham?category=${catGiaVi.slug}`} className="group relative col-span-1 overflow-hidden rounded-3xl bg-black shadow-sm md:col-span-1 md:row-span-1">
                <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/dn00btmpw/image/upload/v1782982310/pctdjvhktdufhkm91npt.jpg')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 transition-opacity group-hover:opacity-90" />
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <Flame className="mb-2 h-8 w-8 text-red-400" />
                  <h3 className="text-xl font-bold">{catGiaVi.name}</h3>
                </div>
              </Link>
            )}

            {/* Bento Item 3: Tall (Đồ uống) */}
            {catDoUong && (
              <Link to={`/san-pham?category=${catDoUong.slug}`} className="group relative col-span-1 overflow-hidden rounded-3xl bg-black shadow-sm md:col-span-1 md:row-span-2">
                <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/dn00btmpw/image/upload/v1782982315/q1h15knili2asqdxzfq7.png')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 transition-opacity group-hover:opacity-90" />
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <CupSoda className="mb-2 h-8 w-8 text-blue-400" />
                  <h3 className="text-2xl font-bold">{catDoUong.name}</h3>
                  <p className="mt-2 text-blue-100">Bia, nước ngọt, trà...</p>
                </div>
              </Link>
            )}

            {/* Bento Item 4: Small (Đồ ăn vặt / Hóa phẩm) */}
            {catAnVat && (
              <Link to={`/san-pham?category=${catAnVat.slug}`} className="group relative col-span-1 overflow-hidden rounded-3xl bg-orange-100 shadow-sm md:col-span-1 md:row-span-1 transition-colors hover:bg-orange-200">
                <div className="flex h-full flex-col items-center justify-center p-6 text-center text-orange-900">
                  <Candy className="mb-3 h-10 w-10 text-orange-500" />
                  <h3 className="text-xl font-bold">{catAnVat.name}</h3>
                  <span className="mt-2 rounded-full bg-white/50 px-3 py-1 text-xs font-semibold backdrop-blur-sm">Khám phá</span>
                </div>
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <ProductSection
        title="Bán chạy nhất"
        subtitle="Sản phẩm được nhiều gia đình tin dùng"
        products={featured?.data}
        loading={loadingFeatured}
        viewAllHref="/san-pham?featured=true"
      />

      {/* Promo Flash Sale */}
      <section className="mx-auto max-w-[1440px] px-4 py-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-red-600 to-orange-500 px-8 py-12 text-white shadow-2xl md:px-16 md:py-16">
          <div className="absolute -right-20 -top-20 h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-yellow-400/20 blur-3xl" />
          
          <div className="relative z-10 flex flex-col items-center justify-between gap-10 md:flex-row">
            <div className="max-w-xl text-center md:text-left">
              <div className="mb-6 inline-flex animate-bounce items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-red-600 shadow-lg">
                <Flame className="h-5 w-5" />
                FLASH SALE CUỐI TUẦN
              </div>
              <h3 className="text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
                Giảm 30% toàn bộ
                <span className="mt-2 block text-yellow-300">Gia vị & Đồ uống</span>
              </h3>
              <p className="mt-4 text-lg font-medium text-red-100">
                Nhập mã <span className="rounded bg-black/20 px-2 py-1 font-mono tracking-widest text-white">GIAM10</span> lúc thanh toán.
              </p>
            </div>
            
            {/* Fake Timer */}
            <div className="flex shrink-0 gap-4 rounded-3xl bg-black/20 p-6 backdrop-blur-md">
              <div className="flex flex-col items-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl font-black text-red-600 shadow-inner">02</span>
                <span className="mt-2 text-xs font-bold uppercase tracking-wider text-red-100">Ngày</span>
              </div>
              <div className="text-3xl font-bold text-white/50 mt-3">:</div>
              <div className="flex flex-col items-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl font-black text-red-600 shadow-inner">15</span>
                <span className="mt-2 text-xs font-bold uppercase tracking-wider text-red-100">Giờ</span>
              </div>
              <div className="text-3xl font-bold text-white/50 mt-3">:</div>
              <div className="flex flex-col items-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl font-black text-red-600 shadow-inner">45</span>
                <span className="mt-2 text-xs font-bold uppercase tracking-wider text-red-100">Phút</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New products */}
      <ProductSection
        title="Hàng mới lên kệ"
        subtitle="Cập nhật liên tục mỗi ngày"
        products={newest?.data}
        loading={loadingNew}
        viewAllHref="/san-pham?sort=newest"
      />
      
      {/* Required style for marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function ProductSection({
  title,
  subtitle,
  products,
  loading,
  viewAllHref,
}: {
  title: string;
  subtitle: string;
  products?: Product[];
  loading: boolean;
  viewAllHref: string;
}) {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#111827]">{title}</h2>
          <p className="mt-2 text-gray-500">{subtitle}</p>
        </div>
        <Link to={viewAllHref} className="hidden items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#111827] shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:shadow-md md:flex">
          Xem tất cả <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : (products || []).map((p, index) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.05, duration: 0.5, type: "spring", stiffness: 100 }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
      </div>
      {!loading && (!products || products.length === 0) && (
        <div className="flex h-40 items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white/50">
          <p className="text-sm font-medium text-gray-500">Chưa có sản phẩm trong danh mục này.</p>
        </div>
      )}
    </section>
  );
}
