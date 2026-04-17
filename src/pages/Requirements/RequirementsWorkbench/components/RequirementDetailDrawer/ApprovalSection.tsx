import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Input, Toast, TextArea } from '@douyinfe/semi-ui';
import type { RequirementItem } from '../../types';

const { Text } = Typography;

interface ApprovalSectionProps {
  data: RequirementItem;
  onStatusChange: (id: string, newStatus: string, comment?: string) => Promise<void>;
}

const ApprovalSection = ({ data, onStatusChange }: ApprovalSectionProps) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null);

  if (data.status !== 'PENDING_APPROVAL') return null;

  const handleAction = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !reason.trim()) {
      Toast.warning(t('requirements.detail.rejectReasonRequired'));
      return;
    }
    setSubmitting(action);
    try {
      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
      await onStatusChange(data.id, newStatus, reason.trim() || undefined);
      Toast.success(
        action === 'approve'
          ? t('requirements.detail.approveSuccess')
          : t('requirements.detail.rejectSuccess'),
      );
      setReason('');
    } catch {
      Toast.error(t('requirements.detail.actionFailed'));
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <>
      <div className="requirement-detail-property-divider" />
      <div className="requirement-detail-property-group">
        <Text strong size="small" style={{ marginBottom: 8, display: 'block' }}>
          {t('requirements.detail.approval')}
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
