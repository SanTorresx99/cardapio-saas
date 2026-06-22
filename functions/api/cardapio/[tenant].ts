import { jsonResponse } from '@/lib/middleware';
import type { PagesFunction, Env } from '@/types/cloudflare';

interface TenantRow {
  id: number;
  nome: string;
  slug: string;
  descricao: string | null;
  chave_pix: string | null;
  plano: string;
}

interface ProdutoRow {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  categoria: string | null;
  imagem_url: string | null;
  ativo: number;
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const slug = Array.isArray(params.tenant) ? params.tenant[0] : params.tenant;

  const tenant = await env.DB.prepare(
    `SELECT id, nome, slug, descricao, chave_pix, plano
     FROM tenants WHERE slug = ? AND status = 'ativo'`
  ).bind(slug).first<TenantRow>();

  if (!tenant) {
    return jsonResponse({ success: false, error: 'Restaurante não encontrado' }, 404);
  }

  const { results: produtos } = await env.DB.prepare(
    `SELECT id, nome, descricao, preco, categoria, imagem_url, ativo
     FROM cardapio WHERE tenant_id = ? AND ativo = 1
     ORDER BY categoria, nome`
  ).bind(tenant.id).all<ProdutoRow>();

  return jsonResponse({
    success: true,
    tenant: {
      id: String(tenant.id),
      slug: tenant.slug,
      nomeRestaurante: tenant.nome,
      descricao: tenant.descricao,
      pixChave: tenant.chave_pix,
      plano: tenant.plano,
    },
    produtos: produtos.map(p => ({
      id: String(p.id),
      tenantId: String(tenant.id),
      nome: p.nome,
      descricao: p.descricao,
      preco: p.preco,
      categoria: p.categoria,
      imagemUrl: p.imagem_url,
      disponivel: Boolean(p.ativo),
    })),
  });
};
