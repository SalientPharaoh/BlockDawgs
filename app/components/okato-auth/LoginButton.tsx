"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AppContext";
import { useEffect, useState } from "react";
import ApiClient from '../../api/apiClient';

const API_KEY = 'd91b795c-954c-457d-9628-49fdf7b5a4d7';
const apiClient = new ApiClient(API_KEY);

export function LoginButton() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setAuthTokens, updateWallets } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleGoogleAuth = async () => {
      // Skip if not authenticated or no id_token
      if (status !== "authenticated" || !session?.id_token) {
        return;
      }

      console.log("Session status:", status);
      console.log("Session data:", session);

      let currentTokens;
      
      // Check if we already have valid tokens
      const existingTokens = localStorage.getItem('auth_tokens');
      if (existingTokens) {
        try {
          const tokens = JSON.parse(existingTokens);
          if (tokens.auth_token) {
            console.log("Using existing auth tokens");
            currentTokens = tokens;
          }
        } catch (e) {
          console.log("Invalid stored tokens, proceeding with authentication");
        }
      }

      if (!currentTokens) {
        setLoading(true);
        try {
          console.log("Attempting Okto authentication with Google ID token");
          const response = await apiClient.authenticateWithGoogle(session.id_token);
          console.log("Okto authentication response:", response);
          
          if (!response?.data?.auth_token) {
            throw new Error("Invalid authentication response");
          }

          currentTokens = {
            auth_token: response.data.auth_token,
            refresh_auth_token: response.data.refresh_auth_token,
            device_token: response.data.device_token,
          };

          // Store tokens and update context
          setAuthTokens(currentTokens);
          console.log("Tokens stored successfully");
        } catch (error) {
          console.error("Okto authentication error:", error);
          setError(error instanceof Error ? error.message : 'Authentication failed');
          // Clear any partial authentication state on error
          localStorage.removeItem('auth_tokens');
          document.cookie = 'auth_tokens=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          return;
        } finally {
          setLoading(false);
        }
      }

      // Always check and create wallet regardless of token source
      try {
        console.log("Fetching wallets...");
        const walletsResponse = await apiClient.getWallets(currentTokens.auth_token);
        
        if (!walletsResponse?.data?.wallets || walletsResponse.data.wallets.length === 0) {
          console.log("No wallets found, creating new wallet...");
          try {
            const createWalletResponse = await apiClient.createWallet(currentTokens.auth_token);
            if (createWalletResponse?.data?.wallets) {
              console.log("Wallet created successfully:", createWalletResponse.data.wallets);
              updateWallets(createWalletResponse.data.wallets);
            } else {
              throw new Error("Failed to create wallet");
            }
          } catch (createError) {
            console.error("Error creating wallet:", createError);
            throw createError;
          }
        } else {
          console.log("Existing wallets found:", walletsResponse.data.wallets);
          updateWallets(walletsResponse.data.wallets);
        }
        console.log("Wallets updated successfully");
      } catch (walletError) {
        console.error("Error fetching wallets:", walletError);
      }
    };

    handleGoogleAuth();
  }, [session?.id_token, status]);

  const handleLogin = async () => {
    try {
      console.log("Initiating Google sign-in");
      setLoading(true);
      setError(null);
      await signIn("google", {
        callbackUrl: "/chat",
      });
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 rounded-lg bg-white/10 backdrop-blur-xl px-4 py-3 text-sm font-medium text-white border border-white/20 transition-all duration-300 hover:scale-[1.02] hover:bg-white/20 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {loading ? "Loading..." : "Continue with Google"}
      </button>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}
