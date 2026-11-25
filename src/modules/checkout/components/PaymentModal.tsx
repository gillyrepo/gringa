import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, CheckCircle, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import whatsappLogo from '@/shared/assets/icons8-whatsapp-logo-96.png';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pixCode: string;
  total: number;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export const PaymentModal = ({
  isOpen,
  onClose,
  pixCode,
  total,
  onConfirm,
  isSubmitting,
}: PaymentModalProps) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      toast.success('Código PIX copiado com sucesso!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Erro ao copiar código PIX');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-6 w-6 text-primary" />
            Pagamento via PIX
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 md:py-4">
          <div className="flex flex-col items-center justify-center space-y-4 border-r-0 md:border-r md:pr-6 border-border">
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">Valor total a pagar</p>
              <p className="text-3xl font-bold text-primary">R$ {total.toFixed(2)}</p>
            </div>

            <div className="p-4 bg-white rounded-xl shadow-sm border">
              <QRCodeSVG value={pixCode} size={200} level="M" />
            </div>

            <p className="text-sm text-center text-muted-foreground md:hidden">
              Escaneie o QR Code acima ou copie o código abaixo:
            </p>
          </div>

          <div className="flex flex-col justify-center space-y-4">
            <p className="text-sm text-center text-muted-foreground hidden md:block mb-2">
              Escaneie o QR Code ao lado ou copie o código abaixo:
            </p>

            <div className="relative">
              <textarea
                className="w-full h-24 p-3 pr-12 text-xs bg-muted/50 rounded-md border resize-none font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                readOnly
                value={pixCode}
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 h-8 w-8 bg-background shadow-sm hover:bg-muted"
                onClick={handleCopy}
                aria-label="Copiar código PIX"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Código Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar código PIX
                </>
              )}
            </Button>

            <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm w-full text-center">
              <p>Após realizar o pagamento, clique no botão abaixo e cole o comprovante.</p>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-center md:justify-end">
          <Button
            type="button"
            className="w-full h-12 gradient-gold text-primary-foreground shadow-gold text-lg font-semibold flex items-center justify-center gap-2"
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            <span>Enviar Pedido</span>
            <img src={whatsappLogo} alt="WhatsApp" className="h-6 w-6" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
