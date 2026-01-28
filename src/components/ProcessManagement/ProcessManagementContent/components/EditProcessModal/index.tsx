import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Toast, Button } from '@douyinfe/semi-ui';
import type { LYUpdateProcessRequest, LYProcessResponse } from '@/api';
import './index.less';

interface EditProcessModalProps {
  visible: boolean;
  onCancel: () => void;
  processData: LYProcessResponse | null;
  onSuccess?: (updatedData: LYProcessResponse) => void;
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
    if (!processData?.id) return;

    setLoading(true);
    try {
      // 构建API请求参数 - 使用LYUpdateProcessRequest类型
      const updateRequest: LYUpdateProcessRequest = {
        name: values.name as string,
        description: (values.description as string) || undefined,
      };

      // 模拟API调用延迟
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 生成Mock响应 - 直接返回LYProcessResponse
      const updatedProcess: LYProcessResponse = {
        ...processData,
        name: updateRequest.name || processData.name,
        description: updateRequest.description || processData.description,
        updated_at: new Date().toISOString(),
      };

      Toast.success(t('development.processDevelopment.editModal.success'));
      onSuccess?.(updatedProcess);
      onCancel();
    } catch (error) {
      console.error('更新流程失败:', error);
      Toast.error(t('development.processDevelopment.editModal.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('development.processDevelopment.editModal.title')}
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
          maxCount={2000}
          rules={[
            { max: 2000, message: t('development.processDevelopment.createModal.validation.descriptionLengthError') },
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
