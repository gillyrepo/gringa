# Arquitetura - Docim da Gringa

## 1. Visão Geral do Sistema
O **Docim da Gringa** é uma aplicação de e-commerce de doces importados e nacionais com checkout integrado ao PIX (BR Code EMVCo) e WhatsApp, além de painel administrativo completo.
- **Frontend:** React 18 + Vite + TypeScript + TailwindCSS + TanStack Query
- **Backend / BaaS:** Supabase (`PostgreSQL 17`, Row Level Security estrito, RPCs transacionais, Auth e Storage)
- **Hospedagem:** Vercel (`https://www.docimdagringa.com.br/`)

## 2. Organização Modular (`src/`)
O código é estruturado por domínios de negócio independentes:
- `src/app/` — Providers globais e roteador (`AppRouter`) com *code splitting* (`React.lazy` + `Suspense`).
- `src/modules/products/` — Vitrine pública (`active = true`, exibindo itens com `stock = 0` no fim da lista como *"Fora de Estoque"*), filtros de categoria, gestão administrativa e utilitário central de precificação/descontos (`pricing.ts`).
- `src/modules/cart/` — Estado do carrinho (`CartContext`) persistido em `localStorage` e página `/carrinho`.
- `src/modules/coupons/` — Aplicação de cupons no carrinho/checkout, cálculo centralizado (`couponDiscount.ts`) e painel administrativo.
- `src/modules/shipping/` — Seleção e gerenciamento de taxas de entrega por bairro (`store = 'docimdagringa'`).
- `src/modules/checkout/` — Formulário validado com Zod, geração de QR Code PIX (`pixService.ts`) e confirmação do pedido.
- `src/modules/orders/` — Criação atômica via RPC (`create_public_order`), acompanhamento seguro por UUID em `/pedidos` (`get_customer_orders_by_ids`) e gestão administrativa em `/admin`.
- `src/modules/store-settings/` — Horários/observações, endereço de retirada e WhatsApp oficial da loja.
- `src/modules/admin/` — Autenticação Supabase Auth e shell responsivo do painel `/admin`.
- `src/shared/` — Layout (`Header`, `BottomNav`), primitivos `ui`, assets WebP otimizados, constantes (`store.ts`) e cliente Supabase.

## 3. Segurança e Controle de Acesso (Supabase RLS & RPCs)
- **Função `public.is_admin()`:** `SECURITY DEFINER` com `search_path = public` verificando `role = 'admin'` em `public.profiles` sem recursão de RLS.
- **Catálogo, Frete, Cupons e Configurações:** Leitura pública restrita a `store = 'docimdagringa'` (e `active = true` para `products` e `coupons`); operações `INSERT`, `UPDATE` e `DELETE` exclusivas para `public.is_admin()`.
- **Pedidos e Itens (`orders`, `order_items`):** Acesso direto às tabelas bloqueado para visitantes anônimos (exclusivo para `public.is_admin()`). Clientes anônimos interagem apenas via RPCs:
  - `public.create_public_order(...)`: Calcula preços, descontos de produto, frete e cupom no servidor em transação única (estoque gerenciado manualmente pelo Admin).
  - `public.get_customer_orders_by_ids(uuid[])`: Retorna apenas pedidos cujos UUIDs v4 estejam salvos no dispositivo do cliente, omitindo `internal_comments` e `whatsapp_message`.
