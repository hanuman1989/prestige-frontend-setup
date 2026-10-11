"use client";

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearUserAuthError,
  initializeFrontendAuth,
  loginFrontendUser,
  logoutFrontendUser,
} from '@/store/slices/userAuthSlice';

export const useUserAuth = () => {
  const dispatch = useDispatch();
  const userAuth = useSelector((state) => state.userAuth);

  useEffect(() => {
    if (!userAuth.initialized) {
      dispatch(initializeFrontendAuth());
    }
  }, [dispatch, userAuth.initialized]);

  return {
    ...userAuth,
    login: (email, password) => dispatch(loginFrontendUser({ email, password })),
    logout: () => dispatch(logoutFrontendUser()),
    clearError: () => dispatch(clearUserAuthError()),
  };
};
