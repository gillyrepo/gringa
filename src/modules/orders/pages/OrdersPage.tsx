import { useState } from 'react';
import { ClipboardList, Calendar, Package, Eye } from 'lucide-react';
import { useCart } from '@/modules/cart/context/CartContext';
import type { Order } from '@/modules/orders/types';
import { useCustomerOrders } from '@/modules/orders/hooks/useOrders';
import { OrderDetailsModal } from '@/modules/orders/components/OrderDetailsModal';
import { OrderStatusBadge } from '@/modules/orders/components/AdminOrders';
import { Header } from '@/shared/components/layout/Header';
import { BottomNav } from '@/shared/components/layout/BottomNav';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const OrdersPage = () => {
  const { orders: localOrders, syncLocalOrders } = useCart();
  const syncedOrders = useCustomerOrders(localOrders, syncLocalOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="container px-4 py-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">Meus Pedidos</h1>

        {syncedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Nenhum pedido ainda</h2>
            <p className="text-muted-foreground text-center">
              Seus pedidos aparecerão aqui após confirmar a compra
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {syncedOrders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs text-muted-foreground font-mono">
                      Pedido #{order.orderNumber ? order.orderNumber : order.id.slice(0, 8)}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-primary"
                      onClick={() => openOrderDetails(order)}
                      aria-label="Ver detalhes do pedido"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={item.product.id} className="flex items-center gap-2 text-sm">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      <span className="text-foreground">
                        {item.quantity}x {item.product.name}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      + {order.items.length - 3} outros itens
                    </span>
                  )}
                </div>

                <div className="border-t border-border pt-3 flex justify-end items-center">
                  <span className="font-bold text-primary">R$ {order.total.toFixed(2)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isAdmin={false}
      />

      <BottomNav />
    </div>
  );
};

export default OrdersPage;
