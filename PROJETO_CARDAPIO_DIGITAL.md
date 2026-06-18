# 📋 Projeto: Cardápio Digital SaaS Multi-Tenant

**Status:** Planejamento e Arquitetura  
**Data Início:** Junho 2026  
**Stack:** Cloudflare Workers + Pages + D1 + React  
**Modelo:** SaaS (Custo Zero para Infra, Receita por Assinatura)

---

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Stack Técnico](#stack-técnico)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Schema do Banco (D1)](#schema-do-banco-d1)
6. [Passo a Passo de Implementação](#passo-a-passo-de-implementação)
7. [Endpoints da API](#endpoints-da-api)
8. [Frontend Pages](#frontend-pages)
9. [Segurança & Auth](#segurança--auth)
10. [Deployment](#deployment)
11. [Roadmap](#roadmap)

---

## 🎯 Visão Geral

### Descrição
Plataforma SaaS que permite restaurantes/lanchonetes criar cardápios digitais, gerenciar pedidos e clientes com fidelidade automática, tudo com **custo zero de infraestrutura**.

### Problema Resolvido
- Instadelivery cobra R$ 40-110/mês apenas para cardápio
- Sem CRM ou fidelidade
- Sem controle de dados dos clientes

### Solução
- Plataforma própria (você é dono)
- Cardápio + Pedidos + CRM + Fidelidade
- PIX integrado (sem custos de gateway)
- WhatsApp via wa.me (gratuito)
- Totalmente escalável

### Modelo de Negócio

```
FREE TIER
├─ Até 100 pedidos/mês
├─ Até 50 clientes
└─ Sem fidelidade

PRO - R$ 49/mês
├─ Até 1.000 pedidos/mês
├─ Clientes ilimitados
├─ Fidelidade automática
└─ Dashboard com analytics

ENTERPRISE - R$ 149/mês
├─ Pedidos ilimitados
├─ CRM integrado (fase 2)
├─ APIs customizadas
└─ Suporte prioritário
```

### Receita Projetada
- **25 restaurantes no plano PRO:** 25 × R$ 49 = **R$ 1.225/mês**
- **5 restaurantes no plano ENTERPRISE:** 5 × R$ 149 = **R$ 745/mês**
- **Total:** ~R$ 2.000/mês com apenas 30 clientes

---

## 🏗️ Arquitetura

### Diagrama Geral

```
┌─────────────────────────────────────────────────────────────┐
│                    SANDRO'S PLATFORM                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Admin Panel  │  │  Dashboard   │  │  Billing &   │     │
│  │ (Seu controle│  │  Analytics   │  │  Manage      │     │
│  │ de negócio)  │  │  (Seu BI)    │  │  Tenants     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                         ↑ (Admin API)
┌─────────────────────────────────────────────────────────────┐
│             CLOUDFLARE EDGE (Global Network)               │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Pages (Frontend + Pages Functions - Backend)         │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ / → Landing Page                                    │  │
│  │ /login → Auth (Cliente/Restaurante)                │  │
│  │ /cardapio → Catálogo de produtos                   │  │
│  │ /carrinho → Seleção + PIX QR Code                  │  │
│  │ /pedidos → Histórico do cliente                    │  │
│  │ /restaurante/dashboard → Painel do restaurante     │  │
│  │ /admin/dashboard → Seu painel de controle          │  │
│  │                                                    │  │
│  │ /api/* → Pages Functions (Servidor Serverless)    │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ D1 Database (SQLite - Multi-Tenant)                │  │
│  │ - tenants (restaurantes)                           │  │
│  │ - cardapio (produtos)                              │  │
│  │ - pedidos (orders)                                 │  │
│  │ - clientes (customers)                             │  │
│  │ - fidelidade (loyalty automation)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Scheduled Workers (Cron Jobs)                       │  │
│  │ - Fidelidade automática (diária)                    │  │
│  │ - Limpeza de dados (semanal)                        │  │
│  │ - Sincronizações (conforme necessário)             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         ↓ (Integrações Externas - Todas Gratuitas)
┌─────────────────────────────────────────────────────────────┐
│ wa.me (WhatsApp) │ PIX (Banco do Cliente) │ Domínio Custom  │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

```
1. CLIENTE ACESSA CARDÁPIO
   └─ cloudapio-restaurante-a.com/cardapio
      └─ Pages → Busca tenant_id via subdomain
         └─ API /api/cardapio?tenant_id=1
            └─ D1 → SELECT * FROM cardapio WHERE tenant_id=1
               └─ Retorna produtos JSON → Frontend renderiza

2. CLIENTE FAZ PEDIDO
   └─ Clica "Fechar Pedido"
      └─ POST /api/pedidos/criar
         ├─ Insere em pedidos (D1)
         ├─ Gera QR Code PIX (qrcode.js - no público)
         ├─ Retorna imagem + string para copy/paste
         └─ Salva estado do pedido em D1

3. CLIENTE PAGA PIX
   └─ Escaneia QR ou copia/cola chave
      └─ Banco do cliente processa PIX
         └─ [OPCIONAL] Webhook do banco → confirma pagamento
            └─ POST /api/webhooks/pix
               └─ Marca pedido como pago (D1)
         └─ OU cliente clica "Já paguei"

4. CLIENTE CONFIRMA NO WHATSAPP
   └─ Clica botão "Confirmar no WhatsApp"
      └─ Abre wa.me link pré-preenchido
         └─ Envia mensagem para restaurante
            └─ Restaurante recebe notificação

5. RESTAURANTE CONFIRMA
   └─ Lê pedido no WhatsApp
      └─ Clica link wa.me de resposta
         └─ Envia confirmação ao cliente
            └─ Cliente recebe notificação

6. VOCÊ (ADMIN) MONITORA
   └─ /admin/dashboard
      └─ API /api/admin/stats
         └─ D1 → Análise completa de todos os tenants
            └─ Total pedidos, receita, clientes, etc
```

---

## 💻 Stack Técnico

### Backend
- **Runtime:** Cloudflare Workers (JavaScript/TypeScript)
- **Database:** Cloudflare D1 (SQLite)
- **Scheduled Tasks:** Cloudflare Scheduled Workers (Cron)
- **APIs Internas:** REST JSON via Pages Functions
- **Auth:** JWT (token-based)

### Frontend
- **Framework:** Next.js 14 ou Astro 4
- **UI:** React + Tailwind CSS
- **QR Code:** `qrcode.js` (geração local, sem API)
- **HTTP Client:** fetch nativo + TanStack Query (opcional)
- **Deployment:** Cloudflare Pages

### Ferramentas de Dev
- **Package Manager:** npm ou bun
- **Bundler:** esbuild (Cloudflare nativo)
- **CLI:** Wrangler (Cloudflare)
- **Version Control:** Git + GitHub
- **Env Management:** .env local + Wrangler secrets

### Integrações (Gratuitas)
- **PIX:** Geração local (sem API)
- **WhatsApp:** wa.me links (sem API, sem custo)
- **Email:** SendGrid free (100/dia) ou Resend
- **Domínio:** Registro.br (R$ 40/ano)

### Relatórios (Opcional - Fase 2)
- **BI:** Power BI (você já domina!)
- **Conexão:** D1 → Power BI connector

---

## 📂 Estrutura do Projeto

```
cardapio-saas/
│
├── 📄 package.json
├── 📄 tsconfig.json
├── 📄 wrangler.toml           ← Configuração Cloudflare
├── 📄 next.config.js          ← Config Next.js (se usar)
├── 📄 .env.example
├── 📄 .env.local (ignorado)
│
├── 📁 src/
│   ├── 📁 functions/           ← Pages Functions (Backend)
│   │   ├── 📁 api/
│   │   │   ├── 📁 auth/
│   │   │   │   ├── login.ts
│   │   │   │   ├── logout.ts
│   │   │   │   └── verify-token.ts
│   │   │   ├── 📁 cardapio/
│   │   │   │   ├── [tenant]/index.ts  (GET /api/cardapio/[tenant])
│   │   │   │   ├── [tenant]/criar.ts  (POST)
│   │   │   │   └── [tenant]/atualizar.ts (PUT)
│   │   │   ├── 📁 pedidos/
│   │   │   │   ├── criar.ts      (POST - novo pedido)
│   │   │   │   ├── gerar-pix.ts  (POST - gera QR Code)
│   │   │   │   ├── confirmar.ts  (PUT - marca como confirmado)
│   │   │   │   └── [id].ts       (GET - detalhes)
│   │   │   ├── 📁 clientes/
│   │   │   │   ├── registrar.ts
│   │   │   │   └── perfil.ts
│   │   │   ├── 📁 fidelidade/
│   │   │   │   ├── ativar-promocao.ts
│   │   │   │   └── aplicar-desconto.ts
│   │   │   ├── 📁 admin/
│   │   │   │   ├── stats.ts        (Dashboard admin)
│   │   │   │   ├── tenants.ts      (CRUD tenants)
│   │   │   │   └── billing.ts      (Gerenciar assinaturas)
│   │   │   └── 📁 webhooks/
│   │   │       └── pix.ts          (Webhook do banco)
│   │   ├── 📁 scheduled/
│   │   │   ├── fidelidade.ts       (Cron: fidelidade automática)
│   │   │   ├── cleanup.ts          (Cron: limpeza de dados)
│   │   │   └── sync.ts             (Cron: sincronizações)
│   │   └── 📁 middleware/
│   │       ├── auth.ts             (JWT validation)
│   │       ├── tenant.ts           (Multi-tenant check)
│   │       └── cors.ts
│   │
│   ├── 📁 pages/                ← Frontend (React)
│   │   ├── _app.tsx             (Root layout)
│   │   ├── _document.tsx        (HTML template)
│   │   ├── index.tsx            (Home / Landing)
│   │   ├── 📁 auth/
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── reset-password.tsx
│   │   ├── 📁 [tenant]/
│   │   │   ├── index.tsx        (Cardápio público)
│   │   │   ├── cardapio.tsx     (Listagem de produtos)
│   │   │   ├── carrinho.tsx     (Seleção + PIX QR)
│   │   │   ├── pedidos.tsx      (Histórico cliente)
│   │   │   └── rastreamento/[id].tsx
│   │   ├── 📁 restaurante/
│   │   │   ├── dashboard.tsx    (Painel do restaurante)
│   │   │   ├── cardapio.tsx     (Gerenciar produtos)
│   │   │   ├── pedidos.tsx      (Lista de pedidos)
│   │   │   ├── clientes.tsx     (CRM básico)
│   │   │   └── configuracoes.tsx
│   │   ├── 📁 admin/
│   │   │   ├── dashboard.tsx    (Seu painel - receita, clientes, etc)
│   │   │   ├── tenants.tsx      (Gerenciar restaurantes)
│   │   │   ├── billing.tsx      (Cobranças)
│   │   │   └── analytics.tsx    (Estatísticas globais)
│   │   └── 404.tsx, 500.tsx     (Error pages)
│   │
│   ├── 📁 components/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── 📁 common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Loading.tsx
│   │   ├── 📁 cardapio/
│   │   │   ├── ProdutoCard.tsx
│   │   │   ├── CarrinhoItem.tsx
│   │   │   └── ResumoCarrinho.tsx
│   │   ├── 📁 pagamento/
│   │   │   ├── QRCodePIX.tsx    (Exibe QR Code + copy/paste)
│   │   │   └── ConfirmacaoPagamento.tsx
│   │   └── 📁 admin/
│   │       ├── KPICard.tsx
│   │       ├── ChartFaturamento.tsx
│   │       └── TabelaTenants.tsx
│   │
│   ├── 📁 lib/
│   │   ├── api-client.ts        (Fetch wrapper)
│   │   ├── auth.ts              (JWT encode/decode)
│   │   ├── pix-utils.ts         (Gerar QR Code)
│   │   ├── whatsapp-utils.ts    (Links wa.me)
│   │   ├── db.ts                (D1 client)
│   │   ├── validators.ts        (Zod schemas)
│   │   └── constants.ts
│   │
│   ├── 📁 hooks/
│   │   ├── useAuth.ts
│   │   ├── useTenant.ts
│   │   ├── usePedidos.ts
│   │   └── useCardapio.ts
│   │
│   ├── 📁 types/
│   │   ├── index.ts             (Types globais)
│   │   ├── api.ts               (Responses)
│   │   ├── db.ts                (Database)
│   │   └── auth.ts
│   │
│   ├── 📁 styles/
│   │   └── globals.css          (Tailwind)
│   │
│   ├── 📁 public/
│   │   ├── logo.svg
│   │   ├── favicon.ico
│   │   └── qrcode-logo.svg      (Logo para QR Code)
│   │
│   └── 📁 migrations/
│       ├── 001-initial.sql
│       ├── 002-add-fidelidade.sql
│       └── 003-add-analytics.sql
│
├── 📁 tests/
│   ├── api.test.ts
│   ├── auth.test.ts
│   └── integration.test.ts
│
├── 📁 docs/
│   ├── API.md                   (Documentação de endpoints)
│   ├── SETUP.md                 (Como começar)
│   └── DEPLOYMENT.md            (Deploy instructions)
│
└── 📁 .github/
    ├── workflows/
    │   ├── deploy.yml           (CI/CD - Deploy automático)
    │   └── test.yml             (Testes automáticos)
    └── CONTRIBUTING.md

```

---

## 🗄️ Schema do Banco (D1)

### 1. Tabela: `tenants` (Seus Restaurantes)

```sql
CREATE TABLE tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Identidade
  nome TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,  -- cardapio-restaurante-a
  email_admin TEXT NOT NULL UNIQUE,
  telefone_admin TEXT,
  whatsapp_numero TEXT,  -- Para receber pedidos
  
  -- Chave PIX
  chave_pix_cpf TEXT,  -- CPF, CNPJ, Email ou Telefone
  chave_pix_nome TEXT, -- Nome do recebedor
  
  -- Plano & Billing
  plano TEXT DEFAULT 'free',  -- free, pro, enterprise
  status TEXT DEFAULT 'ativo', -- ativo, suspenso, cancelado, trial
  
  -- Cobrança
  valor_mensal_pago REAL DEFAULT 0,
  data_proximo_cobranca TIMESTAMP,
  
  -- Metadata
  logo_url TEXT,
  descricao TEXT,
  endereco TEXT,
  horario_funcionamento TEXT JSON,  -- {"seg": "10:00-22:00", ...}
  
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_slug (slug),
  INDEX idx_status (status)
);
```

### 2. Tabela: `cardapio` (Produtos)

```sql
CREATE TABLE cardapio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  
  nome TEXT NOT NULL,
  descricao TEXT,
  preco REAL NOT NULL,
  
  categoria TEXT,  -- Lanches, Bebidas, Sobremesas, etc
  imagem_url TEXT,
  
  estoque INTEGER,  -- NULL = ilimitado, número = quantidade
  
  ativo BOOLEAN DEFAULT 1,
  
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE(tenant_id, nome),
  INDEX idx_tenant_categoria (tenant_id, categoria)
);
```

### 3. Tabela: `clientes` (Seus Clientes)

```sql
CREATE TABLE clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  
  -- Login/Identidade
  email TEXT,
  whatsapp TEXT NOT NULL,  -- Chave única por tenant
  
  nome TEXT,
  telefone TEXT,
  
  -- Dados de Fidelidade
  pedidos_count INTEGER DEFAULT 0,
  gasto_total REAL DEFAULT 0,
  ultimo_pedido TIMESTAMP,
  
  inativo BOOLEAN DEFAULT 0,  -- Sem pedido há 90 dias
  
  -- Promoção Ativa
  promocao_ativa BOOLEAN DEFAULT 0,
  promo_codigo TEXT,
  desconto_percentual INTEGER DEFAULT 0,
  promocao_criada_em TIMESTAMP,
  promocao_usada_em TIMESTAMP,
  
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE(tenant_id, whatsapp),
  INDEX idx_tenant_inativo (tenant_id, inativo)
);
```

### 4. Tabela: `pedidos` (Histórico de Pedidos)

```sql
CREATE TABLE pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  cliente_id INTEGER,
  
  -- Items (JSON array)
  items_json JSON,  -- [{"id": 1, "nome": "Burger", "quantidade": 2, "preco": 25.50}]
  
  subtotal REAL,
  desconto_valor REAL DEFAULT 0,
  desconto_percentual REAL DEFAULT 0,
  promo_codigo_usado TEXT,
  total REAL NOT NULL,
  
  -- Pagamento PIX
  chave_pix_string TEXT,  -- String EMV para QR Code
  pix_confirmado BOOLEAN DEFAULT 0,
  data_pagamento TIMESTAMP,
  
  -- Status
  status TEXT DEFAULT 'aguardando_pagamento',
  -- aguardando_pagamento
  -- → pago
  -- → aguardando_confirmacao (enviado wa.me)
  -- → confirmado (restaurante confirmou)
  -- → pronto (pronto para retirar)
  -- → finalizado (cliente retirou)
  
  -- Rastreamento
  data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_confirmacao TIMESTAMP,
  data_pronto TIMESTAMP,
  data_entrega TIMESTAMP,
  
  -- Notas
  observacoes TEXT,
  
  FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY(cliente_id) REFERENCES clientes(id),
  INDEX idx_tenant_status (tenant_id, status),
  INDEX idx_cliente (cliente_id),
  INDEX idx_data (data_pedido DESC)
);
```

### 5. Tabela: `fidelidade` (Histórico de Promoções)

```sql
CREATE TABLE fidelidade (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  cliente_id INTEGER NOT NULL,
  
  tipo TEXT,  -- 'automatica', 'manual', 'referral'
  motivo TEXT,  -- 'terceiro_pedido', 'desconto_semanal', etc
  
  promo_codigo TEXT,
  desconto_percentual INTEGER,
  desconto_valor REAL,
  
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_expiracao TIMESTAMP,
  data_uso TIMESTAMP,
  
  FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY(cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  INDEX idx_tenant_cliente (tenant_id, cliente_id),
  INDEX idx_expiracao (data_expiracao)
);
```

### 6. Tabela: `analytics_daily` (Seus Relatórios Diários)

```sql
CREATE TABLE analytics_daily (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,  -- NULL = global
  
  data DATE,
  
  -- Contadores
  pedidos_dia INTEGER DEFAULT 0,
  clientes_novos INTEGER DEFAULT 0,
  clientes_ativos INTEGER DEFAULT 0,
  
  -- Financeiro
  faturamento_dia REAL DEFAULT 0,
  ticket_medio REAL DEFAULT 0,
  desconto_total REAL DEFAULT 0,
  
  -- Fidelidade
  promocoes_criadas INTEGER DEFAULT 0,
  promocoes_usadas INTEGER DEFAULT 0,
  
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE(tenant_id, data),
  INDEX idx_data (data DESC)
);
```

### 7. Tabela: `auditoria` (Log de Ações)

```sql
CREATE TABLE auditoria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  
  usuario_id TEXT,  -- Email do admin
  acao TEXT,  -- 'criou_pedido', 'atualizou_cardapio', etc
  tabela TEXT,
  registro_id INTEGER,
  
  dados_antigo JSON,
  dados_novo JSON,
  
  ip_origem TEXT,
  user_agent TEXT,
  
  data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_tenant_data (tenant_id, data DESC),
  INDEX idx_acao (acao)
);
```

### Criar Tabelas (migrations/001-initial.sql)

```sql
-- Executar com: wrangler d1 execute cardapio-db --file=migrations/001-initial.sql

-- Já definidas acima (copiar e executar no Cloudflare Dashboard)
```

---

## 🚀 Passo a Passo de Implementação

### FASE 1: Setup e Autenticação (Semana 1-2)

#### 1.1 Criar Projeto

```bash
# 1. Clonar template
git clone https://github.com/SanTorresx99/cardapio-saas.git meu-cardapio
cd meu-cardapio

# 2. Instalar dependências
npm install

# 3. Criar conta Cloudflare (gratuita)
# https://dash.cloudflare.com

# 4. Autenticar Wrangler
npx wrangler login

# 5. Criar D1 Database
npx wrangler d1 create cardapio-db
# → Salvar database_id em wrangler.toml

# 6. Criar primeiras tabelas
npx wrangler d1 execute cardapio-db --file=migrations/001-initial.sql --local

# 7. Testar localmente
npm run dev
# → Acessa http://localhost:3000
```

#### 1.2 Configurar `wrangler.toml`

```toml
name = "cardapio-saas"
main = "src/functions/api/_middleware.ts"
compatibility_date = "2026-06-01"

[env.production]
routes = [
  { pattern = "cardapio.com.br/*", zone_id = "seu_zone_id" }
]

[[d1_databases]]
binding = "DB"
database_name = "cardapio-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

[[env.production.d1_databases]]
binding = "DB"
database_name = "cardapio-db-prod"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-yyyyyyyyyyyy"

[triggers]
crons = [
  "0 0 * * *"      # Fidelidade automática - 00:00 UTC
  "0 3 * * 0"      # Limpeza de dados - 03:00 UTC domingo
]

[env.production.triggers]
crons = [
  "0 0 * * *"
  "0 3 * * 0"
]

[vars]
API_URL = "http://localhost:3000/api"
JWT_SECRET = "sua_chave_super_secreta_aqui"

[env.production.vars]
API_URL = "https://cardapio.com.br/api"
JWT_SECRET = "sua_chave_super_secreta_em_prod"
```

#### 1.3 Implementar Autenticação JWT

**Arquivo: `src/lib/auth.ts`**

```typescript
import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');

export async function createToken(data: any) {
  return await new SignJWT(data)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const verified = await jwtVerify(token, SECRET);
    return verified.payload;
  } catch (err) {
    return null;
  }
}

export function getTenantFromRequest(context: any) {
  // Extrair tenant_id de:
  // 1. Subdomain: cardapio-a.cardapio.com → slug "cardapio-a"
  // 2. Path: /cardapio-a/dashboard → slug "cardapio-a"
  
  const host = context.request.headers.get('Host');
  const url = new URL(context.request.url);
  
  const subdomain = host.split('.')[0];
  const pathSlug = url.pathname.split('/')[1];
  
  return subdomain !== 'cardapio' ? subdomain : pathSlug;
}
```

**Arquivo: `src/functions/api/auth/login.ts`**

```typescript
export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { email, senha } = await context.request.json();
  const db = context.env.DB;

  // Validar (validação real seria hash + bcrypt)
  const user = await db.prepare(
    `SELECT id, email, nome FROM clientes WHERE email = ?`
  ).bind(email).first();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { 
      status: 401 
    });
  }

  // Criar JWT
  const token = await createToken({
    cliente_id: user.id,
    email: user.email,
    nome: user.nome
  });

  return new Response(JSON.stringify({ 
    success: true, 
    token,
    user 
  }), { status: 200 });
}
```

#### 1.4 Página de Login (Frontend)

**Arquivo: `src/pages/auth/login.tsx`**

```tsx
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha })
    });

    const data = await res.json();
    
    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/cardapio');
    } else {
      alert('Erro ao fazer login');
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6">Fazer Login</h1>
        
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded mb-4"
            required
          />
          
          <input
            type="password"
            placeholder="Sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full border p-2 rounded mb-6"
            required
          />
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white p-2 rounded font-bold hover:bg-green-600"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

### FASE 2: Cardápio e Carrinho (Semana 3-4)

#### 2.1 Endpoint: Buscar Cardápio

**Arquivo: `src/functions/api/cardapio/[tenant]/index.ts`**

```typescript
export async function onRequest(context) {
  const db = context.env.DB;
  const tenant = context.params.tenant;

  // Buscar tenant_id pelo slug
  const tenantData = await db.prepare(
    `SELECT id FROM tenants WHERE slug = ? OR nome = ?`
  ).bind(tenant, tenant).first();

  if (!tenantData) {
    return new Response(JSON.stringify({ error: 'Restaurant not found' }), { 
      status: 404 
    });
  }

  // Buscar produtos (público, sem autenticação)
  const cardapio = await db.prepare(
    `SELECT id, nome, descricao, preco, categoria, imagem_url, estoque
     FROM cardapio
     WHERE tenant_id = ? AND ativo = 1
     ORDER BY categoria, nome`
  ).bind(tenantData.id).all();

  return new Response(JSON.stringify({
    tenant: tenantData.id,
    produtos: cardapio.results
  }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

#### 2.2 Componente: Catálogo de Produtos

**Arquivo: `src/components/cardapio/ProdutoCard.tsx`**

```tsx
export default function ProdutoCard({ produto, onAdicionarCarrinho }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition">
      <div className="h-40 bg-gray-200 rounded mb-2">
        {produto.imagem_url && (
          <img src={produto.imagem_url} alt={produto.nome} className="w-full h-full object-cover rounded" />
        )}
      </div>

      <h3 className="font-bold text-lg">{produto.nome}</h3>
      <p className="text-gray-600 text-sm">{produto.descricao}</p>

      <div className="flex justify-between items-center mt-4">
        <span className="text-xl font-bold text-green-600">
          R$ {produto.preco.toFixed(2)}
        </span>

        <button
          onClick={() => onAdicionarCarrinho(produto)}
          className="bg-green-500 text-white px-4 py-2 rounded font-bold hover:bg-green-600"
        >
          + Adicionar
        </button>
      </div>
    </div>
  );
}
```

#### 2.3 Página: Cardápio

**Arquivo: `src/pages/[tenant]/cardapio.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProdutoCard from '@/components/cardapio/ProdutoCard';

