import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@dosumart/api';
import { formatCurrency, formatDate } from '@dosumart/utils';
import { ORDER_STATUS_LABELS } from '@dosumart/constants';
import { Spinner, Badge, EmptyState } from '@dosumart/ui';
import { PageToolbar, FilterBar, FilterChip, DataTable, TableHead, Th } from '../../components/ui/AdminUI';
import type { Order, OrderStatus } from '@dosumart/types';

const statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED'];

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  PENDING: 'warning',
  CONFIRMED: 'default',
  PROCESSING: 'default',
  SHIPPING: 'default',
  COMPLETED: 'success',
  CANCELLED: 'error',
};

export default function OrdersPage() {
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status],
    queryFn: () => ordersApi.adminList({ status: status || undefined, limit: 50 }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ordersApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  return (
    <div>
      <PageToolbar
        title="Quản lý đơn hàng"
        description={`${data?.meta?.total ?? 0} đơn hàng`}
      />

      <FilterBar>
        <FilterChip active={!status} onClick={() => setStatus('')}>Tất cả</FilterChip>
        {statuses.map((s) => (
          <FilterChip key={s} active={status === s} onClick={() => setStatus(s)}>
            {ORDER_STATUS_LABELS[s]}
          </FilterChip>
        ))}
      </FilterBar>

      {isLoading ? (
        <Spinner />
      ) : data?.data?.length === 0 ? (
        <EmptyState title="Chưa có đơn hàng" description="Đơn hàng sẽ hiển thị tại đây khi có giao dịch." />
      ) : (
        <DataTable>
          <table className="w-full text-[13px]">
            <TableHead>
              <Th>Mã đơn</Th>
              <Th>Khách hàng</Th>
              <Th>Kênh</Th>
              <Th>Ngày</Th>
              <Th align="right">Tổng tiền</Th>
              <Th>Trạng thái</Th>
              <Th>Thao tác</Th>
            </TableHead>
            <tbody>
              {(data?.data || []).map((order: Order & { user?: { fullName: string } }) => (
                <tr key={order.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-orange-50/40">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      )}
    </div>
  );
}
