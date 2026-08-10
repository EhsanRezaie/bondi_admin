import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { doLogin, doLogout, ensureLogin } from '../api/admin';

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => ensureLogin());

  const login = useCallback(async (username: string, password: string) => {
    await doLogin(username, password);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await doLogout();
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}