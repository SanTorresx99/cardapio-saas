import { jsonResponse } from '@/lib/middleware';
import type { PagesFunction, Env } from '@/types/cloudflare';

export const onRequestPost: PagesFunction<Env> = async ({ params }) => {
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // TODO: atualizar status do pedido no D1 para 'pix_confirmado'

  return jsonResponse({
    success: true,
    pedidoId: id,
    status: 'pix_confirmado',
    message: 'Pagamento confirmado! Seu pedido está sendo preparado.',
  });
};
