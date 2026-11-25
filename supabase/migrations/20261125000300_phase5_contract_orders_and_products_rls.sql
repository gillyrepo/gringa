-- Phase 5 (Contract): Final RLS Lockdown After Modular Frontend Deployment
-- 1. Restrict anonymous SELECT on products to active = true AND store = 'docimdagringa'
--    (active = true with stock = 0 remains visible per business rule; active = false is hidden from public)
-- 2. Lock direct table SELECT/INSERT on orders and order_items to admins only
--    (public checkout and order tracking now operate exclusively via create_public_order & get_customer_orders_by_ids RPCs)
-- 3. Drop legacy standalone increment_coupon_usage RPC (now handled atomically inside create_public_order)

BEGIN;

-- products: public sees only active = true; admin sees all
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
CREATE POLICY "products_select_policy"
  ON public.products FOR SELECT TO public
  USING (
    (active = true AND store = 'docimdagringa')
    OR (SELECT public.is_admin())
  );

-- orders: direct table access restricted to admin only (PII/LGPD protected)
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;

CREATE POLICY "orders_select_admin"
  ON public.orders FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

CREATE POLICY "orders_insert_admin"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

-- order_items: direct table access restricted to admin only
DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;

CREATE POLICY "order_items_select_admin"
  ON public.order_items FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

CREATE POLICY "order_items_insert_admin"
  ON public.order_items FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

-- Drop legacy standalone coupon increment RPC
DROP FUNCTION IF EXISTS public.increment_coupon_usage(text);

COMMIT;
