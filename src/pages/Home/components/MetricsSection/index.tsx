import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RadioGroup, Radio } from '@douyinfe/semi-ui';
import { ExternalLink } from 'lucide-react';
import { metrics } from '../../mockData';
import './index.less';

// Custom filled SVG icons for each metric
const FilledBot = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="3" y="6" width="16" height="12" rx="3" fill="currentColor" />
    <circle cx="8" cy="11" r="1.5" fill="#fff" />
    <circle cx="14" cy="11" r="1.5" fill="#fff" />
    <rect x="9" y="2" width="4" height="5" rx="2" fill="currentColor" opacity="0.6" />
    <rect x="0" y="9" width="3" height="5" rx="1.5" fill="currentColor" opacity="0.5" />
    <rect x="19" y="9" width="3" height="5" rx="1.5" fill="currentColor" opacity="0.5" />
  </svg>
);

const FilledWorkflow = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="1" y="2" width="8" height="6" rx="2" fill="currentColor" />
    <rect x="13" y="2" width="8" height="6" rx="2" fill="currentColor" opacity="0.5" />
    <rect x="7" y="14" width="8" height="6" rx="2" fill="currentColor" />
    <path d="M5 8 L5 12 L11 12 L11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M17 8 L17 12 L11 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
  </svg>
);

const FilledPlay = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="1" y="1" width="20" height="20" rx="5" fill="currentColor" opacity="0.15" />
    <path d="M8 5.5 L17 11 L8 16.5Z" fill="currentColor" />
  </svg>
);

const FilledCheck = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="10" fill="currentColor" opacity="0.15" />
    <circle cx="11" cy="11" r="7" fill="currentColor" />
    <path d="M7.5 11 L10 13.5 L14.5 8.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const FilledClock = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="10" fill="currentColor" opacity="0.15" />
    <circle cx="11" cy="11" r="7" fill="currentColor" />
    <path d="M11 7 L11 11.5 L14 13.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const FilledTrending = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="1" y="1" width="20" height="20" rx="5" fill="currentColor" opacity="0.15" />
    <path d="M4 15 L8.5 10 L12 13 L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M14 6 L18 6 L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const FilledFolder = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M2 5 C2 3.9 2.9 3 4 3 L8.5 3 L10.5 5.5 L18 5.5 C19.1 5.5 20 6.4 20 7.5 L20 17 C20 18.1 19.1 19 18 19 L4 19 C2.9 19 2 18.1 2 17Z" fill="currentColor" />
    <line x1="8" y1="12" x2="14" y2="12" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="11" y1="9" x2="11" y2="15" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const iconCompMap: Record<string, React.FC> = {
  Bot: FilledBot,
  Workflow: FilledWorkflow,
  Play: FilledPlay,
  CheckCircle: FilledCheck,
  Clock: FilledClock,
  TrendingUp: FilledTrending,
  FolderPlus: FilledFolder,
};

const MetricsSection = () => {
  const { t } = useTranslation();
  const [scope, setScope] = useState<string>('department');
  const [activeIndex, setActiveIndex] = useState(0);

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
      <div className="metrics-list">
        {metrics.map((item, index) => {
          const IconComp = iconCompMap[item.icon] || FilledBot;
          const isActive = index === activeIndex;
          return (
            <div
              key={item.key}
              className={`metric-card ${isActive ? 'metric-card-active' : ''}`}
              style={isActive ? {
                backgroundColor: item.iconBgColor,
                borderColor: item.iconColor,
              } : undefined}
              onClick={() => setActiveIndex(index)}
            >
              <div className="metric-card-left">
                <div
                  className="metric-card-icon"
                  style={{ color: item.iconColor }}
                >
                  <IconComp />
                </div>
                <span className="metric-card-label">{t(item.labelKey)}</span>
              </div>
              <div className="metric-card-value">
                {item.value}{item.unit || ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MetricsSection;
