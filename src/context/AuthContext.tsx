import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserWallet, Subscription, SiteSettings } from '../types.js';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../api.js';

interface AuthContextType {
  user: UserProfile | null;
  wallet: UserWallet | null;
  subscription: Subscription | null;
  systemConfig: { geminiConfigured: boolean; siteName: string; siteNameAr: string; currency: string } | null;
  siteSettings: SiteSettings | null;
  isLoading: boolean;
  login: (token: string, userData: UserProfile) => void;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [systemConfig, setSystemConfig] = useState<any | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUserData = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setWallet(null);
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setWallet(data.wallet);
      setSubscription(data.subscription);
      setSystemConfig(data.systemConfig);
    } catch {
      clearStoredToken();
      setUser(null);
      setWallet(null);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  const login = (token: string, userData: UserProfile) => {
    setStoredToken(token);
    setUser(userData);
    refreshUserData();
  };

  const logout = () => {
    clearStoredToken();
    setUser(null);
    setWallet(null);
    setSubscription(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        subscription,
        systemConfig,
        siteSettings,
        isLoading,
        login,
        logout,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
