import { useQuery } from '@tanstack/react-query';
import { TrendingUp, ShoppingBag, Package } from 'lucide-react';
import { reportsApi } from '@dosumart/api';
import { formatCurrency } from '@dosumart/utils';
import { Spinner } from '@dosumart/ui';
import { StatCard, DataTable, TableHead, Th, ContentCard } from '../../components/ui/AdminUI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DashboardPage() {
  const { data: revenue, isLoading } = useQuery({
    queryKey: ['revenue'],
    queryFn: () => reportsApi.revenue(),
  });

  const { data: topProducts } = useQuery({
    queryKey: ['top-products'],
    queryFn: () => reportsApi.topProducts(5),
  });

  if (isLoading) return <Spinner />;

  const chartData = (revenue?.data || []).map((r: { date: string; revenue: number }) => ({
    date: new Date(r.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    doanhThu: r.revenue,
  }));

  const totalRevenue = (revenue?.data || []).reduce((s: number, r: { revenue: number }) => s + r.revenue, 0);
  const totalOrders = (revenue?.data || []).reduce((s: number, r: { orderCount: number }) => s + r.orderCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#111827]">Tổng quan</h2>
        <p className="mt-1.5 flex items-center gap-2 text-sm text-[#6b7280]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#f97316]" />
          Theo dõi hiệu suất kinh doanh hôm nay
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Doanh thu" value={formatCurrency(totalRevenue)} icon={TrendingUp} accent="orange" trend="Tổng tích lũy" />
        <StatCard label="Đơn hàng" value={String(totalOrders)} icon={ShoppingBag} accent="green" trend="Tất cả kênh" />
        <StatCard label="Sản phẩm bán chạy" value={String((topProducts?.data || []).length)} icon={Package} accent="blue" trend="Top 5" />
      </div>

      <ContentCard title="Doanh thu theo ngày" subtitle="Biểu đồ doanh thu tích lũy">
        <div className="h-72">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), 'Doanh thu']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="doanhThu" fill="url(#orangeGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb923c" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-[#9ca3af]">
              <Package className="h-10 w-10 text-gray-200" />
              Chưa có dữ liệu doanh thu
            </div>
          )}
        </div>
      </ContentCard>

      <DataTable title="Sản phẩm bán chạy">
        <table className="w-full text-[13px]">
          <TableHead>
            <Th>Sản phẩm</Th>
            <Th>SKU</Th>
            <Th align="right">Đã bán</Th>
            <Th align="right">Doanh thu</Th>
          </TableHead>
          <tbody>
            {(topProducts?.data || []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-[#9ca3af]">Chưa có dữ liệu bán hàng</td>
              </tr>
            ) : (
              (topProducts?.data || []).map((p: { sku: string; productName: string; quantitySold: number; revenue: number }) => (
                <tr key={p.sku} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-orange-50/40">
                  <td className="px-5 py-4 font-medium text-[#111827]">{p.productName}</td>
                  <td className="px-5 py-4 font-mono text-xs text-[#9ca3af]">{p.sku}</td>
                  <td className="px-5 py-4 text-right">{p.quantitySold}</td>
                  <td className="px-5 py-4 text-right font-semibold text-[#f97316]">{formatCurrency(p.revenue)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </DataTable>
    </div>
  );
}
