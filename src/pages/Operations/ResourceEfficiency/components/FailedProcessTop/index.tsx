import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import type { ResourceEfficiencyData } from '@/pages/Operations/types';
import './index.less';

interface Props {
  data: ResourceEfficiencyData['failedProcessTop'];
  topN?: number;
}

const FailedProcessTop = ({ data, topN = 5 }: Props) => {
  const { t } = useTranslation();
  const max = Math.max(...data.map(d => d.failedCount), 1);

  return (
    <div className="failed-process-top dashboard-card" style={{ marginBottom: 0 }}>
      <div className="dashboard-card-header">
        <span className="dashboard-card-title">
          <AlertTriangle size={16} strokeWidth={2} style={{ marginRight: 6, color: '#EF4444', verticalAlign: -3 }} />
          {t('operations.resourceEfficiency.failedProcessTopTitleN', { n: topN })}
        </span>
      </div>
      <div className="failed-process-list">
        {data.map((item, i) => (
          <div key={item.processName} className="failed-process-item">
            <div className="row">
              <span className={`rank rank-${i + 1}`}>{i + 1}</span>
              <span className="name" title={item.processName}>{item.processName}</span>
              <span className="ratio">{item.ratio.toFixed(1)}%</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(item.failedCount / max) * 100}%` }} />
            </div>
            <div className="meta">
              <span>{t('operations.resourceEfficiency.failedTimes')}: <b>{item.failedCount.toLocaleString()}</b></span>
              <span>{t('operations.resourceEfficiency.totalRuns')}: {item.totalCount.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FailedProcessTop;
