import { Navigate } from 'react-router-dom';

/**
 * R-05 路由守卫：仅供应商可访问"上架管理"模块。
 * 当前为 Mock 阶段，默认所有用户均为供应商；可通过 localStorage('role') = 'consumer' 模拟非供应商。
 */
export const isSupplier = (): boolean => {
  try {
    const role = typeof window !== 'undefined' ? window.localStorage.getItem('role') : null;
    return role !== 'consumer';
  } catch {
    return true;
  }
};

interface Props {
  children: React.ReactNode;
}

export default function SupplierGuard({ children }: Props) {
  if (!isSupplier()) {
    return <Navigate to="/sharing-center/market" replace />;
  }
  return <>{children}</>;
}
