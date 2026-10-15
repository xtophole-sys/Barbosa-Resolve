import { useState } from 'react';
import { User, Phone, Calendar, Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, Store, LogIn } from 'lucide-react';
import { useCustomer } from '@/context/CustomerContext';

interface LoginViewProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

export default function LoginView({ onBack, onLoginSuccess }: LoginViewProps) {
  const { login, register } = useCustomer();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: '',
    password: '',
    identifier: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (mode === 'login') {
      if (!form.identifier.trim() || !form.password) {
        setError('Digite seu e-mail ou WhatsApp e sua senha.');
        setSubmitting(false);
        return;
      }
      const result = await login(form.identifier, form.password);
      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.error || 'Não foi possível entrar.');
      }
    } else {
      if (!form.name.trim()) {
        setError('Digite seu nome completo.');
        setSubmitting(false);
        return;
      }
      if (!form.email.trim() && !form.phone.trim()) {
        setError('Digite pelo menos seu e-mail ou WhatsApp.');
        setSubmitting(false);
        return;
      }
      if (form.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        setSubmitting(false);
        return;
      }
      const result = await register(
        form.name,
        form.email.trim() || null,
        form.phone,
        form.password,
        form.birthday
      );
      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.error || 'Não foi possível cadastrar.');
      }
    }

    setSubmitting(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar à loja
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
            <Store className="w-6 h-6 text-white" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-900 text-center mb-1">
          {mode === 'login' ? 'Entrar na minha conta' : 'Criar minha conta'}
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          {mode === 'login'
            ? 'Use seu e-mail ou WhatsApp para acessar seus pedidos.'
            : 'Cadastre-se para acompanhar seus pedidos e receber novidades.'}
        </p>

        {/* Mode toggle */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'login' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail ou WhatsApp</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.identifier}
                  onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                  placeholder="seu@email.com ou (22) 99999-9999"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  E-mail <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(22) 99999-9999"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Data de aniversário <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={form.birthday}
                    onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : 'Sua senha'}
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
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
                Aguarde...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                {mode === 'login' ? 'Entrar' : 'Cadastrar'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
