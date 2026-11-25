-- Operational Rollback Script (Pre-Phase-1 Baseline)
-- Execute ONLY if an emergency rollback to the original permissive policies is required.

BEGIN;

-- store_settings
DROP POLICY IF EXISTS "store_settings_select_policy" ON public.store_settings;
DROP POLICY IF EXISTS "store_settings_insert_admin" ON public.store_settings;
DROP POLICY IF EXISTS "store_settings_update_admin" ON public.store_settings;
DROP POLICY IF EXISTS "store_settings_delete_admin" ON public.store_settings;
ALTER TABLE public.store_settings DISABLE ROW LEVEL SECURITY;

-- products
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
DROP POLICY IF EXISTS "products_update_admin" ON public.products;
DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
CREATE POLICY "all products" ON public.products FOR ALL TO public USING (true) WITH CHECK (true);

-- orders
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;
CREATE POLICY "all orders" ON public.orders FOR ALL TO public USING (true) WITH CHECK (true);

-- order_items
DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update_admin" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_admin" ON public.order_items;
CREATE POLICY "all order item" ON public.order_items FOR ALL TO public USING (true) WITH CHECK (true);

-- profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "all profiles" ON public.profiles FOR ALL TO public USING (true) WITH CHECK (true);

-- coupons
DROP POLICY IF EXISTS "coupons_select_policy" ON public.coupons;
DROP POLICY IF EXISTS "coupons_insert_admin" ON public.coupons;
DROP POLICY IF EXISTS "coupons_update_admin" ON public.coupons;
DROP POLICY IF EXISTS "coupons_delete_admin" ON public.coupons;
CREATE POLICY "Admin full access coupons" ON public.coupons FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow public read active coupons" ON public.coupons FOR SELECT TO public USING (active = true);

-- shipping_rates
DROP POLICY IF EXISTS "shipping_rates_select_policy" ON public.shipping_rates;
DROP POLICY IF EXISTS "shipping_rates_insert_admin" ON public.shipping_rates;
DROP POLICY IF EXISTS "shipping_rates_update_admin" ON public.shipping_rates;
DROP POLICY IF EXISTS "shipping_rates_delete_admin" ON public.shipping_rates;
CREATE POLICY "Admin pode gerenciar taxas de frete" ON public.shipping_rates FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow public read access" ON public.shipping_rates FOR SELECT TO public USING (true);

COMMIT;
