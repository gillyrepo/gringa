
import { useState, useMemo } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { FloatingCartButton } from '@/components/FloatingCartButton';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { useProducts } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { getLastOrder, repeatLastOrder } = useCart();
  const { data: products = [], isLoading, error } = useProducts();
  
  const lastOrder = getLastOrder();

  // Calcular categorias dinâmicas
  const categories = useMemo(() => {
    // Apenas categorias que realmente têm produtos
    const productCategories = new Set(products.map(p => p.category));
    
    // Converter para array e ordenar
    const allCategories = Array.from(productCategories).sort();
    
    return allCategories.map(cat => ({
      id: cat,
      label: cat
    }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesCategory = !selectedCategory || product.category === selectedCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const aOutOfStock = !a.active || a.stock <= 0;
        const bOutOfStock = !b.active || b.stock <= 0;

        if (aOutOfStock === bOutOfStock) return 0;
        return aOutOfStock ? 1 : -1;
      });
  }, [products, selectedCategory, searchQuery]);

  const handleRepeatOrder = async () => {
    const success = await repeatLastOrder(products);
    if (success) {
      toast.success('Último pedido adicionado ao carrinho!');
    } else {
      toast.error('Não foi possível repetir o pedido. Alguns itens podem estar indisponíveis.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <Header />
        <main className="container px-4 py-4">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-2 overflow-auto pb-2">
               {[...Array(5)].map((_, i) => (
                 <Skeleton key={i} className="h-8 w-24 flex-shrink-0 rounded-full" />
               ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-40 w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pb-32 flex flex-col items-center justify-center p-4">
        <p className="text-destructive mb-4">Erro ao carregar produtos</p>
        <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />
      
      <main className="container px-4 py-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        {/* Quick Actions */}
        {lastOrder && (
          <Button
            variant="outline"
            className="w-full mb-4 h-12 border-primary/30 hover:bg-primary/10"
            onClick={handleRepeatOrder}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Repetir último pedido
          </Button>
        )}

        {/* Categories */}
        <CategoryFilter
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          categories={categories}
        />

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhum produto encontrado
            </p>
          </div>
        )}
      </main>

      <FloatingCartButton />
      <BottomNav />
    </div>
  );
};

export default Index;
