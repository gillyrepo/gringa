import { useState, useEffect } from 'react';
import { Package, Settings, ShoppingBag, Truck, ChevronRight, Ticket } from 'lucide-react';
import { STORAGE_KEYS } from '@/shared/config/store';
import { useAdminAuth } from '@/modules/admin/hooks/useAdminAuth';
import { AdminLoginForm } from '@/modules/admin/components/AdminLoginForm';
import { AdminOrders } from '@/modules/orders/components/AdminOrders';
import { AdminProducts } from '@/modules/products/components/AdminProducts';
import { ShippingRatesManager } from '@/modules/shipping/components/ShippingRatesManager';
import { AdminCoupons } from '@/modules/coupons/components/AdminCoupons';
import { AdminSettings } from '@/modules/store-settings/components/AdminSettings';
import { Header } from '@/shared/components/layout/Header';
import { BottomNav } from '@/shared/components/layout/BottomNav';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';

type AdminSection = 'orders' | 'products' | 'shipping' | 'coupons' | 'settings';

const ADMIN_SECTIONS: {
  id: AdminSection;
  title: string;
  subtitle: string;
  icon: typeof ShoppingBag;
}[] = [
  { id: 'orders', title: 'Pedidos', subtitle: 'Gerenciar pedidos recebidos', icon: ShoppingBag },
  { id: 'products', title: 'Produtos', subtitle: 'Catálogo e estoque', icon: Package },
  { id: 'shipping', title: 'Ajuste de Frete', subtitle: 'Taxas e locais de entrega', icon: Truck },
  { id: 'coupons', title: 'Cupons', subtitle: 'Gerenciar descontos', icon: Ticket },
  { id: 'settings', title: 'Configurações', subtitle: 'Horários e preferências', icon: Settings },
];

const AdminPage = () => {
  const { isAuthenticated, loading, signIn, signOut } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<AdminSection>(() => {
    return (localStorage.getItem(STORAGE_KEYS.adminTab) as AdminSection) || 'orders';
  });

  const [activeMobileSection, setActiveMobileSection] = useState<AdminSection | null>(() => {
    return (localStorage.getItem(STORAGE_KEYS.adminMobileSection) as AdminSection) || null;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.adminTab, activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (activeMobileSection) {
      localStorage.setItem(STORAGE_KEYS.adminMobileSection, activeMobileSection);
    } else {
      localStorage.removeItem(STORAGE_KEYS.adminMobileSection);
    }
  }, [activeMobileSection]);

  const renderSection = (section: AdminSection | null, isMobile = false) => {
    switch (section) {
      case 'orders':
        return <AdminOrders isMobile={isMobile} />;
      case 'products':
        return <AdminProducts isMobile={isMobile} />;
      case 'shipping':
        return <ShippingRatesManager isOpen={true} onClose={() => {}} />;
      case 'coupons':
        return <AdminCoupons isMobile={isMobile} />;
      case 'settings':
        return <AdminSettings />;
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <main className="container px-4 py-4">
          <AdminLoginForm loading={loading} onLogin={signIn} />
        </main>
        <BottomNav />
      </div>
    );
  }

  const mobileTitle =
    ADMIN_SECTIONS.find((s) => s.id === activeMobileSection)?.title || '';

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="container px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sair
          </Button>
        </div>

        <div className="hidden md:block">
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {ADMIN_SECTIONS.map((section) => (
              <Button
                key={section.id}
                variant={activeTab === section.id ? 'default' : 'outline'}
                onClick={() => setActiveTab(section.id)}
              >
                {section.title}
              </Button>
            ))}
          </div>
          {renderSection(activeTab, false)}
        </div>

        <div className="md:hidden space-y-3">
          {ADMIN_SECTIONS.map(({ id, title, subtitle, icon: Icon }) => (
            <Card
              key={id}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent/50 active:bg-accent transition-colors"
              onClick={() => setActiveMobileSection(id)}
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Card>
          ))}
        </div>

        <Dialog
          open={!!activeMobileSection}
          onOpenChange={(open) => !open && setActiveMobileSection(null)}
        >
          <DialogContent className="w-screen h-screen max-w-full m-0 rounded-none border-0 flex flex-col p-0 bg-background overflow-hidden">
            <DialogHeader className="px-4 py-4 border-b shrink-0 flex flex-row items-center justify-between space-y-0">
              <DialogTitle className="text-lg font-bold">{mobileTitle}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-4">
              {renderSection(activeMobileSection, true)}
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <BottomNav />
    </div>
  );
};

export default AdminPage;
