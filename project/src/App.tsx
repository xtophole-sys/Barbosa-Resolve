import { useState } from 'react';
import { CartProvider } from '@/context/CartContext';
import { CustomerProvider } from '@/context/CustomerContext';
import { AdminAuthProvider } from '@/context/AdminAuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StoreView from '@/components/StoreView';
import CartDrawer from '@/components/CartDrawer';
import CheckoutView from '@/components/CheckoutView';
import MyOrdersView from '@/components/MyOrdersView';
import LoginView from '@/components/LoginView';
import AdminGate from '@/components/AdminGate';

type View = 'store' | 'checkout' | 'myorders' | 'login' | 'admin';
type NavView = 'store' | 'myorders' | 'admin' | 'login';

function App() {
  const [view, setView] = useState<View>('store');
  const [cartOpen, setCartOpen] = useState(false);

  const handleNavigate = (dest: NavView) => {
    setView(dest);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckout = () => {
    setCartOpen(false);
    setView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderComplete = () => {
    setView('store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = () => {
    setView('myorders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentNav: NavView =
    view === 'admin' ? 'admin'
    : view === 'myorders' ? 'myorders'
    : view === 'login' ? 'login'
    : 'store';

  return (
    <AdminAuthProvider>
      <CustomerProvider>
        <CartProvider>
          {view === 'admin' ? (
            <AdminGate onBack={() => setView('store')} />
          ) : (
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <Header
                onCartClick={() => setCartOpen(true)}
                onNavigate={handleNavigate}
                currentView={currentNav}
              />

              <main className="flex-1">
                {view === 'store' && <StoreView onCartClick={() => setCartOpen(true)} />}
                {view === 'checkout' && (
                  <CheckoutView
                    onBack={() => setView('store')}
                    onOrderComplete={handleOrderComplete}
                  />
                )}
                {view === 'myorders' && (
                  <MyOrdersView onLoginClick={() => setView('login')} />
                )}
                {view === 'login' && (
                  <LoginView
                    onBack={() => setView('store')}
                    onLoginSuccess={handleLoginSuccess}
                  />
                )}
              </main>

              <Footer />

              <CartDrawer
                open={cartOpen}
                onClose={() => setCartOpen(false)}
                onCheckout={handleCheckout}
              />
            </div>
          )}
        </CartProvider>
      </CustomerProvider>
    </AdminAuthProvider>
  );
}

export default App;
