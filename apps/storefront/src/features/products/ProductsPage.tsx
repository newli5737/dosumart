import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, Search, ChevronRight } from 'lucide-react';
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

  const activeCategory = (categories?.data || []).find((c: Category) => c.slug === category);

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
    <div className="min-h-full bg-[#f4f6f8]">
      {/* Page header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
          <nav className="mb-3 flex items-center gap-1.5 text-sm text-[#9ca3af]">
            <Link to="/" className="hover:text-[#f97316]">Trang chủ</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-[#111827]">Sản phẩm</span>
            {activeCategory && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-[#f97316]">{activeCategory.name}</span>
              </>
            )}
          </nav>
          <h1 className="text-2xl font-bold text-[#111827] sm:text-3xl">
            {activeCategory ? activeCategory.name : 'Tất cả sản phẩm'}
          </h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            {data?.meta?.total !== undefined ? `${data.meta.total} sản phẩm` : 'Đang tải...'}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <aside className="w-full shrink-0 lg:w-64">
            <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-[#111827]">
                <SlidersHorizontal className="h-4 w-4 text-[#f97316]" />
                Bộ lọc
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Danh mục</p>
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

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Sắp xếp</p>
                <select
                  className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-[#fafafa] px-3 text-sm focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100"
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

          <div className="flex-1">
            <form onSubmit={handleSearch} className="mb-6 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Tìm sản phẩm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm shadow-sm focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </div>
              <button
                type="submit"
                className="h-12 shrink-0 rounded-xl bg-[#f97316] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#ea580c]"
              >
                Tìm
              </button>
            </form>

            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 py-12 text-center text-red-600">
                Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : data?.data?.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white py-16 shadow-sm">
                <EmptyState
                  title="Không tìm thấy sản phẩm"
                  description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
                />
              </div>
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
                    className={`h-10 w-10 rounded-xl text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-[#f97316] text-white shadow-md shadow-orange-200'
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
      className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
        active
          ? 'bg-[#f97316] font-semibold text-white shadow-sm'
          : 'text-[#374151] hover:bg-orange-50 hover:text-[#f97316]'
      }`}
    >
      {children}
    </button>
  );
}
