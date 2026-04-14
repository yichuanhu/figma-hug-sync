import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Toast, Button } from '@douyinfe/semi-ui';
import type { LYCreateProcessRequest, LYProcessResponse } from '@/api';
import DepartmentSelect from '@/components/DepartmentSelect';
import OwnerSelect from '@/components/OwnerSelect';
import { MOCK_CURRENT_USER } from '@/mocks/departmentData';
import './index.less';

// 生成UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// 生成Mock的LYProcessResponse
const generateMockLYProcessResponse = (request: LYCreateProcessRequest, owningDepartmentId: string, owningDepartmentName: string): LYProcessResponse => {
  const now = new Date().toISOString();
  return {
    id: generateUUID(),
    name: request.name,
    description: request.description || null,
    language: 'Python',
    process_type: 'RPA',
    timeout: 60,
    status: 'DEVELOPING',
    current_version_id: null,
    creator_id: MOCK_CURRENT_USER.id,
    requirement_id: request.requirement_id || null,
    created_at: now,
    updated_at: now,
    owning_department_id: owningDepartmentId,
    owning_department_name: owningDepartmentName,
    owner_id: MOCK_CURRENT_USER.id,
    owner_name: MOCK_CURRENT_USER.name,
  };
};

interface CreateProcessModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: (processData: LYProcessResponse) => void;
}

const CreateProcessModal = ({ visible, onCancel, onSuccess }: CreateProcessModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [owningDepartmentId, setOwningDepartmentId] = useState<string | undefined>(undefined);

  const existingProcessNames = ['订单自动处理流程', '财务报销审批流程', '人事入职流程'];

  const validateProcessNameFormat = (rule: unknown, value: string, callback: (error?: string) => void) => {
    if (!value) {
      callback();
      return true;
    }
    const namePattern = /^[^\d][a-zA-Z0-9\u4e00-\u9fa5_]*$/;
    if (!namePattern.test(value.trim())) {
      callback(t('development.processDevelopment.createModal.validation.nameFormatError'));
      return false;
    }
    callback();
    return true;
  };

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
      if (!owningDepartmentId) {
        Toast.warning(t('common.owningDepartmentRequired'));
        setLoading(false);
        return;
      }

      const createRequest: LYCreateProcessRequest = {
        name: values.name as string,
        description: (values.description as string) || undefined,
        owning_department_id: owningDepartmentId,
      };

      await new Promise((resolve) => setTimeout(resolve, 300));

      const { getDepartmentName } = await import('@/mocks/departmentData');
      const mockResponse = generateMockLYProcessResponse(createRequest, owningDepartmentId, getDepartmentName(owningDepartmentId));

      Toast.success(t('development.processDevelopment.createModal.success'));
      onCancel();
      onSuccess?.(mockResponse);
    } catch (error) {
      console.error('创建流程失败:', error);
      Toast.error(t('development.processDevelopment.createModal.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('development.processDevelopment.createModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={520}
      closeOnEsc
      maskClosable={false}
    >
      <Form onSubmit={handleSubmit} labelPosition="top" className="create-process-modal-form">
        <Form.Input
          field="name"
          label={t('development.processDevelopment.fields.processName')}
          placeholder={t('development.processDevelopment.createModal.fields.namePlaceholder')}
          trigger={['blur', 'change']}
          rules={[
            { required: true, message: t('development.processDevelopment.createModal.validation.nameRequired') },
            { max: 100, message: t('development.processDevelopment.createModal.validation.nameLengthError') },
            { validator: validateProcessNameFormat },
            { validator: validateProcessNameUnique },
          ]}
          showClear
        />

        <Form.TextArea
          field="description"
          label={t('common.description')}
          placeholder={t('development.processDevelopment.createModal.fields.descriptionPlaceholder')}
          autosize={{ minRows: 3, maxRows: 6 }}
          maxCount={2000}
          trigger={['blur', 'change']}
          rules={[
            { max: 2000, message: t('development.processDevelopment.createModal.validation.descriptionLengthError') },
          ]}
        />

        <Form.Slot label={t('common.owningDepartment')}>
          <DepartmentSelect
            value={owningDepartmentId}
            onChange={setOwningDepartmentId}
          />
        </Form.Slot>

        <Form.Slot label={t('common.owner')}>
          <OwnerSelect value={ownerId} onChange={setOwnerId} />
        </Form.Slot>

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
