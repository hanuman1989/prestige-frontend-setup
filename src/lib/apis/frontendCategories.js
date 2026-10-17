import axiosInstance from "@/lib/axios";

const frontendCategoriesAPI = {
  categories: async (params) => {
    try {
      const response = await axiosInstance.get("/categories", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch categories" };
    }
  },

  getPopularCategories: async (params) => {
    try {
      const response = await axiosInstance.get("/categories/popular", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch categories" };
    }
  },

  getCategory: async (id) => {
    try {
      const response = await axiosInstance.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch categorie" };
    }
  },
};

export default frontendCategoriesAPI;
