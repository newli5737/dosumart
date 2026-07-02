import { forwardRef } from 'react';
import { formatCurrency, formatDate } from '@dosumart/utils';

interface ReceiptProps {
  order: {
    code?: string;
    createdAt?: string;
    items?: Array<{ productName: string; quantity: number; price: number; lineTotal: number }>;
    subtotal?: number;
    discount?: number;
    total?: number;
    cashReceived?: number;
    changeAmount?: number;
  } | null;
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ order }, ref) => {
  if (!order) return <div ref={ref} />;

  return (
    <div ref={ref} className="print-area p-4 font-mono text-xs" style={{ width: '80mm' }}>
      <div className="text-center">
        <p className="text-sm font-bold">DosuMart</p>
        <p>123 Nguyễn Huệ, Q1, TP.HCM</p>
        <p>028 1234 5678</p>
      </div>
      <div className="my-3 border-t border-dashed border-black" />
      <p>Mã HĐ: {order.code}</p>
      <p>Ngày: {order.createdAt ? formatDate(order.createdAt) : ''}</p>
      <div className="my-3 border-t border-dashed border-black" />
      {order.items?.map((item, i) => (
        <div key={i} className="mb-2">
          <p>{item.productName}</p>
          <p className="flex justify-between">
            <span>{item.quantity} x {formatCurrency(item.price)}</span>
            <span>{formatCurrency(item.lineTotal)}</span>
          </p>
        </div>
      ))}
      <div className="my-3 border-t border-dashed border-black" />
      <p className="flex justify-between"><span>Tạm tính</span><span>{formatCurrency(order.subtotal || 0)}</span></p>
      {(order.discount || 0) > 0 && (
        <p className="flex justify-between"><span>Giảm giá</span><span>-{formatCurrency(order.discount || 0)}</span></p>
      )}
      <p className="flex justify-between font-bold"><span>Tổng cộng</span><span>{formatCurrency(order.total || 0)}</span></p>
      {order.cashReceived && (
        <>
          <p className="flex justify-between"><span>Tiền khách đưa</span><span>{formatCurrency(order.cashReceived)}</span></p>
          <p className="flex justify-between"><span>Tiền thối</span><span>{formatCurrency(order.changeAmount || 0)}</span></p>
        </>
      )}
      <div className="my-3 border-t border-dashed border-black" />
      <p className="text-center">Cảm ơn quý khách!</p>
    </div>
  );
});

Receipt.displayName = 'Receipt';
export default Receipt;
