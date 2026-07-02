import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ShoppingCart, Truck, ShieldCheck, Check } from 'lucide-react';
import { productsApi } from '@dosumart/api';
import { formatCurrency } from '@dosumart/utils';
import { Button, Spinner } from '@dosumart/ui';
import { useLocalCartStore } from '@dosumart/stores';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const addItem = useLocalCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug!),
    enabled: !!slug,
  });

  if (isLoading) return <Spinner />;
  if (error || !data?.data) {
    return (
      <div className="py-20 text-center text-[#dc2626]">
        Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.
      </div>
    );
  }

  const product = data.data;
  const variant = product.variants?.[0];
  const stock = variant?.stock ?? 0;

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
    <div className="mx-auto max-w-[1440px] px-4 py-8 md:py-12">
      {/* Breadcrumb */}
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
          <div className="aspect-square overflow-hidden rounded-[10px] border border-gray-200 bg-[#f5f5f5]">
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img: string, i: number) => (
                <div key={i} className="h-20 w-20 overflow-hidden rounded-[10px] border border-gray-200">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.brand && (
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
              {product.brand.name}
            </p>
          )}
          <h1 className="mt-2 text-2xl font-bold text-[#111827] md:text-3xl">{product.name}</h1>

          {product.category && (
            <p className="mt-2 text-sm text-[#6b7280]">
              Danh mục:{' '}
              <Link
                to={`/san-pham?category=${product.category.slug}`}
                className="text-[#f97316] hover:underline"
              >
                {product.category.name}
              </Link>
            </p>
          )}

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-[#f97316]">
              {formatCurrency(variant?.price ?? product.basePrice)}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {stock > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-[#16a34a]">
                <Check className="h-3.5 w-3.5" />
                Còn {stock} sản phẩm
              </span>
            ) : (
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-[#dc2626]">
                Hết hàng
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-6 text-sm leading-relaxed text-[#4b5563]">{product.description}</p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-[10px] border border-gray-100 bg-[#fafafa] px-3 py-2.5 text-xs text-[#374151]">
              <Truck className="h-4 w-4 text-[#f97316]" />
              Giao 2–4 ngày
            </div>
            <div className="flex items-center gap-2 rounded-[10px] border border-gray-100 bg-[#fafafa] px-3 py-2.5 text-xs text-[#374151]">
              <ShieldCheck className="h-4 w-4 text-[#16a34a]" />
              Hàng chính hãng
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-[10px] border border-gray-200">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center text-lg text-[#374151] hover:bg-gray-50"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                −
              </button>
              <span className="w-12 text-center text-sm font-medium">{quantity}</span>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center text-lg text-[#374151] hover:bg-gray-50"
                onClick={() => setQuantity(Math.min(stock, quantity + 1))}
              >
                +
              </button>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={!variant || stock <= 0}
              size="lg"
              className="min-w-[200px] !bg-[#f97316] hover:!bg-[#ea580c]"
            >
              {added ? (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" /> Đã thêm
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" /> Thêm vào giỏ
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
