import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { STORAGE_KEYS } from '@/shared/config/store';
import type { Product } from '@/modules/products/types';
import type { CartItem } from '@/modules/cart/types';
import type { ShippingRate } from '@/modules/shipping/types';
import type { Coupon } from '@/modules/coupons/types';
import {
  calculateCouponDiscount,
  calculateItemsSubtotal,
} from '@/modules/coupons/utils/couponDiscount';
import type { CustomerInfo } from '@/modules/checkout/types';
import type { Order } from '@/modules/orders/types';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  customerInfo: CustomerInfo | null;
  setCustomerInfo: (info: CustomerInfo) => void;
  orders: Order[];
  addOrder: (order: Order) => void;
  removeOrder: (orderId: string) => void;
  syncLocalOrders: (validOrders: Order[]) => void;
  getLastOrder: () => Order | null;
  repeatLastOrder: (currentProducts: Product[]) => Promise<boolean>;
  shippingRate: ShippingRate | null;
  setShippingRate: (rate: ShippingRate | null) => void;
  appliedCoupon: Coupon | null;
  setAppliedCoupon: (coupon: Coupon | null) => void;
  getDiscountAmount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.cart);
    return stored ? JSON.parse(stored) : [];
  });

  const [customerInfo, setCustomerInfoState] = useState<CustomerInfo | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.customer);
    return stored ? JSON.parse(stored) : null;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.orders);
    return stored ? JSON.parse(stored) : [];
  });

  const [shippingRate, setShippingRate] = useState<ShippingRate | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.shipping);
    return stored ? JSON.parse(stored) : null;
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (customerInfo) {
      localStorage.setItem(STORAGE_KEYS.customer, JSON.stringify(customerInfo));
    }
  }, [customerInfo]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    if (shippingRate) {
      localStorage.setItem(STORAGE_KEYS.shipping, JSON.stringify(shippingRate));
    } else {
      localStorage.removeItem(STORAGE_KEYS.shipping);
    }
  }, [shippingRate]);

  const addItem = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setShippingRate(null);
    setAppliedCoupon(null);
  };

  const getSubtotal = () => calculateItemsSubtotal(items);

  const getDiscountAmount = () =>
    calculateCouponDiscount(appliedCoupon, items, shippingRate?.price || 0);

  const getTotal = () => {
    const subtotal = getSubtotal();
    const shipping = shippingRate?.price || 0;
    return Math.max(0, subtotal + shipping - getDiscountAmount());
  };

  const getItemCount = () => items.reduce((count, item) => count + item.quantity, 0);

  const setCustomerInfo = (info: CustomerInfo) => {
    setCustomerInfoState(info);
  };

  const addOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
  };

  const removeOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
  };

  const syncLocalOrders = (validOrders: Order[]) => {
    setOrders((prev) =>
      JSON.stringify(validOrders) !== JSON.stringify(prev) ? validOrders : prev
    );
  };

  const getLastOrder = () => (orders.length > 0 ? orders[0] : null);

  const repeatLastOrder = async (currentProducts: Product[]) => {
    const lastOrder = getLastOrder();
    if (!lastOrder) return false;

    const activeItems = lastOrder.items
      .map((item) => {
        const currentProduct = currentProducts.find((p) => p.id === item.product.id);
        if (!currentProduct || !currentProduct.active || currentProduct.stock <= 0) {
          return null;
        }
        return {
          quantity: Math.min(item.quantity, currentProduct.stock),
          product: currentProduct,
        };
      })
      .filter((item): item is CartItem => item !== null);

    if (activeItems.length === 0) return false;

    setItems(activeItems);
    return true;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getSubtotal,
        getTotal,
        getItemCount,
        customerInfo,
        setCustomerInfo,
        orders,
        addOrder,
        removeOrder,
        syncLocalOrders,
        getLastOrder,
        repeatLastOrder,
        shippingRate,
        setShippingRate,
        appliedCoupon,
        setAppliedCoupon,
        getDiscountAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