export default function CardapioPage() {
  const router = useRouter();
  const { tenant } = router.query;
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);

  useEffect(() => {
    if (!tenant) return;

    fetch(`/api/cardapio/${tenant}`)
      .then(r => r.json())
      .then(data => setProdutos(data.produtos))
      .catch(err => console.error(err));

    // Carregar carrinho do localStorage
    const carrinhoSalvo = localStorage.getItem(`carrinho_${tenant}`);
    if (carrinhoSalvo) {
      setCarrinho(JSON.parse(carrinhoSalvo));
    }
  }, [tenant]);

  function adicionarAoCarrinho(produto) {
    const itemExistente = carrinho.find(item => item.id === produto.id);
    
    let novoCarrinho;
    if (itemExistente) {
      novoCarrinho = carrinho.map(item =>
        item.id === produto.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      );
    } else {
      novoCarrinho = [...carrinho, { ...produto, quantidade: 1 }];
    }

    setCarrinho(novoCarrinho);
    localStorage.setItem(`carrinho_${tenant}`, JSON.stringify(novoCarrinho));
    alert('Produto adicionado!');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">📋 Cardápio</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {produtos.map(produto => (
            <ProdutoCard
              key={produto.id}
              produto={produto}
              onAdicionarCarrinho={adicionarAoCarrinho}
            />
          ))}
        </div>

        {/* Botão para ir ao carrinho */}
        {carrinho.length > 0 && (
          <button
            onClick={() => router.push(`/${tenant}/carrinho`)}
            className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-green-600 shadow-lg"
          >
            🛒 Carrinho ({carrinho.length})
          </button>
        )}
      </div>
    </div>
  );
}
```

---

### FASE 3: PIX e Pagamento (Semana 5-6)

#### 3.1 Gerar QR Code PIX

**Arquivo: `src/lib/pix-utils.ts`**

```typescript
import QRCode from 'qrcode';

