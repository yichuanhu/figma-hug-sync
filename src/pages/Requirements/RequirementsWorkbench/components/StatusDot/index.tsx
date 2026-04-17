import { useTranslation } from 'react-i18next';
import { statusConfigV2 } from '../../statusConfig';
import type { RequirementStatus } from '../../types';
import './index.less';

interface StatusDotProps {
  status: RequirementStatus;
}

// Map Semi TagColor → CSS color token
const colorMap: Record<string, string> = {
  grey:   'var(--semi-color-text-2)',
  orange: 'var(--semi-color-warning)',
  purple: '#a855f7',
  cyan:   '#06b6d4',
  blue:   'var(--semi-color-primary)',
  green:  'var(--semi-color-success)',
  red:    'var(--semi-color-danger)',
};

const StatusDot = ({ status }: StatusDotProps) => {
  const { t } = useTranslation();
  const cfg = statusConfigV2[status];
  if (!cfg) return <span>-</span>;
  const color = colorMap[cfg.color] || 'var(--semi-color-text-2)';
  return (
    <span className="req-status-dot">
      <span className="req-status-dot__dot" style={{ backgroundColor: color }} />
      <span className="req-status-dot__label">{t(cfg.i18nKey)}</span>
    </span>
  );
};

export default StatusDot;
