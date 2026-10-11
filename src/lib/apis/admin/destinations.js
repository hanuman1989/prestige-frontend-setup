import axiosInstance from "@/lib/axios";

const destinationAPI = {
  getDestinations: async (params) => {
    try {
      const response = await axiosInstance.get("/admin/destinations", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch destinations" };
    }
  },

  getDestination: async (id) => {
    try {
      const response = await axiosInstance.get(`/admin/destinations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch destination" };
    }
  },

  createDestination: async (data) => {
    try {
      const response = await axiosInstance.post("/admin/destinations", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to create destination" };
    }
  },

  updateDestination: async (id, data) => {
    console.log(data, "data---------");
    try {
      const url = `/admin/destinations/${id}`;
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
      throw error.response?.data || { message: "Failed to update destination" };
    }
  },

  deleteDestination: async (id) => {
    try {
      const response = await axiosInstance.delete(`/admin/destinations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to delete destination" };
    }
  },
};

export default destinationAPI;
