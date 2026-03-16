import { useTranslation } from 'react-i18next';
import { metrics } from '../../mockData';
import robotsIconRaw from '@/assets/metrics/robots.svg?raw';
import processesIconRaw from '@/assets/metrics/processes.svg?raw';
import todayTasksIconRaw from '@/assets/metrics/today-tasks.svg?raw';
import successRateIconRaw from '@/assets/metrics/success-rate.svg?raw';
import savedHoursIconRaw from '@/assets/metrics/saved-hours.svg?raw';
import savedCostIconRaw from '@/assets/metrics/saved-cost.svg?raw';
import weeklyNewIconRaw from '@/assets/metrics/weekly-new.svg?raw';
import './index.less';

const iconMap: Record<string, string> = {
  Bot: robotsIconRaw,
  Workflow: processesIconRaw,
  Play: todayTasksIconRaw,
  CheckCircle: successRateIconRaw,
  Clock: savedHoursIconRaw,
  TrendingUp: savedCostIconRaw,
  FolderPlus: weeklyNewIconRaw,
};

const MetricsSection = () => {
  const { t } = useTranslation();

  return (
    <div className="home-card metrics-section">
      <div className="home-card-header">
        <span className="home-card-title">{t('homepage.metrics.title')}</span>
      </div>
      <div className="metrics-grid">
        {metrics.map((item) => {
          const iconSvg = iconMap[item.icon] || '';
          return (
            <div key={item.key} className="metric-card">
              <div className="metric-card-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: iconSvg }} />
              <div className="metric-card-info">
                <div className="metric-card-label">{t(item.labelKey)}</div>
                <div className="metric-card-value-row">
                  <span className="metric-card-value">{item.value}</span>
                  {item.unit && <span className="metric-card-unit">{item.unit}</span>}
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
