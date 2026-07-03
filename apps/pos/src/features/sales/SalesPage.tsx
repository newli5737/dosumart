import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  Loader2,
} from 'lucide-react';
import { posApi } from '@dosumart/api';
import { usePosStore } from '@dosumart/stores';
import { formatCurrency } from '@dosumart/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@dosumart/ui';
import { printReceipt, type ReceiptOrder } from './printReceipt';

type PosProduct = {
  id: string;
  sku: string;
  barcode?: string;
  price: number;
  stock: number;
  product: { name: string; images: string[] };
};

function PosModal({
  title,
  description,
  children,
  onClose,
  actions,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  onClose: () => void;
  actions: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#111827]">{title}</h3>
            {description && <p className="mt-1 text-sm text-[#6b7280]">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
        <div className="mt-5 flex gap-2">{actions}</div>
      </div>
    </div>
  );
}

export default function SalesPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showCloseShift, setShowCloseShift] = useState(false);
  const [closingCash, setClosingCash] = useState('');
  const [openingCash, setOpeningCash] = useState('');
  const [lastOrder, setLastOrder] = useState<ReceiptOrder | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const { items, addItem, updateQuantity, removeItem, clear, subtotal, discount, setDiscount } = usePosStore();

  const { data: shift, refetch: refetchShift } = useQuery({
    queryKey: ['current-shift'],
    queryFn: posApi.currentShift,
  });

  const trimmedSearch = search.trim();
  const isBarcode = /^\d{8,}$/.test(trimmedSearch);

  const { data: products, isFetching: searching } = useQuery({
    queryKey: ['pos-search', trimmedSearch, isBarcode],
    queryFn: () =>
      isBarcode
        ? posApi.searchProducts(undefined, trimmedSearch)
        : posApi.searchProducts(trimmedSearch || undefined),
    enabled: !!shift?.data,
    staleTime: 30_000,
  });

  const productList: PosProduct[] = products?.data || [];

  const openShiftMutation = useMutation({
    mutationFn: (cash: number) => posApi.openShift(cash),
    onSuccess: () => {
      setOpeningCash('');
      refetchShift();
    },
  });

  const closeShiftMutation = useMutation({
    mutationFn: (cash: number) => posApi.closeShift(cash),
    onSuccess: () => {
      setShowCloseShift(false);
      setClosingCash('');
      refetchShift();
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: posApi.createOrder,
    onSuccess: (res) => {
      const order = res.data as ReceiptOrder;
      setLastOrder(order);
      clear();
      setShowPayment(false);
      setCashReceived('');
      printReceipt(order);
    },
  });

  const addProduct = (p: PosProduct) => {
    addItem({
      variantId: p.id,
      productName: p.product.name,
      sku: p.sku,
      price: p.price,
      quantity: 1,
      stock: p.stock,
    });
    setSearch('');
    setSearchFocused(false);
    searchRef.current?.focus();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'F4') { e.preventDefault(); if (items.length) setShowPayment(true); }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowPayment(false);
        setShowCloseShift(false);
        setSearchFocused(false);
      }
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        if (lastOrder) printReceipt(lastOrder);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [items, lastOrder]);

  const total = subtotal() - discount;
  const change = cashReceived ? Number(cashReceived) - total : 0;

  const handleLogout = async () => {
    await logout();
    navigate('/dang-nhap');
  };

  const showSuggestions = searchFocused && (trimmedSearch.length > 0 || productList.length > 0);

  if (!shift?.data) {
    return (
      <div className="pos-shell flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-200/80 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <div className="mb-6 flex items-center gap-3">
            <img src="/dosumart.png" alt="DoSuMart" className="h-10 w-auto" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#f97316]">Mở ca</p>
              <h2 className="text-xl font-bold text-[#111827]">Bắt đầu ca làm việc</h2>
            </div>
          </div>
          <p className="text-sm text-[#6b7280]">Nhập số tiền quỹ đầu ca để bắt đầu bán hàng</p>
          <input
            type="number"
            placeholder="Số tiền đầu ca (VD: 500000)"
            value={openingCash}
            onChange={(e) => setOpeningCash(e.target.value)}
            className="mt-4 h-12 w-full rounded-xl border border-gray-200 bg-[#fafafa] px-4 text-sm focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100"
            onKeyDown={(e) => {
              if (e.key === 'Enter') openShiftMutation.mutate(Number(openingCash || 0));
            }}
          />
          <button
            type="button"
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-sm font-semibold text-white shadow-md shadow-orange-200 hover:from-[#ea580c] hover:to-[#f97316] disabled:opacity-60"
            disabled={openShiftMutation.isPending}
            onClick={() => openShiftMutation.mutate(Number(openingCash || 0))}
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
            onClick={() => setShowCloseShift(true)}
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
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (isBarcode && productList[0]) {
                      addProduct(productList[0]);
                    } else if (productList[0]) {
                      addProduct(productList[0]);
                    }
                  }
                }}
                className="h-11 w-full rounded-xl border border-gray-200 bg-[#fafafa] pl-10 pr-10 text-sm focus:border-[#f97316] focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
              {searching && (
                <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#f97316]" />
              )}

              {showSuggestions && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                  {searching && productList.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400">Đang tìm...</p>
                  ) : productList.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400">Không tìm thấy sản phẩm</p>
                  ) : (
                    productList.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="flex w-full items-center gap-3 border-b border-gray-50 px-4 py-3 text-left last:border-0 hover:bg-orange-50"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addProduct(p)}
                      >
                        {p.product.images?.[0] ? (
                          <img src={p.product.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                            <ScanBarcode className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[#111827]">{p.product.name}</p>
                          <p className="text-xs text-gray-400">{p.sku} · Tồn: {p.stock}</p>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-[#f97316]">{formatCurrency(p.price)}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {!trimmedSearch && (
              <p className="mt-2 text-xs text-gray-400">Gõ tên/SKU hoặc quét mã vạch — click hoặc Enter để thêm vào giỏ</p>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4">
            {productList.length === 0 && trimmedSearch ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-[#9ca3af]">
                <ScanBarcode className="h-10 w-10 text-gray-200" />
                <p className="text-sm">Không tìm thấy &quot;{trimmedSearch}&quot;</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
                {productList.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="group rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-all hover:border-[#f97316] hover:shadow-md hover:shadow-orange-100"
                    onClick={() => addProduct(p)}
                  >
                    {p.product.images?.[0] && (
                      <img src={p.product.images[0]} alt="" className="mb-2 h-20 w-full rounded-lg object-cover" />
                    )}
                    <p className="line-clamp-2 text-sm font-medium text-[#111827] group-hover:text-[#f97316]">{p.product.name}</p>
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
            <ShoppingCart className="h-4 w-4 text-[#f97316]" />
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
                  className="h-9 w-28 rounded-lg border border-gray-200 px-2 text-right text-sm focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100"
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
                  className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100"
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

      {showCloseShift && (
        <PosModal
          title="Đóng ca"
          description="Nhập số tiền thực tế trong quỹ khi kết thúc ca"
          onClose={() => setShowCloseShift(false)}
          actions={
            <>
              <button
                type="button"
                onClick={() => setShowCloseShift(false)}
                className="h-11 flex-1 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!closingCash || closeShiftMutation.isPending}
                onClick={() => closeShiftMutation.mutate(Number(closingCash))}
                className="h-11 flex-1 rounded-xl bg-[#f97316] text-sm font-semibold text-white hover:bg-[#ea580c] disabled:opacity-50"
              >
                {closeShiftMutation.isPending ? 'Đang đóng ca...' : 'Xác nhận đóng ca'}
              </button>
            </>
          }
        >
          <input
            type="number"
            autoFocus
            placeholder="Tiền thực tế trong quỹ (VNĐ)"
            value={closingCash}
            onChange={(e) => setClosingCash(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && closingCash) closeShiftMutation.mutate(Number(closingCash));
            }}
            className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
        </PosModal>
      )}
    </div>
  );
}
