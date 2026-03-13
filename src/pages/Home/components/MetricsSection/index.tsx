import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RadioGroup, Radio } from '@douyinfe/semi-ui';

import { metrics } from '../../mockData';
import './index.less';

// Custom filled SVG icons for each metric
const BotFilledIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="8" width="18" height="12" rx="3" />
    <circle cx="8.5" cy="14" r="1.5" fill="white" />
    <circle cx="15.5" cy="14" r="1.5" fill="white" />
    <rect x="10" y="3" width="4" height="5" rx="2" />
    <circle cx="12" cy="3" r="2" />
    <rect x="0" y="11" width="3" height="6" rx="1.5" />
    <rect x="21" y="11" width="3" height="6" rx="1.5" />
  </svg>
);

const WorkflowFilledIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <rect x="2" y="2" width="8" height="6" rx="2" />
    <rect x="14" y="2" width="8" height="6" rx="2" />
    <rect x="8" y="16" width="8" height="6" rx="2" />
    <path d="M6 8v3a3 3 0 003 3h6a3 3 0 003-3V8" strokeWidth="0" />
    <rect x="11" y="11" width="2" height="5" />
  </svg>
);

const PlayFilledIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" />
    <path d="M10 8l6 4-6 4V8z" fill="white" />
  </svg>
);

const CheckFilledIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const ClockFilledIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

const TrendUpFilledIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="M6 16l4-4 3 2 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="18" cy="8" r="1.5" fill="white" />
  </svg>
);

const FolderFilledIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    <path d="M12 10v6M9 13h6" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

const iconMap: Record<string, React.FC> = {
  Bot: BotFilledIcon,
  Workflow: WorkflowFilledIcon,
  Play: PlayFilledIcon,
  CheckCircle: CheckFilledIcon,
  Clock: ClockFilledIcon,
  TrendingUp: TrendUpFilledIcon,
  FolderPlus: FolderFilledIcon,
};

const MetricsSection = () => {
  const { t } = useTranslation();
  const [scope, setScope] = useState<string>('department');

  return (
    <div className="home-card metrics-section">
      <div className="home-card-header">
        <span className="home-card-title">{t('homepage.metrics.title')}</span>
        <RadioGroup
          type="button"
          value={scope}
          onChange={(e) => setScope(e.target.value as string)}
        >
          <Radio value="department">{t('homepage.metrics.department')}</Radio>
          <Radio value="platform">{t('homepage.metrics.platform')}</Radio>
        </RadioGroup>
      </div>
      <div className="metrics-grid">
        {metrics.map((item) => {
          const IconComp = iconMap[item.icon] || BotFilledIcon;
          return (
            <div key={item.key} className="metric-card">
              <div
                className="metric-card-icon"
                style={{ backgroundColor: item.iconBgColor, color: item.iconColor }}
              >
                <IconComp />
              </div>
              <div className="metric-card-info">
                <div className="metric-card-label">{t(item.labelKey)}</div>
                <div className="metric-card-value-row">
                  <span className="metric-card-value">{item.value}</span>
                  {item.unit && <span className="metric-card-unit">{item.unit}</span>}
                  {item.trend && (
                    <span className={`metric-card-trend ${item.trend}`}>
                      {item.trendValue}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MetricsSection;
