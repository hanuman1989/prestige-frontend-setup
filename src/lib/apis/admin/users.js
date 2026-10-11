import axiosInstance from '../../axios';

const frontUsersAPI = {

  getUsers: async (params) => {
    try {
      const response =  await axiosInstance.get('admin/users', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch users' };
    }
  },

  getUser: async (id) => {
    try {
      const response = await axiosInstance.get(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user' };
    }
  },

  createUser: async (data) => {
    try {
      const response = await axiosInstance.post('/admin/users', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create user' };
    }
  },

  updateUser: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/admin/users/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user' };
    }
  },

  updateUserStatus: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/admin/users-status/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user status' };
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await axiosInstance.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete user' };
    }
  },

  exportUsers: async (params) => {
    try {
      const response =  await axiosInstance.get(`admin/users/export`, {
        params,
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      throw await parseBlobError(error, 'Unable to download the users data. Please try again.');
    }
  },
  
};

export default frontUsersAPI;
