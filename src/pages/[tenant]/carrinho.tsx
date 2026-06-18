import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCarrinho, limparCarrinho, totalCarrinho, formatarPreco, alterarQuantidade, removerItem } from '@/lib/carrinho';
import type { ItemCarrinho } from '@/types/cardapio';
import type { Pedido } from '@/types/pedido';

const PEDIDOS_KEY = 'pedidos_locais';

function salvarPedidoLocal(pedido: Pedido) {
  const pedidos: Record<string, Pedido> = JSON.parse(localStorage.getItem(PEDIDOS_KEY) ?? '{}');
  pedidos[pedido.id] = pedido;
  localStorage.setItem(PEDIDOS_KEY, JSON.stringify(pedidos));
}

export function getStaticPaths() {
  return { paths: [{ params: { tenant: 'burguer-do-joao' } }], fallback: false };
}
export function getStaticProps() {
  return { props: {} };
}

export default function CarrinhoPage() {
  const router = useRouter();
  const { tenant: tenantSlug } = router.query;

  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (tenantSlug) setItens(getCarrinho(tenantSlug as string));
  }, [tenantSlug]);

  const handleAlterarQtd = (produtoId: string, qtd: number) => {
    setItens(alterarQuantidade(tenantSlug as string, produtoId, qtd));
  };

  const handleRemover = (produtoId: string) => {
    setItens(removerItem(tenantSlug as string, produtoId));
  };

  const handleFinalizar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itens.length === 0) return;
    setErro('');
    setLoading(true);

    try {
      const res = await fetch('/api/pedidos/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          clienteNome,
          clienteTelefone,
          itens: itens.map(i => ({
            produtoId: i.produto.id,
            nome: i.produto.nome,
            preco: i.produto.preco,
            quantidade: i.quantidade,
          })),
        }),
      });
      const data = await res.json();
      if (data.success && data.pedido) {
        salvarPedidoLocal(data.pedido);
        limparCarrinho(tenantSlug as string);
        router.push(`/${tenantSlug}/pedido/${data.pedido.id}`);
      } else {
        setErro(data.error ?? 'Erro ao criar pedido.');
      }
    } catch {
      setErro('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  if (itens.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">🛒</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Carrinho vazio</h2>
          <Link href={`/${tenantSlug}`} className="text-orange-500 hover:underline">
            ← Voltar ao cardápio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-3">
        <Link href={`/${tenantSlug}`} className="text-gray-400 hover:text-gray-700 text-lg">←</Link>
        <h1 className="text-lg font-bold text-gray-900">Revisar Pedido</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Itens */}
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {itens.map(item => (
            <div key={item.produto.id} className="flex items-center gap-3 p-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{item.produto.nome}</p>
                <p className="text-orange-600 text-sm">{formatarPreco(item.produto.preco)} cada</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleAlterarQtd(item.produto.id, item.quantidade - 1)}
                  className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 font-bold text-sm flex items-center justify-center">−</button>
                <span className="w-5 text-center text-sm font-semibold">{item.quantidade}</span>
                <button onClick={() => handleAlterarQtd(item.produto.id, item.quantidade + 1)}
                  className="w-7 h-7 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center justify-center">+</button>
              </div>
              <p className="text-gray-700 font-semibold text-sm w-16 text-right">
                {formatarPreco(item.produto.preco * item.quantidade)}
              </p>
              <button onClick={() => handleRemover(item.produto.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
            </div>
          ))}
          <div className="flex justify-between items-center p-4 font-bold text-gray-900">
            <span>Total</span>
            <span className="text-orange-600 text-lg">{formatarPreco(totalCarrinho(itens))}</span>
          </div>
        </div>

        {/* Dados do cliente */}
        <form onSubmit={handleFinalizar} className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h2 className="font-bold text-gray-900">Seus dados</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              value={clienteNome}
              onChange={e => setClienteNome(e.target.value)}
              required
              placeholder="Como quer ser chamado?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp (opcional)</label>
            <input
              value={clienteTelefone}
              onChange={e => setClienteTelefone(e.target.value)}
              placeholder="11 99999-9999"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {erro && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>}

          <button
            type="submit"
            disabled={loading || itens.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Gerando PIX...' : `Gerar PIX • ${formatarPreco(totalCarrinho(itens))}`}
          </button>
        </form>
      </div>
    </div>
  );
}
