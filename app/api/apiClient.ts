import axios from 'axios';

const API_BASE_URL = 'https://sandbox-api.okto.tech/api/v1';
const API_V2_BASE_URL = 'https://sandbox-api.okto.tech/api/v2';

interface EmailAuthResponse {
  token: string;
  message: string;
}

interface PhoneAuthResponse {
  status: string;
  data: {
    status: string;
    message: string;
    code: number;
    token: string;
    trace_id: string;
  };
}

interface AuthResponse {
  status: string;
  data: {
    auth_token: string;
    refresh_auth_token: string;
    device_token: string;
    message: string;
    trace_id?: string;
  };
}

interface EmailVerifyResponse {
  token: string;
  message: string;
}

interface Wallet {
  network_name: string;
  address: string;
  success: boolean;
}

interface WalletResponse {
  status: string;
  data: {
    wallets: Wallet[];
  };
}

class ApiClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders(authToken?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Api-Key': this.apiKey,
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    return headers;
  }

  async initiateEmailAuth(email: string): Promise<EmailAuthResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/authenticate/email`,
        { email },
        { headers: this.getHeaders() }
      );
      return response.data.data;
    } catch (error) {
      throw new Error('Failed to initiate email authentication');
    }
  }

  async verifyEmailOtp(email: string, otp: string, token: string): Promise<AuthResponse> {
    try {
      console.log(email, otp, token);
      const response = await axios.post(
        `${API_BASE_URL}/authenticate/email/verify`,
        { email, otp, token },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to verify OTP');
    }
  }

  async initiatePhoneAuth(phoneNumber: string): Promise<PhoneAuthResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/authenticate/phone`,
        {
          phone_number: phoneNumber,
          country_short_name: "IN"
        },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to initiate phone authentication');
    }
  }

  async verifyPhoneOtp(phoneNumber: string, otp: string, token: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/authenticate/phone/verify`,
        {
          phone_number: phoneNumber,
          country_short_name: "IN",
          otp,
          token
        },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to verify phone OTP');
    }
  }

  async authenticateWithGoogle(idToken: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(
        `${API_V2_BASE_URL}/authenticate`,
        { id_token: idToken },
        { 
          headers: this.getHeaders(),
          // Add retry configuration
          timeout: 10000, // 10 second timeout
          validateStatus: (status) => {
            return status < 500; // Resolve only if the status code is less than 500
          }
        }
      );

      if (response.status === 429) {
        throw new Error('Too many requests. Please try again later.');
      }

      if (response.status === 401) {
        throw new Error('Unauthorized. Please check your credentials.');
      }

      if (response.status !== 200 || !response.data?.data?.auth_token) {
        throw new Error(`Authentication failed: ${response.data?.message || 'Unknown error'}`);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Too many requests. Please try again later.');
        }
        throw new Error(`Authentication failed: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async logout(authToken: string): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/logout`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
    } catch (error) {
      throw new Error('Failed to logout');
    }
  }

  async createWallet(authToken: string): Promise<WalletResponse> {
    console.log('Creating wallet...');
    try {
      const response = await axios.post<WalletResponse>(
        `${API_BASE_URL}/wallet`,
        {},
        { headers: this.getHeaders(authToken) }
      );
      console.log('Wallet created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  async getWallets(authToken: string): Promise<WalletResponse> {
    console.log('Fetching wallets...');
    try {
      if (!authToken) {
        throw new Error('No auth token provided');
      }

      const response = await axios.get<WalletResponse>(
        `${API_BASE_URL}/wallet`,
        { 
          headers: this.getHeaders(authToken),
          // Add retry configuration
          timeout: 10000, // 10 second timeout
          validateStatus: (status) => {
            return status < 500; // Resolve only if the status code is less than 500
          }
        }
      );

      if (response.status === 429) {
        throw new Error('Too many requests. Please try again later.');
      }

      if (response.status === 401) {
        throw new Error('Unauthorized. Please check your authentication.');
      }

      if (response.status !== 200 || !response.data?.data?.wallets) {
        throw new Error(`Failed to fetch wallets: ${response.data || 'Unknown error'}`);
      }

      console.log('Wallets fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching wallets:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Too many requests. Please try again later.');
        }
        throw new Error(`Failed to fetch wallets: ${error.response?.data || error.message}`);
      }
      throw error;
    }
  }
}

export default ApiClient;
