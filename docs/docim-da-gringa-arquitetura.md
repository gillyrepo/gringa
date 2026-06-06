# Arquitetura - Docim da Gringa

## 1. Visão Geral do Sistema
O Docim da Gringa é uma aplicação de e-commerce e catálogo de produtos focada em vendas diretas e integração com WhatsApp, além de um painel/dashboard administrativo. A arquitetura atual é baseada em:
- **Frontend**: React (Vite) + TailwindCSS
- **Backend / BaaS**: Supabase Online (acessado através da nuvem)
- **Integração de Mensageria**: WhatsApp API

## 2. Personas e Papéis (Roles)
O sistema trabalha majoritariamente com os seguintes tipos de usuários:
- **Admin (`role = 'admin'`)**: Pode gerenciar produtos (cadastrar, alterar estoque, inativar, aplicar descontos), visualizar e atualizar status de todos os pedidos, definir as taxas de entrega (`shipping_rates`), gerenciar as configurações vitais da loja (horário e status de aberto/fechado em `store_settings`) e visualizar todo o fluxo pelo dashboard administrativo.
- **Customer (`role = 'customer'` ou Visitante Anônimo)**: Pode visualizar o catálogo de produtos, ver destaques e promoções temporárias, adicionar itens ao carrinho, finalizar compras escolhendo entre *Delivery* ou *Pickup* (Retirada). Pode também inserir dados para o troco caso a forma de pagamento escolhida seja dinheiro, e finalmente acompanhar o status dos seus pedidos.

## 3. Principais Fluxos
- **Fluxo de Checkout (Cliente)**: O cliente navega nas categorias de produtos, adiciona o que deseja no carrinho. No checkout, preenche seus dados (nome, telefone, bairro com cálculo dinâmico de frete). O cliente seleciona o método de entrega e a forma de pagamento e então o pedido é persistido nas tabelas `orders` e `order_items`. É possível a geração de uma mensagem automática no WhatsApp agilizando a comunicação direta da loja.
- **Fluxo de Gestão (Admin)**: O dono/gerente da loja entra no `/admin`. Pode abrir ou fechar a loja manualmente para novos pedidos (`store_settings.is_open_manually`), configurar novos bairros e fretes para expansão da entrega, ver detalhes profundos do pedido (adicionar comentários internos ou externos que aparecem para o cliente), e manipular as múltiplas imagens e atributos de cada produto.

## 4. Modelo de Dados Atual (Supabase)

O sistema introduziu capacidades de **Multi-Tenant** com a coluna `store` presente na grande maioria das tabelas, definindo que o projeto pode ser facilmente escalado para múltiplas lojas convivendo no mesmo banco (atualmente utiliza o identificador base `docimdagringa`).

### 4.1. Perfis (`profiles`)
Armazena dados estendidos vinculados ao sistema de Autenticação (Supabase Auth) determinando o nível de acesso (RBAC).
- `id` (UUID, PK) - Vinculado ao Auth.
- `email` (String)
- `role` (String) - ex: 'admin', 'customer'
- `metadata` (JSONB) - Metadados adicionais
- `store` (Text) - Identificador da loja
- `created_at`, `updated_at` (Timestamp)

### 4.2. Configurações da Loja (`store_settings`)
Gerencia o status, funcionamento e endereços da loja.
- `id` (UUID, PK)
- `is_open_manually` (Boolean) - Botão de pânico (Abre/Fecha a loja a qualquer momento)
- `store` (Text)
- `observation` (Text) - Campo para avisos gerais aos clientes
- `whatsapp_number` (Text) - Número oficial de contato da loja
- `store_address` (Text) - Endereço físico oficial para retirada (Pickup)
- `updated_at` (Timestamp)

### 4.3. Taxas de Entrega (`shipping_rates`)
Tabela de regras de frete e custos baseados em região (Bairro/Cidade/Estado).
- `id` (UUID, PK)
- `store` (Text)
- `state`, `city`, `neighborhood` (Text) - Localidade
- `price` (Numeric) - Custo do frete cobrado do cliente
- `created_at` (Timestamp)

### 4.4. Produtos (`products`)
Catálogo completo e precificação. Suporta promoções com data de expiração e múltiplas imagens.
- `id` (UUID, PK)
- `name` (String), `description` (Text), `sku` (Text)
- `price` (Numeric), `category` (String)
- `image_url`, `image_url_2`, `image_url_3` (Text) - Carrossel de imagens
- `active` (Boolean), `stock` (Integer)
- `discount_percentage` (Numeric) - Desconto na compra
- `discount_expires_at` (Timestamp) - Prazo de validade do desconto
- `store` (Text)
- `created_at`, `updated_at` (Timestamp)

### 4.5. Pedidos (`orders`)
Registra as vendas, detalhes do cliente, entrega, pagamento, mensagens e comentários.
- `id` (UUID, PK)
- `user_id` (UUID, FK profiles)
- `order_number` (Integer) - ID sequencial de fácil leitura (ex: Pedido #124)
- `status` (String) - 'pending', 'confirmed', 'delivered', 'cancelled', etc.
- `customer_name`, `customer_phone`, `customer_email`, `customer_address` (Text)
- `shipping_city`, `shipping_neighborhood`, `complement` (Text) - Dados da entrega
- `shipping_cost` (Numeric) - Frete cobrado
- `total_amount`, `total_discount` (Numeric) - Valor total com descontos aplicados
- `delivery_method` (Text) - 'delivery' ou 'pickup'
- `payment_method` (Text), `payment_label` (Text) - Dinheiro, PIX, Cartão
- `change_amount` (Numeric) - Troco para entregas pagas em dinheiro
- `whatsapp_message` (Text)
- `internal_comments` (Text) - Notas apenas visíveis para Admin
- `external_comments` (Text) - Respostas ou justificativas visíveis para o Cliente
- `order_notes` (Text) - Observações deixadas pelo cliente na finalização
- `store` (Text)
- `created_at`, `updated_at` (Timestamp)

### 4.6. Itens de Pedido (`order_items`)
Relação Many-to-Many entre `orders` e `products`, garantindo o "snapshot" dos valores comprados.
- `id` (UUID, PK)
- `order_id` (UUID, FK orders)
- `product_id` (UUID, FK products)
- `quantity` (Integer)
- `unit_price`, `subtotal`, `order_total_amount` (Numeric) - Preserva o preço do momento da compra
- `discount_percentage` (Numeric) - Desconto herdado do produto na hora da venda
- `store` (Text)

## 5. Integrações e Segurança Externa
- **WhatsApp API**: Ao finalizar os pedidos, links formatados podem enviar um overview contendo Itens, Valores e Endereço para agilizar a preparação.
- **Supabase Auth & RLS (Row Level Security)**: Acesso e visualização em camadas. Políticas ativas garantem que Clientes vejam apenas as suas próprias compras, enquanto Admins gerenciam a fila global de pedidos. O RLS também pode ser estendido no futuro combinando dados da role na tabela `profiles` com o critério multilocatário da coluna `store`.
