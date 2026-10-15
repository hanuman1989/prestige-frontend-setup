import axiosInstance from "@/lib/axios";

// Use POST method overriding so Laravel can parse uploaded files.
const patchStep = (url, data) => {
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    const payload = new FormData();
    for (const [key, value] of data.entries()) {
      payload.append(key, value);
    }
    payload.set("_method", "PATCH");
    return axiosInstance.post(url, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  return axiosInstance.patch(url, data);
};

const packageAPI = {
  getpackages: async (params) => {
    try {
      const response = await axiosInstance.get("/admin/packages", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch packages" };
    }
  },

  getPackage: async (id) => {
    try {
      const response = await axiosInstance.get(`/admin/packages/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch package" };
    }
  },

  // Step 1: create the package and return its ID for subsequent steps.
  createPackage: async (data) => {
    try {
      const response = await axiosInstance.post(
        "/admin/packages/basic-details",
        data,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to create package" };
    }
  },

  // Step 1.
  updatePackage: async (id, data) => {
    try {
      const response = await patchStep(
        `/admin/packages/${id}/basic-details`,
        data,
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          message: "Failed to save package basic details",
        }
      );
    }
  },

  // Step 2.
  saveRelations: async (id, data) => {
    try {
      const response = await patchStep(
        `/admin/packages/${id}/categories-destinations`,
        data,
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          message: "Failed to save package categories and destinations",
        }
      );
    }
  },

  // Step 3.
  saveItineraries: async (id, data) => {
    try {
      const response = await patchStep(
        `/admin/packages/${id}/itineraries`,
        data,
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          message: "Failed to save package itineraries",
        }
      );
    }
  },

  // Step 4.
  saveDetails: async (id, data) => {
    try {
      const response = await patchStep(`/admin/packages/${id}/details`, data);
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Failed to save package details" }
      );
    }
  },

  // Step 5.
  savePhotos: async (id, data) => {
    try {
      const response = await patchStep(`/admin/packages/${id}/photos`, data);
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Failed to save package photos" }
      );
    }
  },

  deletePackage: async (id) => {
    try {
      const response = await axiosInstance.delete(`/admin/packages/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to delete package" };
    }
  },
};

// Keep the existing spelling available to other callers.
packageAPI.getPackages = packageAPI.getpackages;

export default packageAPI;
