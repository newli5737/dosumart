import { formatCurrency, formatDate } from '@dosumart/utils';

export type StoreInfo = {
  name: string;
  branchName?: string;
  address: string;
  phone?: string;
  hotline?: string;
  email?: string;
  taxCode?: string;
  logo?: string;
  website?: string;
};

export type ReceiptOrder = {
  id?: string;
  code?: string;
  createdAt?: string;
  items?: Array<{
    productName: string;
    sku?: string;
    quantity: number;
    price: number;
    lineTotal: number;
  }>;
  subtotal?: number;
  discount?: number;
  total?: number;
  cashReceived?: number | null;
  changeAmount?: number | null;
  paymentMethod?: string;
};

export type PrintContext = {
  store: StoreInfo;
  cashier?: string;
  counter?: string;
};

const DEFAULT_STORE: StoreInfo = {
  name: 'DoSuMart',
  branchName: 'CN Tạp Hóa DoSuMart',
  address: 'Số 45A đường số 5, KDC Bình Trị Đông B, Phường Bình Trị Đông, Quận Bình Tân, TP. Hồ Chí Minh',
  phone: '0901 234 567',
  hotline: '1900 6368',
  logo: '/dosumart.svg',
  website: 'mart.dosutech.site',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function amount(n: number): string {
  return formatCurrency(n).replace(/\s*₫$/, '').trim();
}

function logoUrl(logoPath?: string): string {
  const path = logoPath || '/dosumart.svg';
  if (path.startsWith('http')) return path;
  return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
}

function buildReceiptHtml(order: ReceiptOrder, ctx: PrintContext): string {
  const store = ctx.store;
  const branch = store.branchName || store.name;
  const logo = logoUrl(store.logo);

  const itemRows = (order.items || [])
    .map(
      (item) => `
      <tr class="item-row">
        <td colspan="4" class="item-name">${escapeHtml(item.productName)}</td>
      </tr>
      <tr class="item-row">
        <td class="sku">${item.sku ? escapeHtml(item.sku) : ''}</td>
        <td class="num">${amount(item.price)}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${amount(item.lineTotal)}</td>
      </tr>`,
    )
    .join('');

  const discount = order.discount || 0;
  const discountBlock =
    discount > 0
      ? `<tr class="sum-row"><td colspan="3" class="label">TỔNG TIỀN ĐÃ GIẢM</td><td class="num">-${amount(discount)}</td></tr>`
      : '';

  const paymentBlock =
    order.cashReceived != null && order.cashReceived > 0
      ? `
      <tr class="sum-row"><td colspan="3" class="label">TIỀN KHÁCH TRẢ</td><td class="num bold">${amount(order.cashReceived)}</td></tr>
      <tr class="sum-row"><td colspan="3" class="label">Tiền mặt</td><td class="num">${amount(order.cashReceived)}</td></tr>
      <tr class="sum-row highlight"><td colspan="3" class="label">TIỀN TRẢ LẠI</td><td class="num bold">${amount(order.changeAmount || 0)}</td></tr>`
      : '';

  return `
    <div class="receipt">
      <table class="header">
        <tr>
          <td class="logo-cell">
            <img src="${logo}" alt="DoSuMart" class="logo" />
          </td>
          <td class="store-cell">
            <div class="branch">${escapeHtml(branch)}</div>
            <div class="addr">${escapeHtml(store.address)}</div>
            ${store.phone ? `<div class="phone">${escapeHtml(store.phone)}</div>` : ''}
          </td>
        </tr>
      </table>

      <div class="title">HÓA ĐƠN BÁN HÀNG</div>

      <table class="meta">
        <tr>
          <td>Ngày bán: ${order.createdAt ? formatDate(order.createdAt) : ''}</td>
          <td class="right">HD: ${escapeHtml(order.code || '')}</td>
        </tr>
        <tr>
          <td>Quầy: ${escapeHtml(ctx.counter || 'POS')}</td>
          <td class="right">NVBH: ${escapeHtml(ctx.cashier || '')}</td>
        </tr>
      </table>

      <div class="divider"></div>

      <table class="items">
        <thead>
          <tr>
            <th class="col-name">Mặt hàng</th>
            <th class="col-price">Đơn giá</th>
            <th class="col-qty">SL</th>
            <th class="col-total">T.Tiền</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <div class="divider"></div>

      <table class="summary">
        <tr class="sum-row highlight">
          <td colspan="3" class="label">TỔNG TIỀN T.TOÁN</td>
          <td class="num bold">${amount(order.total || 0)}</td>
        </tr>
        ${discountBlock}
        ${paymentBlock}
      </table>

      <p class="tax-note">(Giá đã bao gồm thuế GTGT)</p>

      <div class="divider"></div>

      <p class="footer-title">CẢM ƠN QUÝ KHÁCH VÀ HẸN GẶP LẠI</p>
      ${store.hotline ? `<p class="footer-line">Hotline: ${escapeHtml(store.hotline)}</p>` : ''}
      ${store.website ? `<p class="footer-line">${escapeHtml(store.website)}</p>` : ''}
    </div>
  `;
}

const PRINT_STYLES = `
  @page { size: 80mm auto; margin: 3mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    line-height: 1.35;
    color: #000;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .receipt { width: 72mm; margin: 0 auto; }
  .header { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  .logo-cell { width: 42px; vertical-align: top; padding-right: 6px; }
  .logo { width: 40px; height: 40px; object-fit: contain; }
  .store-cell { vertical-align: top; text-align: right; font-size: 10px; }
  .branch { font-weight: 700; font-size: 11px; margin-bottom: 2px; }
  .addr { margin-bottom: 2px; }
  .title {
    text-align: center;
    font-weight: 700;
    font-size: 12px;
    margin: 8px 0 6px;
    letter-spacing: 0.3px;
  }
  .meta { width: 100%; font-size: 10px; margin-bottom: 4px; }
  .meta td { padding: 1px 0; vertical-align: top; }
  .right { text-align: right; }
  .divider { border-top: 1px dashed #000; margin: 6px 0; }
  .items { width: 100%; border-collapse: collapse; font-size: 10px; }
  .items th {
    border-bottom: 1px solid #000;
    padding: 3px 2px;
    text-align: right;
    font-weight: 700;
    font-size: 9px;
  }
  .items th.col-name { text-align: left; }
  .item-row td { padding: 2px; vertical-align: top; }
  .item-name { font-weight: 600; text-align: left; padding-top: 4px !important; }
  .sku { text-align: left; font-size: 9px; color: #333; }
  .num { text-align: right; white-space: nowrap; }
  .summary { width: 100%; border-collapse: collapse; font-size: 10px; }
  .sum-row td { padding: 2px; }
  .label { text-align: left; font-weight: 600; }
  .bold { font-weight: 700; }
  .highlight .label, .highlight .num { font-weight: 700; }
  .tax-note { font-size: 9px; margin: 6px 0 0; }
  .footer-title {
    text-align: center;
    font-weight: 700;
    font-size: 10px;
    margin: 8px 0 4px;
  }
  .footer-line { text-align: center; font-size: 9px; margin: 2px 0; }
`;

export function printReceipt(order: ReceiptOrder, ctx?: Partial<PrintContext>): void {
  const store = ctx?.store ?? DEFAULT_STORE;
  const printCtx: PrintContext = {
    store,
    cashier: ctx?.cashier,
    counter: ctx?.counter ?? 'POS',
  };

  const html = buildReceiptHtml(order, printCtx);
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
    window.setTimeout(doPrint, 300);
  } else {
    iframe.onload = () => window.setTimeout(doPrint, 300);
  }
}

export { DEFAULT_STORE };
