import Link from 'next/link';
import { useRouter } from 'next/router';

export default function PedidoSucesso() {
  const { query } = useRouter();
  const pedidoId = (query.id as string)?.slice(-6).toUpperCase() ?? '';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-4">
        <div className="text-6xl">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900">Pedido Confirmado!</h1>
        {pedidoId && (
          <p className="text-gray-500 text-sm">
            Pedido <span className="font-semibold text-gray-700">#{pedidoId}</span>
          </p>
        )}
        <p className="text-gray-600 text-sm">
          Seu pedido foi recebido! Aguarde a preparação. Você receberá atualizações em breve.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-800 text-sm">
          Pagamento PIX registrado com sucesso ✓
        </div>

        <Link
          href={`/${query.tenant}`}
          className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition"
        >
          Fazer Novo Pedido
        </Link>
      </div>
    </div>
  );
}
