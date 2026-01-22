import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Modal, 
  Form, 
  Toast, 
  Button,
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

// 已存在的机器人名称（用于唯一性校验）
const existingWorkerNames = ['财务机器人-01', '财务机器人-02', '财务机器人-03', '人力机器人-01', '运维机器人-01', '测试机器人-01'];

const EditWorkerModal = ({ visible, onCancel, workerData, onSuccess }: EditWorkerModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [desktopType, setDesktopType] = useState<string>('Console');

  useEffect(() => {
    if (workerData) {
      setDesktopType(workerData.desktop_type || 'Console');
    }
  }, [workerData]);

  // 名称唯一性校验（排除当前编辑的机器人）
  const validateWorkerNameUnique = (rule: unknown, value: string, callback: (error?: string) => void) => {
    if (value === workerData?.name) {
      callback();
      return true;
    }
    if (value && existingWorkerNames.includes(value.trim())) {
      callback(t('worker.create.validation.nameExists'));
      return false;
    }
    callback();
    return true;
  };

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
      centered
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
              { min: 2, message: t('worker.create.validation.nameLengthError') },
              { max: 50, message: t('worker.create.validation.nameLengthError') },
              { validator: validateWorkerNameUnique },
            ]}
            showClear
          />
          <Form.TextArea
            field="description"
            label={t('common.description')}
            placeholder={t('worker.create.fields.descriptionPlaceholder')}
            autosize={{ minRows: 2, maxRows: 4 }}
            maxCount={500}
            rules={[
              { max: 500, message: t('worker.create.validation.descriptionLengthError') },
            ]}
          />
        </div>

        <div className="edit-worker-modal-section">
          <div className="edit-worker-modal-section-title">{t('worker.create.runtimeConfig')}</div>
          <Form.RadioGroup
            field="desktopType"
            label={t('worker.create.fields.desktopType')}
            initValue={workerData.desktop_type || 'Console'}
            onChange={(e) => setDesktopType(e.target.value)}
          >
            <Radio value="Console">{t('worker.create.fields.localDesktop')}</Radio>
            <Radio value="NotConsole">{t('worker.create.fields.remoteDesktop')}</Radio>
          </Form.RadioGroup>
        </div>

        <div className="edit-worker-modal-section">
          <div className="edit-worker-modal-section-title">{t('worker.create.connectionParams')}</div>
          <Form.Input
            field="username"
            label={t('worker.create.fields.account')}
            trigger="blur"
            rules={[
              { required: true, message: t('worker.create.validation.accountRequired') },
              { min: 2, message: t('worker.create.validation.accountLengthError') },
              { max: 100, message: t('worker.create.validation.accountLengthError') },
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
            <Form.RadioGroup 
              field="enableAutoUnlock"
              label={t('worker.edit.fields.unlockScreen')}
            >
              <Radio value={true}>{t('common.yes')}</Radio>
              <Radio value={false}>{t('common.no')}</Radio>
            </Form.RadioGroup>
          )}
          {desktopType === 'NotConsole' && (
            <Form.Select
              field="displaySize"
              label={t('worker.detail.fields.resolution')}
              className="edit-worker-modal-select-full"
              optionList={[
                { value: '1024x768', label: '1024x768' },
                { value: '1280x720', label: '1280x720 (HD)' },
                { value: '1280x800', label: '1280x800' },
                { value: '1366x768', label: '1366x768' },
                { value: '1440x900', label: '1440x900' },
                { value: '1600x900', label: '1600x900' },
                { value: '1680x1050', label: '1680x1050' },
                { value: '1920x1080', label: '1920x1080 (Full HD)' },
                { value: '1920x1200', label: '1920x1200' },
                { value: '2560x1440', label: '2560x1440 (2K)' },
                { value: '3840x2160', label: '3840x2160 (4K)' },
              ]}
            />
          )}
          <Form.RadioGroup 
            field="forceLogin"
            label={t('worker.detail.fields.forceLogin')}
          >
            <Radio value={true}>{t('common.yes')}</Radio>
            <Radio value={false}>{t('common.no')}</Radio>
          </Form.RadioGroup>
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
