/**
 * 流程列表「审批中」提示单元格
 *
 * 仅渲染色彩化 Tag，点击触发外部回调（一般打开只读审批进度抽屉）。
 */
import { Tag, Tooltip } from '@douyinfe/semi-ui';
import { FileUp, PowerOff, PlayCircle, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ApprovalHint } from '../../hooks/useProcessApprovalHints';

interface Props {
  hint?: ApprovalHint;
  onOpen: (hint: ApprovalHint) => void;
}

const ApprovalHintCell = ({ hint, onOpen }: Props) => {
  const { t } = useTranslation();
  if (!hint) return <span style={{ color: 'var(--semi-color-text-2)' }}>-</span>;

  let color: 'blue' | 'orange' | 'red' = 'blue';
  let icon = <FileUp size={12} strokeWidth={2} />;
  let textKey = '';
  if (hint.kind === 'publish') {
    color = 'blue';
    icon = <FileUp size={12} strokeWidth={2} />;
    textKey = 'development.processDevelopment.approvalHint.publishPending';
  } else if (hint.status === 'PENDING_APPROVAL') {
    color = 'orange';
    icon = <PowerOff size={12} strokeWidth={2} />;
    textKey = 'development.processDevelopment.approvalHint.offlinePending';
  } else if (hint.status === 'APPROVED') {
    color = 'blue';
    icon = <PlayCircle size={12} strokeWidth={2} />;
    textKey = 'development.processDevelopment.approvalHint.offlineExecuting';
  } else {
    color = 'red';
    icon = <AlertTriangle size={12} strokeWidth={2} />;
    textKey = 'development.processDevelopment.approvalHint.offlineFailed';
  }

  const tooltip = hint.currentLevel && hint.totalLevels
    ? t('development.processDevelopment.approvalHint.levelTooltip', {
        current: hint.currentLevel,
        total: hint.totalLevels,
      })
    : t('development.processDevelopment.approvalHint.viewProgress');

  const tag = (
    <Tag
      color={color}
      type="light"
      prefixIcon={icon}
      style={{ cursor: 'pointer' }}
      onClick={(e) => { e.stopPropagation(); onOpen(hint); }}
    >
      {t(textKey)}
    </Tag>
  );

  return <Tooltip content={tooltip} position="top">{tag}</Tooltip>;
};

export default ApprovalHintCell;
