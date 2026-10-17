import axiosInstance from "@/lib/axios";

const frontendDestinationsAPI = {
  destination: async (params) => {
    try {
      const response = await axiosInstance.get("/destinations", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch destinations" };
    }
  },

  getTopDestination: async () => {
    try {
      const response = await axiosInstance.get("/destinations/top");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch destinations" };
    }
  },

  getDestination: async (id) => {
    try {
      const response = await axiosInstance.get(`/destinations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch destination" };
    }
  },
};

export default frontendDestinationsAPI;
