import { useRouter } from 'next/router';
import type { ItemCarrinho } from '@/types/cardapio';
import { formatarPreco, totalCarrinho, alterarQuantidade, removerItem } from '@/lib/carrinho';

interface Props {
  tenantId: string;
  itens: ItemCarrinho[];
  aberto: boolean;
  onFechar: () => void;
  onAtualizar: (itens: ItemCarrinho[]) => void;
}

export default function CarrinhoDrawer({ tenantId, itens, aberto, onFechar, onAtualizar }: Props) {
  const router = useRouter();

  const handleAlterarQtd = (produtoId: string, qtd: number) => {
    onAtualizar(alterarQuantidade(tenantId, produtoId, qtd));
  };

  const handleRemover = (produtoId: string) => {
    onAtualizar(removerItem(tenantId, produtoId));
  };

  const handleFinalizar = () => {
    onFechar();
    router.push(`/${router.query.tenant}/carrinho`);
  };

  return (
    <>
      {aberto && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={onFechar} />
      )}

      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${aberto ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Meu Pedido</h2>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {itens.length === 0 ? (
            <div className="text-center text-gray-400 mt-16">
              <p className="text-4xl mb-3">🛒</p>
              <p>Seu carrinho está vazio</p>
            </div>
          ) : (
            itens.map(item => (
              <div key={item.produto.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{item.produto.nome}</p>
                  <p className="text-orange-600 text-sm font-semibold">{formatarPreco(item.produto.preco)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAlterarQtd(item.produto.id, item.quantidade - 1)}
                    className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm flex items-center justify-center"
                  >−</button>
                  <span className="w-5 text-center text-sm font-semibold">{item.quantidade}</span>
                  <button
                    onClick={() => handleAlterarQtd(item.produto.id, item.quantidade + 1)}
                    className="w-7 h-7 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center justify-center"
                  >+</button>
                </div>
                <button onClick={() => handleRemover(item.produto.id)} className="text-red-400 hover:text-red-600 text-xs ml-1">
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {itens.length > 0 && (
          <div className="p-4 border-t space-y-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-orange-600">{formatarPreco(totalCarrinho(itens))}</span>
            </div>
            <button
              onClick={handleFinalizar}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition"
            >
              Finalizar Pedido
            </button>
          </div>
        )}
      </div>
    </>
  );
}
