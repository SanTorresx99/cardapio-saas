import { useState, useEffect, useCallback } from 'react';
import { decodeTokenClient } from '@/lib/auth';
import type { User } from '@/types/auth';

const TOKEN_KEY = 'auth_token';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      const payload = decodeTokenClient(token);
      if (payload) {
        setUser({ id: payload.sub, email: payload.email, name: payload.name, role: payload.role, tenantId: payload.tenantId });
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setUser(data.user);
        return { success: true as const };
      }
      return { success: false as const, error: (data.error as string) ?? 'Credenciais inválidas' };
    } catch {
      return { success: false as const, error: 'Erro de conexão. A API não está disponível.' };
    }
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
    }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const getToken = useCallback(() => localStorage.getItem(TOKEN_KEY), []);

  return { user, loading, login, logout, getToken };
}