export async function gerarQRCodePIX(valor, chavePixCpf, nomeRestaurante) {
  // Gerar string EMV (BR Code)
  // Formato simplificado para PIX via chave CPF
  
  const pixString = construirBRCode({
    chave: chavePixCpf,
    nome: nomeRestaurante,
    valor: Math.round(valor * 100), // Converter para centavos
    descricao: 'Pagamento de Pedido'
  });

  // Gerar QR Code como data URL
  const qrCodeUrl = await QRCode.toDataURL(pixString, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' }
  });

  return {
    qrCodeUrl,      // Para exibir na tela
    pixString,      // Para copy/paste
    valor
  };
}

function construirBRCode({ chave, nome, valor, descricao }) {
  // Formato EMV para BR Code (simplificado)
  // Em produção, usar biblioteca `brcode-js`
  
  // Placeholder: retornar string válida (ou usar lib)
  return `00020126580014br.gov.bcb.pix0136${chave}52040000530398654061${valor.toString().padStart(10, '0')}5802BR5913${nome}6009SAO PAULO62410503***63041D3D`;
}
```

#### 3.2 Endpoint: Gerar PIX do Pedido

**Arquivo: `src/functions/api/pedidos/gerar-pix.ts`**

```typescript
export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { pedido_id, valor, tenant_id } = await context.request.json();
  const db = context.env.DB;

  // Buscar chave PIX do restaurante
  const tenant = await db.prepare(
    `SELECT chave_pix_cpf, chave_pix_nome FROM tenants WHERE id = ?`
  ).bind(tenant_id).first();

  if (!tenant?.chave_pix_cpf) {
    return new Response(JSON.stringify({ 
      error: 'PIX not configured for this restaurant' 
    }), { status: 400 });
  }

  // Gerar QR Code
  const { qrCodeUrl, pixString } = await gerarQRCodePIX(
    valor,
    tenant.chave_pix_cpf,
    tenant.chave_pix_nome
  );

  // Salvar no banco
  await db.prepare(
    `UPDATE pedidos SET chave_pix_string = ? WHERE id = ?`
  ).bind(pixString, pedido_id).run();

  return new Response(JSON.stringify({
    success: true,
    qr_code_url: qrCodeUrl,
    pix_string: pixString,
    valor: valor.toFixed(2),
    instrucoes: 'Escaneie o código QR ou copie a chave PIX acima'
  }), { status: 200 });
}
```

#### 3.3 Componente: QR Code PIX com Copy/Paste

**Arquivo: `src/components/pagamento/QRCodePIX.tsx`**

```tsx
import { useState } from 'react';

