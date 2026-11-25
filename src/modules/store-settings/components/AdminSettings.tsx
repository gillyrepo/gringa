import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Save, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/queryKeys';
import type { StoreSettings } from '@/modules/store-settings/types';
import { useStoreSettings } from '@/modules/store-settings/hooks/useStoreSettings';
import { upsertStoreSettings } from '@/modules/store-settings/services/storeSettingsService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

export function AdminSettings() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useStoreSettings();
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: upsertStoreSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storeSettings });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao salvar configurações');
    },
  });

  if (isLoading || !settings) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Carregando configurações...
      </div>
    );
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
              value={settings.observation || ''}
              onChange={(e) =>
                setSettings((prev) => (prev ? { ...prev, observation: e.target.value } : null))
              }
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
              value={settings.whatsapp_number || ''}
              onChange={(e) =>
                setSettings((prev) =>
                  prev ? { ...prev, whatsapp_number: e.target.value.replace(/\D/g, '') } : null
                )
              }
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
              value={settings.store_address || ''}
              onChange={(e) =>
                setSettings((prev) => (prev ? { ...prev, store_address: e.target.value } : null))
              }
            />
            <p className="text-xs text-muted-foreground">
              Este é o endereço que será exibido no checkout quando o cliente selecionar &quot;Buscar na loja&quot;.
            </p>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              onClick={() => saveMutation.mutate(settings)}
              disabled={saveMutation.isPending}
              className="gradient-gold text-primary-foreground shadow-gold"
            >
              {saveMutation.isPending ? (
                'Salvando...'
              ) : (
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
