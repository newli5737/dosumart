import axios, { AxiosError } from 'axios';
import { DEFAULT_API_URL } from '@dosumart/constants';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_URL) ||
  DEFAULT_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original.url?.includes('/auth/')) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {},
            { withCredentials: true },
          );
          refreshQueue.forEach((cb) => cb());
          refreshQueue = [];
          return api(original);
        } catch {
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/dang-nhap')) {
            window.location.href = '/dang-nhap';
          }
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }
      return new Promise((resolve) => {
        refreshQueue.push(() => {
          resolve(api(original));
        });
      });
    }
    return Promise.reject(error);
  },
);

export { api };

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  register: (data: { email: string; password: string; fullName: string; phone?: string }) =>
    api.post('/auth/register', data).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data).then((r) => r.data),
  addresses: () => api.get('/auth/addresses').then((r) => r.data),
  createAddress: (data: Record<string, unknown>) =>
    api.post('/auth/addresses', data).then((r) => r.data),
  updateAddress: (id: string, data: Record<string, unknown>) =>
    api.patch(`/auth/addresses/${id}`, data).then((r) => r.data),
  deleteAddress: (id: string) => api.delete(`/auth/addresses/${id}`).then((r) => r.data),
};

export const productsApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    api.get('/products', { params }).then((r) => r.data),
  getBySlug: (slug: string) => api.get(`/products/${slug}`).then((r) => r.data),
  adminList: (params?: Record<string, string | number | undefined>) =>
    api.get('/admin/products', { params }).then((r) => r.data),
  create: (data: unknown) => api.post('/admin/products', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.patch(`/admin/products/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/admin/products/${id}`).then((r) => r.data),
};

export const categoriesApi = {
  list: () => api.get('/categories').then((r) => r.data),
  brands: () => api.get('/brands').then((r) => r.data),
};

export const cartApi = {
  get: () => api.get('/cart').then((r) => r.data),
  addItem: (variantId: string, quantity: number) =>
    api.post('/cart/items', { variantId, quantity }).then((r) => r.data),
  updateItem: (id: string, quantity: number) =>
    api.patch(`/cart/items/${id}`, { quantity }).then((r) => r.data),
  removeItem: (id: string) => api.delete(`/cart/items/${id}`).then((r) => r.data),
};

export const ordersApi = {
  checkout: (data: unknown) => api.post('/orders', data).then((r) => r.data),
  list: (params?: Record<string, string | number>) =>
    api.get('/orders', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/orders/${id}`).then((r) => r.data),
  cancel: (id: string) => api.patch(`/orders/${id}/cancel`).then((r) => r.data),
  adminList: (params?: Record<string, string | number | undefined>) =>
    api.get('/admin/orders', { params }).then((r) => r.data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/admin/orders/${id}/status`, { status }).then((r) => r.data),
};

export const posApi = {
  openShift: (openingCash: number) => api.post('/pos/shifts/open', { openingCash }).then((r) => r.data),
  closeShift: (closingCash: number, note?: string) =>
    api.post('/pos/shifts/close', { closingCash, note }).then((r) => r.data),
  currentShift: () => api.get('/pos/shifts/current').then((r) => r.data),
  createOrder: (data: unknown) => api.post('/pos/orders', data).then((r) => r.data),
  searchProducts: (q?: string, barcode?: string) =>
    api.get('/pos/products/search', { params: { q, barcode } }).then((r) => r.data),
  printOrder: (id: string) => api.post(`/pos/orders/${id}/print`).then((r) => r.data),
};

export const reportsApi = {
  revenue: (params?: Record<string, string>) =>
    api.get('/admin/reports/revenue', { params }).then((r) => r.data),
  topProducts: (limit?: number) =>
    api.get('/admin/reports/top-products', { params: { limit } }).then((r) => r.data),
  inventory: () => api.get('/admin/reports/inventory').then((r) => r.data),
  customers: (params?: Record<string, string | number>) =>
    api.get('/admin/customers', { params }).then((r) => r.data),
};

export const inventoryApi = {
  importStock: (
    variantId: string,
    data: { type: string; quantity: number; note?: string; supplierId?: string; unitCost?: number },
  ) => api.post(`/admin/variants/${variantId}/stock`, data).then((r) => r.data),
  stockLogs: (params?: Record<string, string | number>) =>
    api.get('/admin/stock-logs', { params }).then((r) => r.data),
  suppliers: () => api.get('/admin/suppliers').then((r) => r.data),
  createSupplier: (data: Record<string, unknown>) =>
    api.post('/admin/suppliers', data).then((r) => r.data),
  updateSupplier: (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/suppliers/${id}`, data).then((r) => r.data),
};
