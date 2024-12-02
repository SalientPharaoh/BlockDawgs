'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { LoginButton } from './LoginButton';
import ApiClient from '../../api/apiClient';
import { useAuth } from './AppContext';

const API_KEY = process.env.NEXT_PUBLIC_OKTO_API_KEY || '';
const apiClient = new ApiClient(API_KEY);

export const LoginPage: React.FC = () => {
  const router = useRouter();
  const { setAuthTokens } = useAuth();
  const [authMethod, setAuthMethod] = useState<'email' | 'phone' | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await apiClient.initiateEmailAuth(email);
      setToken(response.token);
      setShowOtp(true);
      setError('');
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await apiClient.initiatePhoneAuth(phone);
      setToken(response.data.token);
      setShowOtp(true);
      setError('');
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let response;
      if (authMethod === 'email') {
        response = await apiClient.verifyEmailOtp(email, otp, token);
      } else {
        response = await apiClient.verifyPhoneOtp(phone, otp, token);
      }

      const tokens = {
        auth_token: response.data.auth_token,
        refresh_auth_token: response.data.refresh_auth_token,
        device_token: response.data.device_token,
      };

      // Set tokens in context
      setAuthTokens(tokens);

      // Sign in with NextAuth
      const credentials = {
        ...tokens,
        ...(authMethod === 'email' ? { email } : { phone }),
        callbackUrl: '/chat',
      };

      const result = await signIn(
        authMethod === 'email' ? 'email-auth' : 'phone-auth',
        { 
          redirect: false,
          ...credentials
        }
      );

      if (result?.error) {
        throw new Error(result.error);
      }

      router.push('/chat');
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Invalid OTP or authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="animate-gradient-x absolute inset-0 bg-gradient-to-br from-purple-900/30 via-purple-600/30 to-purple-900/30"></div>
        <div className="absolute inset-0">
          <div className="absolute inset-0 backdrop-blur-3xl">
            <div className="absolute inset-0 bg-black/50"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-2xl space-y-8 rounded-2xl bg-black/30 p-12 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_rgba(192,132,252,0.15)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_100px_rgba(192,132,252,0.25)] hover:border-purple-500/30">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-violet-400 to-purple-400">
              BlockMate
            </h2>
            <p className="text-lg bg-gradient-to-r from-purple-300/90 to-purple-200/90 bg-clip-text text-transparent font-medium">
            Chat your way through the chain: Where Web3 wisdom meets AI simplicity
            </p>
            <p className="text-sm text-gray-400/80 italic">
            Blockchain simplified, through the power of conversation.
            </p>
          </div>

          <div className="mt-12 space-y-8">
            {error && (
              <div className="rounded-md bg-red-500/10 p-4 text-sm text-red-400 backdrop-blur-xl border border-red-500/20">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="transition-transform duration-300 hover:scale-[1.02]">
                <LoginButton />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-purple-500/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-black/30 backdrop-blur-xl px-4 text-gray-400">or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setAuthMethod('email')}
                  className={`flex items-center justify-center rounded-lg border border-purple-500/20 px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:scale-[1.05] hover:bg-purple-500/20 hover:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    authMethod === 'email' ? 'bg-purple-500/20 border-purple-500/40' : ''
                  }`}
                >
                  Email
                </button>
                <button
                  onClick={() => setAuthMethod('phone')}
                  className={`flex items-center justify-center rounded-lg border border-purple-500/20 px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:scale-[1.05] hover:bg-purple-500/20 hover:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    authMethod === 'phone' ? 'bg-purple-500/20 border-purple-500/40' : ''
                  }`}
                >
                  Phone
                </button>
              </div>

              {authMethod === 'email' && (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="sr-only">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="block w-full rounded-lg border border-purple-500/20 bg-black/20 backdrop-blur-xl px-4 py-3 text-white placeholder-gray-400 transition-all duration-300 hover:border-purple-500/40 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-purple-500 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isLoading ? 'Sending...' : 'Send OTP'}
                  </button>
                </form>
              )}

              {authMethod === 'phone' && (
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="phone" className="sr-only">
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="block w-full rounded-lg border border-purple-500/20 bg-black/20 backdrop-blur-xl px-4 py-3 text-white placeholder-gray-400 transition-all duration-300 hover:border-purple-500/40 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-purple-500 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isLoading ? 'Sending...' : 'Send OTP'}
                  </button>
                </form>
              )}

              {showOtp && (
                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="otp" className="sr-only">
                      OTP
                    </label>
                    <input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP"
                      className="block w-full rounded-lg border border-purple-500/20 bg-black/20 backdrop-blur-xl px-4 py-3 text-white placeholder-gray-400 transition-all duration-300 hover:border-purple-500/40 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-purple-500 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
