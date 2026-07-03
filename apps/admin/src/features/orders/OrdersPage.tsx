import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { ordersApi } from '@dosumart/api';
import { formatCurrency, formatDate } from '@dosumart/utils';
import { ORDER_STATUS_LABELS } from '@dosumart/constants';
import { Spinner, Badge, EmptyState } from '@dosumart/ui';
import { PageToolbar, FilterBar, FilterChip, DataTable, TableHead, Th } from '../../components/ui/AdminUI';
import type { Order, OrderStatus } from '@dosumart/types';

const statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED'];
const PAGE_SIZE = 10;

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  PENDING: 'warning',
  CONFIRMED: 'default',
  PROCESSING: 'default',
  SHIPPING: 'default',
  COMPLETED: 'success',
  CANCELLED: 'error',
};

function OrderReceipt({ order }: { order: Order & { user?: { fullName: string; email?: string } } }) {
  return (
    <div className="p-6 font-mono text-sm text-black">
      <h2 className="text-center text-lg font-bold">DoSuMart</h2>
      <p className="text-center text-xs text-gray-500">Hóa đơn bán hàng</p>
      <hr className="my-3 border-dashed" />
      <p>Mã đơn: <strong>{order.code}</strong></p>
      <p>Ngày: {formatDate(order.createdAt)}</p>
      <p>Khách: {order.user?.fullName || 'Khách lẻ'}</p>
      <p>Kênh: {order.channel === 'ONLINE' ? 'Online' : 'Tại quầy'}</p>
      <hr className="my-3 border-dashed" />
      {order.items?.map((item) => (
        <div key={item.id} className="mb-1 flex justify-between gap-2">
          <span>{item.productName} x{item.quantity}</span>
          <span>{formatCurrency(item.lineTotal)}</span>
        </div>
      ))}
      <hr className="my-3 border-dashed" />
      <div className="flex justify-between font-bold">
        <span>Tổng cộng</span>
        <span>{formatCurrency(order.total)}</span>
      </div>
      <p className="mt-2 text-center text-xs text-gray-500">Cảm ơn quý khách!</p>
    </div>
  );
}

export default function OrdersPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [printOrder, setPrintOrder] = useState<(Order & { user?: { fullName: string } }) | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, page],
    queryFn: () => ordersApi.adminList({ status: status || undefined, page, limit: PAGE_SIZE }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status: s }: { id: string; status: string }) => ordersApi.updateStatus(id, s),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  const bulkMutation = useMutation({
    mutationFn: ({ ids, status: s }: { ids: string[]; status: string }) => ordersApi.bulkUpdateStatus(ids, s),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setSelected(new Set());
    },
  });

  const totalPages = data?.meta?.totalPages ?? 1;
  const orders = data?.data || [];

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === orders.length) setSelected(new Set());
    else setSelected(new Set(orders.map((o: Order) => o.id)));
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>In hóa đơn</title></head><body>${content.innerHTML}</body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div>
      <PageToolbar
        title="Quản lý đơn hàng"
        description={`${data?.meta?.total ?? 0} đơn hàng`}
      />

      <FilterBar>
        <FilterChip active={!status} onClick={() => { setStatus(''); setPage(1); }}>Tất cả</FilterChip>
        {statuses.map((s) => (
          <FilterChip key={s} active={status === s} onClick={() => { setStatus(s); setPage(1); }}>
            {ORDER_STATUS_LABELS[s]}
          </FilterChip>
        ))}
      </FilterBar>

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <span className="text-sm font-medium text-orange-800">Đã chọn {selected.size} đơn</span>
          {(['CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'] as OrderStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => bulkMutation.mutate({ ids: Array.from(selected), status: s })}
              disabled={bulkMutation.isPending}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-orange-700 shadow-sm hover:bg-orange-100"
            >
              → {ORDER_STATUS_LABELS[s]}
            </button>
          ))}
          <button type="button" onClick={() => setSelected(new Set())} className="text-xs text-orange-600 hover:underline">
            Bỏ chọn
          </button>
        </div>
      )}

      {isLoading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <EmptyState title="Chưa có đơn hàng" description="Đơn hàng sẽ hiển thị tại đây khi có giao dịch." />
      ) : (
        <>
          <DataTable>
            <table className="w-full text-[13px]">
              <TableHead>
                <Th>
                  <input type="checkbox" checked={selected.size === orders.length && orders.length > 0} onChange={toggleAll} />
                </Th>
                <Th>Mã đơn</Th>
                <Th>Khách hàng</Th>
                <Th>Kênh</Th>
                <Th>Ngày</Th>
                <Th align="right">Tổng tiền</Th>
                <Th>Trạng thái</Th>
                <Th>Thao tác</Th>
              </TableHead>
              <tbody>
                {orders.map((order: Order & { user?: { fullName: string } }) => (
                  <tr key={order.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-orange-50/40">
                    <td className="px-5 py-4">
                      <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggleSelect(order.id)} />
                    </td>
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-[#111827]">{order.code}</td>
                    <td className="px-5 py-3.5">{order.user?.fullName || 'Khách lẻ'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${order.channel === 'ONLINE' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                        {order.channel === 'ONLINE' ? 'Online' : 'Tại quầy'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#9ca3af]">{formatDate(order.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-[#111827]">{formatCurrency(order.total)}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusVariant[order.status] || 'default'}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          title="In hóa đơn"
                          className="text-gray-500 hover:text-[#f97316]"
                          onClick={() => { setPrintOrder(order); setTimeout(handlePrint, 100); }}
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        {order.status === 'PENDING' && (
                          <button type="button" className="text-sm font-medium text-[#f97316] hover:underline" onClick={() => updateMutation.mutate({ id: order.id, status: 'CONFIRMED' })}>
                            Xác nhận
                          </button>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <button type="button" className="text-sm font-medium text-[#f97316] hover:underline" onClick={() => updateMutation.mutate({ id: order.id, status: 'SHIPPING' })}>
                            Giao hàng
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex h-9 items-center gap-1 rounded-lg border px-3 text-sm disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Trước
              </button>
              <span className="text-sm text-gray-500">Trang {page} / {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-9 items-center gap-1 rounded-lg border px-3 text-sm disabled:opacity-40"
              >
                Sau <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      <div className="hidden">
        <div ref={printRef}>{printOrder && <OrderReceipt order={printOrder} />}</div>
      </div>
    </div>
  );
}
