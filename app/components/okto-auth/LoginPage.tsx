'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { LoginButton } from './LoginButton';
import ApiClient from '../../api/apiClient';
import { useAuth } from './AppContext';

const API_KEY = process.env.OKTO_API_KEY || '';
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
        callbackUrl: '/dashboard',
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

      router.push('/dashboard');
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Invalid OTP or authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderAuthForm = () => {
    if (!authMethod) {
      return (
        <div className="space-y-4">
          <button
            onClick={() => setAuthMethod('email')}
            className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading}
          >
            Email Login
          </button>
          <button
            onClick={() => setAuthMethod('phone')}
            className="w-full px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
            disabled={isLoading}
          >
            Phone Login
          </button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 text-gray-500 bg-white">Or</span>
            </div>
          </div>
          <LoginButton />
        </div>
      );
    }

    if (showOtp) {
      return (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Enter OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter the OTP sent to your email"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      );
    }

    return (
      <form onSubmit={authMethod === 'email' ? handleEmailSubmit : handlePhoneSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {authMethod === 'email' ? 'Email Address' : 'Phone Number'}
          </label>
          <input
            type={authMethod === 'email' ? 'email' : 'tel'}
            value={authMethod === 'email' ? email : phone}
            onChange={(e) => authMethod === 'email' ? setEmail(e.target.value) : setPhone(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder={authMethod === 'email' ? 'Enter your email' : 'Enter your phone number'}
            required
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Sending OTP...' : 'Send OTP'}
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMethod(null);
            setShowOtp(false);
            setOtp('');
            setError('');
          }}
          className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          disabled={isLoading}
        >
          Back
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        {renderAuthForm()}
      </div>
    </div>
  );
};
