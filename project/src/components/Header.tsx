import { ShoppingCart, Store, Menu, X, ClipboardList, Lock, LogIn, User, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCustomer } from '@/context/CustomerContext';
import { useState } from 'react';

type NavView = 'store' | 'myorders' | 'admin' | 'login';

interface HeaderProps {
  onCartClick: () => void;
  onNavigate: (view: NavView) => void;
  currentView: NavView;
}

export default function Header({ onCartClick, onNavigate, currentView }: HeaderProps) {
  const { totalItems } = useCart();
  const { customer, logout } = useCustomer();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { view: NavView; label: string; icon: typeof Store }[] = [
    { view: 'store', label: 'Loja', icon: Store },
    { view: 'myorders', label: 'Meus Pedidos', icon: ClipboardList },
  ];

  const handleNav = (view: NavView) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => handleNav('store')}
            className="flex items-center gap-2 group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="text-left leading-none">
              <p className="text-sm font-medium text-gray-500">Mercadinho do</p>
              <p className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Chris
              </p>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => handleNav(item.view)}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  currentView === item.view
                    ? 'text-emerald-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}

            {/* Login / Account */}
            {customer ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="max-w-24 truncate">{customer.name.split(' ')[0]}</span>
                </div>
                <button
                  onClick={logout}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNav('login')}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  currentView === 'login'
                    ? 'text-emerald-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Entrar
              </button>
            )}

            {/* Admin link */}
            <button
              onClick={() => handleNav('admin')}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                currentView === 'admin'
                  ? 'text-emerald-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Admin
            </button>

            <a
              href="https://wa.me/5522988219840"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              (22) 98821-9840
            </a>
          </nav>

          {/* Cart button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onCartClick}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-sm transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline">Carrinho</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md animate-in fade-in zoom-in">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden flex flex-col gap-1 pb-4">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => handleNav(item.view)}
                className={`flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === item.view
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}

            {customer ? (
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User className="w-4 h-4 text-emerald-600" />
                  {customer.name.split(' ')[0]}
                </div>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNav('login')}
                className={`flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'login'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Entrar / Cadastrar
              </button>
            )}

            <button
              onClick={() => handleNav('admin')}
              className={`flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'admin'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <Lock className="w-4 h-4" />
              Admin
            </button>

            <a
              href="https://wa.me/5522988219840"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              (22) 98821-9840
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
