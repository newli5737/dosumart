import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PackagePlus, History, Building2, Boxes, Plus, Search, Download, ArrowDownUp, ClipboardCheck } from 'lucide-react';
import { reportsApi, inventoryApi, productsApi } from '@dosumart/api';
import { formatCurrency, formatDate } from '@dosumart/utils';
import { Spinner, Badge, EmptyState } from '@dosumart/ui';
import { PageToolbar, DataTable, TableHead, Th } from '../../components/ui/AdminUI';

type Tab = 'stock' | 'import' | 'export' | 'adjust' | 'logs' | 'suppliers';

const TX_LABELS: Record<string, string> = {
  IMPORT: 'Nhập kho',
  EXPORT: 'Xuất kho',
  SALE: 'Bán hàng',
  RETURN: 'Trả hàng',
  ADJUSTMENT: 'Điều chỉnh',
};

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>('stock');
  const [logPage, setLogPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: stock, isLoading: stockLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: reportsApi.inventory,
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['stock-logs', logPage],
    queryFn: () => inventoryApi.stockLogs({ page: logPage, limit: 15 }),
    enabled: tab === 'logs' || tab === 'import',
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: inventoryApi.suppliers,
  });

  const tabs: { id: Tab; label: string; icon: typeof Boxes }[] = [
    { id: 'stock', label: 'Tồn kho', icon: Boxes },
    { id: 'import', label: 'Nhập kho', icon: PackagePlus },
    { id: 'export', label: 'Xuất kho', icon: ArrowDownUp },
    { id: 'adjust', label: 'Kiểm kê', icon: ClipboardCheck },
    { id: 'logs', label: 'Lịch sử', icon: History },
    { id: 'suppliers', label: 'Nhà cung cấp', icon: Building2 },
  ];

  const exportCsv = () => {
    const rows = stock?.data || [];
    const header = 'Sản phẩm,SKU,Kho,Tồn,Cảnh báo,Trạng thái\n';
    const body = rows.map((item: {
      productName: string;
      sku: string;
      warehouse: string;
      quantity: number;
      lowStockAt: number;
      isLowStock: boolean;
    }) =>
      `"${item.productName}","${item.sku}","${item.warehouse}",${item.quantity},${item.lowStockAt},${item.isLowStock ? 'Sắp hết' : 'Đủ hàng'}`,
    ).join('\n');
    const blob = new Blob(['\uFEFF' + header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ton-kho-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageToolbar
        title="Quản lý kho hàng"
        description="Tồn kho, nhập hàng, nhà cung cấp và lịch sử biến động"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-[#f97316] text-white shadow-md shadow-orange-200'
                : 'border border-gray-200 bg-white text-[#374151] hover:border-orange-200'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'stock' && (
        stockLoading ? <Spinner /> : (
          <>
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium hover:border-orange-200"
              >
                <Download className="h-4 w-4" />
                Xuất CSV
              </button>
            </div>
            <DataTable>
            <table className="w-full text-[13px]">
              <TableHead>
                <Th>Sản phẩm</Th>
                <Th>SKU</Th>
                <Th>Kho</Th>
                <Th align="right">Tồn kho</Th>
                <Th align="right">Cảnh báo</Th>
                <Th>Trạng thái</Th>
              </TableHead>
              <tbody>
                {(stock?.data || []).map((item: {
                  variantId: string;
                  productName: string;
                  sku: string;
                  warehouse: string;
                  quantity: number;
                  lowStockAt: number;
                  isLowStock: boolean;
                }) => (
                  <tr key={item.variantId} className="border-b border-gray-50 hover:bg-orange-50/40">
                    <td className="px-5 py-4 font-medium">{item.productName}</td>
                    <td className="px-5 py-4 font-mono text-xs text-[#9ca3af]">{item.sku}</td>
                    <td className="px-5 py-4 text-[#6b7280]">{item.warehouse}</td>
                    <td className="px-5 py-4 text-right text-lg font-bold text-[#111827]">{item.quantity}</td>
                    <td className="px-5 py-4 text-right text-[#9ca3af]">{item.lowStockAt}</td>
                    <td className="px-5 py-4">
                      <Badge variant={item.isLowStock ? 'warning' : 'success'}>
                        {item.isLowStock ? 'Sắp hết' : 'Đủ hàng'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
          </>
        )
      )}

      {tab === 'export' && (
        <StockOutForm
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['stock-logs'] });
            setTab('logs');
          }}
        />
      )}

      {tab === 'adjust' && (
        <StocktakeForm
          stock={stock?.data || []}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['stock-logs'] });
            setTab('logs');
          }}
        />
      )}

      {tab === 'import' && (
        <ImportStockForm
          suppliers={suppliers?.data || []}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['stock-logs'] });
            setTab('logs');
          }}
        />
      )}

      {tab === 'logs' && (
        <LogsTab
          logs={logs}
          loading={logsLoading}
          page={logPage}
          onPageChange={setLogPage}
        />
      )}

      {tab === 'suppliers' && (
        <SuppliersTab suppliers={suppliers?.data || []} />
      )}
    </div>
  );
}

