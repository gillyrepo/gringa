import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { Coupon } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Ticket, X, ArrowRight } from 'lucide-react';

export function CouponInput() {
  const { appliedCoupon, setAppliedCoupon, items } = useCart();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const applyCoupon = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');

    try {
      const { data, error: dbError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .eq('active', true)
        .single();

      if (dbError || !data) {
        setError('Cupom inválido ou não encontrado.');
        return;
      }

      const coupon = data as Coupon;

      if (coupon.usage_count >= coupon.usage_limit) {
        setError('Este cupom já atingiu o limite de uso.');
        return;
      }

      // If specific product, check if it's in the cart
      if (coupon.discount_type === 'specific_product' && coupon.product_id) {
        const hasProduct = items.some(item => item.product.id === coupon.product_id);
        if (!hasProduct) {
          setError('Este cupom não se aplica aos itens do seu carrinho.');
          return;
        }
      }

      setAppliedCoupon(coupon);
      setCode('');
    } catch (err) {
      setError('Erro ao validar cupom.');
    } finally {
      setLoading(false);
    }
  };

  if (appliedCoupon) {
    let description = '';
    if (appliedCoupon.discount_type === 'total_with_shipping') {
      description = `(${appliedCoupon.discount_percentage}% no total com frete)`;
    } else if (appliedCoupon.discount_type === 'total_without_shipping') {
      description = `(${appliedCoupon.discount_percentage}% no subtotal)`;
    } else if (appliedCoupon.discount_type === 'specific_product') {
      description = `(${appliedCoupon.discount_percentage}% no produto específico)`;
    }

    return (
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center text-green-700">
          <Ticket className="w-4 h-4 mr-2" />
          <div className="flex flex-col">
            <span className="font-medium">Cupom aplicado: {appliedCoupon.code}</span>
            <span className="text-xs opacity-80">{description}</span>
          </div>
        </div>
        <button 
          onClick={() => setAppliedCoupon(null)}
          className="text-gray-500 hover:text-gray-700 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <div 
        onClick={() => setIsExpanded(true)}
        className="flex items-center justify-between p-3.5 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl cursor-pointer hover:shadow-md transition-all group mt-2"
      >
        <div className="flex items-center text-primary">
          <Ticket className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-sm">Adicionar Cupom de Desconto</span>
        </div>
        <ArrowRight className="w-4 h-4 text-primary/60 group-hover:translate-x-1 transition-transform" />
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-2 bg-accent/30 p-3 rounded-xl border border-border/50 shadow-sm animate-in fade-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-1 px-1">
        <span className="text-sm font-semibold text-foreground flex items-center">
          <Ticket className="w-4 h-4 mr-2 text-primary" /> Cupom de Desconto
        </span>
        <button onClick={() => setIsExpanded(false)} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex space-x-2">
        <Input 
          placeholder="Digite seu código" 
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
          className="bg-background"
        />
        <Button 
          variant="default" 
          onClick={applyCoupon}
          disabled={loading || !code.trim()}
          className="gradient-gold shadow-gold text-primary-foreground font-semibold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
        </Button>
      </div>
      {error && <p className="text-xs text-red-500 font-medium ml-1">{error}</p>}
    </div>
  );
}
