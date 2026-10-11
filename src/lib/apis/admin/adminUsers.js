import axiosInstance from "@/lib/axios";

const adminUsersAPI = {
  getUsers: async (params) => {
    try {
      const response = await axiosInstance.get("/admin/admin-users", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch users" };
    }
  },

  getUser: async (id) => {
    try {
      const response = await axiosInstance.get(`/admin/admin-users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch user" };
    }
  },

  createUser: async (data) => {
    try {
      const response = await axiosInstance.post("/admin/admin-users", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to create user" };
    }
  },

  updateUser: async (id, data) => {
    try {
      const response = await axiosInstance.put(
        `/admin/admin-users/${id}`,
        data,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to update user" };
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await axiosInstance.delete(`/admin/admin-users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to delete user" };
    }
  },

  changePassword: async (id, data) => {
    try {
      const response = await axiosInstance.patch(
        `/admin/admin-users/${id}/password`,
        data,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to change password" };
    }
  },
};

export default adminUsersAPI;
