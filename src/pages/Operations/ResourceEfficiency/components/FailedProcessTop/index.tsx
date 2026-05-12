import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Select, Table } from '@douyinfe/semi-ui';
import type { ResourceEfficiencyData } from '@/pages/Operations/types';
import './index.less';

interface Props {
  data: ResourceEfficiencyData['failedProcessTop'];
  defaultTopN?: number;
}

const TOP_OPTIONS = [5, 10, 15, 20].map(n => ({ value: n, label: `Top ${n}` }));

const FailedProcessTop = ({ data, defaultTopN = 5 }: Props) => {
  const { t } = useTranslation();
  const [topN, setTopN] = useState<number>(defaultTopN);
  const list = data.slice(0, topN).map((d, i) => ({ ...d, _rank: i + 1 }));

  const columns = [
    {
      title: '#', dataIndex: '_rank', width: 56,
      render: (v: number) => <span className={`failed-process-rank rank-${v}`}>{v}</span>,
    },
    {
      title: t('operations.resourceEfficiency.processName') || t('common.name'),
      dataIndex: 'processName',
      ellipsis: { showTitle: true },
    },
    {
      title: t('operations.resourceEfficiency.failedTimes'),
      dataIndex: 'failedCount',
      width: 110,
      align: 'right' as const,
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: t('operations.resourceEfficiency.totalRuns'),
      dataIndex: 'totalCount',
      width: 110,
      align: 'right' as const,
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: t('operations.resourceEfficiency.failedRatio'),
      dataIndex: 'ratio',
      width: 100,
      align: 'right' as const,
      render: (v: number) => <span style={{ color: '#EF4444', fontWeight: 600 }}>{v.toFixed(1)}%</span>,
    },
  ];

  return (
    <div className="failed-process-top dashboard-card" style={{ marginBottom: 0 }}>
      <div className="dashboard-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="dashboard-card-title">
          <AlertTriangle size={16} strokeWidth={2} style={{ marginRight: 6, color: '#EF4444', verticalAlign: -3 }} />
          {t('operations.resourceEfficiency.failedProcessTopTitleN', { n: topN })}
        </span>
        <Select size="small" value={topN} optionList={TOP_OPTIONS} onChange={(v) => setTopN(v as number)} style={{ width: 96 }} />
      </div>
      <Table
        size="small"
        columns={columns}
        dataSource={list}
        rowKey="processName"
        pagination={false}
      />
    </div>
  );
};

export default FailedProcessTop;
