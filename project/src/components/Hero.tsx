import { Truck, Clock, ShieldCheck, ShoppingBag } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 text-white">
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-sm font-medium mb-4">
              <Truck className="w-4 h-4" />
              Entrega rápida no bairro
            </span>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
              Mercadinho do <span className="text-yellow-300">Chris</span><br />
              <span className="text-emerald-200">entregue em casa</span>
            </h1>
            <p className="text-lg text-emerald-50/90 mb-6 leading-relaxed">
              Frutas, verduras, padaria, bebidas e tudo o que você precisa.
              Peça pelo site e receba em casa com a gente!
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#produtos"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-emerald-700 font-semibold text-sm hover:bg-emerald-50 transition-colors shadow-lg"
              >
                <ShoppingBag className="w-5 h-5" />
                Ver produtos
              </a>
              <div className="flex items-center gap-2 text-sm text-emerald-50/90">
                <Clock className="w-5 h-5" />
                Seg a Sex, 10h às 18h
              </div>
            </div>
          </div>

          <div className="hidden md:grid grid-cols-2 gap-4">
            <FeatureCard
              icon={<Truck className="w-6 h-6" />}
              title="Entrega grátis"
              desc="Em compras acima de R$ 50"
            />
            <FeatureCard
              icon={<ShieldCheck className="w-6 h-6" />}
              title="Produtos frescos"
              desc="Selecionados todo dia"
            />
            <FeatureCard
              icon={<Clock className="w-6 h-6" />}
              title="Rápido e prático"
              desc="Peça em minutos"
            />
            <FeatureCard
              icon={<ShoppingBag className="w-6 h-6" />}
              title="Tudo num lugar"
              desc="Mercado completo"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/10">
      <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-3 text-white">
        {icon}
      </div>
      <h3 className="font-semibold text-white text-sm">{title}</h3>
      <p className="text-xs text-emerald-50/80 mt-0.5">{desc}</p>
    </div>
  );
}
