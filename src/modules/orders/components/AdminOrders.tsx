import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/queryKeys';
import type { Order } from '@/modules/orders/types';
import { useAdminOrders } from '@/modules/orders/hooks/useOrders';
import {
  updateOrderStatus,
  updateOrderComment,
  deleteOrder,
  updateOrderExternalComment,
} from '@/modules/orders/services/orderService';
import { OrderDetailsModal } from '@/modules/orders/components/OrderDetailsModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';

interface AdminOrdersProps {
  isMobile?: boolean;
}

export function OrderStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary">Pendente</Badge>;
    case 'processing':
      return <Badge className="bg-blue-500 text-white">Andamento</Badge>;
    case 'sent':
      return <Badge className="bg-primary text-primary-foreground">Enviado</Badge>;
    case 'delivered':
      return <Badge className="bg-green-600 text-white">Entregue</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Cancelado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export const AdminOrders = ({ isMobile = false }: AdminOrdersProps) => {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const { data: orders, isLoading } = useAdminOrders();

  const invalidateOrders = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.ordersAdmin });
  };

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      invalidateOrders();
      toast.success('Status atualizado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ orderId, comment }: { orderId: string; comment: string }) =>
      updateOrderComment(orderId, comment),
    onSuccess: () => {
      invalidateOrders();
      toast.success('Comentário salvo com sucesso');
    },
    onError: () => {
      toast.error('Erro ao salvar comentário');
    },
  });

  const externalCommentMutation = useMutation({
    mutationFn: ({ orderId, comment }: { orderId: string; comment: string }) =>
      updateOrderExternalComment(orderId, comment),
    onSuccess: () => {
      invalidateOrders();
      toast.success('Comentário para cliente salvo com sucesso');
    },
    onError: () => {
      toast.error('Erro ao salvar comentário para cliente');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (orderId: string) => deleteOrder(orderId),
    onSuccess: () => {
      invalidateOrders();
      toast.success('Pedido excluído com sucesso');
      setOrderToDelete(null);
    },
    onError: () => {
      toast.error('Erro ao excluir pedido');
    },
  });

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <div>Carregando pedidos...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Gestão de Pedidos</h2>

      {isMobile ? (
        <div className="space-y-3">
          {orders?.map((order) => (
            <Card key={order.id} className="overflow-hidden bg-card text-card-foreground shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3 border-b pb-2">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-muted-foreground">
                      {order.orderNumber ? `#${order.orderNumber}` : order.id.slice(0, 8)}
                    </span>
                    <span className="font-semibold text-sm line-clamp-1">
                      {order.customerInfo.responsibleName}
                    </span>
                  </div>
                  <Select
                    defaultValue={order.status}
                    onValueChange={(value) => statusMutation.mutate({ orderId: order.id, status: value })}
                  >
                    <SelectTrigger className="w-[110px] h-7 text-xs">
                      <SelectValue><OrderStatusBadge status={order.status} /></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="processing">Andamento</SelectItem>
                      <SelectItem value="sent">Enviado</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Data</span>
                      <span className="text-sm">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Celular</span>
                      <span className="text-xs truncate max-w-[120px]" title={order.customerInfo.phone}>
                        {order.customerInfo.phone}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 items-end text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Total</span>
                      <span className="text-sm font-semibold text-green-600">
                        R$ {order.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => openOrderDetails(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => setOrderToDelete(order.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">
                    {order.orderNumber ? `#${order.orderNumber}` : order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{order.customerInfo.responsibleName}</span>
                      <span className="text-xs text-muted-foreground">{order.customerInfo.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>R$ {order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={order.status}
                      onValueChange={(value) =>
                        statusMutation.mutate({ orderId: order.id, status: value })
                      }
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue><OrderStatusBadge status={order.status} /></SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="processing">Andamento</SelectItem>
                        <SelectItem value="sent">Enviado</SelectItem>
                        <SelectItem value="delivered">Entregue</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openOrderDetails(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setOrderToDelete(order.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isAdmin={true}
        onSaveInternalComment={(orderId, comment) =>
          commentMutation.mutate({ orderId, comment })
        }
        onSaveExternalComment={(orderId, comment) =>
          externalCommentMutation.mutate({ orderId, comment })
        }
        isSaving={commentMutation.isPending || externalCommentMutation.isPending}
      />

      <AlertDialog
        open={!!orderToDelete}
        onOpenChange={(open) => !open && setOrderToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => orderToDelete && deleteMutation.mutate(orderToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
