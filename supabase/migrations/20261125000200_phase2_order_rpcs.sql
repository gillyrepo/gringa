-- Phase 2 (Expand): Transactional Server-Side Order Creation & Safe Customer Order Lookup RPCs
-- Stock remains 100% manual per business rule (no automatic decrement on products.stock).

BEGIN;

CREATE OR REPLACE FUNCTION public.create_public_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text DEFAULT '',
  p_complement text DEFAULT NULL,
  p_customer_email text DEFAULT NULL,
  p_order_notes text DEFAULT NULL,
  p_whatsapp_message text DEFAULT '',
  p_delivery_method text DEFAULT 'delivery',
  p_shipping_rate_id uuid DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_payment_label text DEFAULT NULL,
  p_change_amount numeric DEFAULT NULL,
  p_coupon_code text DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_shipping_city text := NULL;
  v_shipping_neighborhood text := NULL;
  v_shipping_cost numeric := 0;
  v_subtotal numeric := 0;
  v_products_discount numeric := 0;
  v_coupon record;
  v_coupon_id uuid := NULL;
  v_coupon_code text := NULL;
  v_coupon_discount numeric := 0;
  v_specific_subtotal numeric := 0;
  v_total numeric := 0;
  v_total_discount numeric := 0;
  v_order_id uuid;
  v_order_number integer;
  v_created_at timestamptz;
  v_item jsonb;
  v_product record;
  v_qty integer;
  v_has_discount boolean;
  v_disc_pct numeric;
  v_unit_price numeric;
