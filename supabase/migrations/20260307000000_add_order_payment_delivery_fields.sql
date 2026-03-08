ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_method text,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS payment_label text,
ADD COLUMN IF NOT EXISTS change_amount numeric(10,2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_delivery_method_check'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_delivery_method_check
    CHECK (delivery_method IN ('delivery', 'pickup') OR delivery_method IS NULL);
  END IF;
END $$;
