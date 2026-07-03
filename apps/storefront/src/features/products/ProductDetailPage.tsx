import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  ShoppingCart,
  Truck,
  ShieldCheck,
  Check,
  Minus,
  Plus,
  Package,
} from 'lucide-react';
import { productsApi } from '@dosumart/api';
import { formatCurrency } from '@dosumart/utils';
import { Spinner } from '@dosumart/ui';
import { useLocalCartStore } from '@dosumart/stores';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const addItem = useLocalCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#f4f6f8]">
        <Spinner />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#f4f6f8] px-4">
        <div className="rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
          <p className="text-[#dc2626]">Không thể tải thông tin sản phẩm.</p>
          <Link to="/san-pham" className="mt-4 inline-block text-sm font-medium text-[#f97316] hover:underline">
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const product = data.data;
  const variant = product.variants?.[0];
  const stock = variant?.stock ?? 0;
  const price = variant?.price ?? product.basePrice;
  const hasDiscount = product.basePrice > price;

  const handleAddToCart = () => {
    if (!variant || stock <= 0) return;
    addItem({
      variantId: variant.id,
      productName: product.name,
      price: variant.price,
      image: product.images[0],
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-full bg-[#f4f6f8]">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-10">
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-[#6b7280]">
          <Link to="/" className="hover:text-[#f97316]">Trang chủ</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/san-pham" className="hover:text-[#f97316]">Sản phẩm</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate text-[#111827]">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-square overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <img
                src={product.images[activeImage] || product.images[0]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                      activeImage === i ? 'border-[#f97316]' : 'border-gray-200'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            {product.brand && (
              <p className="text-xs font-semibold uppercase tracking-wider text-[#f97316]">
                {product.brand.name}
              </p>
            )}
            <h1 className="mt-2 text-2xl font-bold text-[#111827] md:text-3xl">{product.name}</h1>

            {product.category && (
              <p className="mt-2 text-sm text-[#6b7280]">
                Danh mục:{' '}
                <Link
                  to={`/san-pham?category=${product.category.slug}`}
                  className="font-medium text-[#f97316] hover:underline"
                >
                  {product.category.name}
                </Link>
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-bold text-[#f97316]">{formatCurrency(price)}</span>
              {hasDiscount && (
                <span className="text-lg text-gray-400 line-through">{formatCurrency(product.basePrice)}</span>
              )}
            </div>

            <div className="mt-4">
              {stock > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-[#16a34a]">
                  <Check className="h-3.5 w-3.5" />
                  Còn {stock} sản phẩm
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-[#dc2626]">
                  <Package className="h-3.5 w-3.5" />
                  Hết hàng
                </span>
              )}
            </div>

            {product.description && (
              <p className="mt-6 text-sm leading-relaxed text-[#4b5563] border-t border-gray-100 pt-6">
                {product.description}
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-xs font-medium text-[#374151]">
                <Truck className="h-4 w-4 text-[#f97316]" />
                Giao 2–4 ngày
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-green-100 bg-green-50/50 px-4 py-3 text-xs font-medium text-[#374151]">
                <ShieldCheck className="h-4 w-4 text-[#16a34a]" />
                Hàng chính hãng
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-8">
              <div className="flex items-center rounded-xl border border-gray-200 bg-[#fafafa]">
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center text-gray-600 hover:text-[#111827]"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center text-gray-600 hover:text-[#111827]"
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!variant || stock <= 0}
                className="inline-flex h-12 min-w-[220px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-6 text-sm font-semibold text-white shadow-md shadow-orange-200 transition-colors hover:bg-[#ea580c] disabled:opacity-50 sm:flex-none"
              >
                {added ? (
                  <>
                    <Check className="h-4 w-4" /> Đã thêm vào giỏ
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" /> Thêm vào giỏ hàng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
