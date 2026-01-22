import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Modal, 
  Form, 
  Toast, 
  Button, 
  Checkbox,
  RadioGroup,
  Radio,
  Select,
} from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
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

// Mock已有机器人列表
const existingWorkers = [
  { id: '1', name: '财务机器人-01' },
  { id: '2', name: '财务机器人-02' },
  { id: '3', name: '人力机器人-01' },
];

// 已存在的机器人名称（用于唯一性校验）
const existingWorkerNames = ['财务机器人-01', '财务机器人-02', '财务机器人-03', '人力机器人-01', '运维机器人-01', '测试机器人-01'];

const CreateWorkerModal = ({ visible, onCancel, onSuccess }: CreateWorkerModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [useSameDevice, setUseSameDevice] = useState(false);
  const [desktopType, setDesktopType] = useState<string>('Console');
  const formApiRef = useRef<FormApi>();

  // 名称唯一性校验
  const validateWorkerNameUnique = (rule: unknown, value: string, callback: (error?: string) => void) => {
    if (value && existingWorkerNames.includes(value.trim())) {
      callback(t('worker.create.validation.nameExists'));
      return false;
    }
    callback();
    return true;
  };

  const handleSubmit = async () => {
    if (!formApiRef.current) return;
    
    try {
      const values = await formApiRef.current.validate();
      
      setLoading(true);
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

  const handleFormMount = (formApi: FormApi) => {
    formApiRef.current = formApi;
  };

  return (
    <Modal
      title={t('worker.create.title')}
      visible={visible}
      onCancel={onCancel}
      footer={
        <div className="create-worker-modal-footer">
          <Button theme="light" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button theme="solid" type="primary" onClick={handleSubmit} loading={loading}>
            {t('common.create')}
          </Button>
        </div>
      }
      width={520}
      closeOnEsc
      maskClosable={false}
      bodyStyle={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto', padding: '12px 24px' }}
    >
      <Form 
        getFormApi={handleFormMount}
        labelPosition="top" 
        className="create-worker-modal-form"
        initValues={{
          enableAutoUnlock: true,
          forceLogin: false,
          displaySize: '1920x1080',
        }}
      >
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
            >
              {existingWorkers.map((w) => (
                <Select.Option key={w.id} value={w.id}>
                  {w.name}
                </Select.Option>
              ))}
            </Form.Select>
          )}
          <div className="create-worker-modal-field">
            <Form.Label>{t('worker.create.fields.desktopType')}</Form.Label>
            <RadioGroup value={desktopType} onChange={(e) => setDesktopType(e.target.value)}>
              <Radio value="Console">{t('worker.create.fields.localDesktop')}</Radio>
              <Radio value="NotConsole">{t('worker.create.fields.remoteDesktop')}</Radio>
            </RadioGroup>
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
            <div className="create-worker-modal-field">
              <Form.Label>{t('worker.create.fields.unlockScreen')}</Form.Label>
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
              placeholder={t('worker.create.fields.resolutionPlaceholder')}
              showClear
            />
          )}
          <div className="create-worker-modal-field">
            <Form.Label>{t('worker.create.fields.forceLogin')}</Form.Label>
            <Form.RadioGroup field="forceLogin">
              <Radio value={true}>{t('common.yes')}</Radio>
              <Radio value={false}>{t('common.no')}</Radio>
            </Form.RadioGroup>
          </div>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateWorkerModal;
