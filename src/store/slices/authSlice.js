import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import APIs from "@/lib/apis";
import { getUser, getToken } from "@/lib/helpers";

// Async Thunks
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password, isChecked }, { rejectWithValue }) => {
    try {
      const data = await APIs.admin.adminAuth.login(email, password, isChecked);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Login failed");
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await APIs.admin.adminAuth.logout();
      return null;
    } catch (error) {
      // Even if logout fails on server, we still want to clear local state
      return rejectWithValue(error.message || "Logout failed");
    }
  },
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) {
        return rejectWithValue("No token found");
      }

      const user = await APIs.admin.adminAuth.getCurrentUser();
      return { token, user };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch user");
    }
  },
);

export const initializeAuth = createAsyncThunk(
  "auth/initializeAuth",
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      const user = getUser();

      if (token && user) {
        try {
          // Verify token is still valid
          const currentUser = await APIs.admin.adminAuth.getCurrentUser();
          return { token, user: currentUser };
        } catch (error) {
          return rejectWithValue("Token expired");
        }
      }

      return rejectWithValue("No auth data");
    } catch (error) {
      return rejectWithValue("Auth initialization failed");
    }
  },
);

// Initial State
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  initialized: false,
};

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login user
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });

    // Logout user
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        // Clear state even if logout fails
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });

    // // Fetch current user
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });

    // Initialize auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.initialized = true;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.initialized = true;
      });
  },
});

export const { clearError, resetAuth } = authSlice.actions;
export default authSlice.reducer;
