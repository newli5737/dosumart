import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@dosumart/api';
import { Spinner, Badge, EmptyState } from '@dosumart/ui';
import { PageToolbar, DataTable, TableHead, Th } from '../../components/ui/AdminUI';

export default function InventoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: reportsApi.inventory,
  });

  return (
    <div>
      <PageToolbar
        title="Quản lý kho hàng"
        description={`${data?.data?.length ?? 0} mặt hàng trong kho`}
      />

      {isLoading ? (
        <Spinner />
      ) : data?.data?.length === 0 ? (
        <EmptyState title="Chưa có dữ liệu tồn kho" description="Dữ liệu tồn kho sẽ hiển thị khi có sản phẩm." />
      ) : (
        <DataTable>
          <table className="w-full text-[13px]">
            <TableHead>
              <Th>Sản phẩm</Th>
              <Th>SKU</Th>
              <Th>Kho</Th>
              <Th align="right">Tồn kho</Th>
              <Th>Cảnh báo</Th>
            </TableHead>
            <tbody>
              {(data?.data || []).map((item: { variantId: string; productName: string; sku: string; warehouse: string; quantity: number; isLowStock: boolean }) => (
                <tr key={item.variantId} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-orange-50/40">
                  <td className="px-5 py-4 font-medium text-[#111827]">{item.productName}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-[#9ca3af]">{item.sku}</td>
                  <td className="px-5 py-3.5 text-[#6b7280]">{item.warehouse}</td>
                  <td className="px-5 py-3.5 text-right font-semibold">{item.quantity}</td>
                  <td className="px-5 py-3.5">
                    {item.isLowStock ? (
                      <Badge variant="warning">Sắp hết</Badge>
                    ) : (
                      <Badge variant="success">Đủ hàng</Badge>
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
