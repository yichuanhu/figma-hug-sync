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
      callback(t('createProcess.validation.nameExists'));
      return false;
    }
    callback();
    return true;
  };

  const requirementOptions = [
    { value: 'REQ-2024-001', label: 'REQ-2024-001 - 订单自动处理需求' },
    { value: 'REQ-2024-002', label: 'REQ-2024-002 - 财务报销自动化' },
    { value: 'REQ-2024-003', label: 'REQ-2024-003 - 人事审批流程优化' },
  ];

  const organizationOptions = [
    { value: '财务部', label: '财务部' },
    { value: '人事部', label: '人事部' },
    { value: '技术部', label: '技术部' },
    { value: '运营部', label: '运营部' },
  ];

  const processTypeOptions = [{ value: '原生流程', label: '原生流程' }];

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
        type: values.type as string,
        relatedRequirement: values.relatedRequirement as string,
        organization: values.organization as string,
        status: t('development.status.draft'),
        creator: '当前用户',
        createdAt: now,
      };
      Toast.success(t('createProcess.success'));
      onCancel();
      onSuccess?.(processData);
    } catch {
      Toast.error(t('createProcess.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={t('createProcess.title')} visible={visible} onCancel={onCancel} footer={null} width={520} closeOnEsc maskClosable={false}>
      <Form onSubmit={handleSubmit} labelPosition="top" className="create-process-modal-form">
        <Form.Input
          field="name"
          label={t('createProcess.fields.name')}
          placeholder={t('createProcess.fields.namePlaceholder')}
          trigger="blur"
          rules={[
            { required: true, message: t('createProcess.validation.nameRequired') },
            { min: 1, message: t('createProcess.validation.nameLengthError') },
            { max: 100, message: t('createProcess.validation.nameLengthError') },
            { validator: validateProcessNameUnique },
          ]}
          showClear
        />

        <Form.TextArea
          field="description"
          label={t('createProcess.fields.description')}
          placeholder={t('createProcess.fields.descriptionPlaceholder')}
          autosize={{ minRows: 3, maxRows: 6 }}
          maxCount={500}
          trigger="blur"
          rules={[
            { required: true, message: t('createProcess.validation.descriptionRequired') },
            { min: 1, message: t('createProcess.validation.descriptionLengthError') },
            { max: 500, message: t('createProcess.validation.descriptionLengthError') },
          ]}
        />

        <Form.Select
          field="type"
          label={t('createProcess.fields.type')}
          placeholder={t('createProcess.fields.typePlaceholder')}
          initValue="原生流程"
          optionList={processTypeOptions}
          rules={[{ required: true, message: t('createProcess.validation.typeRequired') }]}
          className="create-process-modal-select-full"
        />

        <Form.Select
          field="relatedRequirement"
          label={t('createProcess.fields.relatedRequirement')}
          placeholder={t('createProcess.fields.relatedRequirementPlaceholder')}
          optionList={requirementOptions}
          showClear
          className="create-process-modal-select-full"
        />

        <Form.Select
          field="organization"
          label={t('createProcess.fields.organization')}
          placeholder={t('createProcess.fields.organizationPlaceholder')}
          optionList={organizationOptions}
          rules={[{ required: true, message: t('createProcess.validation.organizationRequired') }]}
          className="create-process-modal-select-full"
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
