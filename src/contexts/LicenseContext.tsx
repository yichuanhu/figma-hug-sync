import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';

export type LicenseStatus = 'loading' | 'valid' | 'invalid' | 'expired';

interface LicenseState {
  status: LicenseStatus;
  expireAt?: string;
  refresh: () => void;
}

const STORAGE_KEY = 'mock-license-status';
const STORAGE_EXPIRE_KEY = 'mock-license-expire-at';

const LicenseContext = createContext<LicenseState>({
  status: 'loading',
  refresh: () => {},
});

const readMockLicense = (): { status: LicenseStatus; expireAt?: string } => {
  try {
    // 支持通过 URL 参数快速预览：?license=invalid | expired&expireAt=2026-05-01
    const params = new URLSearchParams(window.location.search);
    const urlStatus = params.get('license');
    const urlExpire = params.get('expireAt') || undefined;
    if (urlStatus === 'invalid') {
      localStorage.setItem(STORAGE_KEY, 'invalid');
    } else if (urlStatus === 'expired') {
      localStorage.setItem(STORAGE_KEY, 'expired');
      if (urlExpire) localStorage.setItem(STORAGE_EXPIRE_KEY, urlExpire);
    } else if (urlStatus === 'valid') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_EXPIRE_KEY);
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    const expireAt = localStorage.getItem(STORAGE_EXPIRE_KEY) || undefined;
    if (raw === 'invalid') return { status: 'invalid' };
    if (raw === 'expired') return { status: 'expired', expireAt: expireAt || '2026-01-01' };
    return { status: 'valid' };
  } catch {
    return { status: 'valid' };
  }
};

interface ProviderProps {
  children: ReactNode;
}

export const LicenseProvider = ({ children }: ProviderProps) => {
  const [state, setState] = useState<{ status: LicenseStatus; expireAt?: string }>({ status: 'loading' });

  const load = useCallback(() => {
    setState({ status: 'loading' });
    // 默认清除历史预览状态，避免残留导致始终看到“未授权”页面
    try {
      const params = new URLSearchParams(window.location.search);
      if (!params.get('license')) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_EXPIRE_KEY);
      }
    } catch {
      // ignore
    }
    // 模拟异步：真实接入时替换为 API 调用
    setTimeout(() => {
      setState(readMockLicense());
    }, 200);
  }, []);

  useEffect(() => {
    load();
    // 调试入口：window.__setLicense('invalid' | 'expired' | 'valid', '2026-04-01')
    (window as unknown as { __setLicense?: (s: LicenseStatus, e?: string) => void }).__setLicense = (s, e) => {
      if (s === 'valid') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_EXPIRE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, s);
        if (e) localStorage.setItem(STORAGE_EXPIRE_KEY, e);
      }
      load();
    };
  }, [load]);

  return (
    <LicenseContext.Provider value={{ status: state.status, expireAt: state.expireAt, refresh: load }}>
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = () => useContext(LicenseContext);
