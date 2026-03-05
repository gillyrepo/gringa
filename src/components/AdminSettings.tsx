import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Clock, Save, Phone } from 'lucide-react';

interface StoreSettings {
  id: string;
  observation: string;
  whatsapp_number: string;
  is_open_manually: boolean;
  store_address?: string;
}

export function AdminSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('store', 'docimdagringa')
      .single();

    if (error && error.code !== 'PGRST116') {
      toast.error('Erro ao carregar configurações');
    } else if (data) {
      setSettings(data);
    } else {
      // Fallback default
      setSettings({
        id: '',
        observation: '',
        whatsapp_number: '5535991154125',
        is_open_manually: true,
        store_address: ''
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);

    const { error } = await supabase
      .from('store_settings')
      .upsert({
        id: settings.id || undefined,
        observation: settings.observation,
        whatsapp_number: settings.whatsapp_number,
        is_open_manually: settings.is_open_manually,
        store_address: settings.store_address,
        updated_at: new Date().toISOString(),
        store: 'docimdagringa'
      });

    if (error) {
      toast.error('Erro ao salvar configurações');
    } else {
      toast.success('Configurações salvas com sucesso!');
      fetchSettings();
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Configurações da Loja
          </CardTitle>
          <CardDescription>
            Gerencie o horário de funcionamento e contatos da loja.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="observation">Observação de Horário</Label>
            <Textarea
              id="observation"
              placeholder="Ex: Aberto de segunda a sexta das 08:00 às 18:00. Sábados até 12:00."
              value={settings?.observation || ''}
              onChange={(e) => setSettings(prev => prev ? ({ ...prev, observation: e.target.value }) : null)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Número do WhatsApp (Pedidos)
            </Label>
            <Input
              id="whatsapp"
              placeholder="Ex: 5535991154125 (Apenas números)"
              value={settings?.whatsapp_number || ''}
              onChange={(e) => setSettings(prev => prev ? ({ ...prev, whatsapp_number: e.target.value.replace(/\D/g, '') }) : null)}
            />
            <p className="text-xs text-muted-foreground">
              Este é o número para onde os pedidos serão enviados. Digite apenas números (código do país + DDD + número).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="store_address">Endereço da Loja (Para Retirada)</Label>
            <Input
              id="store_address"
              placeholder="Ex: Rua Benedito Antônio de Oliveira, 93A. Bairro Ponte Nova. Portão Branco."
              value={settings?.store_address || ''}
              onChange={(e) => setSettings(prev => prev ? ({ ...prev, store_address: e.target.value }) : null)}
            />
            <p className="text-xs text-muted-foreground">
              Este é o endereço que será exibido no checkout quando o cliente selecionar "Buscar na loja".
            </p>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gradient-gold text-primary-foreground shadow-gold"
            >
              {saving ? 'Salvando...' : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
