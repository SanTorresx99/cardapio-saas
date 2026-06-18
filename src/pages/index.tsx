import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 text-white">
      {/* Navbar */}
      <nav className="bg-black/30 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">🍔 CardápioSaaS</h1>
          <div className="space-x-4">
            <Link href="/auth/login" className="hover:underline">
              Login
            </Link>
            <Link href="/auth/register" className="bg-green-500 px-4 py-2 rounded hover:bg-green-600">
              Registrar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-4">Cardápio Digital para Seu Restaurante</h2>
        <p className="text-xl text-gray-200 mb-8">
          Crie cardápios, receba pedidos e gerencie clientes com fidelidade automática
        </p>
        
        <div className="space-x-4">
          <Link
            href="/auth/register"
            className="inline-block bg-green-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-600"
          >
            Começar Grátis
          </Link>
          <Link
            href="#features"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100"
          >
            Saiba Mais
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white text-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Por que CardápioSaaS?</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon="📱"
              title="Cardápio Digital"
              desc="Crie seu cardápio em minutos, sem programação"
            />
            <FeatureCard
              icon="💰"
              title="PIX Integrado"
              desc="Receba pagamentos instantaneamente"
            />
            <FeatureCard
              icon="👥"
              title="CRM + Fidelidade"
              desc="Promoções automáticas para seus clientes"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 text-center py-4 text-gray-300">
        <p>CardápioSaaS © 2026 | Feito por Sandro Torres</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
      <p className="text-4xl mb-3">{icon}</p>
      <h4 className="text-xl font-bold mb-2">{title}</h4>
      <p className="text-gray-600">{desc}</p>
    </div>
  );
}