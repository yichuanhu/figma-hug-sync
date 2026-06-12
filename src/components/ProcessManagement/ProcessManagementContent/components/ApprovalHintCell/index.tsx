/**
 * 流程列表「审批中」提示徽标
 *
 * 实心彩圆 + 白色 Lucide 图标，类似 iOS 通知徽标，
 * 悬浮 Tooltip 显示完整文案，点击触发外部回调。
 */
import { Tooltip } from '@douyinfe/semi-ui';
import { Send, ShieldAlert, Rocket, OctagonAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ApprovalHint } from '../../hooks/useProcessApprovalHints';

interface Props {
  hint?: ApprovalHint;
  onOpen: (hint: ApprovalHint) => void;
}

const ApprovalHintCell = ({ hint, onOpen }: Props) => {
  const { t } = useTranslation();
  if (!hint) return null;

  let bg = '#3B82F6';
  let Icon = Send;
  let textKey = '';
  if (hint.kind === 'publish') {
    bg = '#3B82F6';
    Icon = Send;
    textKey = 'development.processDevelopment.approvalHint.publishPending';
  } else if (hint.status === 'PENDING_APPROVAL') {
    bg = '#F59E0B';
    Icon = ShieldAlert;
    textKey = 'development.processDevelopment.approvalHint.offlinePending';
  } else if (hint.status === 'APPROVED') {
    bg = '#8B5CF6';
    Icon = Rocket;
    textKey = 'development.processDevelopment.approvalHint.offlineExecuting';
  } else {
    bg = '#EF4444';
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
          justifyContent: 'center',
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: bg,
          color: '#fff',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
          transition: 'transform 120ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <Icon size={11} strokeWidth={2.4} color="#fff" />
      </span>
    </Tooltip>
  );
};

export default ApprovalHintCell;
