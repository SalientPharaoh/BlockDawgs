'use client';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AppContext';

export function LogoutButton() {
  const router = useRouter();
  const { clearTokens } = useAuth();

  const handleLogout = async () => {
    console.log('Starting logout process');
    
    try {
      // Clear all auth tokens and context first
      clearTokens();
      console.log('Cleared auth context');

      // Sign out from NextAuth and wait for it to complete
      await signOut({ 
        redirect: false,
        callbackUrl: '/'
      });
      console.log('Signed out from NextAuth');

      // Force reload the page to clear all React state
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
    >
      Logout
    </button>
  );
}
