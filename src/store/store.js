import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userAuthReducer from './slices/userAuthSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    userAuth: userAuthReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/loginUser/fulfilled', 'auth/fetchCurrentUser/fulfilled'],
        ignoredPaths: ['auth.user'],
      },
    }),
});

export default store;
