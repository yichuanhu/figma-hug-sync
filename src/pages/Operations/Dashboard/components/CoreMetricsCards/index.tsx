import { useTranslation } from 'react-i18next';
import type { RoiMetrics } from '@/pages/Operations/types';
import './index.less';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface CoreMetricsCardsProps {
  data: RoiMetrics;
}

const CoreMetricsCards = ({ data }: CoreMetricsCardsProps) => {
  const { t } = useTranslation();

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `¥${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `¥${(val / 1000).toFixed(0)}K`;
    return `¥${val}`;
  };

  const formatHours = (val: number) => {
    if (val >= 10000) return `${(val / 1000).toFixed(1)}K`;
    return val.toLocaleString();
  };

  const cards = [
    {
      key: 'savedCost',
      label: t('operations.dashboard.totalSavedCost'),
      value: formatCurrency(data.totalSavedCost),
      trend: data.savedCostTrend,
      trendLabel: `${data.savedCostTrend > 0 ? '+' : ''}${data.savedCostTrend}%`,
    },
    {
      key: 'utilization',
      label: t('operations.dashboard.robotUtilization'),
      value: `${data.robotUtilization}%`,
      trend: data.utilizationTrend,
      trendLabel: `${data.utilizationTrend > 0 ? '+' : ''}${data.utilizationTrend}%`,
    },
    {
      key: 'requirements',
      label: t('operations.dashboard.activeRequirements'),
      value: data.activeRequirements.toString(),
      trend: data.requirementsTrend,
      trendLabel: `${data.requirementsTrend > 0 ? '+' : ''}${data.requirementsTrend}`,
    },
    {
      key: 'automationHours',
      label: t('operations.dashboard.totalAutomationHours'),
      value: formatHours(data.totalAutomationHours),
      trend: data.automationHoursTrend,
      trendLabel: `+${data.automationHoursTrend.toLocaleString()}`,
    },
    {
      key: 'investmentCost',
      label: t('operations.dashboard.totalInvestmentCost'),
      value: formatCurrency(data.totalInvestmentCost),
      trend: null,
      trendLabel: null,
    },
  ];

  return (
    <div className="core-metrics-cards">
      <div className="core-metrics-section-title">{t('operations.dashboard.coreMetrics')}</div>
      <div className="core-metrics-grid">
        {cards.map((card) => (
          <div key={card.key} className="core-metric-card">
            <div className="core-metric-label">{card.label}</div>
            <div className="core-metric-value">{card.value}</div>
            {card.trend !== null && (
              <div className={`core-metric-trend ${card.trend >= 0 ? 'up' : 'down'}`}>
                {card.trend >= 0 ? <ArrowUp size={16} strokeWidth={2} /> : <ArrowDown size={16} strokeWidth={2} />}
                <span>{card.trendLabel}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoreMetricsCards;
