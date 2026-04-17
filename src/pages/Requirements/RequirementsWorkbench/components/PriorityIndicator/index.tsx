import { useTranslation } from 'react-i18next';
import { ChevronsUp, Equal, ChevronsDown } from 'lucide-react';
import type { RequirementPriority } from '../../types';
import './index.less';

interface PriorityIndicatorProps {
  priority: RequirementPriority;
}

const config: Record<
  RequirementPriority,
  { Icon: typeof ChevronsUp; i18nKey: string; variant: 'high' | 'medium' | 'low' }
> = {
  HIGH:   { Icon: ChevronsUp,   i18nKey: 'requirements.priority.high',   variant: 'high' },
  MEDIUM: { Icon: Equal,        i18nKey: 'requirements.priority.medium', variant: 'medium' },
  LOW:    { Icon: ChevronsDown, i18nKey: 'requirements.priority.low',    variant: 'low' },
};

const PriorityIndicator = ({ priority }: PriorityIndicatorProps) => {
  const { t } = useTranslation();
  const cfg = config[priority] || config.LOW;
  const { Icon } = cfg;
  return (
    <span className={`req-priority-tag req-priority-tag--${cfg.variant}`}>
      <Icon size={12} strokeWidth={2.5} />
      <span className="req-priority-tag__label">{t(cfg.i18nKey)}</span>
    </span>
  );
};

export default PriorityIndicator;
