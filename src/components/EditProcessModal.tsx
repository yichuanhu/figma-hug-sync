import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Modal, 
  Form, 
  Toast,
  Button
} from '@douyinfe/semi-ui';

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

  // 模拟已存在的流程名称列表（排除当前编辑的流程）
  const existingProcessNames = [
    '订单自动处理流程',
    '财务报销审批流程',
    '人事入职流程',
  ];

  // 检查流程名称是否唯一
  const validateProcessNameUnique = (
    rule: unknown, 
    value: string, 
    callback: (error?: string) => void
  ) => {
    // 如果名称没有改变，跳过唯一性验证
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

  // 关联需求选项
  const requirementOptions = [
    { value: 'REQ-2024-001', label: 'REQ-2024-001 - 订单自动处理需求' },
    { value: 'REQ-2024-002', label: 'REQ-2024-002 - 财务报销自动化' },
    { value: 'REQ-2024-003', label: 'REQ-2024-003 - 人事审批流程优化' },
  ];

  // 归属组织选项
  const organizationOptions = [
    { value: '财务部', label: '财务部' },
    { value: '人事部', label: '人事部' },
    { value: '技术部', label: '技术部' },
    { value: '运营部', label: '运营部' },
  ];

  // 流程类型选项
  const processTypeOptions = [
    { value: '原生流程', label: '原生流程' },
  ];

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
    } catch (error) {
      Toast.error(t('editProcess.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('editProcess.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={520}
      closeOnEsc
      maskClosable={false}
    >
      <Form
        onSubmit={handleSubmit}
        labelPosition="top"
        style={{ paddingTop: 4 }}
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
          style={{ width: '100%' }}
        />

        <Form.Select
          field="relatedRequirement"
          label={t('createProcess.fields.relatedRequirement')}
          placeholder={t('createProcess.fields.relatedRequirementPlaceholder')}
          optionList={requirementOptions}
          showClear
          style={{ width: '100%' }}
        />

        <Form.Select
          field="organization"
          label={t('createProcess.fields.organization')}
          placeholder={t('createProcess.fields.organizationPlaceholder')}
          optionList={organizationOptions}
          rules={[{ required: true, message: t('createProcess.validation.organizationRequired') }]}
          style={{ width: '100%' }}
        />

        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 12, 
          marginTop: 12,
          paddingTop: 16,
          paddingBottom: 12,
          borderTop: '1px solid var(--semi-color-border)'
        }}>
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
