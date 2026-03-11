# Edge Function notify-openclaw — Guia Completo (Criar do Zero)

Guia passo a passo para criar a Edge Function que recebe INSERTs da tabela `orders` do Supabase, transforma o payload e envia para o OpenClaw, que envia a notificação via WhatsApp.

---

## Pré-requisitos

- Projeto Supabase (ex: `oremaeuqwhjcrjgebfha`)
- Tabela `orders` com colunas como: `id`, `order_number`, `customer_name`, `customer_email`, `customer_phone`, `customer_address`, `total_amount`, `status`, `whatsapp_message`
- OpenClaw rodando e acessível em `https://srv1375424.tail85b8f0.ts.net/hooks/agent`
- Token de hooks do OpenClaw (ex: `Hk7xR4mWqZ9pN2vBtY5sJdLe3fCa8gUi`)
- Número de WhatsApp de destino (ex: `+353833394121`)

---

## Passo 1 — Criar o arquivo da função

Crie o arquivo `index.ts` (ou use o conteúdo abaixo).

### Código completo

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENCLAW_URL = "https://srv1375424.tail85b8f0.ts.net/hooks/agent";
const OPENCLAW_TOKEN = Deno.env.get("OPENCLAW_HOOKS_TOKEN") || "Hk7xR4mWqZ9pN2vBtY5sJdLe3fCa8gUi";
const WHATSAPP_TO = "+353833394121";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.json();
    const { type, table, record } = payload;

    if (type !== "INSERT" || table !== "orders" || !record) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const message = [
      `Novo pedido #${record.order_number || record.id} recebido via webhook do Supabase.`,
      ``,
      `Detalhes do pedido:`,
      `- Cliente: ${record.customer_name || "N/A"}`,
      `- Email: ${record.customer_email || "N/A"}`,
      `- Telefone: ${record.customer_phone || "N/A"}`,
      `- Endereco: ${record.customer_address || "N/A"}`,
      `- Valor total: R$ ${Number(record.total_amount || 0).toFixed(2)}`,
      `- Status: ${record.status || "pending"}`,
      record.whatsapp_message ? `\nMensagem WhatsApp:\n${record.whatsapp_message}` : "",
      ``,
      `Por favor, processe este pedido e notifique o cliente.`,
    ]
      .filter(Boolean)
      .join("\n");

    const response = await fetch(OPENCLAW_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENCLAW_TOKEN}`,
      },
      body: JSON.stringify({
        message,
        agentId: "andre",
        name: "Supabase-Orders",
        deliver: true,
        channel: "whatsapp",
        to: WHATSAPP_TO,
      }),
    });

    const result = await response.text();
    return new Response(
      JSON.stringify({
        ok: response.ok,
        openclaw_status: response.status,
        openclaw_response: result,
        order_number: record.order_number,
      }),
      {
        status: response.ok ? 200 : 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String((err as Error).message) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

### Configurações que você deve ajustar

| Constante       | Valor atual                    | O que mudar                                      |
|-----------------|--------------------------------|--------------------------------------------------|
| `OPENCLAW_URL`  | `https://srv1375424...`        | URL do seu gateway OpenClaw (Tailscale ou outro) |
| `OPENCLAW_TOKEN`| `Hk7xR4mWqZ9pN2vBtY5sJdLe3fCa8gUi` | Seu `OPENCLAW_HOOKS_TOKEN`                    |
| `WHATSAPP_TO`   | `+353833394121`               | Número que deve receber a notificação no WhatsApp |
| `agentId`       | `"andre"`                     | ID do agente no OpenClaw                          |

---

## Passo 2 — Deploy da Edge Function

### Opção A — Via Supabase CLI

1. Instalar o Supabase CLI (se ainda não tiver):
   ```bash
   npm install -g supabase
   ```

2. Login:
   ```bash
   supabase login
   ```

3. Na pasta do projeto (com `supabase/` configurado):
   ```bash
   supabase functions deploy notify-openclaw --project-ref oremaeuqwhjcrjgebfha
   ```

4. Se usar pasta local da função:
   ```bash
   mkdir -p supabase/functions/notify-openclaw
   # Coloque o index.ts em supabase/functions/notify-openclaw/
   supabase functions deploy notify-openclaw --project-ref oremaeuqwhjcrjgebfha
   ```

### Opção B — Via MCP (Cursor)

1. Usar o MCP `user-supabase-mcp-server-trezentos`
2. Chamar `deploy_edge_function` com:
   - `project_id`: `"oremaeuqwhjcrjgebfha"`
   - `name`: `"notify-openclaw"`
   - `entrypoint_path`: `"index.ts"`
   - `verify_jwt`: `false`
   - `files`: `[{ "name": "index.ts", "content": "<conteúdo do código acima>" }]`

---

## Passo 3 — Configurar secrets (opcional)

Para não deixar o token no código:

1. No Supabase Dashboard: **Project Settings → Edge Functions → Secrets**
2. Adicionar:
   - **Name:** `OPENCLAW_HOOKS_TOKEN`
   - **Value:** `Hk7xR4mWqZ9pN2vBtY5sJdLe3fCa8gUi`

3. O código já usa: `Deno.env.get("OPENCLAW_HOOKS_TOKEN") || "fallback"`

---

## Passo 4 — Criar o trigger no banco de dados

O trigger deve chamar a Edge Function em cada INSERT em `orders`.

### Via SQL Editor (Supabase Dashboard)

