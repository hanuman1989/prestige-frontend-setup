'use client';

import { useDispatch, useSelector } from 'react-redux';
import { loginUser, logoutUser } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    initialized,
  } = useSelector((state) => state.auth);

  const login = async (email, password, isChecked) => {
    const result = await dispatch(loginUser({ email, password, isChecked }));
    return result;
  };

  const logout = async () => {
    const result = await dispatch(logoutUser());
    if (result.type === logoutUser.fulfilled.type) {
      router.push('/admin/login');
    }
    return result;
  };

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    initialized,
    login,
    logout,
  };
};
