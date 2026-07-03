import { useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, Banknote, Minus, Plus, Trash2, X, ScanBarcode } from 'lucide-react';
import { posApi } from '@dosumart/api';
import { usePosStore } from '@dosumart/stores';
import { formatCurrency } from '@dosumart/utils';
import { Spinner } from '@dosumart/ui';
import { PageToolbar } from '../../components/ui/AdminUI';

export default function SalesPage() {
  const [search, setSearch] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const { items, addItem, updateQuantity, removeItem, clear, subtotal, discount, setDiscount } = usePosStore();

  const { data: shift, refetch: refetchShift, isLoading: shiftLoading } = useQuery({
    queryKey: ['current-shift'],
    queryFn: posApi.currentShift,
  });

  const { data: products, refetch: searchProducts } = useQuery({
    queryKey: ['pos-search', search],
    queryFn: () => posApi.searchProducts(search),
    enabled: search.length >= 2,
  });

  const openShiftMutation = useMutation({
    mutationFn: (cash: number) => posApi.openShift(cash),
    onSuccess: () => refetchShift(),
  });

  const createOrderMutation = useMutation({
    mutationFn: posApi.createOrder,
    onSuccess: (res) => {
      const o = res.data;
      setLastReceipt(
        `Đơn: ${o.code}\nTổng: ${formatCurrency(o.total)}\nTiền nhận: ${formatCurrency(o.cashReceived || 0)}\nTiền thối: ${formatCurrency(o.changeAmount || 0)}`,
      );
      clear();
      setShowPayment(false);
      setCashReceived('');
    },
  });

  const total = subtotal() - discount;

  const addProduct = (p: { id: string; sku: string; price: number; stock: number; product: { name: string } }) => {
    addItem({
      variantId: p.id,
      productName: p.product.name,
      sku: p.sku,
      price: p.price,
      quantity: 1,
      stock: p.stock,
    });
    setSearch('');
  };

  if (shiftLoading) return <Spinner />;

  if (!shift?.data) {
    return (
      <div>
        <PageToolbar title="Bán hàng tại quầy" description="Mở ca để bắt đầu bán hàng trong admin" />
        <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-[#111827]">Mở ca làm việc</h2>
          <p className="mt-1 text-sm text-[#6b7280]">Nhập quỹ đầu ca để bắt đầu</p>
          <input
            type="number"
            data-shift-cash
            placeholder="Số tiền đầu ca (VD: 500000)"
            className="mt-4 h-11 w-full rounded-xl border border-gray-200 px-4 text-sm focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100"
            onKeyDown={(e) => {
              if (e.key === 'Enter') openShiftMutation.mutate(Number((e.target as HTMLInputElement).value));
            }}
          />
          <button
            type="button"
            disabled={openShiftMutation.isPending}
            onClick={() => {
              const input = document.querySelector<HTMLInputElement>('[data-shift-cash]');
              openShiftMutation.mutate(Number(input?.value || 0));
            }}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#f97316] text-sm font-semibold text-white hover:bg-[#ea580c] disabled:opacity-60"
          >
            <Banknote className="h-4 w-4" />
            {openShiftMutation.isPending ? 'Đang mở ca...' : 'Mở ca'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageToolbar
        title="Bán hàng tại quầy"
        description="Tìm sản phẩm, thêm giỏ và thanh toán tiền mặt"
        action={
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            Ca đang mở
          </span>
        }
      />

      {lastReceipt && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <span className="whitespace-pre-line">{lastReceipt}</span>
          <button type="button" onClick={() => setLastReceipt(null)} className="text-green-600 hover:text-green-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              placeholder="Tìm sản phẩm hoặc quét mã vạch..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value.length >= 2) searchProducts();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && products?.data?.[0]) addProduct(products.data[0]);
              }}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {search.length >= 2 && products?.data?.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              {products.data.slice(0, 8).map((p: { id: string; sku: string; price: number; stock: number; product: { name: string } }) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p)}
                  className="flex w-full items-center justify-between border-b border-gray-50 px-4 py-3 text-left last:border-0 hover:bg-orange-50/50"
                >
                  <div>
                    <p className="text-sm font-medium">{p.product.name}</p>
                    <p className="text-xs text-gray-400">{p.sku} · Tồn: {p.stock}</p>
                  </div>
                  <span className="font-semibold text-[#f97316]">{formatCurrency(p.price)}</span>
                </button>
              ))}
            </div>
          )}

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-gray-400">
              <ScanBarcode className="mb-2 h-10 w-10 opacity-40" />
              <p className="text-sm">Chưa có sản phẩm trong giỏ</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.variantId} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.productName}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-gray-50" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-gray-50" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-24 text-right text-sm font-bold">{formatCurrency(item.price * item.quantity)}</span>
                    <button type="button" className="text-red-500 hover:text-red-700" onClick={() => removeItem(item.variantId)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-[#111827]">Thanh toán</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Tạm tính</span>
                <span className="font-medium text-gray-900">{formatCurrency(subtotal())}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Giảm giá</span>
                <input
                  type="number"
                  className="h-9 w-28 rounded-lg border px-2 text-right text-sm focus:border-[#f97316] focus:outline-none"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                />
              </div>
              <div className="flex justify-between border-t pt-2 text-lg font-bold">
                <span>Tổng cộng</span>
                <span className="text-[#f97316]">{formatCurrency(total)}</span>
              </div>
            </div>

            {!showPayment ? (
              <button
                type="button"
                disabled={items.length === 0}
                onClick={() => setShowPayment(true)}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#f97316] text-sm font-semibold text-white hover:bg-[#ea580c] disabled:opacity-50"
              >
                <Banknote className="h-4 w-4" />
                Thanh toán
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <input
                  type="number"
                  placeholder="Tiền khách đưa"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  autoFocus
                  className="h-11 w-full rounded-xl border px-4 text-sm focus:border-[#f97316] focus:outline-none"
                />
                {cashReceived && (
                  <p className="text-sm">
                    Tiền thối:{' '}
                    <span className="font-bold text-green-600">
                      {formatCurrency(Math.max(0, Number(cashReceived) - total))}
                    </span>
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!cashReceived || Number(cashReceived) < total || createOrderMutation.isPending}
                    onClick={() =>
                      createOrderMutation.mutate({
                        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
                        paymentMethod: 'CASH',
                        cashReceived: Number(cashReceived),
                        discount,
                      })
                    }
                    className="h-11 flex-1 rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {createOrderMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
                  </button>
                  <button type="button" onClick={() => setShowPayment(false)} className="h-11 w-11 rounded-xl border hover:bg-gray-50">
                    <X className="mx-auto h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
