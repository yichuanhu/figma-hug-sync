import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Space, Modal, Toast, Form, Tag, Banner, Rating } from '@douyinfe/semi-ui';
import { IconTickCircle, IconClose } from '@douyinfe/semi-icons';
import type { LYRequirementResponse, ApprovalRole, ApprovalStatus } from '@/api';
import './index.less';

interface ApprovalActionsProps {
  requirement: LYRequirementResponse;
  currentUserRole: ApprovalRole;
  onStatusChange: () => void;
}

const ApprovalActions = ({ requirement, currentUserRole, onStatusChange }: ApprovalActionsProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [techApproveModalVisible, setTechApproveModalVisible] = useState(false);

  const { approval_status } = requirement;

  // Submit for approval (DRAFT -> BUSINESS_PENDING)
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

  // Business approve (BUSINESS_PENDING -> BUSINESS_APPROVED -> TECH_PENDING)
  const handleBusinessApprove = () => {
    Modal.confirm({
      title: t('requirement.approval.businessApproveTitle'),
      icon: <IconTickCircle style={{ color: 'var(--semi-color-success)' }} />,
      content: t('requirement.approval.businessApproveContent', { title: requirement.title }),
      okText: t('requirement.approval.approve'),
      cancelText: t('common.cancel'),
      centered: true,
      maskClosable: false,
      onOk: async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 400));
          Toast.success(t('requirement.approval.businessApproveSuccess'));
          onStatusChange();
        } catch {
          Toast.error(t('requirement.approval.approveError'));
        }
      },
    });
  };

  // Tech approve with assessment (TECH_PENDING -> TECH_APPROVED)
  const handleTechApprove = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      Toast.success(t('requirement.approval.techApproveSuccess'));
      setTechApproveModalVisible(false);
      onStatusChange();
    } catch {
      Toast.error(t('requirement.approval.approveError'));
    } finally {
      setLoading(false);
    }
  };

  // Reject (BUSINESS_PENDING -> BUSINESS_REJECTED, or TECH_PENDING -> TECH_REJECTED)
  const handleReject = async (values: { comment: string }) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const stage = approval_status === 'BUSINESS_PENDING' ? 'business' : 'tech';
      Toast.success(t(`requirement.approval.${stage}RejectSuccess`));
      setRejectModalVisible(false);
      onStatusChange();
    } catch {
      Toast.error(t('requirement.approval.rejectError'));
    } finally {
      setLoading(false);
    }
  };

  // Determine what the current user sees
  const renderActions = () => {
    // Submitter actions
    if (currentUserRole === 'submitter') {
      if (approval_status === 'DRAFT') {
        return (
          <Button theme="solid" type="primary" loading={loading} onClick={handleSubmitForApproval}>
            {t('requirement.approval.submitForApproval')}
          </Button>
        );
      }
      if (approval_status === 'BUSINESS_REJECTED' || approval_status === 'TECH_REJECTED') {
        return (
          <Button theme="solid" type="primary" loading={loading} onClick={handleSubmitForApproval}>
            {t('requirement.approval.resubmit')}
          </Button>
        );
      }
      if (approval_status === 'BUSINESS_PENDING') {
        return <Tag color="orange">{t('requirement.approvalFlow.waitingBusinessApproval')}</Tag>;
      }
      if (approval_status === 'TECH_PENDING') {
        return <Tag color="orange">{t('requirement.approvalFlow.waitingTechApproval')}</Tag>;
      }
      if (approval_status === 'TECH_APPROVED') {
        return <Tag color="green">{t('requirement.approvalFlow.allApproved')}</Tag>;
      }
      return null;
    }

    // Business admin actions
    if (currentUserRole === 'business_admin') {
      if (approval_status === 'BUSINESS_PENDING') {
        return (
          <>
            <Button theme="solid" type="primary" onClick={handleBusinessApprove}>
              {t('requirement.approval.approve')}
            </Button>
            <Button theme="solid" type="danger" onClick={() => setRejectModalVisible(true)}>
              {t('requirement.approval.reject')}
            </Button>
          </>
        );
      }
      return null;
    }

    // Dev admin actions
    if (currentUserRole === 'dev_admin') {
      if (approval_status === 'TECH_PENDING') {
        return (
          <>
            <Button theme="solid" type="primary" onClick={() => setTechApproveModalVisible(true)}>
              {t('requirement.approval.techApproveBtn')}
            </Button>
            <Button theme="solid" type="danger" onClick={() => setRejectModalVisible(true)}>
              {t('requirement.approval.reject')}
            </Button>
          </>
        );
      }
      return null;
    }

    return null;
  };

  const actions = renderActions();
  if (!actions) return null;

  const rejectStageLabel = approval_status === 'BUSINESS_PENDING'
    ? t('requirement.approvalFlow.businessApproval')
    : t('requirement.approvalFlow.techApproval');

  return (
    <div className="approval-actions">
      <Space>{actions}</Space>

      {/* Reject Modal */}
      <Modal
        title={t('requirement.approval.rejectTitle') + ' - ' + rejectStageLabel}
        visible={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        footer={null}
        width={520}
        closeOnEsc
        centered
        maskClosable={false}
      >
        <Form onSubmit={handleReject} labelPosition="top">
          <Form.TextArea
            field="comment"
            label={t('requirement.approval.rejectReason')}
            placeholder={t('requirement.approval.rejectReasonPlaceholder')}
            autosize={{ minRows: 3, maxRows: 6 }}
            maxCount={2000}
            showClear
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

      {/* Tech Approve Modal with Assessment */}
      <Modal
        title={t('requirement.approval.techApproveModalTitle')}
        visible={techApproveModalVisible}
        onCancel={() => setTechApproveModalVisible(false)}
        footer={null}
        width={620}
        closeOnEsc
        centered
        maskClosable={false}
      >
        <Form onSubmit={handleTechApprove} labelPosition="top">
          <Banner
            type="info"
            description={t('requirement.approval.techApproveHint')}
            style={{ marginBottom: 16 }}
          />

          <Form.Slot label={t('requirement.assessment.businessValue')}>
            <Form.Rating field="business_value" count={5} rules={[{ required: true, message: t('requirement.approval.ratingRequired') }]} noLabel />
          </Form.Slot>
          <Form.Slot label={t('requirement.assessment.technicalComplexity')}>
            <Form.Rating field="technical_complexity" count={5} rules={[{ required: true, message: t('requirement.approval.ratingRequired') }]} noLabel />
          </Form.Slot>
          <Form.Slot label={t('requirement.assessment.automationFeasibility')}>
            <Form.Rating field="automation_feasibility" count={5} rules={[{ required: true, message: t('requirement.approval.ratingRequired') }]} noLabel />
          </Form.Slot>

          <Form.Select
            field="conclusion"
            label={t('requirement.approval.techConclusion')}
            placeholder={t('requirement.approval.techConclusionPlaceholder')}
            rules={[{ required: true, message: t('requirement.approval.conclusionRequired') }]}
            style={{ width: '100%' }}
          >
            <Form.Select.Option value="RECOMMENDED">{t('requirement.assessment.conclusion.RECOMMENDED')}</Form.Select.Option>
            <Form.Select.Option value="CONDITIONAL">{t('requirement.assessment.conclusion.CONDITIONAL')}</Form.Select.Option>
            <Form.Select.Option value="NOT_RECOMMENDED">{t('requirement.assessment.conclusion.NOT_RECOMMENDED')}</Form.Select.Option>
          </Form.Select>

          <Form.TextArea
            field="comment"
            label={t('requirement.approval.techComment')}
            placeholder={t('requirement.approval.techCommentPlaceholder')}
            autosize={{ minRows: 3, maxRows: 6 }}
            maxCount={2000}
            showClear
          />

          <div className="approval-actions-reject-footer">
            <Button theme="light" onClick={() => setTechApproveModalVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
              {t('requirement.approval.confirmTechApprove')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ApprovalActions;
