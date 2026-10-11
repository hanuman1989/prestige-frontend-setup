// Token Management
export const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("adminAuthToken");
  }
  return null;
};

export const setToken = (token) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("adminAuthToken", token);
  }
};

export const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("adminAuthToken");
  }
};

// User Management
export const getUser = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const setUser = (user) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }
};

export const removeUser = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
  }
};

// Auth Data Management
export const clearAuthData = () => {
  removeToken();
  removeUser();
};

export const isAuthenticated = () => {
  return !!getToken();
};

// Frontend user authentication is deliberately isolated from admin credentials.
export const getFrontendToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("frontendAuthToken");
  }
  return null;
};

export const setFrontendToken = (token) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("frontendAuthToken", token);
  }
};

export const getFrontendUser = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("frontendUser");
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const setFrontendUser = (user) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("frontendUser", JSON.stringify(user));
  }
};

export const clearFrontendAuthData = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("frontendAuthToken");
    localStorage.removeItem("frontendUser");
  }
};
