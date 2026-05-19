import { Skeleton } from '@douyinfe/semi-ui';
import './index.less';

interface Props {
  /** 'list' = 配置表格骨架；'dashboard' = 看板 KPI + 图表骨架 */
  variant: 'list' | 'dashboard';
}

const MetricsSkeleton = ({ variant }: Props) => {
  if (variant === 'dashboard') {
    return (
      <div className="metrics-skeleton metrics-skeleton-dashboard">
        <div className="skeleton-header">
          <Skeleton.Title style={{ width: 180, height: 18 }} />
          <Skeleton.Title style={{ width: 90, height: 28 }} />
        </div>
        <div className="skeleton-kpi-grid">
          {[0, 1, 2, 3].map((i) => (
            <div className="skeleton-kpi-card" key={i}>
              <Skeleton.Title style={{ width: '60%', height: 12 }} />
              <Skeleton.Title style={{ width: '50%', height: 28 }} />
              <Skeleton.Title style={{ width: '40%', height: 10 }} />
            </div>
          ))}
        </div>
        <div className="skeleton-chart">
          <Skeleton.Image style={{ width: '100%', height: 220 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="metrics-skeleton metrics-skeleton-list">
      {Array.from({ length: 6 }).map((_, i) => (
        <div className="skeleton-row" key={i}>
          <Skeleton.Title style={{ width: '14%', height: 12 }} />
          <Skeleton.Title style={{ width: '18%', height: 12 }} />
          <Skeleton.Title style={{ width: '10%', height: 12 }} />
          <Skeleton.Title style={{ width: '8%', height: 12 }} />
          <Skeleton.Title style={{ width: '14%', height: 12 }} />
          <Skeleton.Title style={{ width: '16%', height: 12 }} />
          <Skeleton.Title style={{ width: '10%', height: 12 }} />
        </div>
      ))}
    </div>
  );
};

export default MetricsSkeleton;