function StockOutForm({ onSuccess }: { onSuccess: () => void }) {
  const [search, setSearch] = useState('');
  const [variantId, setVariantId] = useState('');
  const [qty, setQty] = useState(0);
  const [note, setNote] = useState('');

  const { data: products } = useQuery({
    queryKey: ['admin-products-export', search],
    queryFn: () => productsApi.adminList({ search, limit: 10 }),
    enabled: search.length >= 2,
  });

  const mutation = useMutation({
    mutationFn: () =>
      inventoryApi.importStock(variantId, { type: 'EXPORT', quantity: qty, note: note || 'Xuất kho' }),
    onSuccess,
  });

  return (
    <div className="max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-[#111827]">Phiếu xuất kho</h3>
      <p className="mt-1 text-sm text-[#9ca3af]">Ghi nhận xuất hàng (hỏng, trả NCC, điều chuyển...)</p>
      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Tìm sản phẩm</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input className="h-11 w-full rounded-xl border border-gray-200 pl-10 pr-4 text-sm" placeholder="Nhập tên hoặc SKU..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {search.length >= 2 && (
            <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-gray-100">
              {(products?.data || []).flatMap((p: { name: string; variants?: Array<{ id: string; sku: string }> }) =>
                (p.variants || []).map((v) => (
                  <li key={v.id}>
                    <button type="button" className={`w-full px-4 py-2.5 text-left text-sm hover:bg-orange-50 ${variantId === v.id ? 'bg-orange-50 font-medium text-[#f97316]' : ''}`} onClick={() => { setVariantId(v.id); setSearch(`${p.name} (${v.sku})`); }}>
                      {p.name} — <span className="font-mono text-xs">{v.sku}</span>
                    </button>
                  </li>
                )),
              )}
            </ul>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Số lượng xuất *</label>
          <input type="number" min={1} className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm" value={qty || ''} onChange={(e) => setQty(Number(e.target.value))} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Lý do</label>
          <input className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm" placeholder="VD: Hàng hỏng, trả NCC..." value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button type="button" disabled={!variantId || qty <= 0 || mutation.isPending} onClick={() => mutation.mutate()} className="h-11 w-full rounded-xl bg-red-500 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50">
          {mutation.isPending ? 'Đang xử lý...' : 'Xác nhận xuất kho'}
        </button>
      </div>
    </div>
  );
}

