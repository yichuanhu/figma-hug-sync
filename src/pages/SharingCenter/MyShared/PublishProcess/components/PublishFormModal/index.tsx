import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Button } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import type { PublishProcessRecord } from '../../types';

interface Props {
  visible: boolean;
  record: PublishProcessRecord | null;
  onCancel: () => void;
  onSubmit: (publishNote: string) => Promise<void>;
}

const PublishFormModal = ({ visible, record, onCancel, onSubmit }: Props) => {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [formApi, setFormApi] = useState<FormApi | null>(null);

  useEffect(() => {
    if (!visible) {
      setSubmitting(false);
      formApi?.reset();
    }
  }, [visible, formApi]);

  if (!record) return null;

  const handleSubmit = async () => {
    if (!formApi) return;
    try {
      const values = await formApi.validate();
      setSubmitting(true);
      await onSubmit((values.publishNote as string) || '');
    } catch (e) {
      // 校验未通过 / 提交失败
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={t('publishToSharing.modal.title')}
      visible={visible}
      onCancel={onCancel}
      width={520}
      maskClosable={false}
      centered
      className="pp-publish-modal"
      footer={
        <>
          <Button theme="light" onClick={onCancel} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button theme="solid" type="primary" loading={submitting} onClick={handleSubmit}>
            {t('publishToSharing.modal.confirm')}
          </Button>
        </>
      }
    >
      <div className="pp-publish-readonly">
        <div className="pp-publish-readonly-row">
          <span className="pp-publish-readonly-label">{t('publishToSharing.col.processName')}</span>
          <span className="pp-publish-readonly-value">{record.processName}</span>
        </div>
        <div className="pp-publish-readonly-row">
          <span className="pp-publish-readonly-label">{t('publishToSharing.col.version')}</span>
          <span className="pp-publish-readonly-value">{record.version}</span>
        </div>
        <div className="pp-publish-readonly-row">
          <span className="pp-publish-readonly-label">{t('publishToSharing.col.department')}</span>
          <span className="pp-publish-readonly-value">{record.department}</span>
        </div>
      </div>

      <Form labelPosition="top" getFormApi={setFormApi}>
        <Form.TextArea
          field="publishNote"
          label={t('publishToSharing.modal.noteLabel')}
          placeholder={t('publishToSharing.modal.notePh')}
          maxCount={200}
          maxLength={200}
          rows={4}
          trigger={['blur', 'change']}
          rules={[
            { max: 200, message: t('publishToSharing.modal.noteOverLimit') },
            {
              validator: (_rule, value) => !value || value.length === 0 || value.length >= 5,
              message: t('publishToSharing.modal.noteMin'),
            },
          ]}
        />
      </Form>
    </Modal>
  );
};

export default PublishFormModal;
