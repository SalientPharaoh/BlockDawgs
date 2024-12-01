'use client';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AppContext';
import ApiClient from '../api/apiClient';

const API_KEY = 'd91b795c-954c-457d-9628-49fdf7b5a4d7';
const apiClient = new ApiClient(API_KEY);

export function LogoutButton() {
  const router = useRouter();
  const { authToken, clearTokens } = useAuth();
  const { data: session } = useSession();

  const handleLogout = async () => {
    try {
      if (authToken) {
        await apiClient.logout(authToken);
      }
      
      // Clear NextAuth session
      await signOut({ redirect: false });
      
      // Clear our auth context and local storage
      clearTokens();
      
      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the API call fails, we should still clear local state
      clearTokens();
      router.push('/login');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
    >
      Sign Out
    </button>
  );
}
