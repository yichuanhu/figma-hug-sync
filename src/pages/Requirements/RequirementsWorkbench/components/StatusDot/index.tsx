import { useTranslation } from 'react-i18next';
import { statusConfigV2 } from '../../statusConfig';
import type { RequirementStatus } from '../../types';
import StatusDot, { type StatusDotColor } from '@/components/StatusDot';

interface StatusDotProps {
  status: RequirementStatus;
}

const RequirementStatusDot = ({ status }: StatusDotProps) => {
  const { t } = useTranslation();
  const cfg = statusConfigV2[status];
  if (!cfg) return <span>-</span>;
  return <StatusDot color={(cfg.color as StatusDotColor) || 'grey'} label={t(cfg.i18nKey)} />;
};

export default RequirementStatusDot;
