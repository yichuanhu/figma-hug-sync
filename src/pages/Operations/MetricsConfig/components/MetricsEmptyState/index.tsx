import { ReactNode } from 'react';
import { Empty } from '@douyinfe/semi-ui';
import errorImg from '@/assets/empty-state/error.svg';
import noDataImg from '@/assets/empty-state/no-data.svg';
import noResultImg from '@/assets/empty-state/no-result.svg';
import './index.less';

export type MetricsEmptyVariant = 'error' | 'empty' | 'filter';

interface Props {
  variant: MetricsEmptyVariant;
  title: string;
  description: string;
  children?: ReactNode;
  /** 紧凑模式（用于 Table empty slot 等较小区域） */
  compact?: boolean;
}

const IMG_MAP: Record<MetricsEmptyVariant, string> = {
  error: errorImg,
  empty: noDataImg,
  filter: noResultImg,
};

const MetricsEmptyState = ({ variant, title, description, children, compact }: Props) => {
  const size = compact ? 120 : 160;
  return (
    <div className={`metrics-empty-state${compact ? ' is-compact' : ''}`}>
      <Empty
        image={<img src={IMG_MAP[variant]} alt="" style={{ width: size, height: size }} />}
        title={title}
        description={description}
      >
        {children}
      </Empty>
    </div>
  );
};

export default MetricsEmptyState;
