import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface ServiceWorkerUpdateContextValue {
  needRefresh: boolean;
  update: () => void;
  dismiss: () => void;
}

const ServiceWorkerUpdateContext =
  createContext<ServiceWorkerUpdateContextValue | null>(null);

export const ServiceWorkerUpdateProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const update = useCallback(() => {
    void updateServiceWorker(true);
  }, [updateServiceWorker]);

  const dismiss = useCallback(() => {
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  const value = useMemo(
    () => ({ needRefresh, update, dismiss }),
    [needRefresh, update, dismiss],
  );

  return (
    <ServiceWorkerUpdateContext.Provider value={value}>
      {children}
    </ServiceWorkerUpdateContext.Provider>
  );
};

export const useServiceWorkerUpdate = (): ServiceWorkerUpdateContextValue => {
  const ctx = useContext(ServiceWorkerUpdateContext);
  if (!ctx) {
    throw new Error(
      'useServiceWorkerUpdate must be used within ServiceWorkerUpdateProvider',
    );
  }
  return ctx;
};
