import { jsonResponse } from '@/lib/middleware';
import type { PagesFunction, Env } from '@/types/cloudflare';
import type { Produto, Tenant } from '@/types/cardapio';

// TODO: substituir por consulta ao D1 quando banco for configurado
const MOCK_TENANTS: Record<string, { tenant: Tenant; produtos: Produto[] }> = {
  'burguer-do-joao': {
    tenant: {
      id: 'tenant_001',
      slug: 'burguer-do-joao',
      nomeRestaurante: 'Burguer do João',
      descricao: 'Os melhores burguers da cidade 🍔',
      pixChave: '11999999999',
      plano: 'pro',
    },
    produtos: [
      { id: 'p001', tenantId: 'tenant_001', nome: 'X-Burguer Clássico', descricao: 'Pão, carne 180g, queijo, alface e tomate', preco: 25.90, categoria: 'Burguers', disponivel: true, ordem: 1 },
      { id: 'p002', tenantId: 'tenant_001', nome: 'X-Bacon Duplo', descricao: 'Duas carnes 180g, bacon crocante e queijo cheddar', preco: 35.90, categoria: 'Burguers', disponivel: true, ordem: 2 },
      { id: 'p003', tenantId: 'tenant_001', nome: 'Fritas Grandes', descricao: 'Porção de batata frita crocante', preco: 15.90, categoria: 'Acompanhamentos', disponivel: true, ordem: 3 },
      { id: 'p004', tenantId: 'tenant_001', nome: 'Coca-Cola 350ml', descricao: 'Gelada', preco: 7.00, categoria: 'Bebidas', disponivel: true, ordem: 4 },
      { id: 'p005', tenantId: 'tenant_001', nome: 'Milk Shake Chocolate', descricao: 'Cremoso e gelado', preco: 18.00, categoria: 'Bebidas', disponivel: false, ordem: 5 },
    ],
  },
};

export const onRequestGet: PagesFunction<Env> = async ({ params }) => {
  const slug = Array.isArray(params.tenant) ? params.tenant[0] : params.tenant;
  const dados = MOCK_TENANTS[slug];

  if (!dados) {
    return jsonResponse({ success: false, error: 'Restaurante não encontrado' }, 404);
  }

  return jsonResponse({
    success: true,
    tenant: dados.tenant,
    produtos: dados.produtos.sort((a, b) => a.ordem - b.ordem),
  });
};
