import { Tooltip } from '@douyinfe/semi-ui';
import { Info } from 'lucide-react';
import './index.less';

interface Props {
  label: string;
  tip?: string;
  size?: 'small' | 'medium';
  className?: string;
}

const MetricLabel = ({ label, tip, size = 'small', className }: Props) => {
  return (
    <span className={`metric-label metric-label-${size} ${className || ''}`}>
      <span className="metric-label-text">{label}</span>
      {tip && (
        <Tooltip
          content={<div className="metric-label-tip-content">{tip}</div>}
          position="top"
          showArrow
        >
          <Info size={size === 'medium' ? 14 : 13} strokeWidth={2} className="metric-label-icon" />
        </Tooltip>
      )}
    </span>
  );
};

export default MetricLabel;
