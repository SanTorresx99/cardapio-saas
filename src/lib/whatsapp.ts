import type { Pedido } from '@/types/pedido';
import { formatarPreco } from '@/lib/carrinho';

export const WHATSAPP_PADRAO = '5592984474314';

export function gerarMensagemPedido(pedido: Pedido, nomeRestaurante: string): string {
  const linhasItens = pedido.itens
    .map(i => `  • ${i.quantidade}x ${i.nome} — ${formatarPreco(i.preco * i.quantidade)}`)
    .join('\n');

  return [
    `Olá, ${nomeRestaurante}! 👋`,
    ``,
    `Realizei o pedido *#${pedido.id.slice(-6).toUpperCase()}* e já efetuei o pagamento via PIX.`,
    ``,
    `*Itens do pedido:*`,
    linhasItens,
    ``,
    `*Total: ${formatarPreco(pedido.total)}*`,
    ``,
    `Nome: ${pedido.clienteNome}`,
    pedido.clienteTelefone ? `WhatsApp: ${pedido.clienteTelefone}` : '',
  ]
    .filter(l => l !== undefined)
    .join('\n')
    .trim();
}

export function gerarLinkWhatsApp(
  mensagem: string,
  telefone: string = WHATSAPP_PADRAO
): string {
  const numero = telefone.replace(/\D/g, '');
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
