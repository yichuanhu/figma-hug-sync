import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RadioGroup, Radio } from '@douyinfe/semi-ui';
import { TrendingUp, TrendingDown, Bot, Workflow, Play, CheckCircle, Clock, FolderPlus } from 'lucide-react';
import { metrics } from '../../mockData';
import './index.less';

const iconMap: Record<string, React.ComponentType<any>> = {
  Bot,
  Workflow,
  Play,
  CheckCircle,
  Clock,
  TrendingUp,
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
          const IconComp = iconMap[item.icon] || Bot;
          return (
            <div key={item.key} className="metric-card">
              <div className="metric-card-left">
                <div
                  className="metric-card-icon"
                  style={{ backgroundColor: item.iconBgColor, color: item.iconColor }}
                >
                  <IconComp size={18} strokeWidth={2} />
                </div>
                <div className="metric-card-label">{t(item.labelKey)}</div>
              </div>
              <div className="metric-card-right">
                <div className="metric-card-value-row">
                  <span className="metric-card-value">{item.value}</span>
                  {item.unit && <span className="metric-card-unit">{item.unit}</span>}
                </div>
                {item.trend && (
                  <div className={`metric-card-trend ${item.trend}`}>
                    {item.trend === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    <span>{item.trendValue}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MetricsSection;
