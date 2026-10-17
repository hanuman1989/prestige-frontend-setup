import axiosInstance from "@/lib/axios";

const frontendPackagesAPI = {
  packages: async (params) => {
    try {
      const response = await axiosInstance.get("/packages", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch packages" };
    }
  },

  getSpecialPackages: async (params) => {
    try {
      const response = await axiosInstance.get("/packages/special", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch packages" };
    }
  },

  getPackage: async (slug) => {
    try {
      const response = await axiosInstance.get(`/packages/${slug}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch package" };
    }
  },
};

export default frontendPackagesAPI;
