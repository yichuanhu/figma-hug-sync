import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { RoiMetrics } from '@/pages/Operations/types';
import './index.less';

interface Props {
  data: RoiMetrics;
}

const formatCurrency = (val: number) => {
  if (val >= 1000000) return `¥${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `¥${(val / 1000).toFixed(0)}K`;
  return `¥${val}`;
};

const OverallRoiCards = ({ data }: Props) => {
  const { t } = useTranslation();
  const overallRoi = data.totalInvestmentCost > 0
    ? Math.round(((data.totalSavedCost - data.totalInvestmentCost) / data.totalInvestmentCost) * 100)
    : 0;

  const cards = [
    {
      key: 'roi', tone: 'primary',
      label: t('operations.roiAnalysis.overallRoi'),
      value: `${overallRoi}%`,
      trend: data.savedCostTrend,
    },
    {
      key: 'savedCost', tone: 'success',
      label: t('operations.dashboard.totalSavedCost'),
      value: formatCurrency(data.totalSavedCost),
      trend: data.savedCostTrend,
    },
    {
      key: 'investmentCost', tone: 'warning',
      label: t('operations.dashboard.totalInvestmentCost'),
      value: formatCurrency(data.totalInvestmentCost),
      trend: null,
    },
    {
      key: 'requirements', tone: 'purple',
      label: t('operations.dashboard.activeRequirements'),
      value: data.activeRequirements.toString(),
      trend: data.requirementsTrend,
    },
  ];

  return (
    <div className="overall-roi-cards">
      {cards.map(c => (
        <div key={c.key} className={`overall-roi-card ${c.tone}`}>
          <div className="label">{c.label}</div>
          <div className="value">{c.value}</div>
          {c.trend !== null && (
            <span className={`trend ${c.trend >= 0 ? 'up' : 'down'}`}>
              {c.trend >= 0 ? <ArrowUp size={12} strokeWidth={2.5} /> : <ArrowDown size={12} strokeWidth={2.5} />}
              {Math.abs(c.trend)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default OverallRoiCards;
