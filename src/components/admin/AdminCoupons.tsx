import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Coupon, Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Edit2, Plus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function AdminCoupons({ isMobile = false }: { isMobile?: boolean }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon>>({
    code: '',
    discount_percentage: 0,
    discount_type: 'total_with_shipping',
    usage_limit: 1,
    active: true,
  });

  useEffect(() => {
    fetchCoupons();
    fetchProducts();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCoupons(data as Coupon[]);
    } catch (error) {
      toast.error('Erro ao buscar cupons');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('id, name');
    if (data) setProducts(data as Product[]);
  };

  const handleSave = async () => {
    if (!editingCoupon.code || !editingCoupon.discount_percentage || !editingCoupon.usage_limit) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      if (editingCoupon.id) {
        // Update
        const { error } = await supabase
          .from('coupons')
          .update({
            code: editingCoupon.code.toUpperCase(),
            discount_percentage: editingCoupon.discount_percentage,
            discount_type: editingCoupon.discount_type,
            product_id: editingCoupon.discount_type === 'specific_product' ? editingCoupon.product_id : null,
            usage_limit: editingCoupon.usage_limit,
            active: editingCoupon.active,
          })
          .eq('id', editingCoupon.id);
        if (error) throw error;
        toast.success('Cupom atualizado');
      } else {
        // Create
        const { error } = await supabase.from('coupons').insert({
          code: editingCoupon.code.toUpperCase(),
          discount_percentage: editingCoupon.discount_percentage,
          discount_type: editingCoupon.discount_type,
          product_id: editingCoupon.discount_type === 'specific_product' ? editingCoupon.product_id : null,
          usage_limit: editingCoupon.usage_limit,
          active: editingCoupon.active,
        });
        if (error) {
          if (error.code === '23505') throw new Error('Código já existe');
          throw error;
        }
        toast.success('Cupom criado');
      }
      setIsModalOpen(false);
      fetchCoupons();
    } catch (error: any) {
      toast.error('Erro ao salvar cupom: ' + error.message);
    }
  };

  const toggleStatus = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ active: !coupon.active })
        .eq('id', coupon.id);
      if (error) throw error;
      toast.success(coupon.active ? 'Cupom desativado' : 'Cupom ativado');
      fetchCoupons();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  if (loading) return <div>Carregando cupons...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Gerenciar Cupons</h2>
        <Button onClick={() => {
          setEditingCoupon({
            code: '',
            discount_percentage: 0,
            discount_type: 'total_with_shipping',
            usage_limit: 1,
            active: true,
          });
          setIsModalOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" /> Novo Cupom
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="border p-4 rounded-lg bg-card shadow-sm space-y-3 relative">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-bold text-lg text-primary">{coupon.code}</span>
                <span className={`ml-2 text-[10px] px-2 py-1 rounded-full ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {coupon.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => {
                setEditingCoupon(coupon);
                setIsModalOpen(true);
              }}>
                <Edit2 className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Desconto:</strong> {coupon.discount_percentage}%</p>
              <p><strong>Tipo:</strong> {
                coupon.discount_type === 'total_with_shipping' ? 'Total (com frete)' :
                coupon.discount_type === 'total_without_shipping' ? 'Total (sem frete)' :
                'Produto Específico'
              }</p>
              <p>
                <strong>Uso:</strong> {coupon.usage_count} / {coupon.usage_limit} 
                {coupon.usage_count >= coupon.usage_limit && <span className="text-red-500 ml-2 font-bold">(Esgotado)</span>}
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t">
              <Switch checked={coupon.active} onCheckedChange={() => toggleStatus(coupon)} />
              <Label>Ativo</Label>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-background overflow-y-auto max-h-screen">
          <DialogHeader>
            <DialogTitle>{editingCoupon.id ? 'Editar Cupom' : 'Novo Cupom'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Código</Label>
              <Input 
                value={editingCoupon.code} 
                onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })} 
                placeholder="Ex: PROMO10" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Desconto (%)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  max="100" 
                  value={editingCoupon.discount_percentage} 
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, discount_percentage: Number(e.target.value) })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Limite de Uso</Label>
                <Input 
                  type="number" 
                  min="1" 
                  value={editingCoupon.usage_limit} 
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, usage_limit: Number(e.target.value) })} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Desconto</Label>
              <Select 
                value={editingCoupon.discount_type} 
                onValueChange={(val: any) => setEditingCoupon({ ...editingCoupon, discount_type: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total_with_shipping">Total (com frete)</SelectItem>
                  <SelectItem value="total_without_shipping">Total (sem frete)</SelectItem>
                  <SelectItem value="specific_product">Produto Específico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editingCoupon.discount_type === 'specific_product' && (
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select 
                  value={editingCoupon.product_id || ''} 
                  onValueChange={(val) => setEditingCoupon({ ...editingCoupon, product_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
