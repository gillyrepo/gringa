-- Phase 1: Zero-Downtime RLS Hardening, Legacy Barbershop/OpenClaw Purge & FK Indexes
-- Safe while current frontend bundle is live on www.docimdagringa.com.br

BEGIN;

-- 1. Normalize store slug in shipping_rates ('Gringa' -> 'docimdagringa') and purge legacy barbershop products
UPDATE public.shipping_rates
SET store = 'docimdagringa'
WHERE store IS DISTINCT FROM 'docimdagringa';

DELETE FROM public.products
WHERE store = 'barbershop';

-- 2. Remove legacy OpenClaw webhook trigger & unused SECURITY DEFINER functions
DROP TRIGGER IF EXISTS notificar_novo_pedido_openclaw ON public.orders;
DROP FUNCTION IF EXISTS public.get_order_logs();
DROP FUNCTION IF EXISTS public.get_order_details_by_number(integer);

-- 3. Harden existing functions (immutable search_path) & add non-recursive admin helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.coupons
  SET usage_count = usage_count + 1
  WHERE code = upper(trim(coupon_code))
    AND store = 'docimdagringa'
    AND active = true
    AND usage_count < usage_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$function$;

-- 4. store_settings: create policies BEFORE enabling RLS (zero blocking window)
DROP POLICY IF EXISTS "store_settings_select_policy" ON public.store_settings;
DROP POLICY IF EXISTS "store_settings_insert_admin" ON public.store_settings;
DROP POLICY IF EXISTS "store_settings_update_admin" ON public.store_settings;
DROP POLICY IF EXISTS "store_settings_delete_admin" ON public.store_settings;

CREATE POLICY "store_settings_select_policy"
  ON public.store_settings FOR SELECT TO public
  USING (store = 'docimdagringa' OR (SELECT public.is_admin()));

CREATE POLICY "store_settings_insert_admin"
  ON public.store_settings FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "store_settings_update_admin"
  ON public.store_settings FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "store_settings_delete_admin"
  ON public.store_settings FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- 5. products: cut anonymous INSERT/UPDATE/DELETE immediately (Phase 5 will restrict SELECT to active=true after frontend deploy)
DROP POLICY IF EXISTS "all products" ON public.products;
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
DROP POLICY IF EXISTS "products_update_admin" ON public.products;
DROP POLICY IF EXISTS "products_delete_admin" ON public.products;

CREATE POLICY "products_select_policy"
  ON public.products FOR SELECT TO public
  USING (store = 'docimdagringa' OR (SELECT public.is_admin()));

CREATE POLICY "products_insert_admin"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "products_update_admin"
  ON public.products FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "products_delete_admin"
  ON public.products FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

-- 6. shipping_rates: single SELECT policy + admin-only writes (eliminates multiple_permissive_policies lint)
DROP POLICY IF EXISTS "Admin pode gerenciar taxas de frete" ON public.shipping_rates;
DROP POLICY IF EXISTS "Allow public read access" ON public.shipping_rates;
DROP POLICY IF EXISTS "shipping_rates_select_policy" ON public.shipping_rates;
DROP POLICY IF EXISTS "shipping_rates_insert_admin" ON public.shipping_rates;
DROP POLICY IF EXISTS "shipping_rates_update_admin" ON public.shipping_rates;
DROP POLICY IF EXISTS "shipping_rates_delete_admin" ON public.shipping_rates;

CREATE POLICY "shipping_rates_select_policy"
  ON public.shipping_rates FOR SELECT TO public
  USING (store = 'docimdagringa' OR (SELECT public.is_admin()));

CREATE POLICY "shipping_rates_insert_admin"
  ON public.shipping_rates FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "shipping_rates_update_admin"
  ON public.shipping_rates FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "shipping_rates_delete_admin"
  ON public.shipping_rates FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

-- 7. coupons: single SELECT policy + admin-only writes (eliminates multiple_permissive_policies lint)
DROP POLICY IF EXISTS "Admin full access coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow public read active coupons" ON public.coupons;
DROP POLICY IF EXISTS "coupons_select_policy" ON public.coupons;
DROP POLICY IF EXISTS "coupons_insert_admin" ON public.coupons;
DROP POLICY IF EXISTS "coupons_update_admin" ON public.coupons;
DROP POLICY IF EXISTS "coupons_delete_admin" ON public.coupons;

CREATE POLICY "coupons_select_policy"
  ON public.coupons FOR SELECT TO public
  USING ((active = true AND store = 'docimdagringa') OR (SELECT public.is_admin()));

CREATE POLICY "coupons_insert_admin"
  ON public.coupons FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "coupons_update_admin"
  ON public.coupons FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "coupons_delete_admin"
  ON public.coupons FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

-- 8. profiles: prevent anonymous read and privilege escalation
DROP POLICY IF EXISTS "all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

-- 9. orders: block anonymous UPDATE/DELETE immediately while keeping live checkout (.insert().select()) working until Phase 5
DROP POLICY IF EXISTS "all orders" ON public.orders;
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;

CREATE POLICY "orders_select_policy"
  ON public.orders FOR SELECT TO public
  USING (true);

CREATE POLICY "orders_insert_policy"
  ON public.orders FOR INSERT TO public
  WITH CHECK (
    status = 'pending'
    AND total_amount >= 0
    AND COALESCE(shipping_cost, 0) >= 0
  );

CREATE POLICY "orders_update_admin"
  ON public.orders FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "orders_delete_admin"
  ON public.orders FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

-- 10. order_items: block anonymous UPDATE/DELETE immediately while keeping live checkout working until Phase 5
DROP POLICY IF EXISTS "all order item" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update_admin" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_admin" ON public.order_items;

CREATE POLICY "order_items_select_policy"
  ON public.order_items FOR SELECT TO public
  USING (true);

CREATE POLICY "order_items_insert_policy"
  ON public.order_items FOR INSERT TO public
  WITH CHECK (
    quantity > 0
    AND unit_price >= 0
    AND subtotal >= 0
  );

CREATE POLICY "order_items_update_admin"
  ON public.order_items FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "order_items_delete_admin"
  ON public.order_items FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

-- 11. storage.objects ('products' bucket): restrict uploads/edits/deletes to admins
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Products" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Products" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Products" ON storage.objects;

CREATE POLICY "Admin Upload Products"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'products' AND (SELECT public.is_admin()));

CREATE POLICY "Admin Update Products"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'products' AND (SELECT public.is_admin()))
  WITH CHECK (bucket_id = 'products' AND (SELECT public.is_admin()));

CREATE POLICY "Admin Delete Products"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'products' AND (SELECT public.is_admin()));

-- 12. Covering indexes for foreign keys flagged by performance advisor
CREATE INDEX IF NOT EXISTS idx_coupons_product_id ON public.coupons (product_id);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON public.orders (coupon_id);

COMMIT;
