import { initOktoTransferService, getOktoTransferService } from '../api/oktoTransferService';
import { refreshOktoToken } from './oktoAuth';

interface TransferParams {
  networkName: string;
  tokenAddress: string;
  quantity: string;
  recipientAddress: string;
}

interface TransferResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

export const executeOktoTransfer = async (params: TransferParams): Promise<TransferResult> => {
  try {
    // Get bearer token from localStorage
    const initialToken = localStorage.getItem('auth_token');
    if (!initialToken) {
      return {
        success: false,
        error: 'No bearer token found. Please login first.'
      };
    }

    // Refresh the token
    let token: string;
    try {
      token = await refreshOktoToken(initialToken);
    } catch (refreshError) {
      return {
        success: false,
        error: 'Failed to refresh authentication token.'
      };
    }

    // Get wallet from localStorage
    const walletsStr = localStorage.getItem('wallets');
    if (!walletsStr) {
      return {
        success: false,
        error: 'No wallet found. Please connect your wallet first.'
      };
    }

    try {
      const wallets = JSON.parse(walletsStr);
      if (!wallets || wallets.length === 0) {
        return {
          success: false,
          error: 'No wallet address available.'
        };
      }
    } catch (e) {
      return {
        success: false,
        error: 'Invalid wallet data.'
      };
    }

    // Initialize Okto service with refreshed token
    initOktoTransferService(token);
    const oktoService = getOktoTransferService();

    // Execute transfer
    const result = await oktoService.transferToken({
      networkName: params.networkName,
      tokenAddress: params.tokenAddress,
      quantity: params.quantity,
      recipientAddress: params.recipientAddress
    });

    return {
      success: true,
      orderId: result.orderId
    };

  } catch (error) {
    console.error('Okto transfer failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Example usage:
/*
const transfer = await executeOktoTransfer({
  networkName: 'POLYGON',
  tokenAddress: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', // MATIC token
  quantity: '0.1',
  recipientAddress: '0xCDAC489b062A5d057Bd15DdE758829eCF3A14e5B'
});

if (transfer.success) {
  console.log('Transfer successful! Order ID:', transfer.orderId);
} else {
  console.error('Transfer failed:', transfer.error);
}
*/
