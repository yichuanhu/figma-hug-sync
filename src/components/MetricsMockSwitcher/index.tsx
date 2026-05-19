import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@douyinfe/semi-ui';
import { Wifi, Hourglass, ZapOff, Bug } from 'lucide-react';
import {
  getMetricsMockMode,
  setMetricsMockMode,
  subscribeMetricsMockMode,
} from '@/mocks/operationsMetrics/service';
import type { MetricsMockMode } from '@/mocks/operationsMetrics/types';
import './index.less';

/**
 * 浮动 Mock 切换器（仅供 STORY-010 自定义指标演示使用）
 *
 * 三种模式：
 * - ready：正常响应（300ms）
 * - slow：慢速响应（约 2s），用于验证 loading 状态
 * - error：抛 NETWORK 异常，用于验证错误态与重试
 */
const MetricsMockSwitcher = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<MetricsMockMode>(getMetricsMockMode());
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => subscribeMetricsMockMode(setMode), []);

  const opts: { key: MetricsMockMode; icon: JSX.Element; label: string }[] = [
    { key: 'ready', icon: <Wifi size={14} strokeWidth={2} />, label: t('metricsMock.ready') },
    { key: 'slow', icon: <Hourglass size={14} strokeWidth={2} />, label: t('metricsMock.slow') },
    { key: 'error', icon: <ZapOff size={14} strokeWidth={2} />, label: t('metricsMock.error') },
  ];

  return (
    <div className={`metrics-mock-switcher ${collapsed ? 'collapsed' : ''}`}>
      {collapsed ? (
        <Tooltip content={t('metricsMock.tooltip')} position="left">
          <button
            type="button"
            className={`mock-toggle-btn mode-${mode}`}
            onClick={() => setCollapsed(false)}
          >
            <Bug size={16} strokeWidth={2} />
          </button>
        </Tooltip>
      ) : (
        <div className="mock-panel">
          <div className="mock-panel-title">
            <Bug size={14} strokeWidth={2} />
            <span>{t('metricsMock.title')}</span>
            <button
              type="button"
              className="mock-panel-close"
              onClick={() => setCollapsed(true)}
              aria-label="close"
            >
              ×
            </button>
          </div>
          <div className="mock-panel-options">
            {opts.map((o) => (
              <button
                key={o.key}
                type="button"
                className={`mock-option mode-${o.key} ${mode === o.key ? 'active' : ''}`}
                onClick={() => setMetricsMockMode(o.key)}
              >
                {o.icon}
                <span>{o.label}</span>
              </button>
            ))}
          </div>
          <div className="mock-panel-hint">{t('metricsMock.hint')}</div>
        </div>
      )}
    </div>
  );
};

export default MetricsMockSwitcher;
