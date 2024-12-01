"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { BuildType, OktoProvider } from "okto-sdk-react";

interface AppContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  buildType: string;
  setBuildType: (type: string) => void;
}

interface AuthContextType {
  authToken: string | null;
  refreshToken: string | null;
  deviceToken: string | null;
  setAuthTokens: (tokens: { 
    auth_token: string; 
    refresh_auth_token: string; 
    device_token: string; 
  }) => void;
  clearTokens: () => void;
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
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if there are tokens in localStorage on mount
    const storedAuthToken = localStorage.getItem('auth_token');
    const storedRefreshToken = localStorage.getItem('refresh_auth_token');
    const storedDeviceToken = localStorage.getItem('device_token');

    if (storedAuthToken) setAuthToken(storedAuthToken);
    if (storedRefreshToken) setRefreshToken(storedRefreshToken);
    if (storedDeviceToken) setDeviceToken(storedDeviceToken);
  }, []);

  const setAuthTokens = (tokens: { 
    auth_token: string; 
    refresh_auth_token: string; 
    device_token: string; 
  }) => {
    // Store in localStorage
    localStorage.setItem('auth_token', tokens.auth_token);
    localStorage.setItem('refresh_auth_token', tokens.refresh_auth_token);
    localStorage.setItem('device_token', tokens.device_token);

    // Store in cookies for server-side access
    document.cookie = `auth_token=${tokens.auth_token}; path=/; max-age=86400; secure; samesite=lax`;
    document.cookie = `refresh_auth_token=${tokens.refresh_auth_token}; path=/; max-age=86400; secure; samesite=lax`;
    document.cookie = `device_token=${tokens.device_token}; path=/; max-age=86400; secure; samesite=lax`;

    // Update state
    setAuthToken(tokens.auth_token);
    setRefreshToken(tokens.refresh_auth_token);
    setDeviceToken(tokens.device_token);
  };

  const clearTokens = () => {
    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_auth_token');
    localStorage.removeItem('device_token');

    // Clear cookies
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refresh_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'device_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // Clear state
    setAuthToken(null);
    setRefreshToken(null);
    setDeviceToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        authToken,
        refreshToken,
        deviceToken,
        setAuthTokens,
        clearTokens,
        isAuthenticated: !!authToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}