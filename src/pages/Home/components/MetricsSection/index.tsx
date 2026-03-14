import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RadioGroup, Radio } from '@douyinfe/semi-ui';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { metrics } from '../../mockData';
import robotsIcon from '@/assets/metrics/robots.svg';
import processesIcon from '@/assets/metrics/processes.svg';
import todayTasksIcon from '@/assets/metrics/today-tasks.svg';
import successRateIcon from '@/assets/metrics/success-rate.svg';
import savedHoursIcon from '@/assets/metrics/saved-hours.svg';
import savedCostIcon from '@/assets/metrics/saved-cost.svg';
import weeklyNewIcon from '@/assets/metrics/weekly-new.svg';
import './index.less';

const iconMap: Record<string, string> = {
  Bot: robotsIcon,
  Workflow: processesIcon,
  Play: todayTasksIcon,
  CheckCircle: successRateIcon,
  Clock: savedHoursIcon,
  TrendingUp: savedCostIcon,
  FolderPlus: weeklyNewIcon,
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
          const iconSrc = iconMap[item.icon];
          return (
            <div key={item.key} className="metric-card">
              <div className="metric-card-icon">
                <img src={iconSrc} alt="" width={28} height={28} />
              </div>
              <div className="metric-card-info">
                <div className="metric-card-label">{t(item.labelKey)}</div>
                <div className="metric-card-value-row">
                  <span className="metric-card-value">{item.value}</span>
                  {item.unit && <span className="metric-card-unit">{item.unit}</span>}
                  {item.trend && (
                    <div className={`metric-card-trend ${item.trend}`}>
                      {item.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span>{item.trendValue}</span>
                    </div>
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
