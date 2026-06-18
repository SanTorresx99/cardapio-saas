import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ProdutoCard from '@/components/ProdutoCard';
import CategoriaTabs from '@/components/CategoriaTabs';
import CarrinhoDrawer from '@/components/Carrinho';
import { adicionarItem, getCarrinho, totalItens } from '@/lib/carrinho';
import type { Produto, Tenant, ItemCarrinho } from '@/types/cardapio';

export default function CardapioPublico() {
  const router = useRouter();
  const { tenant: tenantSlug } = router.query;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [itensCarrinho, setItensCarrinho] = useState<ItemCarrinho[]>([]);

  useEffect(() => {
    if (!tenantSlug) return;
    setItensCarrinho(getCarrinho(tenantSlug as string));

    fetch(`/api/cardapio/${tenantSlug}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setTenant(data.tenant);
          setProdutos(data.produtos);
        } else {
          setErro('Restaurante não encontrado.');
        }
      })
      .catch(() => setErro('Erro ao carregar cardápio.'))
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  const categorias = [...new Set(produtos.map(p => p.categoria))];
  const produtosFiltrados = categoriaAtiva === 'Todos'
    ? produtos
    : produtos.filter(p => p.categoria === categoriaAtiva);

  const handleAdicionar = (produto: Produto) => {
    const novosItens = adicionarItem(tenantSlug as string, produto);
    setItensCarrinho(novosItens);
    setCarrinhoAberto(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">🍽️</div>
          <p className="text-gray-500">Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">😕</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Restaurante não encontrado</h1>
          <p className="text-gray-500">{erro}</p>
        </div>
      </div>
    );
  }

  const qtdCarrinho = totalItens(itensCarrinho);

  return (
    <>
      <Head>
        <title>{tenant?.nomeRestaurante ?? 'Cardápio'}</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header do restaurante */}
        <div className="bg-white shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-4">
            {tenant?.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.nomeRestaurante} className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-2xl">🍔</div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{tenant?.nomeRestaurante}</h1>
              {tenant?.descricao && <p className="text-gray-500 text-sm">{tenant.descricao}</p>}
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Abas de categoria */}
          {categorias.length > 0 && (
            <div className="mb-6">
              <CategoriaTabs
                categorias={categorias}
                ativa={categoriaAtiva}
                onChange={setCategoriaAtiva}
              />
            </div>
          )}

          {/* Grid de produtos */}
          {produtosFiltrados.length === 0 ? (
            <p className="text-center text-gray-400 py-12">Nenhum produto nesta categoria.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {produtosFiltrados.map(produto => (
                <ProdutoCard key={produto.id} produto={produto} onAdicionar={handleAdicionar} />
              ))}
            </div>
          )}
        </div>

        {/* Botão flutuante do carrinho */}
        {qtdCarrinho > 0 && (
          <button
            onClick={() => setCarrinhoAberto(true)}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-full shadow-lg flex items-center gap-3 transition z-30"
          >
            <span className="bg-white text-orange-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              {qtdCarrinho}
            </span>
            Ver pedido
            <span className="font-normal text-sm opacity-90">
              {itensCarrinho.reduce((a, i) => a + i.produto.preco * i.quantidade, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </button>
        )}
      </div>

      <CarrinhoDrawer
        tenantId={tenantSlug as string}
        itens={itensCarrinho}
        aberto={carrinhoAberto}
        onFechar={() => setCarrinhoAberto(false)}
        onAtualizar={setItensCarrinho}
      />
    </>
  );
}
