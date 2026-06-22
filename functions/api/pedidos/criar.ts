import { z } from 'zod';
import { jsonResponse } from '@/lib/middleware';
import { gerarPixPayload } from '@/lib/pix';
import type { PagesFunction, Env } from '@/types/cloudflare';

// preco NÃO vem do cliente — é buscado do banco por produtoId
const ItemSchema = z.object({
  produtoId: z.string(),
  nome: z.string(),
  quantidade: z.number().int().positive(),
});

const CriarPedidoSchema = z.object({
  tenantSlug: z.string(),
  clienteNome: z.string().min(2),
  clienteTelefone: z.string().optional(),
  itens: z.array(ItemSchema).min(1),
});

interface TenantRow {
  id: number;
  nome: string;
  chave_pix: string | null;
  chave_pix_nome: string | null;
  whatsapp_numero: string | null;
}

interface CardapioRow {
  id: number;
  nome: string;
  preco: number;
}

function gerarToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Body inválido' }, 400);
  }

  const parsed = CriarPedidoSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const { tenantSlug, clienteNome, clienteTelefone, itens } = parsed.data;

  const tenant = await env.DB.prepare(
    `SELECT id, nome, chave_pix, chave_pix_nome, whatsapp_numero
     FROM tenants WHERE slug = ? AND status = 'ativo'`
  ).bind(tenantSlug).first<TenantRow>();

  if (!tenant) {
    return jsonResponse({ success: false, error: 'Restaurante não encontrado' }, 404);
  }

  // Busca preços reais no banco — cliente não controla o valor
  const produtoQueries = itens.map(i =>
    env.DB.prepare(
      'SELECT id, nome, preco FROM cardapio WHERE id = ? AND tenant_id = ? AND ativo = 1'
    ).bind(i.produtoId, tenant.id)
  );

  const produtosResult = await env.DB.batch<CardapioRow>(produtoQueries);

  const precoMap = new Map<string, { nome: string; preco: number }>();
  for (let i = 0; i < produtosResult.length; i++) {
    const rows = produtosResult[i].results;
    if (rows.length > 0) {
      precoMap.set(itens[i].produtoId, { nome: rows[0].nome, preco: rows[0].preco });
    }
  }

  for (const item of itens) {
    if (!precoMap.has(item.produtoId)) {
      return jsonResponse(
        { success: false, error: `Produto não encontrado: ${item.nome}` }, 400
      );
    }
  }

  const itensVerificados = itens.map(item => {
    const produto = precoMap.get(item.produtoId)!;
    return { produtoId: item.produtoId, nome: produto.nome, preco: produto.preco, quantidade: item.quantidade };
  });

  const total = itensVerificados.reduce((acc, i) => acc + i.preco * i.quantidade, 0);

  let pixPayload: string | null = null;
  if (tenant.chave_pix) {
    const txid = gerarToken().slice(0, 12).toUpperCase();
    pixPayload = gerarPixPayload({
      chave: tenant.chave_pix,
      nomeRecebedor: tenant.chave_pix_nome ?? tenant.nome,
      cidade: 'Sao Paulo',
      valor: total,
      txid,
      descricao: `Pedido ${txid.slice(-6)}`,
    });
  }

  const confirmacaoToken = gerarToken();

  const result = await env.DB.prepare(
    `INSERT INTO pedidos (tenant_id, cliente_nome, cliente_whatsapp, items_json, subtotal, total, chave_pix_string, confirmacao_token, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aguardando_pagamento')`
  ).bind(
    tenant.id,
    clienteNome,
    clienteTelefone ?? null,
    JSON.stringify(itensVerificados),
    total,
    total,
    pixPayload,
    confirmacaoToken,
  ).run();

  const pedidoId = result.meta.last_row_id;

  return jsonResponse({
    success: true,
    pedido: {
      id: String(pedidoId),
      tenantSlug,
      tenantNome: tenant.nome,
      clienteNome,
      clienteTelefone,
      itens: itensVerificados,
      total,
      status: 'aguardando_pagamento',
      pixPayload,
      whatsappNumero: tenant.whatsapp_numero,
      confirmacaoToken,
    },
  }, 201);
};
