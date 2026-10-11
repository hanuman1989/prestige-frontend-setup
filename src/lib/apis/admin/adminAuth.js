import axiosInstance from "@/lib/axios";
import { setToken, setUser, clearAuthData } from "@/lib/helpers";

const authAPI = {
  login: async (email, password, isChecked) => {
    try {
      const response = await axiosInstance.post("/admin/login", {
        email,
        password,
        isChecked,
      });

      const { access_token, admin_user } = response.data.data;

      // Store in localStorage for persistence
      setToken(access_token);
      setUser(admin_user);
      return { token: access_token, user: admin_user };
    } catch (error) {
      throw error.response?.data || { message: "Login failed" };
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/admin/logout");
      clearAuthData();
    } catch (error) {
      // Clear local data even if request fails
      clearAuthData();
      throw error.response?.data || { message: "Logout failed" };
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await axiosInstance.get("/admin/me");
      setUser(response.data.data);
      return response.data.data;
    } catch (error) {
      clearAuthData();
      throw error.response?.data || { message: "Failed to fetch user" };
    }
  },

  refreshToken: async () => {
    try {
      const response = await axiosInstance.post("/admin/refresh");
      const { token } = response.data;
      setToken(token);
      return token;
    } catch (error) {
      clearAuthData();
      throw error.response?.data || { message: "Token refresh failed" };
    }
  },
};

export default authAPI;
