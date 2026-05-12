import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, Snowflake } from 'lucide-react';
import { Select } from '@douyinfe/semi-ui';
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

  // R-03: 在线机器人 (working/idle)。idle 模式额外要求 utilization > 0
  const candidates = robots.filter(r =>
    (r.status === 'working' || r.status === 'idle') &&
    (mode === 'busy' || r.utilization > 0)
  );
  const sorted = [...candidates].sort((a, b) =>
    mode === 'busy' ? b.utilization - a.utilization : a.utilization - b.utilization
  );
  const list = sorted.slice(0, topN);

  const accentColor = mode === 'busy' ? '#EF4444' : '#3B82F6';
  const Icon = mode === 'busy' ? Flame : Snowflake;
  const title = mode === 'busy'
    ? t('operations.resourceEfficiency.busyTopTitleN', { n: topN })
    : t('operations.resourceEfficiency.idleTopTitleN', { n: topN });

  return (
    <div className="busy-idle-top dashboard-card" style={{ marginBottom: 0 }}>
      <div className="dashboard-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="dashboard-card-title">
          <Icon size={16} strokeWidth={2} style={{ marginRight: 6, color: accentColor, verticalAlign: -3 }} />
          {title}
        </span>
        <Select size="small" value={topN} optionList={TOP_OPTIONS} onChange={(v) => setTopN(v as number)} style={{ width: 96 }} />
      </div>
      <div className="busy-idle-list">
        {list.map((r, i) => (
          <div key={r.id} className="busy-idle-item">
            <span className={`rank rank-${i + 1}`}>{i + 1}</span>
            <div className="info">
              <div className="name" title={r.name}>{r.name}</div>
              <div className="meta">{r.group} · {r.monthlyTasks.toLocaleString()} {t('operations.resourceEfficiency.monthlyTasks')}</div>
            </div>
            <div className="util" style={{ color: accentColor }}>{r.utilization}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BusyIdleTopX;
