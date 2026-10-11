"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { initializeFrontendAuth } from "@/store/slices/userAuthSlice";

const protectedRouteConfig = {
  admin: {
    redirectTo: "/admin/login",
    stateKey: "auth",
  },
  frontend: {
    redirectTo: "/?login=true",
    stateKey: "userAuth",
  },
};

export const useProtectedRoute = (accountType) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const config = protectedRouteConfig[accountType];
  const authState = useSelector((state) => state[config.stateKey]);

  useEffect(() => {
    if (accountType === "frontend" && !authState.initialized) {
      dispatch(initializeFrontendAuth());
    }
  }, [accountType, authState.initialized, dispatch]);

  useEffect(() => {
    if (authState.initialized && !authState.isAuthenticated) {
      router.replace(config.redirectTo);
    }
  }, [
    authState.initialized,
    authState.isAuthenticated,
    config.redirectTo,
    router,
  ]);

  return {
    isAuthorized: authState.initialized && authState.isAuthenticated,
    isCheckingAuth: !authState.initialized,
  };
};
