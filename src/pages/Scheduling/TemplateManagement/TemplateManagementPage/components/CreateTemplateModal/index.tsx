import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MOCK_CURRENT_USER } from '@/mocks/departmentData';
import { Modal, Form, Button, Toast } from '@douyinfe/semi-ui';
import OwnerSelect from '@/components/OwnerSelect';
import TaskForm, { TaskFormSource } from '@/components/TaskForm';
import type { TaskFormRef } from '@/components/TaskForm';
import './index.less';

interface CreateTemplateModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

// 已存在的模板名（模拟）
const existingTemplateNames = ['Order Processing Default Template', 'Finance Approval Quick Template'];

const CreateTemplateModal = ({ visible, onCancel, onSuccess }: CreateTemplateModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [ownerId, setOwnerId] = useState<string>(MOCK_CURRENT_USER.id);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const taskRef = useRef<TaskFormRef>(null);

  useEffect(() => {
    if (visible && taskRef.current) {
      taskRef.current.init();
    }
  }, [visible]);

  const validateTemplateName = useCallback((value: string) => {
    if (value && existingTemplateNames.includes(value.trim())) {
      return t('template.validation.nameExists');
    }
    return '';
  }, [t]);

  const handleSubmit = useCallback(async () => {
    if (!taskRef.current) return;
    setLoading(true);
    try {
      const result = await taskRef.current.submit();
      if (!result) {
        setLoading(false);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log('CreateExecuteTemplate:', result);
      Toast.success(t('template.createModal.success'));
      onSuccess();
    } catch (error) {
      console.error('CreateExecuteTemplateFailed:', error);
      Toast.error(t('template.createModal.error'));
    } finally {
      setLoading(false);
    }
  }, [t, onSuccess]);

  const preFormItem = (
    <div className="task-template-section">
      <div className="task-template-section-title">{t('template.createModal.basicSection')}</div>
      <Form.Input
        field="templateName"
        label={t('template.fields.name')}
        placeholder={t('template.fields.namePlaceholder')}
        maxLength={255}
        showClear
        rules={[
          { required: true, message: t('template.validation.nameRequired') },
          { max: 255, message: t('template.validation.nameLengthError') },
          { validator: (_rule: any, value: string, callback: (msg?: string) => void) => {
            const error = validateTemplateName(value);
            if (error) {
              callback(error);
              return false;
            }
            callback();
            return true;
          }},
        ]}
      />
      <Form.TextArea
        field="description"
        label={t('template.fields.description')}
        placeholder={t('template.fields.descriptionPlaceholder')}
        maxCount={2000}
        showClear
        rows={3}
      />
      <Form.Slot label={t('common.owner')}>
        <OwnerSelect value={ownerId} onChange={setOwnerId} />
      </Form.Slot>
    </div>
  );

  return (
    <Modal
      className="create-template-modal"
      title={t('template.createModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={showRightPanel ? 900 : 520}
      centered
    >
      <TaskForm
        taskRef={taskRef}
        showParamsHandle={setShowRightPanel}
        source={TaskFormSource.TaskTemplate}
        preFormItem={preFormItem}
        showRightPanel={showRightPanel}
      />
      <div className="task-template-footer">
        <Button theme="light" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button theme="solid" type="primary" loading={loading} onClick={handleSubmit}>
          {t('common.create')}
        </Button>
      </div>
    </Modal>
  );
};

export default CreateTemplateModal;
