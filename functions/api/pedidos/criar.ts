import { z } from 'zod';
import { jsonResponse } from '@/lib/middleware';
import { gerarPixPayload } from '@/lib/pix';
import type { PagesFunction, Env } from '@/types/cloudflare';

const ItemSchema = z.object({
  produtoId: z.string(),
  nome: z.string(),
  preco: z.number().positive(),
  quantidade: z.number().int().positive(),
});

const CriarPedidoSchema = z.object({
  tenantSlug: z.string(),
  clienteNome: z.string().min(2),
  clienteTelefone: z.string().optional(),
  itens: z.array(ItemSchema).min(1),
});

// TODO: buscar dados do tenant do D1
const TENANT_PIX: Record<string, { chave: string; nome: string; cidade: string }> = {
  'burguer-do-joao': { chave: '11999999999', nome: 'Burguer do Joao', cidade: 'Sao Paulo' },
};

function gerarId(): string {
  return `ped_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const onRequestPost: PagesFunction<Env> = async ({ request }) => {
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
  const tenantPix = TENANT_PIX[tenantSlug];

  if (!tenantPix) {
    return jsonResponse({ success: false, error: 'Restaurante não encontrado' }, 404);
  }

  const total = itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
  const pedidoId = gerarId();

  const pixPayload = gerarPixPayload({
    chave: tenantPix.chave,
    nomeRecebedor: tenantPix.nome,
    cidade: tenantPix.cidade,
    valor: total,
    txid: pedidoId.slice(-25),
    descricao: `Pedido ${pedidoId.slice(-6).toUpperCase()}`,
  });

  const pedido = {
    id: pedidoId,
    tenantId: `tenant_${tenantSlug}`,
    tenantSlug,
    clienteNome,
    clienteTelefone,
    itens,
    total,
    status: 'aguardando_pix',
    pixPayload,
    criadoEm: new Date().toISOString(),
  };

  // TODO: salvar pedido no D1

  return jsonResponse({ success: true, pedido }, 201);
};
