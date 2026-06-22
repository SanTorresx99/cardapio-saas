-- Cardápio SaaS — Migration inicial
-- Executar: wrangler d1 execute cardapio-db --file=migrations/001-initial.sql

CREATE TABLE IF NOT EXISTS tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  email_admin TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  telefone_admin TEXT,
  whatsapp_numero TEXT,
  chave_pix TEXT,
  chave_pix_nome TEXT,
  plano TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'ativo',
  logo_url TEXT,
  descricao TEXT,
  endereco TEXT,
  horario_funcionamento TEXT,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cardapio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco REAL NOT NULL,
  categoria TEXT,
  imagem_url TEXT,
  estoque INTEGER,
  ativo INTEGER NOT NULL DEFAULT 1,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  nome TEXT,
  whatsapp TEXT NOT NULL,
  email TEXT,
  pedidos_count INTEGER NOT NULL DEFAULT 0,
  gasto_total REAL NOT NULL DEFAULT 0,
  ultimo_pedido TIMESTAMP,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE (tenant_id, whatsapp)
);

CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  cliente_id INTEGER,
  cliente_nome TEXT,
  cliente_whatsapp TEXT,
  items_json TEXT NOT NULL,
  subtotal REAL NOT NULL,
  desconto_valor REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  chave_pix_string TEXT,
  pix_confirmado INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aguardando_pagamento',
  observacoes TEXT,
  data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_confirmacao TIMESTAMP,
  data_pronto TIMESTAMP,
  data_entrega TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cardapio_tenant ON cardapio(tenant_id, ativo);
CREATE INDEX IF NOT EXISTS idx_pedidos_tenant_status ON pedidos(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos(data_pedido);
CREATE INDEX IF NOT EXISTS idx_clientes_tenant ON clientes(tenant_id);

-- Tenant de exemplo para desenvolvimento
INSERT OR IGNORE INTO tenants (nome, slug, email_admin, senha_hash, whatsapp_numero, chave_pix, chave_pix_nome, plano)
VALUES (
  'Burguer do João',
  'burguer-do-joao',
  'joao@burguerdojoao.com',
  '$2b$10$exemplo_hash_nao_usar_em_prod',
  '5511999990000',
  '123.456.789-00',
  'João Silva',
  'pro'
);

-- Produtos de exemplo
INSERT OR IGNORE INTO cardapio (tenant_id, nome, descricao, preco, categoria, ativo)
SELECT id, 'X-Burguer Clássico', 'Pão brioche, blend 180g, queijo, alface, tomate', 25.90, 'Burguers', 1 FROM tenants WHERE slug = 'burguer-do-joao';

INSERT OR IGNORE INTO cardapio (tenant_id, nome, descricao, preco, categoria, ativo)
SELECT id, 'X-Bacon Duplo', 'Pão brioche, blend duplo 360g, bacon crocante, queijo cheddar', 39.90, 'Burguers', 1 FROM tenants WHERE slug = 'burguer-do-joao';

INSERT OR IGNORE INTO cardapio (tenant_id, nome, descricao, preco, categoria, ativo)
SELECT id, 'Batata Frita', 'Porção individual crocante com sal', 12.90, 'Acompanhamentos', 1 FROM tenants WHERE slug = 'burguer-do-joao';

INSERT OR IGNORE INTO cardapio (tenant_id, nome, descricao, preco, categoria, ativo)
SELECT id, 'Refrigerante Lata', 'Coca-Cola, Guaraná ou Sprite 350ml', 6.90, 'Bebidas', 1 FROM tenants WHERE slug = 'burguer-do-joao';

INSERT OR IGNORE INTO cardapio (tenant_id, nome, descricao, preco, categoria, ativo)
SELECT id, 'Suco Natural', 'Laranja, limão ou maracujá 300ml', 9.90, 'Bebidas', 1 FROM tenants WHERE slug = 'burguer-do-joao';
