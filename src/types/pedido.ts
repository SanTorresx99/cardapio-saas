export type StatusPedido =
  | 'aguardando_pix'
  | 'pix_confirmado'
  | 'em_preparo'
  | 'pronto'
  | 'entregue'
  | 'cancelado';

export interface ItemPedido {
  produtoId: string;
  nome: string;
  preco: number;
  quantidade: number;
}

export interface Pedido {
  id: string;
  tenantId: string;
  tenantSlug: string;
  clienteNome: string;
  clienteTelefone?: string;
  itens: ItemPedido[];
  total: number;
  status: StatusPedido;
  pixPayload: string;
  criadoEm: string;
}

export interface CriarPedidoRequest {
  tenantSlug: string;
  clienteNome: string;
  clienteTelefone?: string;
  itens: ItemPedido[];
}

export const STATUS_LABEL: Record<StatusPedido, string> = {
  aguardando_pix: 'Aguardando PIX',
  pix_confirmado: 'PIX Confirmado',
  em_preparo: 'Em Preparo',
  pronto: 'Pronto para Retirada',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};
