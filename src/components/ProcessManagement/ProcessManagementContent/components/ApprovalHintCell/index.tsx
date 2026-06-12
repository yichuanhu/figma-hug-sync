/**
 * 流程列表「审批中」提示徽标
 *
 * 紧凑型图标徽标，悬浮 Tooltip 显示完整文案，点击触发外部回调。
 */
import { Tooltip } from '@douyinfe/semi-ui';
import { FileUp, PowerOff, PlayCircle, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ApprovalHint } from '../../hooks/useProcessApprovalHints';

interface Props {
  hint?: ApprovalHint;
  onOpen: (hint: ApprovalHint) => void;
}

const ApprovalHintCell = ({ hint, onOpen }: Props) => {
  const { t } = useTranslation();
  if (!hint) return null;

  let color: 'blue' | 'orange' | 'red' = 'blue';
  let Icon = FileUp;
  let textKey = '';
  if (hint.kind === 'publish') {
    color = 'blue';
    Icon = FileUp;
    textKey = 'development.processDevelopment.approvalHint.publishPending';
  } else if (hint.status === 'PENDING_APPROVAL') {
    color = 'orange';
    Icon = PowerOff;
    textKey = 'development.processDevelopment.approvalHint.offlinePending';
  } else if (hint.status === 'APPROVED') {
    color = 'blue';
    Icon = PlayCircle;
    textKey = 'development.processDevelopment.approvalHint.offlineExecuting';
  } else {
    color = 'red';
    Icon = AlertTriangle;
    textKey = 'development.processDevelopment.approvalHint.offlineFailed';
  }

  const levelSuffix = hint.currentLevel && hint.totalLevels
    ? ' · ' + t('development.processDevelopment.approvalHint.levelTooltip', {
        current: hint.currentLevel,
        total: hint.totalLevels,
      })
    : '';

  const tooltip = t(textKey) + levelSuffix;

  return (
    <Tooltip content={tooltip} position="top">
      <span
        onClick={(e) => { e.stopPropagation(); onOpen(hint); }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: `var(--semi-color-${color}-light-default)`,
          color: `var(--semi-color-${color})`,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <Icon size={12} strokeWidth={2} />
      </span>
    </Tooltip>
  );
};

export default ApprovalHintCell;
