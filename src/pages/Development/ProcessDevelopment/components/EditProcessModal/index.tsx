import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Toast, Button } from '@douyinfe/semi-ui';
import './index.less';

interface ProcessData {
  id: string;
  name: string;
  description: string;
}

interface EditProcessModalProps {
  visible: boolean;
  onCancel: () => void;
  processData: ProcessData | null;
  onSuccess?: (updatedData: ProcessData) => void;
}

const EditProcessModal = ({ visible, onCancel, processData, onSuccess }: EditProcessModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const existingProcessNames = ['订单自动处理流程', '财务报销审批流程', '人事入职流程'];

  const validateProcessNameUnique = (rule: unknown, value: string, callback: (error?: string) => void) => {
    if (value === processData?.name) {
      callback();
      return true;
    }
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
      const updatedData: ProcessData = {
        id: processData?.id || '',
        name: values.name as string,
        description: values.description as string,
      };
      Toast.success(t('development.processDevelopment.editModal.success'));
      onSuccess?.(updatedData);
      onCancel();
    } catch {
      Toast.error(t('development.processDevelopment.editModal.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={t('development.processDevelopment.editModal.title')} visible={visible} onCancel={onCancel} footer={null} width={520} closeOnEsc maskClosable={false}>
      <Form
        onSubmit={handleSubmit}
        labelPosition="top"
        className="edit-process-modal-form"
        initValues={{
          name: processData?.name || '',
          description: processData?.description || '',
        }}
        key={processData?.id}
      >
        <Form.Input
          field="name"
          label={t('development.processDevelopment.fields.processName')}
          placeholder={t('development.processDevelopment.createModal.fields.namePlaceholder')}
          rules={[
            { required: true, message: t('development.processDevelopment.createModal.validation.nameRequired') },
            { min: 1, message: t('development.processDevelopment.createModal.validation.nameLengthError') },
            { max: 100, message: t('development.processDevelopment.createModal.validation.nameLengthError') },
            { validator: validateProcessNameUnique },
          ]}
        />

        <Form.TextArea
          field="description"
          label={t('common.description')}
          placeholder={t('development.processDevelopment.createModal.fields.descriptionPlaceholder')}
          autosize={{ minRows: 3, maxRows: 6 }}
          maxCount={500}
          rules={[
            { max: 500, message: t('development.processDevelopment.createModal.validation.descriptionLengthError') },
          ]}
        />

        <div className="edit-process-modal-footer">
          <Button theme="light" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
            {t('common.save')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditProcessModal;
