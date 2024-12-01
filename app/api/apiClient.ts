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

class ApiClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Api-Key': this.apiKey,
    };
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
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to authenticate with Google');
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
}

export default ApiClient;
