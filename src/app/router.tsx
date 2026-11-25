import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StorefrontPage from '@/modules/products/pages/StorefrontPage';

const CartPage = lazy(() => import('@/modules/cart/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/modules/checkout/pages/CheckoutPage'));
const PaymentPage = lazy(() => import('@/modules/checkout/pages/PaymentPage'));
const OrdersPage = lazy(() => import('@/modules/orders/pages/OrdersPage'));
const AdminPage = lazy(() => import('@/modules/admin/pages/AdminPage'));
const NotFoundPage = lazy(() => import('@/shared/pages/NotFoundPage'));

const PageFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<StorefrontPage />} />
          <Route path="/carrinho" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/pedidos" element={<OrdersPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
