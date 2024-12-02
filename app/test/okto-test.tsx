'use client';

import { useState } from 'react';
import { initOktoTransferService, getOktoTransferService } from '../api/oktoTransferService';

// Initialize Okto service
const OKTO_BEARER_TOKEN = 'd91b795c-954c-457d-9628-49fdf7b5a4d7';
initOktoTransferService(OKTO_BEARER_TOKEN);

export default function TestPage() {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Test data mimicking the chat response with correct token address
  const mockExecutionData = {
    isExecute: true,
    executePath: {
      data: {
        routes: [
          {
            protocol: 'okto',
            network_name: 'POLYGON',
            token_address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', // MATIC token on Polygon
            quantity: '0.1',
            recipient_address: '0xCDAC489b062A5d057Bd15DdE758829eCF3A14e5B'
          }
        ]
      }
    }
  };

  const testTransfer = async () => {
    setLoading(true);
    setStatus('');
    setError('');

    try {
      setStatus('Starting transaction test...');
      
      const oktoService = getOktoTransferService();
      const executePath = mockExecutionData.executePath.data.routes;

      for(const route of executePath) {
        if(route.protocol.toLowerCase() === 'okto') {
          setStatus('Executing Okto transfer...');
          
          const result = await oktoService.transferToken({
            networkName: route.network_name,
            tokenAddress: route.token_address,
            quantity: route.quantity,
            recipientAddress: route.recipient_address
          });

          setStatus('Transfer completed successfully! Order ID: ' + result.orderId);
        }
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
        <h1 className="text-2xl font-bold mb-8">Okto Transfer Test</h1>
        
        {/* Test Configuration Display */}
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
            disabled={loading}
            className={`
              px-6 py-3 rounded-lg font-medium
              ${loading 
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

        {/* Bearer Token Status */}
        <div className={`mt-6 p-4 rounded-lg ${OKTO_BEARER_TOKEN ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
          <h2 className="font-semibold mb-2">Bearer Token Status</h2>
          <p>{OKTO_BEARER_TOKEN ? 'Token is configured' : 'Warning: Bearer token is not set'}</p>
        </div>
      </div>
    </div>
  );
}
