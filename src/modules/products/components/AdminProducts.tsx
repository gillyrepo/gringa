import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { STORE_SLUG } from '@/shared/config/store';
import { queryKeys } from '@/shared/lib/queryKeys';
import type { Product } from '@/modules/products/types';
import { useAdminProducts } from '@/modules/products/hooks/useProducts';
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/modules/products/services/productService';
import { CategorySelectionModal } from '@/modules/products/components/CategorySelectionModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Switch } from '@/shared/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
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
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card, CardContent } from '@/shared/components/ui/card';

interface AdminProductsProps {
  isMobile?: boolean;
}

export const AdminProducts = ({ isMobile = false }: AdminProductsProps) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState<
    Partial<Product> & { stockInput: string; priceInput: string; discountInput: string }
  >({
    name: '',
    description: '',
    price: 0,
    priceInput: '0',
    discount_percentage: 0,
    discountInput: '0',
    discount_expires_at: '',
    sku: '',
    stock: 0,
    stockInput: '0',
    category: '',
    image_url: '',
    image_url_2: '',
    image_url_3: '',
    active: true,
  });

  const { data: products, isLoading } = useAdminProducts();

  const availableCategories = useMemo(() => {
    if (!products) return [];
    const productCategories = new Set(products.map((p) => p.category));
    return Array.from(productCategories).sort();
  }, [products]);

  const invalidateProducts = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.productsAll });
  };

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      invalidateProducts();
      toast.success('Produto criado com sucesso');
      closeModal();
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar produto: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      updateProduct(id, data),
    onSuccess: () => {
      invalidateProducts();
      toast.success('Produto atualizado com sucesso');
      closeModal();
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar produto: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      invalidateProducts();
      toast.success('Produto excluído com sucesso');
      setProductToDelete(null);
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir produto: ' + error.message);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateProduct(id, { active }),
    onSuccess: () => {
      invalidateProducts();
      toast.success('Status atualizado');
    },
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      store: STORE_SLUG,
      description: '',
      price: 0,
      priceInput: '',
      discount_percentage: 0,
      discountInput: '',
      discount_expires_at: '',
      sku: '',
      stock: 0,
      stockInput: '',
      category: '',
      image_url: '',
      image_url_2: '',
      image_url_3: '',
      active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      store: product.store || STORE_SLUG,
      description: product.description || '',
      price: product.price,
      priceInput: product.price.toString(),
      discount_percentage: product.discount_percentage || 0,
      discountInput: (product.discount_percentage || 0).toString(),
      discount_expires_at: product.discount_expires_at
        ? new Date(product.discount_expires_at).toISOString().split('T')[0]
        : '',
      sku: product.sku || '',
      stock: product.stock,
      stockInput: product.stock.toString(),
      category: product.category,
      image_url: product.image_url,
      image_url_2: product.image_url_2 || '',
      image_url_3: product.image_url_3 || '',
      active: product.active,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.category || !formData.image_url) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const { priceInput: _p, stockInput: _s, discountInput: _d, ...payload } = formData;

    if (payload.sku === '') {
      payload.sku = null as unknown as string;
    }

    if (payload.discount_expires_at === '') {
      payload.discount_expires_at = null as unknown as string;
    } else if (payload.discount_expires_at) {
      payload.discount_expires_at = new Date(payload.discount_expires_at).toISOString();
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: payload });
    } else {
      createMutation.mutate(payload as Omit<Product, 'id' | 'created_at'>);
    }
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete);
    }
  };

  const filteredProducts = products?.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div>Carregando produtos...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou SKU..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={openCreateModal} className="gradient-gold text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <div className="rounded-md border">
        {isMobile ? (
          <div className="space-y-3 p-3 bg-muted/20">
            {filteredProducts?.map((product) => (
              <Card key={product.id} className="overflow-hidden bg-card text-card-foreground shadow-sm">
                <CardContent className="p-4">
                  <div className="flex gap-4 mb-4">
                    <div className="h-16 w-16 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <span className="font-semibold text-sm line-clamp-2">{product.name}</span>
                      {product.sku && (
                        <span className="text-xs text-muted-foreground mt-1">SKU: {product.sku}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t pt-3">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold">Categoria</span>
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold w-fit border-transparent bg-secondary text-secondary-foreground">
                          {product.category}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold">Estoque</span>
                        <span className="text-sm">{product.stock} un.</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 items-end text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold">Preço</span>
                        <span className="text-sm font-semibold text-green-600">
                          R$ {product.price.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => setProductToDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={product.active}
                          onCheckedChange={(checked) =>
                            toggleStatusMutation.mutate({ id: product.id, active: checked })
                          }
                          className="scale-75 origin-right"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openEditModal(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Imagem</TableHead>
                <TableHead>Nome / SKU</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{product.name}</span>
                      {product.sku && (
                        <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-secondary text-secondary-foreground">
                      {product.category}
                    </span>
                  </TableCell>
                  <TableCell>R$ {product.price.toFixed(2)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <Switch
                      checked={product.active}
                      onCheckedChange={(checked) =>
                        toggleStatusMutation.mutate({ id: product.id, active: checked })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setProductToDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Barra Milka Oreo 100g"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store">Loja *</Label>
                <Input
                  id="store"
                  value={formData.store}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU (Código)</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Ex: DOC-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <div
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-accent/50 items-center justify-between"
                  onClick={() => setIsCategoryModalOpen(true)}
                >
                  <span className={formData.category ? '' : 'text-muted-foreground'}>
                    {formData.category || 'Selecione uma categoria'}
                  </span>
                  <Pencil className="h-4 w-4 text-muted-foreground opacity-50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Estoque</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stockInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({
                      ...formData,
                      stockInput: value,
                      stock: value === '' ? 0 : parseInt(value, 10) || 0,
                    });
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.priceInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({
                      ...formData,
                      priceInput: value,
                      price: value === '' ? 0 : parseFloat(value) || 0,
                    });
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="finalPrice">Preço Final (Visualização)</Label>
                <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground items-center font-semibold">
                  R$ {((formData.price || 0) * (1 - (formData.discount_percentage || 0) / 100)).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount">Desconto (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({
                      ...formData,
                      discountInput: value,
                      discount_percentage: value === '' ? 0 : parseFloat(value) || 0,
                    });
                  }}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountExpiry">Validade do Desconto</Label>
                <Input
                  id="discountExpiry"
                  type="date"
                  value={
                    formData.discount_expires_at
                      ? new Date(formData.discount_expires_at).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) => setFormData({ ...formData, discount_expires_at: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              {(['image_url', 'image_url_2', 'image_url_3'] as const).map((field, index) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field}>
                    {index === 0 ? 'URL - Imagem Principal *' : `URL - Imagem ${index + 1}`}
                  </Label>
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <Input
                        id={field}
                        value={formData[field] || ''}
                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                        placeholder={`https://exemplo.com/imagem-${index + 1}.jpg`}
                        required={index === 0}
                      />
                    </div>
                    {formData[field] && (
                      <div className="h-16 w-16 rounded border bg-muted flex-shrink-0 overflow-hidden">
                        <img
                          src={formData[field]}
                          alt={`Preview ${index + 1}`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Cole o link direto da imagem (hospedada externamente ou no Storage).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes do produto..."
                className="h-24"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">Produto Ativo</Label>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CategorySelectionModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSelect={(category) => setFormData({ ...formData, category })}
        categories={availableCategories}
      />
    </div>
  );
};
