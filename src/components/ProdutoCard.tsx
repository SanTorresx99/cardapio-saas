import type { Produto } from '@/types/cardapio';
import { formatarPreco } from '@/lib/carrinho';

interface Props {
  produto: Produto;
  onAdicionar: (produto: Produto) => void;
}

export default function ProdutoCard({ produto, onAdicionar }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      {produto.imagemUrl ? (
        <img
          src={produto.imagemUrl}
          alt={produto.nome}
          className="w-full h-40 object-cover"
        />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-5xl">
          🍽️
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-base leading-tight">{produto.nome}</h3>
        {produto.descricao && (
          <p className="text-gray-500 text-sm mt-1 flex-1 line-clamp-2">{produto.descricao}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-orange-600 font-bold text-lg">{formatarPreco(produto.preco)}</span>
          <button
            onClick={() => onAdicionar(produto)}
            disabled={!produto.disponivel}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition"
          >
            {produto.disponivel ? '+ Adicionar' : 'Indisponível'}
          </button>
        </div>
      </div>
    </div>
  );
}
