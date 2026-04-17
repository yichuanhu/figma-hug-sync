import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Toast, TextArea, Tag } from '@douyinfe/semi-ui';
import type { RequirementItem } from '../../types';
import { advanceApprovalFlow, MOCK_CURRENT_USER_ID } from '../../mockData';

const { Text } = Typography;

interface ApprovalSectionProps {
  data: RequirementItem;
  onStatusChange: (id: string, newStatus: string, comment?: string) => Promise<void>;
  onRefresh?: () => void;
}

const ApprovalSection = ({ data, onStatusChange, onRefresh }: ApprovalSectionProps) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null);

  if (data.status !== 'PENDING_APPROVAL') return null;

  const config = data.approvalFlowConfig;
  const currentLevel = config?.levels.find((l) => l.level === config.currentLevel);
  const isApprover = !!currentLevel?.approvers.some(
    (a) => a.id === MOCK_CURRENT_USER_ID && a.status === 'PENDING',
  );

  const handleAction = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !reason.trim()) {
      Toast.warning(t('requirements.detail.rejectReasonRequired'));
      return;
    }
    setSubmitting(action);
    try {
      if (config && isApprover) {
        // 多级审批：调推进函数；推进后 mockData 内已根据条件改写 status
        const updated = await advanceApprovalFlow(data.id, action, reason.trim() || undefined);
        Toast.success(
          action === 'approve'
            ? t('requirements.detail.approveSuccess')
            : t('requirements.detail.rejectSuccess'),
        );
        setReason('');
        // 若 status 未变（仍是 PENDING_APPROVAL，多人会签未满足），刷新即可；变了会通过 onRefresh 同步
        if (updated && updated.status !== data.status) {
          onRefresh?.();
        } else {
          onRefresh?.();
        }
      } else {
        // 兜底：无 flow 配置走旧逻辑
        const newStatus = action === 'approve' ? 'PENDING_ASSESSMENT' : 'REJECTED';
        await onStatusChange(data.id, newStatus, reason.trim() || undefined);
        Toast.success(
          action === 'approve'
            ? t('requirements.detail.approveSuccess')
            : t('requirements.detail.rejectSuccess'),
        );
        setReason('');
      }
    } catch {
      Toast.error(t('requirements.detail.actionFailed'));
    } finally {
      setSubmitting(null);
    }
  };

  // 有 flow 但当前用户不是审批人 → 仅展示提示，不显示按钮
  if (config && !isApprover) {
    return (
      <>
        <div className="requirement-detail-property-divider" />
        <div className="requirement-detail-property-group">
          <Text strong size="small" style={{ marginBottom: 8, display: 'block' }}>
            {t('requirements.detail.approval')}
          </Text>
          <Tag color="orange" type="light" size="small">
            {t('requirements.approvalFlow.notApprover', {
              level: config.currentLevel,
              name: currentLevel?.name ?? '',
            })}
          </Tag>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="requirement-detail-property-divider" />
      <div className="requirement-detail-property-group">
        <Text strong size="small" style={{ marginBottom: 8, display: 'block' }}>
          {t('requirements.detail.approval')}
          {currentLevel && (
            <Tag color="blue" type="light" size="small" style={{ marginLeft: 8 }}>
              {`L${currentLevel.level} · ${currentLevel.name}`}
            </Tag>
          )}
        </Text>
        <TextArea
          placeholder={t('requirements.detail.approvalReasonPlaceholder')}
          value={reason}
          onChange={(v: string) => setReason(v)}
          rows={3}
          maxLength={500}
          showClear
          style={{ marginBottom: 12 }}
        />
        <div className="requirement-detail-property-approval-actions">
          <Button
            theme="solid"
            type="primary"
            size="small"
            style={{ flex: 1 }}
            loading={submitting === 'approve'}
            disabled={!!submitting}
            onClick={() => handleAction('approve')}
          >
            {t('requirements.detail.approve')}
          </Button>
          <Button
            theme="solid"
            type="danger"
            size="small"
            style={{ flex: 1 }}
            loading={submitting === 'reject'}
            disabled={!!submitting}
            onClick={() => handleAction('reject')}
          >
            {t('requirements.detail.reject')}
          </Button>
        </div>
      </div>
    </>
  );
};

export default ApprovalSection;
