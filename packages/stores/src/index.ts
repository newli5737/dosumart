import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@dosumart/types';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

/** In-memory only — auth session lives in httpOnly cookies, not localStorage */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));

interface CartLocalItem {
  variantId: string;
  productName: string;
  price: number;
  image?: string;
  quantity: number;
}

interface LocalCartState {
  items: CartLocalItem[];
  addItem: (item: CartLocalItem) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  total: () => number;
}

export const useLocalCartStore = create<LocalCartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find((i) => i.variantId === item.variantId);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i,
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }
      },
      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.variantId !== variantId) });
        } else {
          set({
            items: get().items.map((i) =>
              i.variantId === variantId ? { ...i, quantity } : i,
            ),
          });
        }
      },
      removeItem: (variantId) =>
        set({ items: get().items.filter((i) => i.variantId !== variantId) }),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
    }),
    { name: 'dosumart-cart' },
  ),
);

interface PosCartItem {
  variantId: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
}

interface PosState {
  items: PosCartItem[];
  addItem: (item: PosCartItem) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  subtotal: () => number;
  discount: number;
  setDiscount: (v: number) => void;
}

export const usePosStore = create<PosState>((set, get) => ({
  items: [],
  discount: 0,
  addItem: (item) => {
    const existing = get().items.find((i) => i.variantId === item.variantId);
    if (existing) {
      set({
        items: get().items.map((i) =>
          i.variantId === item.variantId
            ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) }
            : i,
        ),
      });
    } else {
      set({ items: [...get().items, { ...item, quantity: 1 }] });
    }
  },
  updateQuantity: (variantId, quantity) => {
    if (quantity <= 0) {
      set({ items: get().items.filter((i) => i.variantId !== variantId) });
    } else {
      set({
        items: get().items.map((i) =>
          i.variantId === variantId ? { ...i, quantity } : i,
        ),
      });
    }
  },
  removeItem: (variantId) =>
    set({ items: get().items.filter((i) => i.variantId !== variantId) }),
  clear: () => set({ items: [], discount: 0 }),
  subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
  setDiscount: (v) => set({ discount: v }),
}));
