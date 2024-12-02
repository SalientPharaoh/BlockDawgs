import axios from 'axios';

interface RefreshTokenResponse {
  status: string;
  data?: {
    token: string;
  };
  error?: {
    code: number;
    errorCode: string;
    message: string;
    trace_id: string;
    details: string;
  };
}

export const refreshOktoToken = async (currentToken: string): Promise<string> => {
  try {
    const response = await axios.post<RefreshTokenResponse>(
      'https://sandbox-api.okto.tech/api/v1/refresh_token',  
      {},  
      {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('Refresh token response:', response.data);

    if (response.data.error) {
      throw new Error(response.data.error.message || 'Token refresh failed');
    }

    if (!response.data?.data?.token) {
      throw new Error('Invalid response format from refresh token API');
    }

    const newToken = response.data.data.token;
    
    // Update token in localStorage
    localStorage.setItem('auth_token', newToken);
    console.log('New token saved to localStorage');
    
    return newToken;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // If we get a 401 or 400, the token might be invalid or expired
        // In this case, we should return the current token and let the transfer proceed
        if (error.response.status === 401 || error.response.status === 400) {
          console.log('Token refresh failed, using current token');
          return currentToken;
        }
        throw new Error(`Token refresh failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.log('Token refresh failed, using current token');
        return currentToken;
      }
    }
    console.log('Token refresh failed, using current token');
    return currentToken;
  }
};
