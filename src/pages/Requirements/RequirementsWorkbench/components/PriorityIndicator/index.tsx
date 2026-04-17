import { useTranslation } from 'react-i18next';
import type { RequirementPriority } from '../../types';
import './index.less';

interface PriorityIndicatorProps {
  priority: RequirementPriority;
}

const config: Record<
  RequirementPriority,
  { i18nKey: string; variant: 'high' | 'medium' | 'low' }
> = {
  HIGH:   { i18nKey: 'requirements.priority.high',   variant: 'high' },
  MEDIUM: { i18nKey: 'requirements.priority.medium', variant: 'medium' },
  LOW:    { i18nKey: 'requirements.priority.low',    variant: 'low' },
};

const PriorityIndicator = ({ priority }: PriorityIndicatorProps) => {
  const { t } = useTranslation();
  const cfg = config[priority] || config.LOW;
  return (
    <span className={`req-priority-tag req-priority-tag--${cfg.variant}`}>
      <span className="req-priority-tag__label">{t(cfg.i18nKey)}</span>
    </span>
  );
};

export default PriorityIndicator;
