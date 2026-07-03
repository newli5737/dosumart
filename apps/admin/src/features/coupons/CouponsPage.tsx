import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { couponsApi } from '@dosumart/api';
import { formatCurrency, formatDate } from '@dosumart/utils';
import { Spinner, Badge, EmptyState } from '@dosumart/ui';
import { PageToolbar, DataTable, TableHead, Th } from '../../components/ui/AdminUI';

const emptyForm = {
  code: '',
  type: 'PERCENT' as 'PERCENT' | 'FIXED',
  value: 10,
  minOrderValue: 0,
  usageLimit: 100,
  startAt: new Date().toISOString().slice(0, 10),
  endAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
};

export default function CouponsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: couponsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      couponsApi.create({
        ...form,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setDrawerOpen(false);
      setForm(emptyForm);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      couponsApi.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: couponsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  });

  const inputCls = 'h-10 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-[#f97316] focus:outline-none';

  return (
    <div>
      <PageToolbar
        title="Khuyến mãi"
        description="Quản lý mã giảm giá"
        action={
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#f97316] px-4 text-sm font-semibold text-white hover:bg-[#ea580c]"
          >
            <Plus className="h-4 w-4" />
            Tạo mã
          </button>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : !data?.data?.length ? (
        <EmptyState title="Chưa có mã giảm giá" description="Tạo mã để khách hàng sử dụng khi thanh toán." />
      ) : (
        <DataTable>
          <table className="w-full text-[13px]">
            <TableHead>
              <Th>Mã</Th>
              <Th>Loại</Th>
              <Th align="right">Giá trị</Th>
              <Th align="right">Đơn tối thiểu</Th>
              <Th>Đã dùng</Th>
              <Th>Hiệu lực</Th>
              <Th>Trạng thái</Th>
              <Th>Thao tác</Th>
            </TableHead>
            <tbody>
              {data.data.map((c: {
                id: string;
                code: string;
                type: string;
                value: number;
                minOrderValue: number;
                usedCount: number;
                usageLimit: number | null;
                startAt: string;
                endAt: string;
                isActive: boolean;
              }) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-orange-50/40">
                  <td className="px-5 py-4 font-mono font-semibold">{c.code}</td>
                  <td className="px-5 py-4">{c.type === 'PERCENT' ? '% Giảm' : 'Cố định'}</td>
                  <td className="px-5 py-4 text-right font-semibold text-[#f97316]">
                    {c.type === 'PERCENT' ? `${c.value}%` : formatCurrency(c.value)}
                  </td>
                  <td className="px-5 py-4 text-right">{formatCurrency(c.minOrderValue)}</td>
                  <td className="px-5 py-4">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {formatDate(c.startAt)} – {formatDate(c.endAt)}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={c.isActive ? 'success' : 'default'}>{c.isActive ? 'Hoạt động' : 'Tắt'}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-sm text-[#f97316] hover:underline"
                        onClick={() => toggleMutation.mutate({ id: c.id, isActive: !c.isActive })}
                      >
                        {c.isActive ? 'Tắt' : 'Bật'}
                      </button>
                      <button
                        type="button"
                        className="text-red-500"
                        onClick={() => { if (confirm('Xóa mã này?')) deleteMutation.mutate(c.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">Tạo mã giảm giá</h2>
            <div className="mt-4 space-y-3">
              <input className={inputCls} placeholder="Mã (VD: SUMMER20)" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
              <select className={inputCls} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'PERCENT' | 'FIXED' }))}>
                <option value="PERCENT">Giảm theo %</option>
                <option value="FIXED">Giảm cố định (VNĐ)</option>
              </select>
              <input type="number" className={inputCls} placeholder="Giá trị" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))} />
              <input type="number" className={inputCls} placeholder="Đơn tối thiểu" value={form.minOrderValue} onChange={(e) => setForm((f) => ({ ...f, minOrderValue: Number(e.target.value) }))} />
              <input type="number" className={inputCls} placeholder="Giới hạn lượt dùng" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: Number(e.target.value) }))} />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" className={inputCls} value={form.startAt} onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))} />
                <input type="date" className={inputCls} value={form.endAt} onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))} />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="flex-1 h-11 rounded-xl bg-[#f97316] text-sm font-semibold text-white">
                {createMutation.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button type="button" onClick={() => setDrawerOpen(false)} className="h-11 rounded-xl border px-4 text-sm">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
