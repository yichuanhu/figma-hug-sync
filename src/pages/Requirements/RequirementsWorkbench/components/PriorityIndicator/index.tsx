import { Tooltip } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { ChevronsUp, Equal, ChevronsDown } from 'lucide-react';
import type { RequirementPriority } from '../../types';

interface PriorityIndicatorProps {
  priority: RequirementPriority;
}

const config: Record<RequirementPriority, { color: string; Icon: typeof ChevronsUp; i18nKey: string }> = {
  HIGH:   { color: 'var(--semi-color-danger)',  Icon: ChevronsUp,   i18nKey: 'requirements.priority.high' },
  MEDIUM: { color: 'var(--semi-color-warning)', Icon: Equal,        i18nKey: 'requirements.priority.medium' },
  LOW:    { color: 'var(--semi-color-text-2)',  Icon: ChevronsDown, i18nKey: 'requirements.priority.low' },
};

const PriorityIndicator = ({ priority }: PriorityIndicatorProps) => {
  const { t } = useTranslation();
  const cfg = config[priority] || config.LOW;
  const { Icon } = cfg;
  return (
    <Tooltip content={t(cfg.i18nKey)} position="top">
      <span style={{ display: 'inline-flex', alignItems: 'center', color: cfg.color, lineHeight: 0 }}>
        <Icon size={16} strokeWidth={2.5} />
      </span>
    </Tooltip>
  );
};

export default PriorityIndicator;
