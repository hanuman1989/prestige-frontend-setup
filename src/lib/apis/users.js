import axiosInstance from '../axios';
import { getFrontendToken } from '../helpers';

const usersAPI = {
  register: async (data) => {
    try {
      const response = await axiosInstance.post('/register', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Unable to create your account. Please try again.' };
    }
  },

  resetPassword: async (data) => {
    try {
      const response = await axiosInstance.post('/reset-password', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Unable to reset your password. Please try again.' };
    }
  },

  changePassword: async (data) => {
    try {
      const token = getFrontendToken();
      const response = await axiosInstance.put('/profile/password', data, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Unable to update your password. Please try again.' };
    }
  },

  updateUser: async (data) => {
    try {
      const token = getFrontendToken();
      const response = await axiosInstance.put('/profile', data, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Unable to update your profile. Please try again.' };
    }
  },
};

export default usersAPI;
