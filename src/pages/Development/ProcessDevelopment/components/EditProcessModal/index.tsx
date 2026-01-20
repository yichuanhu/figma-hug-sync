import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Toast, Button } from '@douyinfe/semi-ui';
import './index.less';

interface ProcessData {
  id: string;
  name: string;
  description: string;
  organization: string;
  relatedRequirement?: string;
  type?: string;
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
      const updatedData: ProcessData = {
        id: processData?.id || '',
        name: values.name as string,
        description: values.description as string,
        organization: values.organization as string,
        relatedRequirement: values.relatedRequirement as string,
        type: values.type as string,
      };
      Toast.success(t('editProcess.success'));
      onSuccess?.(updatedData);
      onCancel();
    } catch {
      Toast.error(t('editProcess.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={t('editProcess.title')} visible={visible} onCancel={onCancel} footer={null} width={520} closeOnEsc maskClosable={false}>
      <Form
        onSubmit={handleSubmit}
        labelPosition="top"
        className="edit-process-modal-form"
        initValues={{
          name: processData?.name || '',
          description: processData?.description || '',
          type: processData?.type || '原生流程',
          relatedRequirement: processData?.relatedRequirement || '',
          organization: processData?.organization || '',
        }}
        key={processData?.id}
      >
        <Form.Input
          field="name"
          label={t('createProcess.fields.name')}
          placeholder={t('createProcess.fields.namePlaceholder')}
          rules={[
            { required: true, message: t('createProcess.validation.nameRequired') },
            { min: 1, message: t('createProcess.validation.nameLengthError') },
            { max: 100, message: t('createProcess.validation.nameLengthError') },
            { validator: validateProcessNameUnique },
          ]}
        />

        <Form.TextArea
          field="description"
          label={t('createProcess.fields.description')}
          placeholder={t('createProcess.fields.descriptionPlaceholder')}
          autosize={{ minRows: 3, maxRows: 6 }}
          maxCount={500}
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
          optionList={processTypeOptions}
          rules={[{ required: true, message: t('createProcess.validation.typeRequired') }]}
          className="edit-process-modal-select-full"
        />

        <Form.Select
          field="relatedRequirement"
          label={t('createProcess.fields.relatedRequirement')}
          placeholder={t('createProcess.fields.relatedRequirementPlaceholder')}
          optionList={requirementOptions}
          showClear
          className="edit-process-modal-select-full"
        />

        <Form.Select
          field="organization"
          label={t('createProcess.fields.organization')}
          placeholder={t('createProcess.fields.organizationPlaceholder')}
          optionList={organizationOptions}
          rules={[{ required: true, message: t('createProcess.validation.organizationRequired') }]}
          className="edit-process-modal-select-full"
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
