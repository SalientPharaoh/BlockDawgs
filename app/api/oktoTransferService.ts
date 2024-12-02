import OktoApiClient from './oktoApiClient';

export interface TokenTransferParams {
  networkName: string;
  tokenAddress: string;
  quantity: string;
  recipientAddress: string;
}

export class OktoTransferService {
  private apiClient: OktoApiClient;

  constructor(bearerToken: string) {
    this.apiClient = new OktoApiClient(bearerToken);
  }

  async transferToken(params: TokenTransferParams) {
    try {
      const response = await this.apiClient.executeTokenTransfer({
        network_name: params.networkName.toUpperCase(),
        token_address: params.tokenAddress,
        quantity: params.quantity,
        recipient_address: params.recipientAddress
      });

      // Start polling for transfer status
      if (response.status === 'success') {
        return this.pollTransferStatus(response.data.orderId);
      }

      throw new Error('Transfer initialization failed');
    } catch (error) {
      console.error('Token transfer error:', error);
      throw error;
    }
  }

  private async pollTransferStatus(orderId: string, maxAttempts = 10): Promise<any> {
    let attempts = 0;
    
    const checkStatus = async (): Promise<any> => {
      try {
        const status = await this.apiClient.checkTransferStatus(orderId);
        
        if (status.status === 'completed') {
          return status;
        }
        
        if (status.status === 'failed') {
          throw new Error(`Transfer failed: ${status.message || 'Unknown error'}`);
        }
        
        // Continue polling if still pending
        if (attempts < maxAttempts) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          return checkStatus();
        }
        
        throw new Error('Transfer status check timeout');
      } catch (error) {
        console.error('Status check error:', error);
        throw error;
      }
    };

    return checkStatus();
  }
}

// Create a singleton instance
let oktoTransferService: OktoTransferService | null = null;

export const initOktoTransferService = (bearerToken: string) => {
  oktoTransferService = new OktoTransferService(bearerToken);
  return oktoTransferService;
};

export const getOktoTransferService = () => {
  if (!oktoTransferService) {
    throw new Error('OktoTransferService not initialized');
  }
  return oktoTransferService;
};
