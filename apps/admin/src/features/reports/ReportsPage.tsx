import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Package, Building2 } from 'lucide-react';
import { reportsApi } from '@dosumart/api';
import { formatCurrency } from '@dosumart/utils';
import { Spinner } from '@dosumart/ui';
import { PageToolbar, DataTable, TableHead, Th } from '../../components/ui/AdminUI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type Tab = 'revenue' | 'margins' | 'suppliers' | 'stock-ncc';

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('revenue');

  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ['report-revenue'],
    queryFn: () => reportsApi.revenue(),
    enabled: tab === 'revenue',
  });

  const { data: margins, isLoading: marginLoading } = useQuery({
    queryKey: ['report-margins'],
    queryFn: reportsApi.productMargins,
    enabled: tab === 'margins',
  });

  const { data: supplierProfit, isLoading: spLoading } = useQuery({
    queryKey: ['report-supplier-profit'],
    queryFn: reportsApi.profitBySupplier,
    enabled: tab === 'suppliers',
  });

  const { data: stockByNcc, isLoading: stockLoading } = useQuery({
    queryKey: ['report-stock-ncc'],
    queryFn: reportsApi.inventoryBySupplier,
    enabled: tab === 'stock-ncc',
  });

  const tabs: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
    { id: 'revenue', label: 'Doanh thu', icon: TrendingUp },
    { id: 'margins', label: 'Biên lợi nhuận SP', icon: Package },
    { id: 'suppliers', label: 'Nhập theo NCC', icon: Building2 },
    { id: 'stock-ncc', label: 'Tồn theo NCC', icon: BarChart3 },
  ];

  const chartData = (revenue?.data || []).map((d: { date: string; revenue: number; profit: number }) => ({
    date: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    revenue: d.revenue,
    profit: d.profit,
  }));

  const loading =
    (tab === 'revenue' && revLoading) ||
    (tab === 'margins' && marginLoading) ||
    (tab === 'suppliers' && spLoading) ||
    (tab === 'stock-ncc' && stockLoading);

  return (
    <div>
      <PageToolbar title="Báo cáo" description="Phân tích doanh thu, lợi nhuận và tồn kho" />

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${
              tab === id ? 'bg-[#f97316] text-white' : 'border border-gray-200 bg-white hover:border-orange-200'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : tab === 'revenue' ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 font-semibold">Doanh thu & Lợi nhuận theo ngày</h3>
            {chartData.length === 0 ? (
              <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#f97316" name="Doanh thu" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" fill="#22c55e" name="Lợi nhuận" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      ) : tab === 'margins' ? (
        <DataTable>
          <table className="w-full text-[13px]">
            <TableHead>
              <Th>Sản phẩm</Th>
              <Th>SKU</Th>
              <Th align="right">Giá bán</Th>
              <Th align="right">Giá vốn</Th>
              <Th align="right">Lãi/SP</Th>
              <Th align="right">Biên %</Th>
              <Th align="right">Tồn</Th>
            </TableHead>
            <tbody>
              {(margins?.data || []).map((m: {
                variantId: string;
                productName: string;
                sku: string;
                price: number;
                costPrice: number;
                profit: number;
                marginPct: number;
                stock: number;
              }) => (
                <tr key={m.variantId} className="border-b border-gray-50 hover:bg-orange-50/40">
                  <td className="px-5 py-4 font-medium">{m.productName}</td>
                  <td className="px-5 py-4 font-mono text-xs text-gray-400">{m.sku}</td>
                  <td className="px-5 py-4 text-right">{formatCurrency(m.price)}</td>
                  <td className="px-5 py-4 text-right text-gray-500">{formatCurrency(m.costPrice)}</td>
                  <td className="px-5 py-4 text-right font-semibold text-green-600">{formatCurrency(m.profit)}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${m.marginPct >= 20 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                      {m.marginPct}%
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">{m.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      ) : tab === 'suppliers' ? (
        <DataTable>
          <table className="w-full text-[13px]">
            <TableHead>
              <Th>Nhà cung cấp</Th>
              <Th>Mã</Th>
              <Th align="right">SL nhập</Th>
              <Th align="right">Giá trị nhập</Th>
              <Th align="right">Lần nhập</Th>
            </TableHead>
            <tbody>
              {(supplierProfit?.data || []).map((s: {
                supplier: { id: string; name: string; code: string };
                importQty: number;
                importValue: number;
                transactionCount: number;
              }) => (
                <tr key={s.supplier.id} className="border-b border-gray-50 hover:bg-orange-50/40">
                  <td className="px-5 py-4 font-medium">{s.supplier.name}</td>
                  <td className="px-5 py-4 text-gray-400">{s.supplier.code}</td>
                  <td className="px-5 py-4 text-right">{s.importQty}</td>
                  <td className="px-5 py-4 text-right font-semibold text-[#f97316]">{formatCurrency(s.importValue)}</td>
                  <td className="px-5 py-4 text-right">{s.transactionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      ) : (
        <div className="space-y-4">
          {(stockByNcc?.data || []).map((s: {
            supplier: { id: string; name: string; code: string };
            totalStock: number;
            productCount: number;
            lastImportAt: string;
            products: Array<{ name: string; sku: string; stock: number }>;
          }) => (
            <div key={s.supplier.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{s.supplier.name}</h3>
                  <p className="text-xs text-gray-400">{s.supplier.code} · {s.productCount} sản phẩm · Tồn: {s.totalStock}</p>
                </div>
                <span className="text-xs text-gray-400">Nhập gần nhất: {new Date(s.lastImportAt).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {s.products.slice(0, 6).map((p) => (
                  <span key={p.sku} className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs text-gray-600">
                    {p.name} ({p.stock})
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
