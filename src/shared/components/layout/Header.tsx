import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/shared/components/ui/sheet';
import { Button } from '@/shared/components/ui/button';
import logo from '@/shared/assets/vacasemfundo.webp';

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logo}
            alt="Docim da Gringa"
            width={40}
            height={40}
            decoding="async"
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-foreground">
              DOCIM
            </span>
            <span className="text-xs text-muted-foreground">
              DA GRINGA
            </span>
          </div>
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] bg-card">
            <nav className="flex flex-col gap-4 mt-8">
              <Link
                to="/"
                className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                onClick={() => setOpen(false)}
              >
                Produtos
              </Link>
              <Link
                to="/pedidos"
                className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                onClick={() => setOpen(false)}
              >
                Meus Pedidos
              </Link>
              <div className="border-t border-border my-4" />
              <Link
                to="/admin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setOpen(false)}
              >
                Área Admin
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
