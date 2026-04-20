import { Tooltip, Typography } from '@douyinfe/semi-ui';
import './index.less';

interface ScoreBarProps {
  value?: number;
  max?: number;
  variant?: 'value' | 'complexity';
}

const ScoreBar = ({ value, max = 5, variant = 'value' }: ScoreBarProps) => {
  if (typeof value !== 'number') {
    return <Typography.Text type="tertiary">-</Typography.Text>;
  }
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <Tooltip content={`${value.toFixed(1)} / ${max.toFixed(1)}`} position="top">
      <span className={`req-score-bar req-score-bar--${variant}`}>
        <span className="req-score-bar__num">{value.toFixed(1)}</span>
        <span className="req-score-bar__track">
          <span className="req-score-bar__fill" style={{ width: `${pct}%` }} />
        </span>
      </span>
    </Tooltip>
  );
};

export default ScoreBar;
