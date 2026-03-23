import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Modal, 
  Form, 
  Toast, 
  Button,
  Radio,
  Banner,
} from '@douyinfe/semi-ui';
import type { LYWorkerResponse } from '@/api';
import './index.less';

interface EditWorkerModalProps {
  visible: boolean;
  onCancel: () => void;
  workerData: LYWorkerResponse | null;
  onSuccess?: (updatedData: LYWorkerResponse) => void;
}

// Already存在's botName(用于唯Mon性校验)
const existingWorkerNames = ['Finance Bot-01', 'Finance Bot-02', 'Finance Bot-03', 'HR Bot-01', 'Ops Bot-01', '测试bot-01'];

const EditWorkerModal = ({ visible, onCancel, workerData, onSuccess }: EditWorkerModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [desktopType, setDesktopType] = useState<string>('Console');
  const [configChanged, setConfigChanged] = useState(false);

  const originalConfig = useMemo(() => ({
    desktopType: workerData?.desktop_type || 'Console',
    username: workerData?.username || '',
    enableAutoUnlock: workerData?.enable_auto_unlock ?? true,
    displaySize: workerData?.display_size || '1920x1080',
    forceLogin: workerData?.force_login ?? false,
  }), [workerData]);

  const checkConfigChanged = (field: string, value: unknown) => {
    const key = field as keyof typeof originalConfig;
    if (key in originalConfig && originalConfig[key] !== value) {
      setConfigChanged(true);
    }
  };

  useEffect(() => {
    if (visible && workerData) {
      setDesktopType(workerData.desktop_type || 'Console');
      setConfigChanged(false);
    }
  }, [visible, workerData]);

  // Name唯Mon性校验(排除当前Edit's bot)
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

  // 检测ConnectionInfo是否发生变更
  const isConnectionChanged = (values: Record<string, unknown>): boolean => {
    const password = values.password as string;
    if (password && password.trim() !== '') return true;
    if ((values.username as string) !== (workerData?.username || '')) return true;
    if (desktopType !== (workerData?.desktop_type || 'Console')) return true;
    if (desktopType === 'Console') {
      if ((values.enableAutoUnlock as boolean) !== (workerData?.enable_auto_unlock ?? true)) return true;
    }
    if (desktopType === 'NotConsole') {
      if ((values.displaySize as string) !== (workerData?.display_size || '1920x1080')) return true;
    }
    if ((values.forceLogin as boolean) !== (workerData?.force_login ?? false)) return true;
    return false;
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!workerData?.id) return;

    setLoading(true);
    try {
      // 模拟API调用延迟
      await new Promise((resolve) => setTimeout(resolve, 300));

      const connectionChanged = isConnectionChanged(values);

      // generationMock响应
      const updatedWorker: LYWorkerResponse = {
        ...workerData,
        name: values.name as string,
        description: (values.description as string) || null,
        desktop_type: desktopType as 'Console' | 'NotConsole',
        username: values.username as string,
        enable_auto_unlock: desktopType === 'Console' ? (values.enableAutoUnlock as boolean) : undefined,
        display_size: desktopType === 'NotConsole' ? (values.displaySize as string) : undefined,
        force_login: values.forceLogin as boolean,
        // ConnectionInfo变更时, 将密码同步StatusSettings为"待同步"
        password_sync_status: connectionChanged ? 'PENDING' : workerData.password_sync_status,
        // ConnectionInfo变更时, 将同步StatusSettings为"待同步"
        sync_status: connectionChanged ? 'PENDING' : workerData.sync_status,
      };

      Toast.success(t('worker.edit.success'));
      onSuccess?.(updatedWorker);
      onCancel();
    } catch (error) {
      console.error('Failed to update robot:', error);
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
        <div className="edit-worker-modal-content">
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
              maxCount={2000}
              rules={[
                { max: 2000, message: t('worker.create.validation.descriptionLengthError') },
              ]}
            />
          </div>

          <div className="edit-worker-modal-section">
            <div className="edit-worker-modal-section-title">{t('worker.create.runtimeConfig')}</div>
            <Form.RadioGroup
              field="desktopType"
              label={t('worker.create.fields.desktopType')}
              initValue={workerData.desktop_type || 'Console'}
              onChange={(e) => {
                setDesktopType(e.target.value);
                checkConfigChanged('desktopType', e.target.value);
              }}
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
              onChange={(value) => checkConfigChanged('username', value)}
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
                label={t('worker.create.fields.unlockScreen')}
                onChange={(e) => checkConfigChanged('enableAutoUnlock', e.target.value)}
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
                onChange={(value) => checkConfigChanged('displaySize', value)}
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
              label={t('worker.create.fields.forceLogin')}
              onChange={(e) => checkConfigChanged('forceLogin', e.target.value)}
            >
              <Radio value={true}>{t('common.yes')}</Radio>
              <Radio value={false}>{t('common.no')}</Radio>
            </Form.RadioGroup>
          </div>
        </div>

        {configChanged && (
          <Banner
            type="warning"
            description={t('worker.edit.configChangeWarning')}
            className="edit-worker-modal-banner"
          />
        )}

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
