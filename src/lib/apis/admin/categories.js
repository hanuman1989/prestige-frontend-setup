import axiosInstance from "@/lib/axios";

const adminCategoriesAPI = {
  getCategories: async (params) => {
    try {
      const response = await axiosInstance.get("/admin/categories", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch categories" };
    }
  },

  getCategory: async (id) => {
    try {
      const response = await axiosInstance.get(`/admin/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch category" };
    }
  },

  createCategory: async (data) => {
    try {
      const response = await axiosInstance.post("/admin/categories", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to create category" };
    }
  },

  updateCategory: async (id, data) => {
    try {
      const url = `/admin/categories/${id}`;
      let response;
      if (typeof FormData !== "undefined" && data instanceof FormData) {
        // Laravel parses file uploads from POST, then applies the method override.
        const payload = new FormData();
        for (const [key, value] of data.entries()) payload.append(key, value);
        payload.set("_method", "PUT");
        response = await axiosInstance.post(url, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await axiosInstance.put(url, data);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to update category" };
    }
  },

  deleteCategory: async (id) => {
    try {
      const response = await axiosInstance.delete(`/admin/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to delete category" };
    }
  },
};

export default adminCategoriesAPI;
