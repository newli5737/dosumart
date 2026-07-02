import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import {
  Search,
  LogOut,
  Banknote,
  ShoppingCart,
  ScanBarcode,
  Minus,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { posApi } from '@dosumart/api';
import { usePosStore } from '@dosumart/stores';
import { formatCurrency } from '@dosumart/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@dosumart/ui';
import Receipt from './Receipt';

export default function SalesPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [search, setSearch] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [lastOrder, setLastOrder] = useState<{
    code?: string;
    createdAt?: string;
    items?: Array<{ productName: string; quantity: number; price: number; lineTotal: number }>;
    subtotal?: number;
    discount?: number;
    total?: number;
    cashReceived?: number;
    changeAmount?: number;
  } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { items, addItem, updateQuantity, removeItem, clear, subtotal, discount, setDiscount } = usePosStore();

  const { data: shift, refetch: refetchShift } = useQuery({
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

  const closeShiftMutation = useMutation({
    mutationFn: (cash: number) => posApi.closeShift(cash),
    onSuccess: () => refetchShift(),
  });

  const createOrderMutation = useMutation({
    mutationFn: posApi.createOrder,
    onSuccess: (res) => {
      setLastOrder(res.data);
      clear();
      setShowPayment(false);
      setCashReceived('');
      handlePrint();
    },
  });

  const handlePrint = useReactToPrint({ contentRef: printRef });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'F4') { e.preventDefault(); if (items.length) setShowPayment(true); }
      if (e.key === 'Escape') { e.preventDefault(); setShowPayment(false); }
      if (e.ctrlKey && e.key === 'p') { e.preventDefault(); handlePrint(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [items, handlePrint]);

  const total = subtotal() - discount;
  const change = cashReceived ? Number(cashReceived) - total : 0;

  const handleLogout = async () => {
    await logout();
    navigate('/dang-nhap');
  };

  if (!shift?.data) {
    return (
      <div className="pos-shell flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-200/80 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <div className="mb-6 flex items-center gap-3">
            <img src="/dosumart.png" alt="DoSuMart" className="h-10 w-auto" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#16a34a]">Mở ca</p>
              <h2 className="text-xl font-bold text-[#111827]">Bắt đầu ca làm việc</h2>
            </div>
          </div>
          <p className="text-sm text-[#6b7280]">Nhập số tiền quỹ đầu ca để bắt đầu bán hàng</p>
          <input
            type="number"
            placeholder="Số tiền đầu ca (VD: 500000)"
            className="mt-4 h-12 w-full rounded-xl border border-gray-200 bg-[#fafafa] px-4 text-sm focus:border-[#16a34a] focus:outline-none focus:ring-2 focus:ring-green-100"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                openShiftMutation.mutate(Number((e.target as HTMLInputElement).value));
              }
            }}
          />
          <button
            type="button"
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#16a34a] to-[#22c55e] text-sm font-semibold text-white shadow-md shadow-green-200 hover:from-[#15803d] hover:to-[#16a34a] disabled:opacity-60"
            disabled={openShiftMutation.isPending}
            onClick={() => {
              const input = document.querySelector('input[type=number]') as HTMLInputElement;
              openShiftMutation.mutate(Number(input?.value || 0));
            }}
          >
            <Banknote className="h-4 w-4" />
            {openShiftMutation.isPending ? 'Đang mở ca...' : 'Mở ca (Enter)'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pos-shell flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#0f172a] px-5 text-white">
        <div className="flex items-center gap-4">
          <img src="/dosumart.png" alt="DoSuMart" className="h-8 w-auto brightness-0 invert" />
          <div className="hidden h-6 w-px bg-white/20 sm:block" />
          <span className="hidden items-center gap-1.5 rounded-lg bg-green-500/20 px-2.5 py-1 text-xs font-semibold text-green-300 sm:inline-flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            Ca đang mở
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-3 text-[11px] text-gray-400 md:flex">
            <span className="rounded-md bg-white/5 px-2 py-1">F2 Tìm</span>
            <span className="rounded-md bg-white/5 px-2 py-1">F4 Thanh toán</span>
            <span className="rounded-md bg-white/5 px-2 py-1">ESC Hủy</span>
          </div>
          <button
            type="button"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10"
            onClick={() => {
              const cash = prompt('Nhập tiền thực tế khi đóng ca:');
              if (cash) closeShiftMutation.mutate(Number(cash));
            }}
          >
            Đóng ca
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
            title="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-[68%] flex-col bg-white">
          <div className="border-b border-gray-100 p-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                placeholder="Tìm sản phẩm hoặc quét mã vạch... (F2)"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (e.target.value.length >= 2) searchProducts();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && products?.data?.[0]) {
                    const p = products.data[0];
                    addItem({
                      variantId: p.id,
                      productName: p.product.name,
                      sku: p.sku,
                      price: p.price,
                      quantity: 1,
                      stock: p.stock,
                    });
                    setSearch('');
                  }
                }}
                className="h-11 w-full rounded-xl border border-gray-200 bg-[#fafafa] pl-10 pr-4 text-sm focus:border-[#16a34a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-100"
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {search.length >= 2 && (products?.data || []).length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-[#9ca3af]">
                <ScanBarcode className="h-10 w-10 text-gray-200" />
                <p className="text-sm">Không tìm thấy sản phẩm</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
                {(products?.data || []).map((p: { id: string; sku: string; price: number; stock: number; product: { name: string; images: string[] } }) => (
                  <button
                    key={p.id}
                    type="button"
                    className="group rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-all hover:border-[#16a34a] hover:shadow-md hover:shadow-green-100"
                    onClick={() => addItem({
                      variantId: p.id,
                      productName: p.product.name,
                      sku: p.sku,
                      price: p.price,
                      quantity: 1,
                      stock: p.stock,
                    })}
                  >
                    {p.product.images[0] && (
                      <img src={p.product.images[0]} alt="" className="mb-2 h-20 w-full rounded-lg object-cover" />
                    )}
                    <p className="line-clamp-2 text-sm font-medium text-[#111827] group-hover:text-[#16a34a]">{p.product.name}</p>
                    <p className="mt-1.5 text-sm font-bold text-[#f97316]">{formatCurrency(p.price)}</p>
                    <p className="mt-0.5 text-xs text-[#9ca3af]">Tồn: {p.stock}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex w-[32%] flex-col border-l border-gray-200 bg-[#f8fafc]">
          <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
            <ShoppingCart className="h-4 w-4 text-[#16a34a]" />
            <span className="text-sm font-semibold text-[#111827]">Giỏ hàng</span>
            <span className="ml-auto rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-[#f97316]">{items.length}</span>
          </div>

          <div className="flex-1 overflow-auto p-3">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-[#9ca3af]">
                <ShoppingCart className="h-10 w-10 text-gray-200" />
                <p className="text-sm">Chưa có sản phẩm</p>
                <p className="text-xs">F2 để tìm kiếm</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.variantId} className="mb-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="flex justify-between gap-2">
                    <p className="text-sm font-medium leading-snug text-[#111827]">{item.productName}</p>
                    <button type="button" className="shrink-0 text-[#dc2626] hover:text-red-700" onClick={() => removeItem(item.variantId)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-[#111827]">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-200 bg-white p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[#6b7280]">
                <span>Tạm tính</span>
                <span className="font-medium text-[#111827]">{formatCurrency(subtotal())}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6b7280]">Giảm giá</span>
                <input
                  type="number"
                  className="h-9 w-28 rounded-lg border border-gray-200 px-2 text-right text-sm focus:border-[#16a34a] focus:outline-none focus:ring-2 focus:ring-green-100"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                />
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 text-lg font-bold">
                <span>Tổng cộng</span>
                <span className="text-[#f97316]">{formatCurrency(total)}</span>
              </div>
            </div>

            {!showPayment ? (
              <button
                type="button"
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-sm font-bold text-white shadow-md shadow-orange-200 transition-all hover:from-[#ea580c] hover:to-[#f97316] disabled:opacity-50"
                disabled={items.length === 0}
                onClick={() => setShowPayment(true)}
              >
                <Banknote className="h-4 w-4" />
                Thanh toán (F4)
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <input
                  type="number"
                  placeholder="Tiền khách đưa"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  autoFocus
                  className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm focus:border-[#16a34a] focus:outline-none focus:ring-2 focus:ring-green-100"
                />
                {cashReceived && (
                  <p className="text-sm">
                    Tiền thối: <span className="text-lg font-bold text-[#16a34a]">{formatCurrency(Math.max(0, change))}</span>
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex h-11 flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-[#16a34a] to-[#22c55e] text-sm font-semibold text-white disabled:opacity-50"
                    disabled={!cashReceived || Number(cashReceived) < total || createOrderMutation.isPending}
                    onClick={() => createOrderMutation.mutate({
                      items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
                      paymentMethod: 'CASH',
                      cashReceived: Number(cashReceived),
                      discount,
                    })}
                  >
                    {createOrderMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
                  </button>
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50"
                    onClick={() => setShowPayment(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="hidden">
        <Receipt ref={printRef} order={lastOrder} />
      </div>
    </div>
  );
}
