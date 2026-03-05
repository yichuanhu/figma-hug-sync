import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface BreadcrumbContextType {
  params: Record<string, string>;
  setParam: (key: string, value: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType>({
  params: {},
  setParam: () => {},
});

export const BreadcrumbProvider = ({ children }: { children: ReactNode }) => {
  const [params, setParams] = useState<Record<string, string>>({});
  const location = useLocation();

  // 路由切换时重置动态参数
  useEffect(() => {
    setParams({});
  }, [location.pathname]);

  const setParam = useCallback((key: string, value: string) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ params, setParam }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};

export const useBreadcrumbParams = () => useContext(BreadcrumbContext);
