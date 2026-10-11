import axiosInstance from '../axios';
import {
  clearFrontendAuthData,
  getFrontendToken,
  setFrontendToken,
  setFrontendUser,
} from '../helpers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/';
const SOCIAL_PROVIDERS = new Set(['google', 'facebook']);

function getAuthData(responseData) {
  const data = responseData?.data || responseData;
  const token = data?.token || data?.access_token;

  if (!token) {
    throw { message: 'Login response did not include an access token.' };
  }

  return { token, user: data?.user || null };
}

function persistAuthData(responseData) {
  const { token, user } = getAuthData(responseData);

  setFrontendToken(token);
  if (user) setFrontendUser(user);

  return { token, user };
}

function getApiUrl(path) {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
  return new URL(path, baseUrl).toString();
}

const frontendAuthAPI = {
  login: async (email, password) => {
    try {
      const response = await axiosInstance.post('/login', { email, password });
      return persistAuthData(response.data);
    } catch (error) {
      throw error.response?.data || error || { message: 'Unable to log in. Please try again.' };
    }
  },

  getSocialLoginRedirectUrl: (provider) => {
    if (!SOCIAL_PROVIDERS.has(provider)) {
      throw new Error('Unsupported social login provider.');
    }

    return getApiUrl(`auth/social/${provider}/redirect`);
  },

  exchangeSocialLoginCode: async (code) => {
    try {
      const response = await axiosInstance.post('/auth/social/exchange', { code });
      return persistAuthData(response.data);
    } catch (error) {
      throw error.response?.data || error || { message: 'Unable to complete social login. Please try again.' };
    }
  },

  logout: async () => {
    try {
      const token = getFrontendToken();
      const response = await axiosInstance.post('/logout', {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Unable to log out. Please try again.' };
    } finally {
      clearFrontendAuthData();
    }
  },

  requestPasswordReset: async (email) => {
    try {
      const response = await axiosInstance.post('/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error || { message: 'Unable to send a password reset link. Please try again.' };
    }
  },
};

export default frontendAuthAPI;