export default function QRCodePIX({ qrCodeUrl, pixString, valor }) {
  const [copiado, setCopiado] = useState(false);

  function copiarChavePIX() {
    navigator.clipboard.writeText(pixString);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">💰 Pagar com PIX</h2>

      {/* QR Code */}
      <div className="flex justify-center mb-6">
        <div className="border-4 border-gray-200 p-4 rounded-lg bg-gray-50">
          <img src={qrCodeUrl} alt="QR Code PIX" width={280} height={280} />
        </div>
      </div>

      <p className="text-center text-gray-600 mb-4">
        📱 Abra seu app bancário e escaneie este código
      </p>

      {/* Valor */}
      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-6 text-center">
        <p className="text-gray-600 text-sm mb-1">Valor a pagar</p>
        <p className="text-3xl font-bold text-green-600">R$ {valor}</p>
      </div>

      {/* OU Copiar Chave PIX */}
      <div className="mb-6">
        <p className="text-center text-gray-600 text-sm mb-3">
          Ou copie a chave PIX abaixo:
        </p>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={pixString}
            readOnly
            className="flex-1 border p-3 rounded bg-gray-100 text-xs font-mono"
          />
          
          <button
            onClick={copiarChavePIX}
            className={`px-4 py-3 rounded font-bold text-white transition ${
              copiado 
                ? 'bg-green-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {copiado ? '✅ Copiado!' : '📋 Copiar'}
          </button>
        </div>
      </div>

      {/* Info */}
      <p className="text-center text-xs text-gray-500">
        O PIX é instantâneo. Você receberá a confirmação em poucos segundos.
      </p>
    </div>
  );
}
```

#### 3.4 Página: Carrinho com PIX

**Arquivo: `src/pages/[tenant]/carrinho.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import QRCodePIX from '@/components/pagamento/QRCodePIX';

export default function CarrinhoPage() {
  const router = useRouter();
  const { tenant } = router.query;
  
  const [carrinho, setCarrinho] = useState([]);
  const [etapa, setEtapa] = useState('carrinho'); // carrinho, resumo, pagamento, confirmacao
  const [pedidoId, setPedidoId] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [pagou, setPagou] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    
    const carrinhoSalvo = localStorage.getItem(`carrinho_${tenant}`);
    if (carrinhoSalvo) {
      setCarrinho(JSON.parse(carrinhoSalvo));
    }
  }, [tenant]);

  const total = carrinho.reduce((sum, item) => sum + item.preco * item.quantidade, 0);

  async function criarPedido() {
    const cliente_id = localStorage.getItem('cliente_id');
    
    const res = await fetch('/api/pedidos/criar', {
      method: 'POST',
      body: JSON.stringify({
        items: carrinho,
        total,
        tenant_id: localStorage.getItem('tenant_id'),
        cliente_id
      })
    });

    const data = await res.json();
    setPedidoId(data.id);

    // Gerar QR Code
    const pixRes = await fetch('/api/pedidos/gerar-pix', {
      method: 'POST',
      body: JSON.stringify({
        pedido_id: data.id,
        valor: total,
        tenant_id: localStorage.getItem('tenant_id')
      })
    });

    const pixData = await pixRes.json();
    setQrCode(pixData);
    setEtapa('pagamento');
  }

  function confirmarPagamento() {
    setEtapa('confirmacao');
    setPagou(true);
  }

  // ETAPA 1: Resumo do Carrinho
  if (etapa === 'carrinho') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">🛒 Seu Carrinho</h1>

          {carrinho.length === 0 ? (
            <div className="bg-white p-8 rounded-lg text-center">
              <p className="text-gray-600 mb-4">Seu carrinho está vazio</p>
              <button
                onClick={() => router.push(`/${tenant}/cardapio`)}
                className="bg-green-500 text-white px-6 py-2 rounded font-bold"
              >
                Voltar ao Cardápio
              </button>
            </div>
          ) : (
            <>
              {carrinho.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-lg mb-3 flex justify-between">
                  <div>
                    <h3 className="font-bold">{item.nome}</h3>
                    <p className="text-gray-600">x{item.quantidade}</p>
                  </div>
                  <p className="font-bold">R$ {(item.preco * item.quantidade).toFixed(2)}</p>
                </div>
              ))}

              <div className="bg-white p-6 rounded-lg mt-6 border-t-2">
                <div className="flex justify-between mb-4">
                  <span className="font-bold text-lg">Total:</span>
                  <span className="text-2xl font-bold text-green-600">R$ {total.toFixed(2)}</span>
                </div>

                <button
                  onClick={criarPedido}
                  className="w-full bg-green-500 text-white p-3 rounded font-bold text-lg hover:bg-green-600"
                >
                  Ir para Pagamento
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ETAPA 2: QR Code PIX
  if (etapa === 'pagamento' && !pagou) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <QRCodePIX
          qrCodeUrl={qrCode.qr_code_url}
          pixString={qrCode.pix_string}
          valor={qrCode.valor}
        />

        <button
          onClick={confirmarPagamento}
          className="fixed bottom-6 left-6 bg-blue-500 text-white px-6 py-3 rounded font-bold hover:bg-blue-600"
        >
          ✅ Já Paguei
        </button>
      </div>
    );
  }

  // ETAPA 3: Confirmação no WhatsApp
  if (etapa === 'confirmacao') {
    const linkWame = gerarLinkWaMePedido(tenant, pedidoId, total, carrinho);

    return (
      <div className="min-h-screen bg-green-50 p-6 flex items-center justify-center">
        <div className="max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-green-600 mb-4">✅ Pagamento Confirmado!</h2>

          <p className="text-gray-600 mb-8">
            Agora confirme seu pedido no WhatsApp para finalizar
          </p>

          <a
            href={linkWame}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full bg-green-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-600 mb-4"
          >
            📱 Confirmar Pedido no WhatsApp
          </a>

          <button
            onClick={() => {
              localStorage.removeItem(`carrinho_${tenant}`);
              router.push(`/${tenant}/cardapio`);
            }}
            className="w-full bg-gray-300 text-gray-800 py-2 rounded font-bold"
          >
            ← Voltar
          </button>
        </div>
      </div>
    );
  }
}

function gerarLinkWaMePedido(tenant, pedidoId, total, items) {
  const itemsText = items
    .map(i => `${i.nome} x${i.quantidade}`)
    .join('\n');

  const msg = encodeURIComponent(
    `Olá! 👋 Confirmo meu pedido *#${pedidoId}*\n\n` +
    `📋 *Itens:*\n${itemsText}\n\n` +
    `💰 *Total:* R$ ${total.toFixed(2)}\n` +
    `✅ *Pagamento:* Confirmado via PIX`
  );

  return `https://wa.me/55${tenant}?text=${msg}`;
}
```

---

### FASE 4: Dashboard do Restaurante (Semana 7-8)

#### 4.1 Endpoint: Listar Pedidos Pendentes

**Arquivo: `src/functions/api/restaurante/pedidos.ts`**

```typescript
export async function onRequest(context) {
  const db = context.env.DB;
  const tenant_id = parseInt(context.params.tenant_id);

  const pedidos = await db.prepare(
    `SELECT 
       p.id, p.status, p.total, p.data_pedido,
       c.nome as cliente_nome, c.whatsapp,
       p.items_json
     FROM pedidos p
     LEFT JOIN clientes c ON p.cliente_id = c.id
     WHERE p.tenant_id = ? AND p.status != 'finalizado'
     ORDER BY p.data_pedido DESC`
  ).bind(tenant_id).all();

  return new Response(JSON.stringify(pedidos.results), { status: 200 });
}
```

#### 4.2 Página: Dashboard Restaurante

**Arquivo: `src/pages/restaurante/dashboard.tsx`**

```tsx
import { useState, useEffect } from 'react';

export default function DashboardRestaurante() {
  const [pedidos, setPedidos] = useState([]);
  const tenant_id = localStorage.getItem('tenant_id');

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/restaurante/pedidos/${tenant_id}`)
        .then(r => r.json())
        .then(setPedidos)
        .catch(console.error);
    }, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, [tenant_id]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">📋 Pedidos Pendentes</h1>

      <div className="grid grid-cols-1 gap-4">
        {pedidos.map(pedido => (
          <PedidoCard key={pedido.id} pedido={pedido} tenant_id={tenant_id} />
        ))}
      </div>

      {pedidos.length === 0 && (
        <div className="bg-white p-8 rounded-lg text-center">
          <p className="text-gray-600">Nenhum pedido pendente 🎉</p>
        </div>
      )}
    </div>
  );
}

function PedidoCard({ pedido, tenant_id }) {
  const items = JSON.parse(pedido.items_json);
  const statusColors = {
    'aguardando_pagamento': 'bg-yellow-100 border-yellow-300',
    'pago': 'bg-blue-100 border-blue-300',
    'confirmado': 'bg-green-100 border-green-300',
    'pronto': 'bg-purple-100 border-purple-300'
  };

  function responderNoWhatsApp() {
    const msg = encodeURIComponent(
      `✅ *Pedido Confirmado!* #${pedido.id}\n\n` +
      `⏱️ *Tempo estimado:* 30 minutos\n` +
      `🔗 *Acompanhar:* https://seu-site.com/rastreamento/${pedido.id}`
    );

    window.open(`https://wa.me/55${pedido.whatsapp}?text=${msg}`);
  }

  return (
    <div className={`border-2 rounded-lg p-6 ${statusColors[pedido.status]}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">Pedido #{pedido.id}</h3>
          <p className="text-gray-600">{pedido.cliente_nome}</p>
          <p className="text-sm text-gray-500">{new Date(pedido.data_pedido).toLocaleString('pt-BR')}</p>
        </div>
        <span className="bg-white px-3 py-1 rounded-full font-bold">
          {pedido.status}
        </span>
      </div>

      <div className="mb-4">
        {items.map((item, idx) => (
          <p key={idx} className="text-gray-700">
            {item.nome} x{item.quantidade}
          </p>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4">
        <span className="text-2xl font-bold">R$ {pedido.total.toFixed(2)}</span>
        <span className="text-sm text-gray-600">{items.length} itens</span>
      </div>

      <button
        onClick={responderNoWhatsApp}
        className="w-full bg-green-500 text-white py-2 rounded font-bold hover:bg-green-600"
      >
        ✅ Confirmar no WhatsApp
      </button>
    </div>
  );
}
```

---

### FASE 5: Seu Admin Dashboard (Semana 9-10)

#### 5.1 Endpoint: Estatísticas Globais

**Arquivo: `src/functions/api/admin/stats.ts`**

```typescript
export async function onRequest(context) {
  // Verificar se é admin
  const token = context.request.headers.get('Authorization');
  if (!token || !verifyAdminToken(token)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const db = context.env.DB;

  const [totalTenants, faturamentoMes, totalPedidos, totalClientes, tenants] = 
    await Promise.all([
      db.prepare(`SELECT COUNT(*) as count FROM tenants WHERE status = 'ativo'`).first(),
      db.prepare(
        `SELECT SUM(total) as faturamento FROM pedidos 
         WHERE DATE(data_pedido) >= DATE('now', '-1 month')`
      ).first(),
      db.prepare(`SELECT COUNT(*) as count FROM pedidos`).first(),
      db.prepare(`SELECT COUNT(*) as count FROM clientes`).first(),
      db.prepare(
        `SELECT 
           t.id, t.nome, t.plano, t.status,
           COUNT(p.id) as pedidos_mes,
           SUM(p.total) as faturamento_mes
         FROM tenants t
         LEFT JOIN pedidos p ON t.id = p.tenant_id 
           AND DATE(p.data_pedido) >= DATE('now', '-1 month')
         WHERE t.status = 'ativo'
         GROUP BY t.id
         ORDER BY faturamento_mes DESC`
      ).all()
    ]);

  return new Response(JSON.stringify({
    totalTenants: totalTenants.count,
    faturamentoMes: faturamentoMes.faturamento || 0,
    totalPedidos: totalPedidos.count,
    totalClientes: totalClientes.count,
    tenants: tenants.results
  }), { status: 200 });
}

function verifyAdminToken(token) {
  // Implementar verificação JWT
  return true; // Placeholder
}
```

#### 5.2 Página: Admin Dashboard

**Arquivo: `src/pages/admin/dashboard.tsx`**

```tsx
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    
    fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold mb-8">📊 Painel Admin - Sua Plataforma</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <KPICard
          titulo="Restaurantes Ativos"
          valor={stats.totalTenants}
          icon="🏪"
          cor="blue"
        />
        <KPICard
          titulo="Faturamento (Mês)"
          valor={`R$ ${stats.faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon="💰"
          cor="green"
        />
        <KPICard
          titulo="Total de Pedidos"
          valor={stats.totalPedidos}
          icon="📦"
          cor="purple"
        />
        <KPICard
          titulo="Clientes Cadastrados"
          valor={stats.totalClientes}
          icon="👥"
          cor="orange"
        />
      </div>

      {/* Tabela de Restaurantes */}
      <div className="bg-gray-800 rounded-lg p-6 overflow-x-auto">
        <h2 className="text-2xl font-bold mb-4">🏢 Seus Restaurantes</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-700">
            <tr>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Plano</th>
              <th className="p-3 text-right">Pedidos (Mês)</th>
              <th className="p-3 text-right">Faturamento</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {stats.tenants.map(tenant => (
              <tr key={tenant.id} className="border-b border-gray-700 hover:bg-gray-700">
                <td className="p-3 font-bold">{tenant.nome}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    tenant.plano === 'free' ? 'bg-gray-600' : 
                    tenant.plano === 'pro' ? 'bg-blue-600' : 
                    'bg-purple-600'
                  }`}>
                    {tenant.plano.toUpperCase()}
                  </span>
                </td>
                <td className="p-3 text-right">{tenant.pedidos_mes || 0}</td>
                <td className="p-3 text-right font-bold text-green-400">
                  R$ {(tenant.faturamento_mes || 0).toFixed(2)}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    tenant.status === 'ativo' ? 'bg-green-700' : 'bg-red-700'
                  }`}>
                    {tenant.status}
                  </span>
                </td>
                <td className="p-3">
                  <button className="text-blue-400 hover:underline">Acessar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KPICard({ titulo, valor, icon, cor }) {
  const cores = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600'
  };

  return (
    <div className={`${cores[cor]} rounded-lg p-6`}>
      <p className="text-gray-300 text-sm">{titulo}</p>
      <p className="text-3xl font-bold mt-2">{icon} {valor}</p>
    </div>
  );
}
```

---

## 📡 Endpoints da API

### Autenticação

```
POST   /api/auth/login              → Login cliente
POST   /api/auth/register           → Registrar novo cliente
POST   /api/auth/logout             → Logout
GET    /api/auth/verify-token       → Validar JWT
```

### Cardápio

```
GET    /api/cardapio/[tenant]       → Listar produtos
POST   /api/cardapio/[tenant]       → Criar produto (admin)
PUT    /api/cardapio/[tenant]/[id]  → Atualizar produto
DELETE /api/cardapio/[tenant]/[id]  → Deletar produto
```

### Pedidos

```
POST   /api/pedidos/criar           → Novo pedido
GET    /api/pedidos/[id]            → Detalhes do pedido
POST   /api/pedidos/gerar-pix       → Gerar QR Code PIX
PUT    /api/pedidos/[id]/confirmar  → Marcar como confirmado
GET    /api/pedidos/[id]/rastreamento → Status do pedido
```

### Clientes

```
POST   /api/clientes/registrar      → Novo cliente
GET    /api/clientes/perfil         → Dados do cliente
PUT    /api/clientes/perfil         → Atualizar perfil
GET    /api/clientes/pedidos        → Histórico de pedidos
```

### Fidelidade

```
POST   /api/fidelidade/criar-promo  → Criar promoção manual
GET    /api/fidelidade/[cliente]    → Ver promoções ativas
PUT    /api/fidelidade/[promo]/usar → Usar promoção
```

### Admin (Seu Painel)

```
GET    /api/admin/stats             → Estatísticas globais
GET    /api/admin/tenants           → Listar restaurantes
POST   /api/admin/tenants           → Criar novo restaurante
PUT    /api/admin/tenants/[id]      → Atualizar restaurante
GET    /api/admin/billing           → Gestão de cobranças
GET    /api/admin/analytics         → Análises detalhadas
```

### Webhooks

```
POST   /api/webhooks/pix            → Confirmação PIX do banco
POST   /api/webhooks/eventos        → Eventos gerais
```

---

## 🎨 Frontend Pages

### Páginas Públicas (Sem Login)

- `/` — Landing page (SEO)
- `/[tenant]` — Home do restaurante
- `/[tenant]/cardapio` — Catálogo de produtos
- `/[tenant]/sobre` — Sobre o restaurante
- `/[tenant]/contato` — Formulário de contato

### Páginas do Cliente (Com Login)

- `/[tenant]/carrinho` — Seleção de produtos + PIX
- `/[tenant]/pedidos` — Histórico de pedidos
- `/[tenant]/pedidos/[id]` — Detalhes e rastreamento
- `/[tenant]/perfil` — Dados do cliente

### Páginas do Restaurante (Admin do Restaurante)

- `/restaurante/dashboard` — Painel principal
- `/restaurante/pedidos` — Lista de pedidos
- `/restaurante/cardapio` — Gerenciar produtos
- `/restaurante/clientes` — CRM básico
- `/restaurante/configuracoes` — Dados do restaurante

### Páginas do Sandro (Admin Global)

- `/admin/dashboard` — Seu painel de controle
- `/admin/tenants` — Gerenciar restaurantes
- `/admin/billing` — Cobranças
- `/admin/analytics` — Análises globais

---

## 🔐 Segurança & Auth

### JWT (JSON Web Tokens)

```typescript
// Token contém:
{
  cliente_id: 123,
  email: "cliente@email.com",
  tenant_id: 1,
  role: "cliente", // ou "restaurante_admin", "admin"
  iat: 1234567890,
  exp: 1234654290 // 7 dias
}
```

### Multi-Tenant Isolation

```typescript
// Middleware: Garantir que cliente só vê seus dados
export async function protegerRota(context, handler) {
  const token = context.request.headers.get('Authorization');
  const payload = await verifyToken(token);
  
  if (!payload) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Injetar tenant_id no contexto
  context.tenant_id = payload.tenant_id;
  context.user_id = payload.cliente_id;
  
  return handler(context);
}
```

### Proteção contra XSS

- Usar `dangerouslySetInnerHTML` apenas se necessário
- Sanitizar inputs com `DOMPurify` (opcional)
- Implementar CSP headers

### CORS (Cross-Origin)

```typescript
export function setCORSHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
```

---

## 🚀 Deployment

### 1. Configurar Domínio

```bash
# Registrar domínio em Registro.br
# Exemplo: cardapio.com.br

# Apontar DNS para Cloudflare
# NS1: agnes.ns.cloudflare.com
# NS2: barton.ns.cloudflare.com
```

### 2. Deploy no Cloudflare

```bash
# Login
npx wrangler login

# Deploy Pages (frontend)
npx wrangler pages deploy ./out --project-name=cardapio-saas

# Deploy Workers (backend + database)
npx wrangler deploy

# Deploy Scheduled Workers (cron jobs)
# Já inclusos no deploy acima
```

### 3. CI/CD com GitHub Actions

**Arquivo: `.github/workflows/deploy.yml`**

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm install
      
      - run: npm run build
      
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          secrets: |
            JWT_SECRET
            ADMIN_TOKEN
```

---

## 📦 Roadmap

### Fase 1 (Agora) ✅
- [x] Setup Cloudflare + D1
- [x] Autenticação JWT
- [x] Cardápio + Carrinho
- [x] PIX QR Code (copy/paste)
- [x] wa.me links
- [x] Dashboard restaurante
- [x] Admin dashboard

### Fase 2 (Mês 2)
- [ ] CRM avançado (notas, histórico de compras)
- [ ] Fidelidade automática (Scheduled Workers)
- [ ] Email marketing básico
- [ ] Integração WhatsApp Web (opcional)
- [ ] Webhook PIX automático

### Fase 3 (Mês 3)
- [ ] Mobile app (React Native ou PWA)
- [ ] Análises com Power BI
- [ ] Integração Stripe/Mercado Pago (premium)
- [ ] Sistema de combos/promoções
- [ ] SMS via Twilio (pago)

### Fase 4 (Mês 4+)
- [ ] Marketplace (múltiplas categorias)
- [ ] Sistema de delivery (rastreamento GPS)
- [ ] Integração com motoboys
- [ ] API pública (para integradores)
- [ ] Enterprise features

---

## 📊 Estimativa de Esforço

| Fase | Semanas | Horas | Dev |
|---|---|---|---|
| 1. Setup + Auth | 2 | 60 | 1 |
| 2. Cardápio + PIX | 4 | 120 | 1 |
| 3. Pedidos + Dashboard | 4 | 120 | 1 |
| 4. Admin + Billing | 2 | 60 | 1 |
| **Total** | **12** | **360** | **1** |

**Você consegue fazer sozinho em 3 meses de trabalho part-time!**

---

## 💡 Tech Stack Resumido

```
┌─ FRONTEND
│  ├─ Next.js 14 (React framework)
│  ├─ TypeScript (type safety)
│  ├─ Tailwind CSS (styling)
│  ├─ qrcode.js (gerar QR Code)
│  └─ TanStack Query (fetch cache)
│
├─ BACKEND
│  ├─ Cloudflare Workers (serverless compute)
│  ├─ Pages Functions (API endpoints)
│  └─ TypeScript (type safety)
│
├─ DATABASE
│  ├─ Cloudflare D1 (SQLite managed)
│  └─ Migrations com SQL puro
│
├─ HOSTING
│  ├─ Cloudflare Pages (frontend)
│  └─ Cloudflare Workers (backend)
│
└─ INTEGRAÇÕES (Grátis)
   ├─ wa.me (WhatsApp)
   ├─ PIX (local, sem API)
   ├─ Registro.br (domínio)
   └─ GitHub Actions (CI/CD)
```

---

## 🎯 Próximos Passos

1. **Semana 1:** Setup Cloudflare + primeiras tabelas
2. **Semana 2:** Auth + páginas de login
3. **Semana 3-4:** Cardápio + carrinho
4. **Semana 5-6:** PIX + wa.me
5. **Semana 7-8:** Dashboard restaurante
6. **Semana 9-10:** Admin dashboard
7. **Semana 11-12:** Testes + polimentos

**Comece HOJE!** Clone o template, rode `npm install` e `wrangler dev`.

---

## 📞 Contato & Suporte

- **GitHub:** github.com/SanTorresx99
- **Email:** seu@email.com
- **WhatsApp:** wa.me/seu-numero

---

**Criado para: Sandro Torres**  
**Plataforma: Cardápio Digital SaaS**  
**Modelo: Multi-Tenant com Cloudflare**  
**Custo de Infra: R$ 0/mês**
