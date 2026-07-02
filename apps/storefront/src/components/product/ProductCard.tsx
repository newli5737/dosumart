import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@dosumart/utils';
import { useLocalCartStore } from '@dosumart/stores';
import type { Product } from '@dosumart/types';

interface ProductCardProps {
  product: Product;
  showAddButton?: boolean;
}

export default function ProductCard({ product, showAddButton = true }: ProductCardProps) {
  const addItem = useLocalCartStore((s) => s.addItem);
  const variant = product.variants?.[0];
  const price = variant?.price ?? product.basePrice;
  const stock = variant?.stock ?? 0;
  const originalPrice = product.basePrice;
  const hasDiscount = originalPrice > price;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!variant || stock <= 0) return;
    addItem({
      variantId: variant.id,
      productName: product.name,
      price: variant.price,
      image: product.images[0],
      quantity: 1,
    });
  };

  return (
    <Link
      to={`/san-pham/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[10px] border border-gray-200/80 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-[#f5f5f5]">
        <img
          src={product.images[0]}
          alt={product.name}
          className={`h-full w-full object-cover transition-all duration-700 ${product.images.length > 1 ? 'group-hover:scale-110 group-hover:opacity-0' : 'group-hover:scale-105'}`}
          loading="lazy"
        />
        {product.images.length > 1 && (
          <img
            src={product.images[1]}
            alt={product.name}
            className="absolute inset-0 h-full w-full scale-95 object-cover opacity-0 transition-all duration-700 group-hover:scale-100 group-hover:opacity-100"
            loading="lazy"
          />
        )}
        {product.isFeatured && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#ea580c] shadow-sm backdrop-blur-md border border-white/50">
            Nổi bật
          </span>
        )}
        {stock <= 5 && stock > 0 && (
          <span className="absolute right-2.5 top-2.5 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-medium text-white">
            Sắp hết
          </span>
        )}
        {stock <= 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-medium text-white">
            Hết hàng
          </span>
        )}
        {hasDiscount && discountPercent > 0 && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-sm">
            -{discountPercent}%
          </span>
        )}
        {showAddButton && stock > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleAdd}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/95 py-2.5 text-sm font-semibold text-[#111827] shadow-lg backdrop-blur-md transition-all hover:bg-[#f97316] hover:text-white"
              aria-label="Thêm vào giỏ"
            >
              <ShoppingCart className="h-4 w-4" />
              Thêm vào giỏ
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.brand && (
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#9ca3af]">
            {product.brand.name}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-[#111827] group-hover:text-[#f97316]">
          {product.name}
        </h3>
        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="text-base font-bold text-[#f97316]">{formatCurrency(price)}</span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">{formatCurrency(product.basePrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[10px] border border-gray-200 bg-white">
      <div className="aspect-square animate-pulse bg-gray-100" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
        <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}
