export interface Produto {
  id: string;
  tenantId: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  imagemUrl?: string;
  disponivel: boolean;
  ordem: number;
}

export interface Tenant {
  id: string;
  slug: string;
  nomeRestaurante: string;
  descricao?: string;
  logoUrl?: string;
  corPrimaria?: string;
  telefone?: string;
  pixChave?: string;
  plano: 'free' | 'pro' | 'enterprise';
}

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

export interface Carrinho {
  tenantId: string;
  itens: ItemCarrinho[];
}