BEGIN
  IF trim(coalesce(p_customer_name, '')) = '' OR trim(coalesce(p_customer_phone, '')) = '' THEN
    RAISE EXCEPTION 'Nome e telefone do cliente são obrigatórios.';
  END IF;

  IF p_delivery_method NOT IN ('delivery', 'pickup') THEN
    RAISE EXCEPTION 'Método de entrega inválido.';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 100 THEN
    RAISE EXCEPTION 'Lista de itens do pedido inválida.';
  END IF;

  IF p_delivery_method = 'delivery' THEN
    IF p_shipping_rate_id IS NULL THEN
      RAISE EXCEPTION 'Selecione um bairro para entrega.';
    END IF;

    SELECT city, neighborhood, price
      INTO v_shipping_city, v_shipping_neighborhood, v_shipping_cost
      FROM public.shipping_rates
     WHERE id = p_shipping_rate_id
       AND store = 'docimdagringa';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Taxa de entrega não encontrada.';
    END IF;
  END IF;

  -- First pass: validate products & compute server-authoritative subtotal and item discounts
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := COALESCE((v_item->>'quantity')::integer, 0);
    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantidade de item inválida.';
    END IF;

    SELECT id, price, discount_percentage, discount_expires_at
      INTO v_product
      FROM public.products
     WHERE id = (v_item->>'product_id')::uuid
       AND store = 'docimdagringa';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Um dos produtos do carrinho não existe mais.';
    END IF;

    v_has_discount := COALESCE(v_product.discount_percentage, 0) > 0
      AND (v_product.discount_expires_at IS NULL OR v_product.discount_expires_at > NOW());
    v_disc_pct := CASE WHEN v_has_discount THEN v_product.discount_percentage ELSE 0 END;
    v_unit_price := CASE WHEN v_has_discount THEN v_product.price * (1 - (v_disc_pct / 100.0)) ELSE v_product.price END;

    v_subtotal := v_subtotal + (v_unit_price * v_qty);
    v_products_discount := v_products_discount + ((v_product.price - v_unit_price) * v_qty);
  END LOOP;

  -- Coupon validation & atomic usage increment
  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN
    SELECT *
      INTO v_coupon
      FROM public.coupons
     WHERE code = upper(trim(p_coupon_code))
       AND store = 'docimdagringa'
       AND active = true
     FOR UPDATE;

    IF FOUND AND v_coupon.usage_count < v_coupon.usage_limit THEN
      IF v_coupon.discount_type = 'total_with_shipping' THEN
        v_coupon_discount := (v_subtotal + v_shipping_cost) * (v_coupon.discount_percentage / 100.0);
      ELSIF v_coupon.discount_type = 'total_without_shipping' THEN
        v_coupon_discount := v_subtotal * (v_coupon.discount_percentage / 100.0);
      ELSIF v_coupon.discount_type = 'specific_product' AND v_coupon.product_id IS NOT NULL THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
          IF ((v_item->>'product_id')::uuid = v_coupon.product_id) THEN
            v_qty := (v_item->>'quantity')::integer;
            SELECT price, discount_percentage, discount_expires_at
              INTO v_product
              FROM public.products
             WHERE id = v_coupon.product_id
               AND store = 'docimdagringa';

            v_has_discount := COALESCE(v_product.discount_percentage, 0) > 0
              AND (v_product.discount_expires_at IS NULL OR v_product.discount_expires_at > NOW());
            v_disc_pct := CASE WHEN v_has_discount THEN v_product.discount_percentage ELSE 0 END;
            v_unit_price := CASE WHEN v_has_discount THEN v_product.price * (1 - (v_disc_pct / 100.0)) ELSE v_product.price END;
            v_specific_subtotal := v_specific_subtotal + (v_unit_price * v_qty);
          END IF;
        END LOOP;
        v_coupon_discount := v_specific_subtotal * (v_coupon.discount_percentage / 100.0);
      END IF;

      IF v_coupon_discount > 0 THEN
        v_coupon_id := v_coupon.id;
        v_coupon_code := v_coupon.code;
        UPDATE public.coupons
           SET usage_count = usage_count + 1
         WHERE id = v_coupon.id;
      END IF;
    END IF;
  END IF;

  v_total := GREATEST(0, ROUND(v_subtotal + v_shipping_cost - v_coupon_discount, 2));
  v_total_discount := ROUND(v_products_discount + v_coupon_discount, 2);

  INSERT INTO public.orders (
    customer_name,
    customer_phone,
    customer_address,
    complement,
    customer_email,
    order_notes,
    total_amount,
    total_discount,
    status,
    whatsapp_message,
    shipping_city,
    shipping_neighborhood,
    shipping_cost,
    delivery_method,
    payment_method,
    payment_label,
    change_amount,
    coupon_id,
    coupon_code,
    store
  ) VALUES (
    trim(p_customer_name),
    trim(p_customer_phone),
    COALESCE(trim(p_customer_address), ''),
    NULLIF(trim(coalesce(p_complement, '')), ''),
    NULLIF(trim(coalesce(p_customer_email, '')), ''),
    NULLIF(trim(coalesce(p_order_notes, '')), ''),
    v_total,
    v_total_discount,
    'pending',
    COALESCE(p_whatsapp_message, ''),
    v_shipping_city,
    v_shipping_neighborhood,
    v_shipping_cost,
    p_delivery_method,
    p_payment_method,
    p_payment_label,
    p_change_amount,
    v_coupon_id,
    v_coupon_code,
    'docimdagringa'
  )
  RETURNING id, order_number, created_at
  INTO v_order_id, v_order_number, v_created_at;

  -- Second pass: insert order_items atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::integer;
    SELECT id, price, discount_percentage, discount_expires_at
      INTO v_product
      FROM public.products
     WHERE id = (v_item->>'product_id')::uuid
       AND store = 'docimdagringa';

    v_has_discount := COALESCE(v_product.discount_percentage, 0) > 0
      AND (v_product.discount_expires_at IS NULL OR v_product.discount_expires_at > NOW());
    v_disc_pct := CASE WHEN v_has_discount THEN v_product.discount_percentage ELSE 0 END;
    v_unit_price := CASE WHEN v_has_discount THEN v_product.price * (1 - (v_disc_pct / 100.0)) ELSE v_product.price END;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      quantity,
      unit_price,
      subtotal,
      order_total_amount,
      discount_percentage,
      store
    ) VALUES (
      v_order_id,
      v_product.id,
      v_qty,
      ROUND(v_unit_price, 2),
      ROUND(v_unit_price * v_qty, 2),
      v_total,
      v_disc_pct,
      'docimdagringa'
    );
  END LOOP;

  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'created_at', v_created_at,
    'total_amount', v_total,
    'total_discount', v_total_discount,
    'shipping_cost', v_shipping_cost,
    'status', 'pending'
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.create_public_order(text, text, text, text, text, text, text, text, uuid, text, text, numeric, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_order(text, text, text, text, text, text, text, text, uuid, text, text, numeric, text, jsonb) TO anon, authenticated;

-- Customer order lookup by known UUIDs only (omits internal_comments and whatsapp_message; safe even if product is later marked active=false)
CREATE OR REPLACE FUNCTION public.get_customer_orders_by_ids(p_order_ids uuid[])
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  WITH bounded_ids AS (
    SELECT DISTINCT id
    FROM unnest(COALESCE(p_order_ids, ARRAY[]::uuid[])) AS id
    LIMIT 50
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'order_number', o.order_number,
        'status', o.status,
        'total_amount', o.total_amount,
        'total_discount', o.total_discount,
        'coupon_code', o.coupon_code,
        'delivery_method', o.delivery_method,
        'shipping_city', o.shipping_city,
        'shipping_neighborhood', o.shipping_neighborhood,
        'shipping_cost', o.shipping_cost,
        'payment_method', o.payment_method,
        'payment_label', o.payment_label,
        'change_amount', o.change_amount,
        'customer_name', o.customer_name,
        'customer_phone', o.customer_phone,
        'customer_email', o.customer_email,
        'customer_address', o.customer_address,
        'complement', o.complement,
        'order_notes', o.order_notes,
        'external_comments', o.external_comments,
        'created_at', o.created_at,
        'order_items', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', oi.id,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'subtotal', oi.subtotal,
              'discount_percentage', oi.discount_percentage,
              'products', CASE
                WHEN p.id IS NOT NULL THEN jsonb_build_object(
                  'id', p.id,
                  'name', p.name,
                  'category', p.category,
                  'price', p.price,
                  'image_url', COALESCE(p.image_url, ''),
                  'active', p.active,
                  'stock', p.stock,
                  'discount_percentage', p.discount_percentage,
                  'discount_expires_at', p.discount_expires_at
                )
                ELSE jsonb_build_object(
                  'id', COALESCE(oi.product_id, '00000000-0000-0000-0000-000000000000'::uuid),
                  'name', 'Produto indisponível',
                  'category', '',
                  'price', oi.unit_price,
                  'image_url', '',
                  'active', false,
                  'stock', 0
                )
              END
            )
          )
          FROM public.order_items oi
          LEFT JOIN public.products p ON p.id = oi.product_id
          WHERE oi.order_id = o.id
        ), '[]'::jsonb)
      )
      ORDER BY o.created_at DESC
    ),
    '[]'::jsonb
  )
  FROM public.orders o
  JOIN bounded_ids b ON b.id = o.id
  WHERE o.store = 'docimdagringa';
$function$;

REVOKE ALL ON FUNCTION public.get_customer_orders_by_ids(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_customer_orders_by_ids(uuid[]) TO anon, authenticated;

COMMIT;
