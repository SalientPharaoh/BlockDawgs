"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { BuildType, OktoProvider } from "okto-sdk-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

interface AppContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  buildType: string;
  setBuildType: (type: string) => void;
}

interface Wallet {
  network_name: string;
  address: string;
  success: boolean;
}

interface AuthContextType {
  authToken: string | null;
  refreshToken: string | null;
  deviceToken: string | null;
  wallets: Wallet[];
  setAuthTokens: (tokens: { 
    auth_token: string; 
    refresh_auth_token: string; 
    device_token: string; 
  }) => void;
  clearTokens: () => void;
  updateWallets: (wallets: Wallet[]) => void;
  isAuthenticated: boolean;
}

const defaultContextValue: AppContextType = {
  apiKey: "",
  setApiKey: () => {},
  buildType: "sandbox",
  setBuildType: () => {},
};

const AppContext = createContext<AppContextType>(defaultContextValue);
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState<string>("");
  const [buildType, setBuildType] = useState<string>("sandbox");

  const value = {
    apiKey,
    setApiKey,
    buildType,
    setBuildType,
  };

  return (
    <AppContext.Provider value={value}>
      <OktoProvider
        apiKey={process.env.NEXT_PUBLIC_OKTO_API_KEY || ""}
        buildType={BuildType.SANDBOX}
      >
        {children}
      </OktoProvider>
    </AppContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  // Clear stale auth state on initial load
  useEffect(() => {
    if (status === 'unauthenticated') {
      console.log('No valid session, clearing stored auth state');
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('wallets');
      document.cookie = 'auth_tokens=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      setAuthToken(null);
      setRefreshToken(null);
      setDeviceToken(null);
      setWallets([]);
    }
  }, [status]);

  // Handle navigation based on auth state
  useEffect(() => {
    const checkAuth = async () => {
      if (isNavigating) {
        return;
      }

      console.log('AuthProvider - Checking auth state');
      console.log('Current path:', pathname);
      console.log('Session status:', status);
      console.log('Has auth token:', !!authToken);
      console.log('Has wallets:', wallets.length > 0);

      if (status === 'authenticated' && authToken && wallets.length > 0) {
        if (pathname === '/login') {
          console.log('Fully authenticated, redirecting to chat');
          setIsNavigating(true);
          router.replace('/chat');
        }
      } else if (status === 'unauthenticated' || !authToken) {
        if (pathname === '/chat') {
          console.log('Not authenticated, redirecting to login');
          setIsNavigating(true);
          router.replace('/login');
        }
      }
    };

    checkAuth();
  }, [status, pathname, isNavigating, authToken, wallets]);

  // Reset isNavigating when pathname changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  // Restore auth state from localStorage
  useEffect(() => {
    const storedTokens = localStorage.getItem('auth_tokens');
    const storedWallets = localStorage.getItem('wallets');

    if (storedTokens && status === 'authenticated') {
      try {
        const tokens = JSON.parse(storedTokens);
        console.log('Restored auth tokens from localStorage');
        setAuthToken(tokens.auth_token);
        setRefreshToken(tokens.refresh_auth_token);
        setDeviceToken(tokens.device_token);
      } catch (e) {
        console.error('Error parsing stored tokens:', e);
        localStorage.removeItem('auth_tokens');
      }
    }

    if (storedWallets && status === 'authenticated') {
      try {
        const parsedWallets = JSON.parse(storedWallets);
        console.log('Restored wallets from localStorage');
        setWallets(parsedWallets);
      } catch (e) {
        console.error('Error parsing stored wallets:', e);
        localStorage.removeItem('wallets');
      }
    }
  }, [status]);

  const setAuthTokens = (tokens: { 
    auth_token: string; 
    refresh_auth_token: string; 
    device_token: string; 
  }) => {
    console.log('Setting auth tokens');
    
    // Store in localStorage and cookies
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
    document.cookie = `auth_tokens=${JSON.stringify(tokens)}; path=/; max-age=86400; secure; samesite=lax`;

    // Update state
    setAuthToken(tokens.auth_token);
    setRefreshToken(tokens.refresh_auth_token);
    setDeviceToken(tokens.device_token);
    
    console.log('Auth tokens set successfully');
  };

  const updateWallets = (newWallets: Wallet[]) => {
    console.log('Updating wallets:', newWallets);
    localStorage.setItem('wallets', JSON.stringify(newWallets));
    setWallets(newWallets);
  };

  const clearTokens = () => {
    console.log('Clearing auth tokens and wallets');
    
    // Clear localStorage and cookies
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('wallets');
    document.cookie = 'auth_tokens=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // Clear state
    setAuthToken(null);
    setRefreshToken(null);
    setDeviceToken(null);
    setWallets([]);
    
    console.log('Auth tokens and wallets cleared successfully');
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      authToken, 
      refreshToken, 
      deviceToken,
      wallets,
      setAuthTokens,
      clearTokens,
      updateWallets,
      isAuthenticated: !!authToken
    }}>
      {children}
    </AuthContext.Provider>
  );
}