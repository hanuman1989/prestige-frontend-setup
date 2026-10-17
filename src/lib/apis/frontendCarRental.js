import axiosInstance from "@/lib/axios";

const frontendCarRentalAPI = {
  carCategories: async (params) => {
    try {
      const response = await axiosInstance.get("/car-categories", {
        params,
      });
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Failed to fetch car categories" }
      );
    }
  },

  getCarCategory: async (slug) => {
    try {
      const response = await axiosInstance.get(`/car-categories/${slug}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to car category" };
    }
  },
  cars: async (params) => {
    try {
      const response = await axiosInstance.get("/cars", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch cars" };
    }
  },

  getCar: async (slug) => {
    try {
      const response = await axiosInstance.get(`/cars/${slug}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to cars" };
    }
  },
};

export default frontendCarRentalAPI;
