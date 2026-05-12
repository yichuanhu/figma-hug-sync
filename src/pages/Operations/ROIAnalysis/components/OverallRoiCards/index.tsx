import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { RoiMetrics } from '@/pages/Operations/types';
import MetricLabel from '@/pages/Operations/BusinessOutcomes/components/MetricLabel';
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
  const NA = t('operations.roiAnalysis.notAvailable');

  // R-01: 总投入为 0 → N/A
  const overallRoi = data.totalInvestmentCost > 0
    ? `${Math.round(((data.totalSavedCost - data.totalInvestmentCost) / data.totalInvestmentCost) * 100)}%`
    : NA;

  // R-04: paybackMonths null 或 ≤ 0 → N/A
  const paybackValue = (data.paybackMonths == null || data.paybackMonths <= 0)
    ? NA
    : `${data.paybackMonths.toFixed(1)} ${t('operations.roiAnalysis.months')}`;

  const cards = [
    {
      key: 'investmentCost', tone: 'primary',
      label: t('operations.dashboard.totalInvestmentCost'),
      tip: t('operations.roiAnalysis.tips.totalInvestmentCost'),
      value: formatCurrency(data.totalInvestmentCost),
      trend: null as number | null,
    },
    {
      key: 'savedCost', tone: 'success',
      label: t('operations.dashboard.totalSavedCost'),
      tip: t('operations.roiAnalysis.tips.totalSavedCost'),
      value: formatCurrency(data.totalSavedCost),
      trend: data.savedCostTrend,
    },
    {
      key: 'roi', tone: 'purple',
      label: t('operations.roiAnalysis.overallRoi'),
      tip: t('operations.roiAnalysis.tips.overallRoi'),
      value: overallRoi,
      trend: null,
    },
    {
      key: 'paybackMonths', tone: 'warning',
      label: t('operations.roiAnalysis.paybackMonths'),
      tip: t('operations.roiAnalysis.tips.paybackMonths'),
      value: paybackValue,
      trend: null,
    },
  ];

  return (
    <div className="overall-roi-cards">
      {cards.map(c => (
        <div key={c.key} className={`overall-roi-card ${c.tone}`}>
          <div className="label"><MetricLabel label={c.label} tip={c.tip} /></div>
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
