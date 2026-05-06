import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Toast, TextArea, Tag, Modal } from '@douyinfe/semi-ui';
import { Undo2, Send } from 'lucide-react';
import type { RequirementItem } from '../../types';
import {
  advanceApprovalFlow,
  withdrawRequirement,
  resubmitRequirement,
  useSchemeFlags,
  MOCK_CURRENT_USER_ID,
} from '../../mockData';
import { buildSubmitConfirmContent } from '../../utils/submitConfirm';

const { Text } = Typography;

interface ApprovalSectionProps {
  data: RequirementItem;
  onStatusChange: (id: string, newStatus: string, comment?: string) => Promise<void>;
  onRefresh?: () => void;
}

const ApprovalSection = ({ data, onStatusChange, onRefresh }: ApprovalSectionProps) => {
  const { t } = useTranslation();
  const { hasApproval, hasAssessment } = useSchemeFlags();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | 'withdraw' | 'resubmit' | null>(null);

  const isCreator = data.creatorId === MOCK_CURRENT_USER_ID;

  // ===== REJECTED / WITHDRAWN：仅显示「重新提交」 =====
  if (data.status === 'REJECTED' || data.status === 'WITHDRAWN') {
    if (!isCreator) return null;
    const handleResubmit = () => {
      Modal.confirm({
        title: hasApproval
          ? t('requirements.detail.resubmitConfirmTitle')
          : t('requirements.detail.submitDirectConfirmTitle'),
        content: hasApproval
          ? t('requirements.detail.resubmitConfirmContent')
          : buildSubmitConfirmContent(false, hasAssessment, t),
        okText: t('requirements.detail.resubmit'),
        cancelText: t('common.cancel'),
        onOk: async () => {
          setSubmitting('resubmit');
          try {
            await resubmitRequirement(data.id);
            Toast.success(
              hasApproval
                ? t('requirements.detail.resubmitSuccess')
                : t('requirements.detail.submitDirectSuccess'),
            );
            onRefresh?.();
          } catch (e) {
            Toast.error((e as Error).message);
          } finally {
            setSubmitting(null);
          }
        },
      });
    };
    return (
      <>
        <div className="requirement-detail-property-divider" />
        <div className="requirement-detail-property-group">
          <Button
            theme="solid"
            type="primary"
            block
            style={{ height: 32 }}
            icon={<RotateCcw size={16} strokeWidth={2} />}
            loading={submitting === 'resubmit'}
            onClick={handleResubmit}
          >
            {t('requirements.detail.resubmit')}
          </Button>
        </div>
      </>
    );
  }

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
        const updated = await advanceApprovalFlow(data.id, action, reason.trim() || undefined);
        Toast.success(
          action === 'approve'
            ? t('requirements.detail.approveSuccess')
            : t('requirements.detail.rejectSuccess'),
        );
        setReason('');
        if (updated && updated.status !== data.status) onRefresh?.();
        else onRefresh?.();
      } else {
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

  const handleWithdraw = () => {
    Modal.confirm({
      title: t('requirements.detail.withdrawConfirmTitle'),
      content: t('requirements.detail.withdrawConfirmContent'),
      okText: t('requirements.detail.withdraw'),
      okButtonProps: { type: 'danger' },
      cancelText: t('common.cancel'),
      onOk: async () => {
        setSubmitting('withdraw');
        try {
          await withdrawRequirement(data.id);
          Toast.success(t('requirements.detail.withdrawSuccess'));
          onRefresh?.();
        } catch (e) {
          Toast.error((e as Error).message);
        } finally {
          setSubmitting(null);
        }
      },
    });
  };

  // 提交人 + 待审批 → 撤回按钮（无论是否同时是审批人）
  const withdrawBtn = isCreator ? (
    <Button
      theme="borderless"
      type="tertiary"
      size="small"
      block
      icon={<Undo2 size={14} strokeWidth={2} />}
      loading={submitting === 'withdraw'}
      disabled={!!submitting}
      onClick={handleWithdraw}
      style={{ marginTop: 8 }}
    >
      {t('requirements.detail.withdraw')}
    </Button>
  ) : null;

  // 有 flow 但当前用户不是审批人 → 提示 + 可能的撤回按钮
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
          {withdrawBtn}
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
            style={{ flex: 1, height: 32 }}
            loading={submitting === 'approve'}
            disabled={!!submitting}
            onClick={() => handleAction('approve')}
          >
            {t('requirements.detail.approve')}
          </Button>
          <Button
            theme="solid"
            type="danger"
            style={{ flex: 1, height: 32 }}
            loading={submitting === 'reject'}
            disabled={!!submitting}
            onClick={() => handleAction('reject')}
          >
            {t('requirements.detail.reject')}
          </Button>
        </div>
        {withdrawBtn}
      </div>
    </>
  );
};

export default ApprovalSection;
