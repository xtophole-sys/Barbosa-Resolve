import { useState } from 'react';
import { Lock, ArrowLeft, Mail, Loader2, LogOut, Eye, EyeOff, Store, Shield, ClipboardList, QrCode, Package, Users } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import AdminView, { type AdminTab } from '@/components/AdminView';

interface AdminGateProps {
  onBack: () => void;
}

export default function AdminGate({ onBack }: AdminGateProps) {
  const { session, loading, signIn, signOut } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await signIn(email, password);
    if (!result.success) {
      setError(result.error || 'Não foi possível entrar.');
    }
    setSubmitting(false);
  };

  const handleSignOut = async () => {
    await signOut();
    onBack();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Authenticated — show full admin layout
  if (session) {
    return <AdminLayout onSignOut={handleSignOut} />;
  }

  // Login form
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar à loja
          </button>

          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-7 h-7 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 text-center mb-2">
              Área do administrador
            </h1>
            <p className="text-sm text-gray-500 text-center mb-6">
              Acesso restrito ao responsável pelo Mercadinho do Chris.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="seu@email.com"
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder="Senha"
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

type AdminTabLocal = AdminTab;

function AdminLayout({ onSignOut }: { onSignOut: () => void }) {
  const [tab, setTab] = useState<AdminTabLocal>('orders');

  const tabs: { id: AdminTab; label: string; icon: typeof Store }[] = [
    { id: 'orders', label: 'Pedidos', icon: ClipboardList },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'pix', label: 'Pix', icon: QrCode },
    { id: 'profile', label: 'Perfil', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Admin header */}
      <header className="sticky top-0 z-50 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div className="leading-none">
                <p className="text-xs font-medium text-gray-400">Painel administrativo</p>
                <p className="text-xl font-extrabold tracking-tight text-white">
                  Mercadinho do Chris
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                <Shield className="w-4 h-4" />
                <span>Administrador</span>
              </div>
              <button
                onClick={onSignOut}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-gray-800"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>

          {/* Tab navigation */}
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  tab === t.id
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Admin content */}
      <main className="flex-1">
        <AdminView tab={tab} />
      </main>
    </div>
  );
}
