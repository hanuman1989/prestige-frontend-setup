'use client';

import { Provider } from 'react-redux';
import { useEffect, useState } from 'react';
import store from '@/store/store';
import { initializeAuth } from '@/store/slices/authSlice';
import Loader from '@/components/common/Loader';

function AuthInitializer({ children }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await store.dispatch(initializeAuth());
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

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
