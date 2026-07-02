export type Role = 'CUSTOMER' | 'CASHIER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RETURNED';

export type PaymentMethod = 'COD' | 'BANK_TRANSFER' | 'CASH' | 'CARD' | 'E_WALLET' | 'GATEWAY';

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta | null;
  message?: string | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phone?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  images: string[];
  basePrice: number;
  isActive: boolean;
  isFeatured: boolean;
  category?: { id: string; name: string; slug: string };
  brand?: { id: string; name: string; slug: string };
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  sku: string;
  barcode?: string;
  price: number;
  costPrice?: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface CartItem {
  id: string;
  quantity: number;
  lineTotal: number;
  variant: ProductVariant & { product: { name: string; images: string[] } };
}

export interface Cart {
  id: string;
  items: CartItem[];
  total: number;
}

export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  channel: string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  tax: number;
  shippingFee: number;
  total: number;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
}
