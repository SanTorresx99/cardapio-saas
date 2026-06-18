import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import QRCodePIX from '@/components/QRCodePIX';
import BotaoWhatsApp from '@/components/BotaoWhatsApp';
import type { Pedido } from '@/types/pedido';
import { STATUS_LABEL } from '@/types/pedido';
import { formatarPreco } from '@/lib/carrinho';

const PEDIDOS_KEY = 'pedidos_locais';

function getPedidoLocal(id: string): Pedido | null {
  try {
    const pedidos: Record<string, Pedido> = JSON.parse(localStorage.getItem(PEDIDOS_KEY) ?? '{}');
    return pedidos[id] ?? null;
  } catch {
    return null;
  }
}

export default function PedidoPage() {
  const router = useRouter();
  const { tenant: tenantSlug, id } = router.query;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (id) setPedido(getPedidoLocal(id as string));
  }, [id]);

  const handleConfirmarPagamento = async () => {
    if (!pedido) return;
    setConfirmando(true);
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}/confirmar`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        router.push(`/${tenantSlug}/pedido/sucesso?id=${pedido.id}`);
      }
    } catch {
      // fallback: redireciona mesmo sem confirmação da API
      router.push(`/${tenantSlug}/pedido/sucesso?id=${pedido.id}`);
    } finally {
      setConfirmando(false);
    }
  };

  if (!pedido) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Pedido não encontrado</h2>
          <Link href={`/${tenantSlug}`} className="text-orange-500 hover:underline text-sm">
            ← Voltar ao cardápio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-4 py-4">
        <h1 className="text-lg font-bold text-gray-900">Pedido #{pedido.id.slice(-6).toUpperCase()}</h1>
        <p className="text-sm text-gray-500">
          Status: <span className="font-medium text-orange-600">{STATUS_LABEL[pedido.status]}</span>
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* QR Code PIX */}
        <QRCodePIX
          pixPayload={pedido.pixPayload}
          valor={pedido.total}
          nomeRecebedor={pedido.tenantSlug}
        />

        {/* Resumo do pedido */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
          <h2 className="font-bold text-gray-900 mb-3">Resumo do Pedido</h2>
          {pedido.itens.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.quantidade}x {item.nome}</span>
              <span className="text-gray-900 font-medium">{formatarPreco(item.preco * item.quantidade)}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-orange-600">{formatarPreco(pedido.total)}</span>
          </div>
        </div>

        {/* Botão confirmar */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <p className="text-sm text-gray-600 text-center">
            Após realizar o pagamento PIX, clique abaixo para confirmar seu pedido.
          </p>
          <button
            onClick={handleConfirmarPagamento}
            disabled={confirmando}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
          >
            {confirmando ? 'Confirmando...' : '✓ Já realizei o pagamento PIX'}
          </button>
          <BotaoWhatsApp
            pedido={pedido}
            nomeRestaurante={pedido.tenantSlug}
            label="Enviar comprovante pelo WhatsApp"
          />
          <Link
            href={`/${tenantSlug}`}
            className="block text-center text-sm text-gray-400 hover:text-gray-600"
          >
            Voltar ao cardápio
          </Link>
        </div>
      </div>
    </div>
  );
}
