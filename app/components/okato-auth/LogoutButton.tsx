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
    // <button
    //   onClick={handleLogout}
    //   className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
    // >
    //   Logout
    // </button>
    
    <button className='flex flex-row items-center justify-center space-x-5' onClick={handleLogout}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-sm font-medium">U</span>
            </div>
            <span className="text-md font-bold text-white/70">Log Out</span>
    </button>
  );
}
