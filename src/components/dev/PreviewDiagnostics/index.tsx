import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, X } from 'lucide-react';
import './index.less';

/**
 * 预览诊断面板（仅开发环境）
 * 显示当前 URL/路由、当前语言、i18n 加载状态。
 */
const PreviewDiagnostics = () => {
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);
  const location = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const rerender = () => force((n) => n + 1);
    i18n.on('initialized', rerender);
    i18n.on('loaded', rerender);
    i18n.on('languageChanged', rerender);
    i18n.on('failedLoading', rerender);
    return () => {
      i18n.off('initialized', rerender);
      i18n.off('loaded', rerender);
      i18n.off('languageChanged', rerender);
      i18n.off('failedLoading', rerender);
    };
  }, [i18n]);

  if (!import.meta.env.DEV) return null;

  const lng = i18n.language;
  const initialized = i18n.isInitialized;
  // 用一个已知 key 探测翻译是否已加载（sharing.market.pageTitle 为代表性 key）
  const probeKey = 'sharing.market.pageTitle';
  const probed = i18n.t(probeKey);
  const hasBundle = !!i18n.hasResourceBundle?.(lng, 'translation');
  const i18nReady = initialized && hasBundle && probed !== probeKey;

  const status = (ok: boolean) => (
    <span className={`pd-dot ${ok ? 'ok' : 'bad'}`} aria-hidden />
  );

  return (
    <>
      <button
        type="button"
        className="pd-toggle"
        title="预览诊断"
        onClick={() => setOpen((v) => !v)}
      >
        <Activity size={14} strokeWidth={2} />
      </button>

      {open && (
        <div className="pd-panel" role="dialog" aria-label="预览诊断面板">
          <div className="pd-header">
            <span>预览诊断</span>
            <button type="button" className="pd-close" onClick={() => setOpen(false)}>
              <X size={14} />
            </button>
          </div>
          <div className="pd-body">
            <Row label="完整 URL" value={typeof window !== 'undefined' ? window.location.href : '-'} mono />
            <Row label="路由 pathname" value={location.pathname} mono />
            <Row label="search" value={location.search || '(空)'} mono />
            <Row label="hash" value={location.hash || '(空)'} mono />
            <Row label="当前语言" value={lng} />
            <Row label="可用语言" value={(i18n.languages || []).join(', ') || '-'} />
            <Row
              label="i18n 已初始化"
              value={
                <>
                  {status(initialized)} {String(initialized)}
                </>
              }
            />
            <Row
              label="资源包已加载"
              value={
                <>
                  {status(hasBundle)} {String(hasBundle)}
                </>
              }
            />
            <Row
              label="i18n 就绪"
              value={
                <>
                  {status(i18nReady)} {i18nReady ? '已加载完成' : '未就绪 / 缺失'}
                </>
              }
            />
            <Row label="探测 key" value={probeKey} mono />
            <Row label="探测结果" value={probed} mono />
          </div>
        </div>
      )}
    </>
  );
};

const Row = ({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="pd-row">
    <div className="pd-label">{label}</div>
    <div className={`pd-value ${mono ? 'mono' : ''}`}>{value}</div>
  </div>
);

export default PreviewDiagnostics;
