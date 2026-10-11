"use client";

import { Provider } from 'react-redux';
import { useEffect, useState } from 'react';
import store from '@/store/store';
import Loader from '@/components/common/Loader';
import { initializeFrontendAuth } from '@/store/slices/userAuthSlice';

function AuthInitializer({ children }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await store.dispatch(initializeFrontendAuth());
      } finally {
        setIsReady(true);
      }
    };

    init();
  }, []);

  if (!isReady) {
    return <Loader />;
  }

  return children;
}

export function StoreProvider({ children }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
