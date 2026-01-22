import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Modal, 
  Form, 
  Toast, 
  Button, 
  Checkbox,
  Radio,
  Select,
  Banner,
} from '@douyinfe/semi-ui';
import type { LYWorkerResponse } from '@/api';
import './index.less';

interface CreateWorkerModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: (workerData: LYWorkerResponse) => void;
}

// 生成UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Mock已有机器人列表（包含桌面类型信息）
const existingWorkers: Array<{ id: string; name: string; desktop_type: 'Console' | 'NotConsole' }> = [
  { id: '1', name: '财务机器人-01', desktop_type: 'Console' },
  { id: '2', name: '财务机器人-02', desktop_type: 'NotConsole' },
  { id: '3', name: '人力机器人-01', desktop_type: 'NotConsole' },
];

// 已存在的机器人名称（用于唯一性校验）
const existingWorkerNames = ['财务机器人-01', '财务机器人-02', '财务机器人-03', '人力机器人-01', '运维机器人-01', '测试机器人-01'];

const CreateWorkerModal = ({ visible, onCancel, onSuccess }: CreateWorkerModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [useSameDevice, setUseSameDevice] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | undefined>(undefined);
  const [desktopType, setDesktopType] = useState<string>('Console');
  const [isLocalDesktopDisabled, setIsLocalDesktopDisabled] = useState(false);

  // 当选择的已有机器人变化时，检查其桌面类型
  useEffect(() => {
    if (useSameDevice && selectedWorkerId) {
      const selectedWorker = existingWorkers.find(w => w.id === selectedWorkerId);
      if (selectedWorker?.desktop_type === 'Console') {
        // 已有机器人是本地桌面型，当前只能选择远程桌面型
        setIsLocalDesktopDisabled(true);
        setDesktopType('NotConsole');
      } else {
        setIsLocalDesktopDisabled(false);
      }
    } else {
      setIsLocalDesktopDisabled(false);
    }
  }, [useSameDevice, selectedWorkerId]);

  // 当取消勾选"同一机器"时重置状态
  useEffect(() => {
    if (!useSameDevice) {
      setSelectedWorkerId(undefined);
      setIsLocalDesktopDisabled(false);
    }
  }, [useSameDevice]);

  // 名称唯一性校验
  const validateWorkerNameUnique = (rule: unknown, value: string, callback: (error?: string) => void) => {
    if (value && existingWorkerNames.includes(value.trim())) {
      callback(t('worker.create.validation.nameExists'));
      return false;
    }
    callback();
    return true;
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      // 模拟API调用延迟
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 生成Mock响应
      const now = new Date().toISOString();
      const mockResponse: LYWorkerResponse = {
        id: generateUUID(),
        name: values.name as string,
        description: (values.description as string) || null,
        status: 'OFFLINE',
        sync_status: 'PENDING',
        ip_address: '0.0.0.0',
        priority: 'MEDIUM',
        client_version: '-',
        last_heartbeat_time: '-',
        receive_tasks: true,
        username: values.username as string,
        desktop_type: desktopType as 'Console' | 'NotConsole',
        enable_auto_unlock: desktopType === 'Console' ? (values.enableAutoUnlock as boolean) : undefined,
        display_size: desktopType === 'NotConsole' ? (values.displaySize as string) : undefined,
        force_login: values.forceLogin as boolean,
        device_token: generateUUID(),
        machine_code: '-',
        host_name: '-',
        os: '-',
        arch: '-',
        cpu_model: '-',
        cpu_cores: 0,
        memory_capacity: '-',
        robot_count: 1,
        created_at: now,
        creator_id: 'current_user',
      };

      Toast.success(t('worker.create.success'));
      onCancel();
      onSuccess?.(mockResponse);
    } catch (error) {
      console.error('创建机器人失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('worker.create.title')}
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
        className="create-worker-modal-form"
        initValues={{
          enableAutoUnlock: true,
          forceLogin: false,
          displaySize: '1920x1080',
        }}
      >
        <div className="create-worker-modal-content">
          <div className="create-worker-modal-section">
            <div className="create-worker-modal-section-title">{t('worker.create.basicInfo')}</div>
            <Form.Input
              field="name"
              label={t('worker.detail.fields.workerName')}
              placeholder={t('worker.create.fields.workerNamePlaceholder')}
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

          <div className="create-worker-modal-section">
            <div className="create-worker-modal-section-title">{t('worker.create.runtimeConfig')}</div>
            <div className="create-worker-modal-field">
              <Checkbox 
                checked={useSameDevice} 
                onChange={(e) => setUseSameDevice(e.target.checked)}
              >
                {t('worker.create.fields.useSameDevice')}
              </Checkbox>
            </div>
            {useSameDevice && (
              <Form.Select
                field="existingWorkerId"
                label={t('worker.create.fields.selectWorker')}
                placeholder={t('worker.create.fields.selectWorker')}
                className="create-worker-modal-select-full"
                onChange={(value) => setSelectedWorkerId(value as string)}
              >
                {existingWorkers.map((w) => (
                  <Select.Option key={w.id} value={w.id}>
                    {w.name}
                  </Select.Option>
                ))}
              </Form.Select>
            )}
            {isLocalDesktopDisabled && (
              <Banner
                type="info"
                description={t('worker.create.validation.localDesktopLimitTip')}
                className="create-worker-modal-banner"
              />
            )}
            <div className="create-worker-modal-field">
              <div className="semi-form-field-label-text">{t('worker.create.fields.desktopType')}</div>
              <Radio.Group
                value={desktopType}
                onChange={(e) => {
                  if (!isLocalDesktopDisabled || e.target.value !== 'Console') {
                    setDesktopType(e.target.value);
                  }
                }}
              >
                <Radio value="Console" disabled={isLocalDesktopDisabled}>
                  {t('worker.create.fields.localDesktop')}
                </Radio>
                <Radio value="NotConsole">{t('worker.create.fields.remoteDesktop')}</Radio>
              </Radio.Group>
            </div>
          </div>

          <div className="create-worker-modal-section">
            <div className="create-worker-modal-section-title">{t('worker.create.connectionParams')}</div>
            <Form.Input
              field="username"
              label={t('worker.create.fields.account')}
              placeholder={t('worker.create.fields.accountPlaceholder')}
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
              placeholder={t('worker.create.fields.passwordPlaceholder')}
              mode="password"
            />
            {desktopType === 'Console' && (
              <Form.RadioGroup 
                field="enableAutoUnlock"
                label={t('worker.create.fields.unlockScreen')}
              >
                <Radio value={true}>{t('common.yes')}</Radio>
                <Radio value={false}>{t('common.no')}</Radio>
              </Form.RadioGroup>
            )}
            {desktopType === 'NotConsole' && (
              <Form.Select
                field="displaySize"
                label={t('worker.detail.fields.resolution')}
                placeholder={t('worker.create.fields.resolutionPlaceholder')}
                className="create-worker-modal-select-full"
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
            >
              <Radio value={true}>{t('common.yes')}</Radio>
              <Radio value={false}>{t('common.no')}</Radio>
            </Form.RadioGroup>
          </div>
        </div>

        <div className="create-worker-modal-footer">
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

export default CreateWorkerModal;
