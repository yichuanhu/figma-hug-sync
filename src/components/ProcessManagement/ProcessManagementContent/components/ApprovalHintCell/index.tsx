/**
 * 流程列表「审批中」提示徽标
 *
 * 线性 Lucide 裸图标 + Semi 语义色，悬浮 Tooltip，点击触发外部回调。
 */
import { Tooltip } from '@douyinfe/semi-ui';
import { Send, ShieldAlert, PlayCircle, OctagonAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ApprovalHint } from '../../hooks/useProcessApprovalHints';

interface Props {
  hint?: ApprovalHint;
  onOpen: (hint: ApprovalHint) => void;
}

const ApprovalHintCell = ({ hint, onOpen }: Props) => {
  const { t } = useTranslation();
  if (!hint) return null;

  let color = 'var(--semi-color-primary)';
  let Icon = Send;
  let textKey = '';
  if (hint.kind === 'publish') {
    color = 'var(--semi-color-primary)';
    Icon = Send;
    textKey = 'development.processDevelopment.approvalHint.publishPending';
  } else if (hint.status === 'PENDING_APPROVAL') {
    color = 'var(--semi-color-warning)';
    Icon = ShieldAlert;
    textKey = 'development.processDevelopment.approvalHint.offlinePending';
  } else if (hint.status === 'APPROVED') {
    color = 'var(--semi-color-success)';
    Icon = PlayCircle;
    textKey = 'development.processDevelopment.approvalHint.offlineExecuting';
  } else {
    color = 'var(--semi-color-danger)';
    Icon = OctagonAlert;
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
          cursor: 'pointer',
          flexShrink: 0,
          color,
        }}
      >
        <Icon size={14} strokeWidth={2} />
      </span>
    </Tooltip>
  );
};

export default ApprovalHintCell;
