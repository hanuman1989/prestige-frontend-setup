import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import APIs from '@/lib/apis';
import { getFrontendToken, getFrontendUser } from '@/lib/helpers';

export const loginFrontendUser = createAsyncThunk(
  'userAuth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      return await APIs.frontend.auth.login(email, password);
    } catch (error) {
      return rejectWithValue(error?.message || 'Unable to log in. Please try again.');
    }
  }
);

export const socialLoginFrontendUser = createAsyncThunk(
  'userAuth/socialLogin',
  async (code, { rejectWithValue }) => {
    try {
      return await APIs.frontend.auth.exchangeSocialLoginCode(code);
    } catch (error) {
      return rejectWithValue(error?.message || 'Unable to complete social login. Please try again.');
    }
  }
);

export const logoutFrontendUser = createAsyncThunk(
  'userAuth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await APIs.frontend.auth.logout();
    } catch (error) {
      return rejectWithValue(error?.message || 'Unable to log out. Please try again.');
    }
  }
);

export const initializeFrontendAuth = createAsyncThunk(
  'userAuth/initialize',
  async () => ({
    token: getFrontendToken(),
    user: getFrontendUser(),
  })
);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  initialized: false,
};

const userAuthSlice = createSlice({
  name: 'userAuth',
  initialState,
  reducers: {
    clearUserAuthError: (state) => {
      state.error = null;
    },
    updateFrontendUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginFrontendUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginFrontendUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.initialized = true;
      })
      .addCase(loginFrontendUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      .addCase(socialLoginFrontendUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(socialLoginFrontendUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.initialized = true;
      })
      .addCase(socialLoginFrontendUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.initialized = true;
      })
      .addCase(logoutFrontendUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutFrontendUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutFrontendUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      .addCase(initializeFrontendAuth.fulfilled, (state, action) => {
        if (state.initialized) return;

        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = Boolean(action.payload.token);
        state.initialized = true;
      });
  },
});

export const { clearUserAuthError, updateFrontendUser } = userAuthSlice.actions;
export default userAuthSlice.reducer;