function StocktakeForm({
  stock,
  onSuccess,
}: {
  stock: Array<{ variantId: string; productName: string; sku: string; quantity: number }>;
  onSuccess: () => void;
}) {
  const [variantId, setVariantId] = useState('');
  const [actualQty, setActualQty] = useState(0);
  const [note, setNote] = useState('Kiểm kê');

  const selected = stock.find((s) => s.variantId === variantId);
  const diff = selected ? actualQty - selected.quantity : 0;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selected || diff === 0) return;
      const type = diff > 0 ? 'ADJUSTMENT' : 'EXPORT';
      await inventoryApi.importStock(variantId, {
        type,
        quantity: Math.abs(diff),
        note: `${note} (Hệ thống: ${selected.quantity} → Thực tế: ${actualQty})`,
      });
    },
    onSuccess,
  });

  return (
    <div className="max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-[#111827]">Kiểm kê tồn kho</h3>
      <p className="mt-1 text-sm text-[#9ca3af]">Nhập số lượng thực tế để điều chỉnh chênh lệch</p>
      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Chọn sản phẩm</label>
          <select className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm" value={variantId} onChange={(e) => setVariantId(e.target.value)}>
            <option value="">— Chọn —</option>
            {stock.map((s) => (
              <option key={s.variantId} value={s.variantId}>{s.productName} ({s.sku}) — Hệ thống: {s.quantity}</option>
            ))}
          </select>
        </div>
        {selected && (
          <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Tồn hệ thống: <strong>{selected.quantity}</strong>
          </p>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Số lượng thực tế *</label>
          <input type="number" min={0} className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm" value={actualQty || ''} onChange={(e) => setActualQty(Number(e.target.value))} />
        </div>
        {selected && diff !== 0 && (
          <p className={`rounded-xl px-4 py-3 text-sm ${diff > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            Chênh lệch: <strong>{diff > 0 ? '+' : ''}{diff}</strong> ({diff > 0 ? 'tăng' : 'giảm'})
          </p>
        )}
        <button type="button" disabled={!variantId || diff === 0 || mutation.isPending} onClick={() => mutation.mutate()} className="h-11 w-full rounded-xl bg-[#f97316] text-sm font-semibold text-white hover:bg-[#ea580c] disabled:opacity-50">
          {mutation.isPending ? 'Đang điều chỉnh...' : 'Xác nhận kiểm kê'}
        </button>
      </div>
    </div>
  );
}

function ImportStockForm({
  suppliers,
  onSuccess,
}: {
  suppliers: Array<{ id: string; name: string; code: string }>;
  onSuccess: () => void;
}) {
  const [search, setSearch] = useState('');
  const [variantId, setVariantId] = useState('');
  const [qty, setQty] = useState(0);
  const [unitCost, setUnitCost] = useState(0);
  const [supplierId, setSupplierId] = useState('');
  const [note, setNote] = useState('');

  const { data: products } = useQuery({
    queryKey: ['admin-products-import', search],
    queryFn: () => productsApi.adminList({ search, limit: 10 }),
    enabled: search.length >= 2,
  });

  const mutation = useMutation({
    mutationFn: () =>
      inventoryApi.importStock(variantId, {
        type: 'IMPORT',
        quantity: qty,
        supplierId: supplierId || undefined,
        unitCost: unitCost || undefined,
        note: note || undefined,
      }),
    onSuccess,
  });

  const selected = (products?.data || []).flatMap((p: { name: string; variants?: Array<{ id: string; sku: string }> }) =>
    (p.variants || []).map((v) => ({ ...v, productName: p.name })),
  ).find((v: { id: string }) => v.id === variantId);

  return (
    <div className="max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-[#111827]">Phiếu nhập kho</h3>
      <p className="mt-1 text-sm text-[#9ca3af]">Ghi nhận số lượng và giá vốn mỗi lần nhập</p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Tìm sản phẩm (SKU/tên)</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="h-11 w-full rounded-xl border border-gray-200 pl-10 pr-4 text-sm"
              placeholder="Nhập tên hoặc SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {search.length >= 2 && (
            <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-gray-100">
              {(products?.data || []).flatMap((p: { name: string; variants?: Array<{ id: string; sku: string }> }) =>
                (p.variants || []).map((v) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-orange-50 ${variantId === v.id ? 'bg-orange-50 font-medium text-[#f97316]' : ''}`}
                      onClick={() => { setVariantId(v.id); setSearch(`${p.name} (${v.sku})`); }}
                    >
                      {p.name} — <span className="font-mono text-xs">{v.sku}</span>
                    </button>
                  </li>
                )),
              )}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Số lượng nhập *</label>
            <input type="number" min={1} className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm" value={qty || ''} onChange={(e) => setQty(Number(e.target.value))} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Giá vốn/SP (đ)</label>
            <input type="number" min={0} className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm" value={unitCost || ''} onChange={(e) => setUnitCost(Number(e.target.value))} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Nhà cung cấp</label>
          <select className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">— Chọn NCC —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Ghi chú</label>
          <input className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm" placeholder="VD: Nhập lô tháng 7..." value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {selected && qty > 0 && (
          <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
            Nhập <strong>{qty}</strong> × {selected.productName}
            {unitCost > 0 && <> · Giá vốn {formatCurrency(unitCost)}</>}
          </p>
        )}

        <button
          type="button"
          disabled={!variantId || qty <= 0 || mutation.isPending}
          onClick={() => mutation.mutate()}
          className="h-11 w-full rounded-xl bg-[#f97316] text-sm font-semibold text-white hover:bg-[#ea580c] disabled:opacity-50"
        >
          {mutation.isPending ? 'Đang nhập...' : 'Xác nhận nhập kho'}
        </button>
      </div>
    </div>
  );
}

