import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, Snowflake } from 'lucide-react';
import { Select, Table } from '@douyinfe/semi-ui';
import type { RobotDetail } from '@/pages/Operations/types';
import './index.less';

interface Props {
  robots: RobotDetail[];
  mode: 'busy' | 'idle';
  defaultTopN?: number;
}

const TOP_OPTIONS = [5, 10, 15, 20].map(n => ({ value: n, label: `Top ${n}` }));

const BusyIdleTopX = ({ robots, mode, defaultTopN = 5 }: Props) => {
  const { t } = useTranslation();
  const [topN, setTopN] = useState<number>(defaultTopN);

  const candidates = robots.filter(r =>
    (r.status === 'working' || r.status === 'idle') &&
    (mode === 'busy' || r.utilization > 0)
  );
  const sorted = [...candidates].sort((a, b) =>
    mode === 'busy' ? b.utilization - a.utilization : a.utilization - b.utilization
  );
  const list = sorted.slice(0, topN).map((r, i) => ({ ...r, _rank: i + 1 }));

  const accentColor = mode === 'busy' ? '#EF4444' : '#3B82F6';
  const Icon = mode === 'busy' ? Flame : Snowflake;
  const title = mode === 'busy'
    ? t('operations.resourceEfficiency.busyTopTitleN', { n: topN })
    : t('operations.resourceEfficiency.idleTopTitleN', { n: topN });

  const columns = [
    {
      title: '#', dataIndex: '_rank', width: 56,
      render: (v: number) => <span className={`busy-idle-rank rank-${v}`}>{v}</span>,
    },
    {
      title: t('operations.resourceEfficiency.robotName'),
      dataIndex: 'name',
      ellipsis: { showTitle: true },
    },
    {
      title: t('operations.resourceEfficiency.group'),
      dataIndex: 'group',
      width: 140,
      ellipsis: { showTitle: true },
    },
    {
      title: t('operations.resourceEfficiency.monthlyTasks'),
      dataIndex: 'monthlyTasks',
      width: 110,
      align: 'right' as const,
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: t('operations.resourceEfficiency.utilization'),
      dataIndex: 'utilization',
      width: 90,
      align: 'right' as const,
      render: (v: number) => <span style={{ color: accentColor, fontWeight: 600 }}>{v}%</span>,
    },
  ];

  return (
    <div className="busy-idle-top dashboard-card" style={{ marginBottom: 0 }}>
      <div className="dashboard-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="dashboard-card-title">
          <Icon size={16} strokeWidth={2} style={{ marginRight: 6, color: accentColor, verticalAlign: -3 }} />
          {title}
        </span>
        <Select size="small" value={topN} optionList={TOP_OPTIONS} onChange={(v) => setTopN(v as number)} style={{ width: 96 }} />
      </div>
      <Table
        size="small"
        columns={columns}
        dataSource={list}
        rowKey="id"
        pagination={false}
      />
    </div>
  );
};

export default BusyIdleTopX;
