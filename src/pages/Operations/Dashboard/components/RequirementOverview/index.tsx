import { useTranslation } from 'react-i18next';
import type { RequirementOverviewData } from '@/pages/Operations/types';
import './index.less';

interface RequirementOverviewProps {
  data: RequirementOverviewData;
}

const RequirementOverview = ({ data }: RequirementOverviewProps) => {
  const { t } = useTranslation();

  const items = [
    { key: 'developing', label: t('operations.dashboard.requirementDeveloping'), value: data.developing, color: 'var(--semi-color-primary)' },
    { key: 'completed', label: t('operations.dashboard.requirementCompleted'), value: data.completed, color: 'var(--semi-color-success)' },
    { key: 'running', label: t('operations.dashboard.requirementRunning'), value: data.running, color: 'var(--semi-color-info)' },
    { key: 'total', label: t('operations.dashboard.requirementTotal'), value: data.total, color: 'var(--semi-color-text-2)' },
  ];

  return (
    <div className="requirement-overview">
      <div className="requirement-overview-title">{t('operations.dashboard.requirementOverview')}</div>
      <div className="requirement-overview-grid">
        {items.map((item) => (
          <div key={item.key} className="requirement-overview-item">
            <div className="requirement-overview-item-label">{item.label}</div>
            <div className="requirement-overview-item-value" style={{ color: item.color }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequirementOverview;
