"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AppContext";
import { useEffect } from "react";
import ApiClient from '../../api/apiClient';

const API_KEY = 'd91b795c-954c-457d-9628-49fdf7b5a4d7';
const apiClient = new ApiClient(API_KEY);

export function LoginButton() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setAuthTokens } = useAuth();

  // Handle session changes
  useEffect(() => {
    const handleGoogleAuth = async () => {
      if (status === "authenticated" && session?.id_token) {
        try {
          // Authenticate with Okto using Google ID token
          const response = await apiClient.authenticateWithGoogle(session.id_token);
          
          // Set all tokens in context
          setAuthTokens({
            auth_token: response.data.auth_token,
            refresh_auth_token: response.data.refresh_auth_token,
            device_token: response.data.device_token,
          });
          
          router.push("/dashboard");
        } catch (error) {
          console.error("Okto authentication error:", error);
        }
      }
    };

    handleGoogleAuth();
  }, [session, status, setAuthTokens, router]);

  const handleLogin = async () => {
    try {
      await signIn("google", {
        callbackUrl: "/dashboard",
      });
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
    >
      Continue with Google
    </button>
  );
}
