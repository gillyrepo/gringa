
import { useState, useEffect } from 'react';
import { Lock, Package, Settings, ShoppingBag, Eye, EyeOff, Truck, ChevronRight, Ticket } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { AdminOrders } from '@/components/AdminOrders';
import { AdminProducts } from '@/components/AdminProducts';
import { ShippingRatesManager } from '@/components/ShippingRatesManager';
import { AdminSettings } from '@/components/AdminSettings';
import { AdminCoupons } from '@/components/admin/AdminCoupons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Desktop Tab State
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'shipping' | 'coupons' | 'settings'>('orders');

  // Mobile Modal State
  const [activeMobileSection, setActiveMobileSection] = useState<'orders' | 'products' | 'shipping' | 'coupons' | 'settings' | null>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error('Erro ao fazer login: ' + error.message);
    } else {
      setIsAuthenticated(true);
      toast.success('Login realizado com sucesso!');
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />

        <main className="container px-4 py-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Lock className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Área Administrativa
            </h1>
            <p className="text-muted-foreground text-center mb-8">
              Acesso restrito para administradores
            </p>

            <Card className="w-full max-w-sm p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@exemplo.com"
                    className="bg-background"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Senha
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Sua senha"
                      className="bg-background pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full gradient-gold text-primary-foreground"
                  disabled={loading}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </Card>
          </div>
        </main>

        <BottomNav />
      </div>
    );
  }

  const renderMobileModalContent = () => {
    switch (activeMobileSection) {
      case 'orders':
        return <AdminOrders isMobile={true} />;
      case 'products':
        return <AdminProducts isMobile={true} />;
      case 'shipping':
        return <ShippingRatesManager isOpen={true} onClose={() => { }} />;
      case 'coupons':
        return <AdminCoupons isMobile={true} />;
      case 'settings':
        return <AdminSettings />;
      default:
        return null;
    }
  };

  const getMobileModalTitle = () => {
    switch (activeMobileSection) {
      case 'orders': return 'Pedidos';
      case 'products': return 'Produtos';
      case 'shipping': return 'Ajuste de Frete';
      case 'coupons': return 'Cupons';
      case 'settings': return 'Configurações';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="container px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              setIsAuthenticated(false);
            }}
          >
            Sair
          </Button>
        </div>

        {/* Desktop Tabs Layout (Hidden on Mobile) */}
        <div className="hidden md:block">
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <Button
              variant={activeTab === 'orders' ? 'default' : 'outline'}
              onClick={() => setActiveTab('orders')}
            >
              Pedidos
            </Button>
            <Button
              variant={activeTab === 'products' ? 'default' : 'outline'}
              onClick={() => setActiveTab('products')}
            >
              Produtos
            </Button>
            <Button
              variant={activeTab === 'shipping' ? 'default' : 'outline'}
              onClick={() => setActiveTab('shipping')}
            >
              Ajuste de Frete
            </Button>
            <Button
              variant={activeTab === 'coupons' ? 'default' : 'outline'}
              onClick={() => setActiveTab('coupons')}
            >
              Cupons
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'default' : 'outline'}
              onClick={() => setActiveTab('settings')}
            >
              Configurações
            </Button>
          </div>

          {activeTab === 'orders' && <AdminOrders />}
          {activeTab === 'products' && <AdminProducts />}
          {activeTab === 'shipping' && (
            <ShippingRatesManager isOpen={true} onClose={() => { }} />
          )}
          {activeTab === 'coupons' && <AdminCoupons />}
          {activeTab === 'settings' && <AdminSettings />}
        </div>

        {/* Mobile List Layout (Hidden on Desktop) */}
        <div className="md:hidden space-y-3">
          <Card
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent/50 active:bg-accent transition-colors"
            onClick={() => setActiveMobileSection('orders')}
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Pedidos</h3>
                <p className="text-xs text-muted-foreground">Gerenciar pedidos recebidos</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Card>

          <Card
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent/50 active:bg-accent transition-colors"
            onClick={() => setActiveMobileSection('products')}
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Produtos</h3>
                <p className="text-xs text-muted-foreground">Catálogo e estoque</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Card>

          <Card
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent/50 active:bg-accent transition-colors"
            onClick={() => setActiveMobileSection('shipping')}
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Ajuste de Frete</h3>
                <p className="text-xs text-muted-foreground">Taxas e locais de entrega</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Card>

          <Card
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent/50 active:bg-accent transition-colors"
            onClick={() => setActiveMobileSection('coupons')}
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Ticket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Cupons</h3>
                <p className="text-xs text-muted-foreground">Gerenciar descontos</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Card>

          <Card
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent/50 active:bg-accent transition-colors"
            onClick={() => setActiveMobileSection('settings')}
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Configurações</h3>
                <p className="text-xs text-muted-foreground">Horários e preferências</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Card>
        </div>

        {/* Mobile Full Screen Modal */}
        <Dialog
          open={!!activeMobileSection}
          onOpenChange={(open) => !open && setActiveMobileSection(null)}
        >
          <DialogContent className="w-screen h-screen max-w-full m-0 rounded-none border-0 flex flex-col p-0 bg-background overflow-hidden">
            <DialogHeader className="px-4 py-4 border-b shrink-0 flex flex-row items-center justify-between space-y-0">
              <DialogTitle className="text-lg font-bold">
                {getMobileModalTitle()}
              </DialogTitle>
              {/* Close button is automatically added by DialogContent, but we can style header better */}
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-4">
              {renderMobileModalContent()}
            </div>
          </DialogContent>
        </Dialog>

      </main>

      <BottomNav />
    </div>
  );
};

export default AdminPage;
