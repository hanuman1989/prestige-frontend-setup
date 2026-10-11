import axios from "axios";
import {
  clearAuthData,
  clearFrontendAuthData,
  getToken,
  getFrontendToken,
} from "@/lib/helpers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      config.headers = config.headers || {};
      config.headers["Content-Type"] = "multipart/form-data";
    }

    if (typeof window !== "undefined") {
      const requestUrl = `${config.baseURL || ""}${config.url || ""}`;
      const token = requestUrl.includes("/admin")
        ? getToken()
        : getFrontendToken();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
axiosInstance.interceptors.response.use(
  // Successful response
  (response) => {
    return response;
  },

  // Error response
  (error) => {
    if (typeof window !== "undefined") {
      const status = error?.response?.status;
      if (status === 403) {
        const requestUrl = `${error?.config?.baseURL || ""}${error?.config?.url || ""}`;

        const isAdminRequest = requestUrl.includes("/admin");

        if (isAdminRequest) {
          clearAuthData();
        } else {
          clearFrontendAuthData();
        }

        // Optional: remove related user/session information
        // localStorage.removeItem('user');
        // sessionStorage.removeItem('tenantId');

        // Determine login page
        const loginPath = isAdminRequest ? "/admin/login" : "/?login=true";

        // Avoid redirect loop
        if (window.location.pathname !== loginPath) {
          window.location.href = loginPath;
        }
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