1. Dashboard → **SQL Editor** → **New query**
2. Executar:

```sql
-- Remover trigger antigo (se existir)
DROP TRIGGER IF EXISTS notificar_novo_pedido_openclaw ON public.orders;

-- Criar trigger
CREATE TRIGGER notificar_novo_pedido_openclaw
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://oremaeuqwhjcrjgebfha.supabase.co/functions/v1/notify-openclaw',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '5000'
  );
```

### Ajustar a URL da função

Troque `oremaeuqwhjcrjgebfha` pelo ref do seu projeto Supabase. A URL segue o padrão:

```
https://<PROJECT_REF>.supabase.co/functions/v1/notify-openclaw
```

---

## Passo 5 — Verificar se o trigger existe

```sql
SELECT tgname, pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgname = 'notificar_novo_pedido_openclaw';
```

---

## Passo 6 — Testar

### Teste 1 — INSERT manual na tabela

```sql
INSERT INTO orders (user_id, order_number, customer_name, customer_email, customer_phone, customer_address, total_amount, status, whatsapp_message)
VALUES (
  '176862d2-d3f3-4382-af45-f6e69a3ded33',
  99,
  'Teste Edge Function',
  'teste@teste.com',
  '11999999999',
  'Rua Teste 123',
  150.00,
  'pending',
  'Mensagem de teste'
);
```

### Teste 2 — Invocar a função diretamente (curl)

```bash
curl -X POST "https://oremaeuqwhjcrjgebfha.supabase.co/functions/v1/notify-openclaw" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "orders",
    "schema": "public",
    "record": {
      "id": "test-uuid",
      "order_number": 100,
      "customer_name": "Cliente Teste",
      "customer_email": "teste@email.com",
      "customer_phone": "11998887777",
      "customer_address": "Av. Teste 456",
      "total_amount": 200.50,
      "status": "pending",
      "whatsapp_message": "Pedido de teste"
    },
    "old_record": null
  }'
```

Resposta esperada (quando tudo OK):

```json
{
  "ok": true,
  "openclaw_status": 200,
  "openclaw_response": "{\"ok\":true,\"runId\":\"...\"}",
  "order_number": 100
}
```

### Teste 3 — Logs da função

Dashboard → **Edge Functions** → **notify-openclaw** → **Logs**

---

## Resumo das configurações

| Item              | Valor                                                                 |
|-------------------|-----------------------------------------------------------------------|
| Nome da função    | `notify-openclaw`                                                    |
| URL da função     | `https://<PROJECT_REF>.supabase.co/functions/v1/notify-openclaw`     |
| URL do OpenClaw   | `https://srv1375424.tail85b8f0.ts.net/hooks/agent`                   |
| Token             | `Hk7xR4mWqZ9pN2vBtY5sJdLe3fCa8gUi` (ou via secret)                   |
| Número WhatsApp   | `+353833394121`                                                      |
| Agent ID OpenClaw | `andre`                                                              |
| Trigger           | `AFTER INSERT ON public.orders`                                      |
| verify_jwt        | `false` (trigger invoca sem Bearer do usuário)                       |

---

## Configuração Docim da Gringa (aplicada)

- **MCP:** `user-supabase-mcp-server-docimdagringa`
- **Project ref:** `nswedijyvafrbxjsaple`
- **Número de destino (to):** `+553591154125`
- **Agent ID OpenClaw:** `docimdagringa`
- **Resumo do pedido:** A mensagem enviada para a loja é o **mesmo resumo completo** que o cliente recebe ao finalizar o pedido, incluindo:
  - Nome do responsável
  - Endereço completo (endereço + complemento) ou *Retirada na Loja*
  - Telefone e e-mail de quem fez o pedido
  - Forma de pagamento (ex.: Pagar na Entrega - Cartão, troco para R$ X)
  - Se vai buscar na loja ou receber entrega
  - Itens do pedido (nome, quantidade, valor)
  - Frete (bairro/valor) ou Retirada na Loja
  - Valor total do pedido
  - Observações do cliente (se houver)

A Edge Function usa o campo `whatsapp_message` gravado na tabela `orders` (o mesmo texto gerado no front ao finalizar), garantindo que a loja receba exatamente o resumo do pedido. Código da função em `supabase/functions/notify-openclaw/index.ts`. O trigger `notificar_novo_pedido_openclaw` já foi criado via migração no projeto Docim da Gringa.

---

## Troubleshooting

| Problema                    | Causa provável                              | Solução                                  |
|----------------------------|---------------------------------------------|------------------------------------------|
| 502 da Edge Function       | OpenClaw inacessível ou erro na requisição  | Conferir URL, token e gateway            |
| Payload `skipped: true`    | Evento que não é INSERT em `orders`        | Normal para outros eventos/tabelas        |
| Nenhuma msg no WhatsApp    | `to` incorreto ou canal desativado          | Verificar `WHATSAPP_TO` e configuração  |
| 401 do OpenClaw            | Token errado ou expirado                    | Conferir `OPENCLAW_HOOKS_TOKEN`          |
| Emojis chegam no hook mas não no WhatsApp | OpenClaw/relay perdendo emojis (encoding ou sanitização) | Verificar: (1) se o canal WhatsApp usa UTF-8 explicitamente; (2) se há filtro/sanitização removendo caracteres Unicode. A Edge Function já envia `Content-Type: application/json; charset=utf-8`. |

---

*Documentação criada em 10/Mar/2026 para o projeto Trezentos.*
