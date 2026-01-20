import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Toast, Button } from '@douyinfe/semi-ui';
import './index.less';

interface ProcessData {
  id: string;
  name: string;
  description: string;
  status: string;
  organization: string;
  creator: string;
  createdAt: string;
}

interface CreateProcessModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: (processData: ProcessData) => void;
}

const CreateProcessModal = ({ visible, onCancel, onSuccess }: CreateProcessModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const generateProcessId = () => {
    const year = new Date().getFullYear();
    const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `PROC-${year}-${randomNum}`;
  };

  const existingProcessNames = ['订单自动处理流程', '财务报销审批流程', '人事入职流程'];

  const validateProcessNameUnique = (rule: unknown, value: string, callback: (error?: string) => void) => {
    if (value && existingProcessNames.includes(value.trim())) {
      callback(t('development.processDevelopment.createModal.validation.nameExists'));
      return false;
    }
    callback();
    return true;
  };


  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const processId = generateProcessId();
      const now = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      const processData = {
        id: processId,
        name: values.name as string,
        description: values.description as string,
        organization: '',
        status: t('development.processDevelopment.status.developing'),
        creator: '当前用户',
        createdAt: now,
      };
      Toast.success(t('development.processDevelopment.createModal.success'));
      onCancel();
      onSuccess?.(processData);
    } catch {
      Toast.error(t('development.processDevelopment.createModal.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={t('development.processDevelopment.createModal.title')} visible={visible} onCancel={onCancel} footer={null} width={520} closeOnEsc maskClosable={false}>
      <Form onSubmit={handleSubmit} labelPosition="top" className="create-process-modal-form">
        <Form.Input
          field="name"
          label={t('development.processDevelopment.fields.processName')}
          placeholder={t('development.processDevelopment.createModal.fields.namePlaceholder')}
          trigger="blur"
          rules={[
            { required: true, message: t('development.processDevelopment.createModal.validation.nameRequired') },
            { min: 1, message: t('development.processDevelopment.createModal.validation.nameLengthError') },
            { max: 100, message: t('development.processDevelopment.createModal.validation.nameLengthError') },
            { validator: validateProcessNameUnique },
          ]}
          showClear
        />

        <Form.TextArea
          field="description"
          label={t('common.description')}
          placeholder={t('development.processDevelopment.createModal.fields.descriptionPlaceholder')}
          autosize={{ minRows: 3, maxRows: 6 }}
          maxCount={500}
          trigger="blur"
          rules={[
            { required: true, message: t('development.processDevelopment.createModal.validation.descriptionRequired') },
            { min: 1, message: t('development.processDevelopment.createModal.validation.descriptionLengthError') },
            { max: 500, message: t('development.processDevelopment.createModal.validation.descriptionLengthError') },
          ]}
        />

        <div className="create-process-modal-footer">
          <Button theme="light" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
            {t('common.create')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateProcessModal;
