import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Modal, 
  Form, 
  Toast, 
  Button,
  RadioGroup,
  Radio,
} from '@douyinfe/semi-ui';
import type { LYWorkerResponse } from '@/api';
import './index.less';

interface EditWorkerModalProps {
  visible: boolean;
  onCancel: () => void;
  workerData: LYWorkerResponse | null;
  onSuccess?: (updatedData: LYWorkerResponse) => void;
}

const EditWorkerModal = ({ visible, onCancel, workerData, onSuccess }: EditWorkerModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [desktopType, setDesktopType] = useState<string>('Console');

  useEffect(() => {
    if (workerData) {
      setDesktopType(workerData.desktop_type || 'Console');
    }
  }, [workerData]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!workerData?.id) return;

    setLoading(true);
    try {
      // 模拟API调用延迟
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 生成Mock响应
      const updatedWorker: LYWorkerResponse = {
        ...workerData,
        name: values.name as string,
        description: (values.description as string) || null,
        receive_tasks: values.receiveTasks as boolean,
        desktop_type: desktopType as 'Console' | 'NotConsole',
        username: values.username as string,
        enable_auto_unlock: desktopType === 'Console' ? (values.enableAutoUnlock as boolean) : undefined,
        display_size: desktopType === 'NotConsole' ? (values.displaySize as string) : undefined,
        force_login: values.forceLogin as boolean,
      };

      Toast.success(t('worker.edit.success'));
      onSuccess?.(updatedWorker);
      onCancel();
    } catch (error) {
      console.error('更新机器人失败:', error);
      Toast.error(t('worker.deleteModal.error'));
    } finally {
      setLoading(false);
    }
  };

  if (!workerData) return null;

  return (
    <Modal
      title={t('worker.edit.title')}
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
        className="edit-worker-modal-form"
        initValues={{
          name: workerData.name || '',
          description: workerData.description || '',
          receiveTasks: workerData.receive_tasks ?? true,
          username: workerData.username || '',
          enableAutoUnlock: workerData.enable_auto_unlock ?? true,
          displaySize: workerData.display_size || '1920x1080',
          forceLogin: workerData.force_login ?? false,
        }}
        key={workerData.id}
      >
        <div className="edit-worker-modal-section">
          <div className="edit-worker-modal-section-title">{t('worker.create.basicInfo')}</div>
          <Form.Input
            field="name"
            label={t('worker.detail.fields.workerName')}
            trigger="blur"
            rules={[
              { required: true, message: t('worker.create.validation.nameRequired') },
            ]}
            showClear
          />
          <Form.TextArea
            field="description"
            label={t('common.description')}
            placeholder={t('worker.create.fields.descriptionPlaceholder')}
            autosize={{ minRows: 2, maxRows: 4 }}
            maxCount={500}
          />
          <div className="edit-worker-modal-field">
            <Form.Label>{t('worker.edit.fields.receiveTasks')}</Form.Label>
            <Form.RadioGroup field="receiveTasks">
              <Radio value={true}>{t('common.yes')}</Radio>
              <Radio value={false}>{t('common.no')}</Radio>
            </Form.RadioGroup>
          </div>
        </div>

        <div className="edit-worker-modal-section">
          <div className="edit-worker-modal-section-title">{t('worker.create.runtimeConfig')}</div>
          <div className="edit-worker-modal-field">
            <Form.Label>{t('worker.create.fields.desktopType')}</Form.Label>
            <RadioGroup value={desktopType} onChange={(e) => setDesktopType(e.target.value)}>
              <Radio value="Console">{t('worker.create.fields.localDesktop')}</Radio>
              <Radio value="NotConsole">{t('worker.create.fields.remoteDesktop')}</Radio>
            </RadioGroup>
          </div>
        </div>

        <div className="edit-worker-modal-section">
          <div className="edit-worker-modal-section-title">{t('worker.create.connectionParams')}</div>
          <Form.Input
            field="username"
            label={t('worker.create.fields.account')}
            trigger="blur"
            rules={[
              { required: true, message: t('worker.create.validation.accountRequired') },
            ]}
            showClear
          />
          <Form.Input
            field="password"
            label={t('worker.create.fields.password')}
            placeholder={t('worker.edit.fields.passwordPlaceholder')}
            mode="password"
          />
          {desktopType === 'Console' && (
            <div className="edit-worker-modal-field">
              <Form.Label>{t('worker.edit.fields.unlockScreen')}</Form.Label>
              <Form.RadioGroup field="enableAutoUnlock">
                <Radio value={true}>{t('common.yes')}</Radio>
                <Radio value={false}>{t('common.no')}</Radio>
              </Form.RadioGroup>
            </div>
          )}
          {desktopType === 'NotConsole' && (
            <Form.Input
              field="displaySize"
              label={t('worker.detail.fields.resolution')}
              showClear
            />
          )}
          <div className="edit-worker-modal-field">
            <Form.Label>{t('worker.detail.fields.forceLogin')}</Form.Label>
            <Form.RadioGroup field="forceLogin">
              <Radio value={true}>{t('common.yes')}</Radio>
              <Radio value={false}>{t('common.no')}</Radio>
            </Form.RadioGroup>
          </div>
        </div>

        <div className="edit-worker-modal-footer">
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

export default EditWorkerModal;
