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

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  margin: '2px 0',
};

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ order }, ref) => {
  if (!order) return <div ref={ref} />;

  return (
    <div
      ref={ref}
      style={{
        width: '80mm',
        padding: '12px',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#000',
        background: '#fff',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <p style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px' }}>DoSuMart</p>
        <p style={{ margin: '2px 0' }}>123 Nguyễn Huệ, Q1, TP.HCM</p>
        <p style={{ margin: '2px 0' }}>028 1234 5678</p>
      </div>
      <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '8px 0' }} />
      <p style={{ margin: '4px 0' }}>Mã HĐ: <strong>{order.code}</strong></p>
      <p style={{ margin: '4px 0' }}>Ngày: {order.createdAt ? formatDate(order.createdAt) : ''}</p>
      <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '8px 0' }} />
      {order.items?.map((item, i) => (
        <div key={i} style={{ marginBottom: '8px' }}>
          <p style={{ margin: '0 0 2px', fontWeight: 600 }}>{item.productName}</p>
          <div style={rowStyle}>
            <span>{item.quantity} x {formatCurrency(item.price)}</span>
            <span>{formatCurrency(item.lineTotal)}</span>
          </div>
        </div>
      ))}
      <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '8px 0' }} />
      <div style={rowStyle}><span>Tạm tính</span><span>{formatCurrency(order.subtotal || 0)}</span></div>
      {(order.discount || 0) > 0 && (
        <div style={rowStyle}><span>Giảm giá</span><span>-{formatCurrency(order.discount || 0)}</span></div>
      )}
      <div style={{ ...rowStyle, fontWeight: 700, fontSize: '13px', marginTop: '4px' }}>
        <span>Tổng cộng</span><span>{formatCurrency(order.total || 0)}</span>
      </div>
      {order.cashReceived != null && order.cashReceived > 0 && (
        <>
          <div style={rowStyle}><span>Tiền khách đưa</span><span>{formatCurrency(order.cashReceived)}</span></div>
          <div style={rowStyle}><span>Tiền thối</span><span>{formatCurrency(order.changeAmount || 0)}</span></div>
        </>
      )}
      <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '8px 0' }} />
      <p style={{ textAlign: 'center', margin: '8px 0 0' }}>Cảm ơn quý khách!</p>
    </div>
  );
});

Receipt.displayName = 'Receipt';
export default Receipt;
