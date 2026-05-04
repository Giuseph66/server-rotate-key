import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

interface Tenant {
  id: string;
  name: string;
  email: string | null;
  role: string;
}

interface AuthContextType {
  tenant: Tenant | null;
  token: string | null;
  login: (name: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [tenant, setTenant] = useState<Tenant | null>(() => {
    const stored = localStorage.getItem('tenant');
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = async (name: string, password: string) => {
    const { data } = await api.post('/auth/login', { name, password });
    setToken(data.access_token);
    setTenant(data.tenant);
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('tenant', JSON.stringify(data.tenant));
  };

  const register = async (name: string, email: string, password: string) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    setToken(data.access_token);
    setTenant(data.tenant);
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('tenant', JSON.stringify(data.tenant));
  };

  const logout = () => {
    setToken(null);
    setTenant(null);
    localStorage.removeItem('token');
    localStorage.removeItem('tenant');
  };

  return (
    <AuthContext.Provider
      value={{
        tenant,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
