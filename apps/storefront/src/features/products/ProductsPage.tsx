import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { productsApi, categoriesApi } from '@dosumart/api';
import ProductCard, { ProductCardSkeleton } from '../../components/product/ProductCard';
import { EmptyState } from '@dosumart/ui';
import type { Product, Category } from '@dosumart/types';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const page = Number(searchParams.get('page')) || 1;
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';
  const featured = searchParams.get('featured') === 'true';

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', { page, category, sort, search: searchParams.get('search'), featured }],
    queryFn: () =>
      productsApi.list({
        page,
        limit: 20,
        category: category || undefined,
        sort: sort || undefined,
        search: searchParams.get('search') || undefined,
        featured: featured || undefined,
      }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) params.set('search', search);
    else params.delete('search');
    params.set('page', '1');
    setSearchParams(params);
  };

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    setSearchParams(params);
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111827]">Sản phẩm</h1>
        <p className="mt-1 text-sm text-[#6b7280]">
          {data?.meta?.total !== undefined ? `${data.meta.total} sản phẩm` : 'Đang tải...'}
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar filters */}
        <aside className="w-full shrink-0 lg:w-56">
          <div className="rounded-[10px] border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
              <SlidersHorizontal className="h-4 w-4" />
              Bộ lọc
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">Danh mục</p>
              <div className="mt-2 space-y-1">
                <FilterBtn active={!category} onClick={() => setFilter('category', '')}>
                  Tất cả
                </FilterBtn>
                {(categories?.data || []).map((c: Category) => (
                  <FilterBtn
                    key={c.id}
                    active={category === c.slug}
                    onClick={() => setFilter('category', c.slug)}
                  >
                    {c.name}
                  </FilterBtn>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">Sắp xếp</p>
              <select
                className="mt-2 h-10 w-full rounded-[10px] border border-gray-200 px-3 text-sm"
                value={sort}
                onChange={(e) => setFilter('sort', e.target.value)}
              >
                <option value="">Mặc định</option>
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá thấp → cao</option>
                <option value="price_desc">Giá cao → thấp</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          <form onSubmit={handleSearch} className="mb-6 flex gap-2">
            <input
              type="search"
              placeholder="Tìm sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 flex-1 rounded-[10px] border border-gray-200 bg-white px-4 text-sm focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
            <button
              type="submit"
              className="h-11 rounded-[10px] bg-[#f97316] px-5 text-sm font-medium text-white hover:bg-[#ea580c]"
            >
              Tìm
            </button>
          </form>

          {error && (
            <p className="py-12 text-center text-[#dc2626]">
              Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.
            </p>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : data?.data?.length === 0 ? (
            <EmptyState
              title="Không tìm thấy sản phẩm"
              description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {(data?.data || []).map((p: Product) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {data?.meta && data.meta.totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`h-10 w-10 rounded-[10px] text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-[#f97316] text-white'
                      : 'border border-gray-200 bg-white text-[#374151] hover:border-orange-200'
                  }`}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set('page', String(p));
                    setSearchParams(params);
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterBtn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[10px] px-3 py-2 text-left text-sm transition-colors ${
        active ? 'bg-orange-50 font-medium text-[#f97316]' : 'text-[#374151] hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}
