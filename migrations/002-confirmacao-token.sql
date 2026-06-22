-- Migration 002: token de confirmação de pedido
-- Evita que terceiros confirmem pedidos alheios sem o token gerado no momento da criação
ALTER TABLE pedidos ADD COLUMN confirmacao_token TEXT;
