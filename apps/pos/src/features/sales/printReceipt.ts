import { formatCurrency, formatDate } from '@dosumart/utils';

export type ReceiptOrder = {
  code?: string;
  createdAt?: string;
  items?: Array<{ productName: string; quantity: number; price: number; lineTotal: number }>;
  subtotal?: number;
  discount?: number;
  total?: number;
  cashReceived?: number | null;
  changeAmount?: number | null;
};

function buildReceiptHtml(order: ReceiptOrder): string {
  const itemsHtml = (order.items || [])
    .map(
      (item) => `
      <div class="item">
        <p class="item-name">${escapeHtml(item.productName)}</p>
        <div class="row">
          <span>${item.quantity} x ${formatCurrency(item.price)}</span>
          <span>${formatCurrency(item.lineTotal)}</span>
        </div>
      </div>`,
    )
    .join('');

  const discountHtml =
    (order.discount || 0) > 0
      ? `<div class="row"><span>Giảm giá</span><span>-${formatCurrency(order.discount || 0)}</span></div>`
      : '';

  const cashHtml =
    order.cashReceived != null && order.cashReceived > 0
      ? `
      <div class="row"><span>Tiền khách đưa</span><span>${formatCurrency(order.cashReceived)}</span></div>
      <div class="row"><span>Tiền thối</span><span>${formatCurrency(order.changeAmount || 0)}</span></div>`
      : '';

  return `
    <div class="receipt">
      <div class="center">
        <p class="store">DoSuMart</p>
        <p>123 Nguyễn Huệ, Q1, TP.HCM</p>
        <p>028 1234 5678</p>
      </div>
      <hr />
      <p>Mã HĐ: <strong>${escapeHtml(order.code || '')}</strong></p>
      <p>Ngày: ${order.createdAt ? formatDate(order.createdAt) : ''}</p>
      <hr />
      ${itemsHtml}
      <hr />
      <div class="row"><span>Tạm tính</span><span>${formatCurrency(order.subtotal || 0)}</span></div>
      ${discountHtml}
      <div class="row total"><span>Tổng cộng</span><span>${formatCurrency(order.total || 0)}</span></div>
      ${cashHtml}
      <hr />
      <p class="center thanks">Cảm ơn quý khách!</p>
    </div>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const PRINT_STYLES = `
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    color: #000;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .receipt { width: 72mm; padding: 4px; }
  .center { text-align: center; }
  .store { font-size: 14px; font-weight: 700; margin: 0 0 4px; }
  p { margin: 3px 0; }
  hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
  .row { display: flex; justify-content: space-between; margin: 2px 0; }
  .total { font-weight: 700; font-size: 13px; margin-top: 4px; }
  .item { margin-bottom: 8px; }
  .item-name { font-weight: 600; margin: 0 0 2px; }
  .thanks { margin-top: 8px; }
`;

export function printReceipt(order: ReceiptOrder): void {
  const html = buildReceiptHtml(order);
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'print-receipt');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;visibility:hidden;';
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  if (!win) {
    document.body.removeChild(iframe);
    return;
  }

  const doc = win.document;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Hóa đơn ${escapeHtml(order.code || '')}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>${html}</body>
</html>`);
  doc.close();

  const doPrint = () => {
    try {
      win.focus();
      win.print();
    } finally {
      window.setTimeout(() => {
        if (iframe.parentNode) document.body.removeChild(iframe);
      }, 1000);
    }
  };

  if (doc.readyState === 'complete') {
    window.setTimeout(doPrint, 250);
  } else {
    iframe.onload = () => window.setTimeout(doPrint, 250);
  }
}