function LogsTab({
  logs,
  loading,
  page,
  onPageChange,
}: {
  logs: { data?: Array<Record<string, unknown>>; meta?: { totalPages: number } };
  loading: boolean;
  page: number;
  onPageChange: (p: number) => void;
}) {
  if (loading) return <Spinner />;
  const items = logs?.data || [];
  if (!items.length) return <EmptyState title="Chưa có lịch sử" description="Lịch sử nhập/xuất kho sẽ hiển thị tại đây." />;

  return (
    <>
      <DataTable>
        <table className="w-full text-[13px]">
          <TableHead>
            <Th>Thời gian</Th>
            <Th>Loại</Th>
            <Th>Sản phẩm</Th>
            <Th>SKU</Th>
            <Th align="right">SL</Th>
            <Th align="right">Giá vốn</Th>
            <Th>NCC</Th>
            <Th>Ghi chú</Th>
          </TableHead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id as string} className="border-b border-gray-50 hover:bg-orange-50/40">
                <td className="px-5 py-3.5 text-[#6b7280]">{formatDate(row.createdAt as string)}</td>
                <td className="px-5 py-3.5">
                  <Badge variant={row.type === 'IMPORT' ? 'success' : row.type === 'SALE' ? 'warning' : 'default'}>
                    {TX_LABELS[row.type as string] || (row.type as string)}
                  </Badge>
                </td>
                <td className="px-5 py-3.5 font-medium">{row.productName as string}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-[#9ca3af]">{row.sku as string}</td>
                <td className={`px-5 py-3.5 text-right font-semibold ${(row.quantity as number) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {(row.quantity as number) > 0 ? '+' : ''}{row.quantity as number}
                </td>
                <td className="px-5 py-3.5 text-right">{row.unitCost ? formatCurrency(row.unitCost as number) : '—'}</td>
                <td className="px-5 py-3.5 text-[#6b7280]">{(row.supplier as { name?: string })?.name || '—'}</td>
                <td className="px-5 py-3.5 text-[#9ca3af]">{(row.note as string) || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>
      {(logs?.meta?.totalPages ?? 1) > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: logs.meta!.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`h-9 w-9 rounded-lg text-sm ${p === page ? 'bg-[#f97316] text-white' : 'border border-gray-200 bg-white'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function SuppliersTab({ suppliers }: { suppliers: Array<Record<string, unknown>> }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', code: '', phone: '', contactName: '' });
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => inventoryApi.createSupplier(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setForm({ name: '', code: '', phone: '', contactName: '' });
      setOpen(false);
    },
  });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#f97316] px-4 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> Thêm NCC
        </button>
      </div>

      {open && (
        <div className="mb-6 grid max-w-xl gap-3 rounded-2xl border border-orange-100 bg-orange-50/40 p-5 sm:grid-cols-2">
          <input className="h-10 rounded-xl border border-gray-200 px-3 text-sm" placeholder="Tên NCC *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="h-10 rounded-xl border border-gray-200 px-3 text-sm" placeholder="Mã NCC *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <input className="h-10 rounded-xl border border-gray-200 px-3 text-sm" placeholder="SĐT" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="h-10 rounded-xl border border-gray-200 px-3 text-sm" placeholder="Người liên hệ" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
          <button type="button" onClick={() => mutation.mutate()} disabled={!form.name || !form.code} className="h-10 rounded-xl bg-[#f97316] text-sm font-semibold text-white sm:col-span-2">
            Lưu nhà cung cấp
          </button>
        </div>
      )}

      <DataTable>
        <table className="w-full text-[13px]">
          <TableHead>
            <Th>Mã</Th>
            <Th>Tên NCC</Th>
            <Th>SĐT</Th>
            <Th>Liên hệ</Th>
            <Th>Trạng thái</Th>
          </TableHead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id as string} className="border-b border-gray-50 hover:bg-orange-50/40">
                <td className="px-5 py-4 font-mono text-xs">{s.code as string}</td>
                <td className="px-5 py-4 font-medium">{s.name as string}</td>
                <td className="px-5 py-4">{(s.phone as string) || '—'}</td>
                <td className="px-5 py-4">{(s.contactName as string) || '—'}</td>
                <td className="px-5 py-4">
                  <Badge variant={s.isActive ? 'success' : 'default'}>
                    {s.isActive ? 'Hoạt động' : 'Ngừng'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>
    </div>
  );
}
