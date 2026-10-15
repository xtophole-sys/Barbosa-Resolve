import { Store, Truck, Clock, Phone, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div className="leading-none">
                <p className="text-sm font-medium text-gray-400">Mercadinho do</p>
                <p className="text-2xl font-extrabold tracking-tight text-emerald-400">
                  Chris
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Seu mercadinho local com produtos fresquinhos entregues na porta de casa.
              Fazemos a entrega para você!
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">
              Horário de Funcionamento
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Segunda a Sexta: 10h às 18h
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                Sábado e Domingo: Fechado
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">
              Contato e Entrega
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <a href="https://wa.me/5522988219840" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">WhatsApp: (22) 98821-9840</a>
              </li>
              <li className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-400" />
                Atendimento online — sem loja física
              </li>
              <li className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                Entrega grátis acima de R$ 50,00
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Mercadinho do Chris. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
