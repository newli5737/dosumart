import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@dosumart/api';
import { formatDate } from '@dosumart/utils';
import { Spinner, EmptyState } from '@dosumart/ui';
import { PageToolbar, DataTable, TableHead, Th } from '../../components/ui/AdminUI';

export default function CustomersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => reportsApi.customers({ limit: 50 }),
  });

  return (
    <div>
      <PageToolbar
        title="Khách hàng"
        description={`${data?.meta?.total ?? 0} khách hàng đã đăng ký`}
      />

      {isLoading ? (
        <Spinner />
      ) : data?.data?.length === 0 ? (
        <EmptyState title="Chưa có khách hàng" description="Khách hàng sẽ hiển thị khi có người đăng ký tài khoản." />
      ) : (
        <DataTable>
          <table className="w-full text-[13px]">
            <TableHead>
              <Th>Họ tên</Th>
              <Th>Email</Th>
              <Th>SĐT</Th>
              <Th align="right">Số đơn</Th>
              <Th>Ngày tham gia</Th>
            </TableHead>
            <tbody>
              {(data?.data || []).map((c: { id: string; fullName: string; email: string; phone?: string; createdAt: string; _count: { orders: number } }) => (
                <tr key={c.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-orange-50/40">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 text-sm font-bold text-[#f97316] shadow-sm">
                        {c.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-[#111827]">{c.fullName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#6b7280]">{c.email}</td>
                  <td className="px-5 py-4 text-[#6b7280]">{c.phone || '—'}</td>
                  <td className="px-5 py-4 text-right">
                    <span className="inline-flex min-w-[28px] items-center justify-center rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-semibold text-[#374151]">
                      {c._count.orders}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#9ca3af]">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      )}
    </div>
  );
}
