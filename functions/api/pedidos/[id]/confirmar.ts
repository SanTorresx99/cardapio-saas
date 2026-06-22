import { jsonResponse } from '@/lib/middleware';
import type { PagesFunction, Env } from '@/types/cloudflare';

export const onRequestPost: PagesFunction<Env> = async ({ params, request, env }) => {
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Body inválido' }, 400);
  }

  const token = (body as Record<string, unknown>)?.confirmacaoToken;
  if (!token || typeof token !== 'string' || token.length < 16) {
    return jsonResponse({ success: false, error: 'Token de confirmação inválido' }, 403);
  }

  const pedido = await env.DB.prepare(
    'SELECT id, status, confirmacao_token FROM pedidos WHERE id = ?'
  ).bind(id).first<{ id: number; status: string; confirmacao_token: string | null }>();

  if (!pedido) {
    return jsonResponse({ success: false, error: 'Pedido não encontrado' }, 404);
  }

  if (!pedido.confirmacao_token || pedido.confirmacao_token !== token) {
    return jsonResponse({ success: false, error: 'Token de confirmação inválido' }, 403);
  }

  await env.DB.prepare(
    `UPDATE pedidos SET status = 'pix_confirmado', pix_confirmado = 1, data_confirmacao = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(id).run();

  return jsonResponse({
    success: true,
    pedidoId: id,
    status: 'pix_confirmado',
    message: 'Pagamento confirmado! Seu pedido está sendo preparado.',
  });
};
