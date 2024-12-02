'use client';

import { useState, useEffect } from 'react';
import { executeOktoTransfer } from '../utils/oktoTransfer';
import { refreshOktoToken } from '../utils/oktoAuth';

export default function ApiTestPage() {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [bearerToken, setBearerToken] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('');

  useEffect(() => {
    // Get bearer token and wallet from localStorage
    const token = localStorage.getItem('auth_token');
    const walletsStr = localStorage.getItem('wallets');
    
    if (token) {
      setBearerToken(token);
    }

    if (walletsStr) {
      try {
        const wallets = JSON.parse(walletsStr);
        if (wallets && wallets.length > 0) {
          setWalletAddress(wallets[0].address);
        }
      } catch (e) {
        console.error('Error parsing wallets:', e);
      }
    }
  }, []);

  // Test data mimicking the chat response
  const mockExecutionData = {
    isExecute: true,
    executePath: {
      data: {
        routes: [
          {
            protocol: 'okto',
            network_name: 'POLYGON',
            token_address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // MATIC token
            quantity: '1000000',
            recipient_address: '0x0f5342B55ABCC0cC78bdB4868375bCA62B6c16eA'
          }
        ]
      }
    }
  };

  const testTransfer = async () => {
    if (!bearerToken) {
      setError('No bearer token found. Please login first.');
      return;
    }

    if (!walletAddress) {
      setError('No wallet address found. Please connect your wallet first.');
      return;
    }

    setLoading(true);
    setStatus('');
    setError('');

    try {
      // First refresh the token
      setStatus('Refreshing authentication token...');
      console.log('Starting token refresh with token:', bearerToken);
      
      try {
        const refreshedToken = await refreshOktoToken(bearerToken);
        console.log('Token refresh successful:', refreshedToken.substring(0, 10) + '...');
        setBearerToken(refreshedToken);
        setStatus('Token refreshed successfully.');
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
        setError(refreshError instanceof Error ? refreshError.message : 'Failed to refresh token');
        return;
      }

      // Execute the transfer with refreshed token
      setStatus('Starting transaction test...');
      const route = mockExecutionData.executePath.data.routes[0];
      
      const transfer = await executeOktoTransfer({
        networkName: route.network_name,
        tokenAddress: route.token_address,
        quantity: route.quantity,
        recipientAddress: route.recipient_address
      });

      if (transfer.success) {
        setStatus(`Transfer completed successfully! Order ID: ${transfer.orderId}`);
      } else {
        throw new Error(transfer.error);
      }
    } catch (error) {
      console.error('Test failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Okto API Test</h1>
        
        {/* Authentication Status */}
        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="w-4 h-4 rounded-full mr-2 bg-opacity-50 inline-block"
                    style={{
                      backgroundColor: bearerToken ? '#22c55e' : '#ef4444'
                    }}></span>
              <span>Bearer Token: {bearerToken ? 'Present' : 'Missing'}</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 rounded-full mr-2 bg-opacity-50 inline-block"
                    style={{
                      backgroundColor: walletAddress ? '#22c55e' : '#ef4444'
                    }}></span>
              <span>Wallet: {walletAddress || 'Not Connected'}</span>
            </div>
          </div>
        </div>

        {/* Test Configuration */}
        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Test Configuration</h2>
          <pre className="bg-black/30 p-4 rounded overflow-x-auto">
            {JSON.stringify(mockExecutionData, null, 2)}
          </pre>
        </div>

        {/* Test Controls */}
        <div className="flex flex-col gap-4 mb-6">
          <button
            onClick={testTransfer}
            disabled={loading || !bearerToken || !walletAddress}
            className={`
              px-6 py-3 rounded-lg font-medium
              ${(loading || !bearerToken || !walletAddress)
                ? 'bg-purple-500/50 cursor-not-allowed' 
                : 'bg-purple-500 hover:bg-purple-600'}
              transition-colors
            `}
          >
            {loading ? 'Testing...' : 'Run Transfer Test'}
          </button>
        </div>

        {/* Status Display */}
        {status && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
            <h2 className="text-green-400 font-semibold mb-2">Status</h2>
            <p className="text-green-300">{status}</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h2 className="text-red-400 font-semibold mb-2">Error</h2>
            <p className="text-red-300">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
