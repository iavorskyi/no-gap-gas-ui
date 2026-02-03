import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types/api';
import { authApi, userApi, setTokens, clearTokens, getAccessToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const userData = await userApi.me();
      setUser(userData);
    } catch {
      setUser(null);
      clearTokens();
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        await fetchUser();
      }
      setIsLoading(false);
    };
    initAuth();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setTokens(response.access_token, response.refresh_token);
    await fetchUser();
  };

  const register = async (email: string, password: string) => {
    await authApi.register({ email, password });
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors, just clear tokens
    }
    clearTokens();
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
