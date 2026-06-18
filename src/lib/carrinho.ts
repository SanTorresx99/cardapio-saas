import type { ItemCarrinho, Produto } from '@/types/cardapio';

const chave = (tenantId: string) => `carrinho_${tenantId}`;

export function getCarrinho(tenantId: string): ItemCarrinho[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(chave(tenantId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function salvarCarrinho(tenantId: string, itens: ItemCarrinho[]): void {
  localStorage.setItem(chave(tenantId), JSON.stringify(itens));
}

export function adicionarItem(tenantId: string, produto: Produto): ItemCarrinho[] {
  const itens = getCarrinho(tenantId);
  const existente = itens.find(i => i.produto.id === produto.id);
  const novosItens = existente
    ? itens.map(i => i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i)
    : [...itens, { produto, quantidade: 1 }];
  salvarCarrinho(tenantId, novosItens);
  return novosItens;
}

export function removerItem(tenantId: string, produtoId: string): ItemCarrinho[] {
  const itens = getCarrinho(tenantId).filter(i => i.produto.id !== produtoId);
  salvarCarrinho(tenantId, itens);
  return itens;
}

export function alterarQuantidade(tenantId: string, produtoId: string, quantidade: number): ItemCarrinho[] {
  const itens = quantidade <= 0
    ? getCarrinho(tenantId).filter(i => i.produto.id !== produtoId)
    : getCarrinho(tenantId).map(i => i.produto.id === produtoId ? { ...i, quantidade } : i);
  salvarCarrinho(tenantId, itens);
  return itens;
}

export function limparCarrinho(tenantId: string): void {
  localStorage.removeItem(chave(tenantId));
}

export function totalCarrinho(itens: ItemCarrinho[]): number {
  return itens.reduce((acc, i) => acc + i.produto.preco * i.quantidade, 0);
}

export function totalItens(itens: ItemCarrinho[]): number {
  return itens.reduce((acc, i) => acc + i.quantidade, 0);
}

export function formatarPreco(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
