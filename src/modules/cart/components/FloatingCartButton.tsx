import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/modules/cart/context/CartContext';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

export function FloatingCartButton() {
  const { getItemCount, getTotal } = useCart();
  const itemCount = getItemCount();
  const total = getTotal();

  if (itemCount === 0) return null;

  return (
    <Link to="/carrinho" className="fixed bottom-20 left-4 right-4 z-40">
      <Button
        className={cn(
          'w-full h-14 gradient-gold text-primary-foreground shadow-gold',
          'flex items-center justify-between px-6 rounded-2xl',
          'animate-in slide-in-from-bottom-4 duration-300'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-background text-xs font-bold text-foreground flex items-center justify-center">
              {itemCount}
            </span>
          </div>
          <span className="font-semibold">Ver Carrinho</span>
        </div>
        <span className="font-bold text-lg">R$ {total.toFixed(2)}</span>
      </Button>
    </Link>
  );
}
