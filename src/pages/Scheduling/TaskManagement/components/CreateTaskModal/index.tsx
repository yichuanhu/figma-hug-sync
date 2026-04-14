import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MOCK_CURRENT_USER } from '@/mocks/departmentData';
import { Modal, Form, Button, Toast } from '@douyinfe/semi-ui';
import OwnerSelect from '@/components/OwnerSelect';
import TaskForm, { TaskFormSource } from '@/components/TaskForm';
import type { TaskFormRef } from '@/components/TaskForm';
import type { LYExecutionTemplateResponse } from '@/api';
import './index.less';

interface CreateTaskModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialTemplate?: LYExecutionTemplateResponse | null;
}

// Mock ExecuteTemplate
const mockTemplates: LYExecutionTemplateResponse[] = [
  {
    template_id: 'tpl-001',
    template_name: 'Order Processing Default Template',
    description: 'Process orders with default config',
    process_id: 'proc-001',
    process_name: 'Auto Order Processing',
    execution_target_type: 'BOT_GROUP',
    execution_target_id: 'group-001',
    execution_target_name: 'Order Processing Group',
    priority: 'MEDIUM',
    max_execution_duration: 3600,
    validity_days: 7,
    enable_recording: true,
    input_parameters: { targetUrl: 'https://orders.example.com', maxCount: 50 },
  },
];

const CreateTaskModal = ({ visible, onCancel, onSuccess, initialTemplate }: CreateTaskModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [ownerId, setOwnerId] = useState<string>(MOCK_CURRENT_USER.id);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const taskRef = useRef<TaskFormRef>(null);

  // 弹窗打开时初始化
  useEffect(() => {
    if (visible && taskRef.current) {
      taskRef.current.init();
    }
  }, [visible]);

  // 提交
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
      console.log('Creating task:', result);
      Toast.success(t('task.createModal.success'));
      onSuccess();
    } catch (error) {
      console.error('Failed to create task:', error);
      Toast.error(t('task.createModal.error'));
    } finally {
      setLoading(false);
    }
  }, [t, onSuccess]);

  // 模板选择回调
  const handleTemplateChange = useCallback((templateId: string | null) => {
    if (templateId && taskRef.current) {
      const template = mockTemplates.find((t) => t.template_id === templateId);
      if (template) {
        taskRef.current.fillTemplate(template);
      }
    }
  }, []);

  // 预置表单项：模板选择 + 归属者
  const preFormItem = (
    <div className="task-template-section">
      <div className="task-template-section-title">{t('task.createModal.selectTemplate')}</div>
      <Form.Select
        field="templateId"
        noLabel
        placeholder={t('task.createModal.templatePlaceholder')}
        optionList={mockTemplates.map((tpl) => ({ value: tpl.template_id, label: tpl.template_name }))}
        showClear
        filter
        className="task-template-select-full"
        onChange={(v) => handleTemplateChange(v as string | null)}
      />
      <Form.Slot label={t('common.owner')}>
        <OwnerSelect value={ownerId} onChange={setOwnerId} />
      </Form.Slot>
    </div>
  );

  return (
    <Modal
      className="create-task-modal"
      title={t('task.createModal.title')}
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
        source={TaskFormSource.TaskList}
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

export default CreateTaskModal;
