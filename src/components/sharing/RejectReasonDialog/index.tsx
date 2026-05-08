import { useEffect, useState } from 'react';
import { Modal, Form } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

interface Props {
  visible: boolean;
  assetName?: string;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}

const RejectReasonDialog = ({ visible, assetName, onSubmit, onCancel }: Props) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (visible) setReason('');
  }, [visible]);

  const handleOk = () => {
    if (reason.trim().length < 5) return;
    onSubmit(reason.trim());
  };

  return (
    <Modal
      title={t('sharing.approvals.rejectDialog.title')}
      visible={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText={t('sharing.approvals.rejectDialog.confirm')}
      cancelText={t('common.cancel')}
      okButtonProps={{ type: 'danger', disabled: reason.trim().length < 5 }}
      width={520}
      maskClosable={false}
    >
      {assetName && (
        <div style={{ marginBottom: 12 }}>
          <span style={{ color: 'var(--semi-color-text-2)' }}>
            {t('sharing.approvals.rejectDialog.target')}:
          </span>{' '}
          <strong>{assetName}</strong>
        </div>
      )}
      <Form labelPosition="top">
        <Form.TextArea
          field="reason"
          label={t('sharing.approvals.rejectDialog.reason')}
          placeholder={t('sharing.approvals.rejectDialog.placeholder')}
          rows={5}
          maxCount={500}
          maxLength={500}
          value={reason}
          onChange={(v) => setReason(v)}
          showClear
        />
      </Form>
    </Modal>
  );
};

export default RejectReasonDialog;
