import { Plus, Minus, Trash2 } from 'lucide-react';
import type { CartItem as CartItemType } from '@/modules/cart/types';
import { useCart } from '@/modules/cart/context/CartContext';
import {
  getEffectiveProductPrice,
  isProductDiscountActive,
} from '@/modules/products/utils/pricing';
import { Button } from '@/shared/components/ui/button';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const { product, quantity } = item;

  const hasDiscount = isProductDiscountActive(product);
  const price = getEffectiveProductPrice(product);
  const subtotal = price * quantity;

  return (
    <div className="flex gap-3 p-3 bg-card rounded-xl border border-border">
      <img
        src={product.image_url}
        alt={product.name}
        loading="lazy"
        decoding="async"
        className="h-20 w-20 rounded-lg object-cover bg-muted"
      />

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-foreground line-clamp-2">
          {product.name}
        </h3>

        <div className="flex flex-col mt-1">
          {hasDiscount ? (
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground line-through">
                R$ {product.price.toFixed(2)}
              </p>
              <p className="text-xs font-semibold text-green-600">
                R$ {price.toFixed(2)} cada
              </p>
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                -{product.discount_percentage}%
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              R$ {product.price.toFixed(2)} cada
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md hover:bg-muted"
              onClick={() => updateQuantity(product.id, quantity - 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-bold w-5 text-center">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md hover:bg-muted"
              onClick={() => updateQuantity(product.id, quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">
              R$ {subtotal.toFixed(2)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:bg-destructive/10"
              onClick={() => removeItem(product.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
