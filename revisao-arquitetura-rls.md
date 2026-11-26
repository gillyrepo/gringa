# Plano Completo (Concluído): Revisão, Modularização, Performance e Blindagem RLS (Zero-Downtime) — Docim da Gringa

**Tipo de Projeto:** `WEB` (React 18 + Vite + TypeScript + Tailwind + Supabase)  
**Ambiente Alvo:** Produção ativa em `https://www.docimdagringa.com.br/` + Supabase `nswedijyvafrbxjsaple` (`sa-east-1`)  
**Status:** **100% Executado e Validado em Produção (Zero Downtime)**

---

## Tarefas (T1–T6) & Phase X Verification

- [x] **T1:** Baseline SQL das policies/funções atuais + script de rollback (`supabase/migrations/0000_rollback_baseline.sql`)
- [x] **T2:** Fase 1 no Banco — `public.is_admin()`, RLS em `store_settings`, bloqueio de `UPDATE`/`DELETE` anônimo, remoção dos `8` produtos `barbershop`, normalização `store`, `DROP` do trigger/funções OpenClaw e índices FK
- [x] **T3:** Fase 2 no Banco (Expand) — RPCs `create_public_order` (sem baixa de estoque) e `get_customer_orders_by_ids`
- [x] **T4:** Limpeza de legado `barbershop`/`Trezentos`/`openclaw`, 33 `ui/*` órfãos, `NavLink.tsx`, 89 pacotes NPM (diretos e transitivos), `bun.lockb` e credenciais hardcoded
- [x] **T5:** Modularização em `src/modules/*` e `src/shared/*`, filtro `active = true` na vitrine, `pricing.ts` único, `React.lazy` + WebP + React Query e integração com as RPCs
- [x] **T6:** Deploy em produção (`9c47ed0`) + Fase 5 Contract no banco (fechamento de `SELECT`/`INSERT` direto anônimo em `orders`/`order_items` e restrição de `SELECT` anônimo em `products` para `active = true`)
- [x] **Phase X:** `npm run lint`, `npx tsc --noEmit`, `npm run test` (9/9), `npm run build`, `security_scan.py` e `get_advisors` validados

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass (0 errors)
- TypeScript: ✅ Pass (`tsc --noEmit`)
- Unit Tests: ✅ Pass (3 suites, 9 tests)
- Security: ✅ RLS 100% enforced across all 7 public tables + Storage (`0` `rls_disabled`, `0` `function_search_path_mutable`, `0` `unindexed_foreign_keys`, `0` `multiple_permissive_policies`)
- Build & Deploy: ✅ Live on `https://www.docimdagringa.com.br/` (`index` chunk reduced from `809 KB` to `90.6 KB`, `logo.webp` reduced from `411 KB` to `28 KB`)
- Date: 2026-11-26
