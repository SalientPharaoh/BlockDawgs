import axios from 'axios';

interface TokenTransferRequest {
  network_name: string;
  token_address: string;
  quantity: string;
  recipient_address: string;
}

interface TokenTransferResponse {
  status: string;
  data: {
    orderId: string;
  };
}

class OktoApiClient {
  private baseUrl: string;
  private bearerToken: string;

  constructor(bearerToken: string) {
    this.baseUrl = 'https://sandbox-api.okto.tech/api/v1';
    this.bearerToken = bearerToken;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.bearerToken}`,
      'Content-Type': 'application/json',
    };
  }

  async executeTokenTransfer(params: TokenTransferRequest): Promise<TokenTransferResponse> {
    console.log(params);
    try {
      const response = await axios.post<TokenTransferResponse>(
        `${this.baseUrl}/transfer/tokens/execute`,
        params,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Token transfer failed: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  // Add method to check transfer status if needed
  async checkTransferStatus(orderId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transfer/status/${orderId}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to check transfer status: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }
}

export default OktoApiClient;
