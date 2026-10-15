import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Customer } from '@/types';

interface CustomerContextType {
  customer: Customer | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string | null, phone: string, password: string, birthday: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const STORAGE_KEY = 'mercadinho_customer';

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Customer;
          setCustomer(parsed);
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      setLoading(false);
    };
    restore();
  }, []);

  const login = async (identifier: string, password: string) => {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-auth`;
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'login', identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'E-mail/WhatsApp ou senha incorretos.' };
      }

      setCustomer(data.customer as Customer);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.customer));
      return { success: true };
    } catch {
      return { success: false, error: 'Erro ao entrar. Tente novamente.' };
    }
  };

  const register = async (name: string, email: string | null, phone: string, password: string, birthday: string) => {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-auth`;
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'register', name, email, phone, password, birthday }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Não foi possível cadastrar.' };
      }

      setCustomer(data.customer as Customer);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.customer));
      return { success: true };
    } catch {
      return { success: false, error: 'Erro ao cadastrar. Tente novamente.' };
    }
  };

  const logout = () => {
    setCustomer(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <CustomerContext.Provider value={{ customer, loading, login, register, logout }}>
      {children}
    </CustomerContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used within CustomerProvider');
  return ctx;
}
