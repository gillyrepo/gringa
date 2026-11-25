import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/shared/components/ui/tooltip';
import { Toaster as Sonner } from '@/shared/components/ui/sonner';
import { CartProvider } from '@/modules/cart/context/CartContext';
import { AppRouter } from '@/app/router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Sonner position="top-center" />
        <AppRouter />
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
