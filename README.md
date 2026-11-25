# Docim da Gringa

E-commerce de doces importados e nacionais com checkout integrado ao PIX/WhatsApp e painel administrativo.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Radix UI (`shadcn/ui`), TanStack Query
- **Backend / BaaS:** Supabase (PostgreSQL 17, RLS, RPCs transacionais, Auth, Storage)
- **Arquitetura:** Modular por domínio (`src/modules/*` + `src/shared/*`)

## Estrutura de Módulos

- `src/app/` — Configuração global de providers e roteamento com *code splitting* (`React.lazy`)
- `src/modules/products/` — Catálogo público, filtros de categoria, gestão de produtos e cálculo centralizado de descontos
- `src/modules/cart/` — Contexto do carrinho, persistência local e página `/carrinho`
- `src/modules/coupons/` — Aplicação e gerenciamento administrativo de cupons
- `src/modules/shipping/` — Seleção de bairros/taxas de entrega e gestão administrativa
- `src/modules/checkout/` — Dados de entrega/retirada, geração de QR Code PIX (CRC16) e confirmação
- `src/modules/orders/` — Criação transacional via RPC (`create_public_order`), acompanhamento em `/pedidos` e gestão em `/admin`
- `src/modules/store-settings/` — Configurações operacionais da loja (horários, endereço de retirada, WhatsApp)
- `src/modules/admin/` — Autenticação e painel administrativo (`/admin`)
- `src/shared/` — Layout global, primitivos `ui`, assets otimizados, constantes e cliente Supabase
- `supabase/migrations/` — Migrações SQL de RLS, índices e funções RPC

## Desenvolvimento Local

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Variáveis de ambiente (`.env`):**
   ```env
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-key>
   ```

3. **Rodar servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Qualidade e Build:**
   ```bash
   npm run lint
   npx tsc --noEmit
   npm run test
   npm run build
   ```
