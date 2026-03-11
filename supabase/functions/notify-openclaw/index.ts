import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENCLAW_URL = "https://srv1375424.tail85b8f0.ts.net/hooks/agent";
const OPENCLAW_TOKEN = Deno.env.get("OPENCLAW_HOOKS_TOKEN") || "Hk7xR4mWqZ9pN2vBtY5sJdLe3fCa8gUi";
const WHATSAPP_TO = "+553591154125";

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

    const orderNum = record.order_number ?? record.id;
    const deliveryMethod = record.delivery_method as string | undefined;

    // Adiciona emojis ao texto: retirada 🏠, frete 🚚, cartão 💳, dinheiro 💵
    // (Endereço sem emoji; E-mail removido)
    const addEmojis = (text: string): string => {
      let out = text;
      out = out.replace(/\*?E-mail\*?:[^\n]*\n?/gi, ""); // Remove linha do E-mail
      if (deliveryMethod === "pickup") {
        out = out.replace(/Retirada na Loja/gi, "🏠 Retirada na Loja");
      } else if (deliveryMethod === "delivery") {
        out = out.replace(/(\*?)Frete\s*\(/g, "$1🚚 Frete ("); // Só Frete com 🚚, não Endereço
      }
      out = out.replace(/\bCartão\b/g, "💳 Cartão").replace(/\bcartão\b/g, "💳 cartão");
      out = out.replace(/\bDinheiro\b/g, "💵 Dinheiro").replace(/\bdinheiro\b/g, "💵 dinheiro");
      return out;
    };

    // Primeira linha com caixa + parabéns (para aparecer mesmo se o agente reformatar o título)
    const header = `📦 Novo Pedido #${orderNum} 👏 Parabéns! Mais um pedido!\n\n`;

    // Resumo completo: usar a mesma mensagem que vai para o cliente (whatsapp_message)
    const footer = "\n\n👏 Parabéns! Mais um pedido!";
    let message: string;
    if (record.whatsapp_message && String(record.whatsapp_message).trim()) {
      message = header + addEmojis(String(record.whatsapp_message).trim()) + footer;
    } else {
      // Fallback se whatsapp_message vier vazio
      const addressLine = record.customer_address
        ? `${record.customer_address}${record.complement ? ` - ${record.complement}` : ""}`
        : "N/A";
      const deliveryLabel =
        record.delivery_method === "pickup"
          ? "🏠 Retirada na Loja"
          : record.delivery_method === "delivery"
            ? "🚚 Entrega"
            : "N/A";
      const payLabel = record.payment_label || record.payment_method || "N/A";
      const payEmoji = /cartão|card/i.test(payLabel) ? "💳 " : /dinheiro|cash/i.test(payLabel) ? "💵 " : "";
      const changeLine =
        record.change_amount != null && Number(record.change_amount) > 0
          ? `\n- Troco para: R$ ${Number(record.change_amount).toFixed(2)}`
          : "";

      message = [
        header,
        `*Nome:* ${record.customer_name || "N/A"}`,
        `*Telefone:* ${record.customer_phone || "N/A"}`,
        `*Endereço:* ${addressLine}`,
        `*Entrega/Retirada:* ${deliveryLabel}`,
        record.shipping_neighborhood ? `*Bairro:* ${record.shipping_neighborhood}` : null,
        record.shipping_cost != null && Number(record.shipping_cost) > 0
          ? `🚚 *Frete:* R$ ${Number(record.shipping_cost).toFixed(2)}`
          : null,
        `*Forma de pagamento:* ${payEmoji}${payLabel}${changeLine}`,
        record.order_notes ? `*Observações:* ${record.order_notes}` : null,
        ``,
        `*Valor total:* R$ ${Number(record.total_amount || 0).toFixed(2)}`,
        `*Status:* ${record.status || "pending"}`,
      ]
        .filter(Boolean)
        .join("\n") + footer;
    }

    const response = await fetch(OPENCLAW_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${OPENCLAW_TOKEN}`,
      },
      body: JSON.stringify({
        message,
        agentId: "docimdagringa",
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
