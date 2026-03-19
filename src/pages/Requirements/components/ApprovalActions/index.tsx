import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Space, Modal, Toast, Form } from '@douyinfe/semi-ui';
import type { LYRequirementResponse, ApprovalStatus } from '@/api';
import './index.less';

interface ApprovalActionsProps {
  requirement: LYRequirementResponse;
  onStatusChange: () => void;
}

const ApprovalActions = ({ requirement, onStatusChange }: ApprovalActionsProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);

  const handleSubmitForApproval = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      Toast.success(t('requirement.approval.submitSuccess'));
      onStatusChange();
    } catch {
      Toast.error(t('requirement.approval.submitError'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    Modal.confirm({
      title: t('requirement.approval.approveConfirmTitle'),
      content: t('requirement.approval.approveConfirmContent', { title: requirement.title }),
      onOk: async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 400));
          Toast.success(t('requirement.approval.approveSuccess'));
          onStatusChange();
        } catch {
          Toast.error(t('requirement.approval.approveError'));
        }
      },
    });
  };

  const handleReject = async (values: { comment: string }) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      Toast.success(t('requirement.approval.rejectSuccess'));
      setRejectModalVisible(false);
      onStatusChange();
    } catch {
      Toast.error(t('requirement.approval.rejectError'));
    } finally {
      setLoading(false);
    }
  };

  const { approval_status } = requirement;

  return (
    <div className="approval-actions">
      <Space>
        {/* Draft → Submit for Approval */}
        {approval_status === 'DRAFT' && (
          <Button
            theme="solid"
            type="primary"
            loading={loading}
            onClick={handleSubmitForApproval}
          >
            {t('requirement.approval.submitForApproval')}
          </Button>
        )}

        {/* Pending → Approve / Reject */}
        {approval_status === 'PENDING' && (
          <>
            <Button
              theme="solid"
              type="primary"
              onClick={handleApprove}
            >
              {t('requirement.approval.approve')}
            </Button>
            <Button
              theme="solid"
              type="danger"
              onClick={() => setRejectModalVisible(true)}
            >
              {t('requirement.approval.reject')}
            </Button>
          </>
        )}

        {/* Rejected → Resubmit */}
        {approval_status === 'REJECTED' && (
          <Button
            theme="solid"
            type="primary"
            loading={loading}
            onClick={handleSubmitForApproval}
          >
            {t('requirement.approval.resubmit')}
          </Button>
        )}
      </Space>

      {/* Reject Modal with comment */}
      <Modal
        title={t('requirement.approval.rejectTitle')}
        visible={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        footer={null}
        width={480}
        closeOnEsc
      >
        <Form onSubmit={handleReject} labelPosition="top">
          <Form.TextArea
            field="comment"
            label={t('requirement.approval.rejectReason')}
            placeholder={t('requirement.approval.rejectReasonPlaceholder')}
            autosize={{ minRows: 3, maxRows: 6 }}
            rules={[
              { required: true, message: t('requirement.approval.rejectReasonRequired') },
            ]}
          />
          <div className="approval-actions-reject-footer">
            <Button theme="light" onClick={() => setRejectModalVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button htmlType="submit" theme="solid" type="danger" loading={loading}>
              {t('requirement.approval.confirmReject')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ApprovalActions;
