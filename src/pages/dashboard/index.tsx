import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🍔</div>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">🍔 CardápioSaaS</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Olá, {user.name}</span>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Sair
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Painel do Restaurante</h2>
        <p className="text-gray-500 mb-8">Bem-vindo! As funcionalidades estão sendo construídas.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <DashCard icon="📋" titulo="Pedidos" desc="Gerencie pedidos em tempo real" href="/dashboard/pedidos" disponivel={false} />
          <DashCard icon="🍔" titulo="Cardápio" desc="Adicione e edite seus produtos" href="/dashboard/cardapio" disponivel={false} />
          <DashCard icon="👥" titulo="Clientes" desc="CRM e fidelidade" href="/dashboard/clientes" disponivel={false} />
          <DashCard icon="💰" titulo="Pagamentos PIX" desc="Histórico de recebimentos" href="/dashboard/pagamentos" disponivel={false} />
          <DashCard icon="⚙️" titulo="Configurações" desc="Dados do restaurante" href="/dashboard/configuracoes" disponivel={false} />
          {user.tenantId && (
            <DashCard icon="🔗" titulo="Ver Cardápio" desc="Como seus clientes veem" href={`/burguer-do-joao`} disponivel={true} externo />
          )}
        </div>

        <div className="mt-8 bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
          <strong>Em desenvolvimento:</strong> As funcionalidades completas (pedidos, PIX, CRM) estão sendo implementadas nas próximas fases.
        </div>
      </div>
    </div>
  );
}

function DashCard({ icon, titulo, desc, href, disponivel, externo }: {
  icon: string; titulo: string; desc: string; href: string; disponivel: boolean; externo?: boolean;
}) {
  return (
    <Link
      href={disponivel ? href : '#'}
      target={externo ? '_blank' : undefined}
      className={`bg-white rounded-xl border p-5 flex items-start gap-4 transition ${
        disponivel ? 'hover:shadow-md hover:border-orange-200 cursor-pointer' : 'opacity-50 cursor-not-allowed'
      }`}
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <h3 className="font-semibold text-gray-900">{titulo}</h3>
        <p className="text-gray-500 text-sm mt-0.5">{desc}</p>
        {!disponivel && <span className="text-xs text-orange-500 mt-1 inline-block">Em breve</span>}
      </div>
    </Link>
  );
}
