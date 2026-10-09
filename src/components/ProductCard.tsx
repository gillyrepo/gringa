
import { useState } from 'react';
import { Plus, Minus, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/types/product';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const cartItem = items.find((item) => item.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  // Filtrar imagens válidas
  const images = [
    product.image_url,
    product.image_url_2,
    product.image_url_3
  ].filter((url): url is string => !!url);

  // Calculate discount
  const hasDiscount = !!(product.discount_percentage && product.discount_percentage > 0 && (!product.discount_expires_at || new Date(product.discount_expires_at) > new Date()));
  const discountedPrice = hasDiscount ? product.price * (1 - (product.discount_percentage! / 100)) : product.price;

  const isOutOfStock = !product.active || product.stock <= 0;

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleAdd = () => {
    if (isOutOfStock) {
      toast.error('Produto fora de estoque');
      return;
    }
    addItem(product);
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  const handleIncrease = () => {
    if (quantity >= product.stock) {
      toast.error('Quantidade máxima em estoque');
      return;
    }
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrease = () => {
    if (quantity <= 1) {
      removeItem(product.id);
      toast.info(`${product.name} removido do carrinho`);
    } else {
      updateQuantity(product.id, quantity - 1);
    }
  };

  return (
    <>
      <Card className={cn(
        'group overflow-hidden transition-all duration-300 h-full flex flex-col',
        'hover:shadow-gold hover:border-primary/30',
        isOutOfStock && 'opacity-60'
      )}>
        <div
          className="relative aspect-square overflow-hidden bg-muted cursor-pointer"
          onClick={() => setIsImageModalOpen(true)}
        >
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <span className="text-sm font-semibold text-destructive">
                Fora de Estoque
              </span>
            </div>
          )}
          {hasDiscount && (
            <>
              <div className="absolute top-2 left-2">
                <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full shadow-md">
                  -{product.discount_percentage}%
                </span>
              </div>
              {product.discount_expires_at && (
                <div className="absolute top-2 right-2">
                  <span className="bg-background/90 text-destructive text-[10px] font-semibold px-2 py-1 rounded-full shadow-sm border border-destructive/20">
                    Válido até: {new Date(product.discount_expires_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-3 flex flex-col flex-1">
          <div className="space-y-2 mb-2">
            <div>
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight mb-1">
                  {product.name}
                </h3>
              </div>
              {product.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5em]">
                  {product.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-auto pt-2">
            <div className="flex flex-col">
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through decoration-destructive/60">
                  R$ {product.price.toFixed(2)}
                </span>
              )}
              <span className={cn("text-lg font-bold text-primary whitespace-nowrap", hasDiscount && "text-green-600")}>
                R$ {discountedPrice.toFixed(2)}
              </span>
            </div>

            {quantity > 0 ? (
              <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 ml-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md hover:bg-muted"
                  onClick={handleDecrease}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-bold w-5 text-center">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md hover:bg-muted"
                  onClick={handleIncrease}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 rounded-md h-8 px-3 gap-1 gradient-gold text-primary-foreground shadow-gold flex-shrink-0"
                onClick={handleAdd}
                disabled={isOutOfStock}
              >
                <ShoppingCart className="h-3 w-3" />
                <span className="text-xs hidden xs:inline">Adicionar</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">{product.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted relative group">
              <img
                src={images[currentImageIndex]}
                alt={`${product.name} - Imagem ${currentImageIndex + 1}`}
                className="h-full w-full object-contain"
              />

              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 shadow-md h-8 w-8 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 shadow-md h-8 w-8 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 bg-background/50 px-2 py-1 rounded-full">
                    {images.map((_, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full transition-all",
                          idx === currentImageIndex ? "bg-primary w-3" : "bg-muted-foreground/50"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-primary">
                  R$ {product.price.toFixed(2)}
                </span>
                {product.sku && (
                  <span className="text-sm text-muted-foreground">
                    SKU: {product.sku}
                  </span>
                )}
              </div>
              {product.description && (
                <div className="bg-muted/30 p-3 rounded-md">
                  <h4 className="text-sm font-semibold mb-1">Descrição</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
            <div className="pt-2">
              {quantity > 0 ? (
                <div className="flex justify-center items-center gap-4 bg-secondary/50 rounded-xl p-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={handleDecrease}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-xl font-bold w-8 text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={handleIncrease}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full h-12 text-lg gradient-gold text-primary-foreground shadow-gold"
                  onClick={() => {
                    handleAdd();
                    setIsImageModalOpen(false);
                  }}
                  disabled={!product.active}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Adicionar ao Carrinho
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
