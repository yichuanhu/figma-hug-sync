import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  Typography,
  Input,
  TextArea,
  Select,
  RadioGroup,
  Radio,
  Checkbox,
  Button,
  Card,
  Toast,
  Modal,
} from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import './index.less';

const { Title, Text } = Typography;

// Mock已有机器人列表
const existingWorkers = [
  { id: '1', name: '财务机器人-01' },
  { id: '2', name: '财务机器人-02' },
  { id: '3', name: '人力机器人-01' },
];

const WorkerCreate = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [useSameDevice, setUseSameDevice] = useState(false);
  const [existingWorkerId, setExistingWorkerId] = useState<string>();
  const [desktopType, setDesktopType] = useState<string>('Console');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [enableAutoUnlock, setEnableAutoUnlock] = useState(true);
  const [displaySize, setDisplaySize] = useState('1920x1080');
  const [forceLogin, setForceLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Toast.error(t('worker.create.validation.nameRequired'));
      return;
    }
    if (!username.trim()) {
      Toast.error(t('worker.create.validation.accountRequired'));
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitting(false);

    Toast.success(t('worker.create.success'));
    navigate('/scheduling-center/resource-monitoring/worker-management');
  };

  const handleCancel = () => {
    if (name || description || username) {
      Modal.confirm({
        title: t('worker.create.cancelConfirm.title'),
        content: t('worker.create.cancelConfirm.content'),
        onOk: () => navigate('/scheduling-center/resource-monitoring/worker-management'),
      });
    } else {
      navigate('/scheduling-center/resource-monitoring/worker-management');
    }
  };

  return (
    <AppLayout>
      <div className="worker-create">
        <Breadcrumb className="worker-create-breadcrumb">
          <Breadcrumb.Item onClick={() => navigate('/')} className="worker-create-breadcrumb-clickable">
            {t('common.home')}
          </Breadcrumb.Item>
          <Breadcrumb.Item>{t('worker.breadcrumb.schedulingCenter')}</Breadcrumb.Item>
          <Breadcrumb.Item>{t('worker.breadcrumb.executionResourceMonitoring')}</Breadcrumb.Item>
          <Breadcrumb.Item onClick={() => navigate('/scheduling-center/resource-monitoring/worker-management')} className="worker-create-breadcrumb-clickable">
            {t('worker.breadcrumb.workerManagement')}
          </Breadcrumb.Item>
          <Breadcrumb.Item>{t('worker.create.title')}</Breadcrumb.Item>
        </Breadcrumb>

        <div className="worker-create-header">
          <Title heading={3} className="worker-create-title">
            {t('worker.create.title')}
          </Title>
          <Text type="tertiary">{t('worker.create.description')}</Text>
        </div>

        <div className="worker-create-content">
          <Card title={t('worker.create.basicInfo')} className="worker-create-card">
            <div className="worker-create-card-content">
              <div className="worker-create-field">
                <Text strong className="worker-create-label">
                  {t('worker.create.fields.workerName')} *
                </Text>
                <Input
                  placeholder={t('worker.create.fields.workerNamePlaceholder')}
                  value={name}
                  onChange={setName}
                  showClear
                />
              </div>
              <div className="worker-create-field">
                <Text strong className="worker-create-label">
                  {t('common.description')}
                </Text>
                <TextArea
                  placeholder={t('worker.create.fields.descriptionPlaceholder')}
                  value={description}
                  onChange={setDescription}
                  rows={3}
                  maxCount={500}
                />
              </div>
              <div className="worker-create-field">
                <Text strong className="worker-create-label">
                  {t('worker.create.fields.priority')}
                </Text>
                <Select value={priority} onChange={(v) => setPriority(v as string)} className="worker-create-select">
                  <Select.Option value="HIGH">🔥 {t('worker.priority.high')}</Select.Option>
                  <Select.Option value="MEDIUM">● {t('worker.priority.medium')}</Select.Option>
                  <Select.Option value="LOW">○ {t('worker.priority.low')}</Select.Option>
                </Select>
              </div>
            </div>
          </Card>

          <Card title={t('worker.create.runtimeConfig')} className="worker-create-card">
            <div className="worker-create-card-content">
              <div className="worker-create-field">
                <Checkbox checked={useSameDevice} onChange={(e) => setUseSameDevice(e.target.checked)}>
                  {t('worker.create.fields.useSameDevice')}
                </Checkbox>
              </div>
              {useSameDevice && (
                <div className="worker-create-field">
                  <Text strong className="worker-create-label">
                    {t('worker.create.fields.selectWorker')}
                  </Text>
                  <Select
                    value={existingWorkerId}
                    onChange={(v) => setExistingWorkerId(v as string)}
                    className="worker-create-select"
                    placeholder={t('createProcess.fields.relatedRequirementPlaceholder')}
                  >
                    {existingWorkers.map((w) => (
                      <Select.Option key={w.id} value={w.id}>
                        {w.name}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              )}
              <div className="worker-create-field">
                <Text strong className="worker-create-label">
                  {t('worker.create.fields.desktopType')} *
                </Text>
                <RadioGroup value={desktopType} onChange={(e) => setDesktopType(e.target.value)}>
                  <Radio value="Console">{t('worker.create.fields.localDesktop')}</Radio>
                  <Radio value="NotConsole">{t('worker.create.fields.remoteDesktop')}</Radio>
                </RadioGroup>
              </div>
            </div>
          </Card>

          <Card title={t('worker.create.connectionParams')} className="worker-create-card">
            <div className="worker-create-card-content">
              <div className="worker-create-field">
                <Text strong className="worker-create-label">
                  {t('worker.create.fields.account')} *
                </Text>
                <Input
                  placeholder={t('worker.create.fields.accountPlaceholder')}
                  value={username}
                  onChange={setUsername}
                  showClear
                />
              </div>
              <div className="worker-create-field">
                <Text strong className="worker-create-label">
                  {t('worker.create.fields.password')}
                </Text>
                <Input
                  mode="password"
                  placeholder={t('worker.create.fields.passwordPlaceholder')}
                  value={password}
                  onChange={setPassword}
                />
              </div>
              {desktopType === 'Console' && (
                <div className="worker-create-field">
                  <Text strong className="worker-create-label">
                    {t('worker.create.fields.unlockScreen')}
                  </Text>
                  <RadioGroup value={enableAutoUnlock} onChange={(e) => setEnableAutoUnlock(e.target.value)}>
                    <Radio value={true}>{t('common.yes')}</Radio>
                    <Radio value={false}>{t('common.no')}</Radio>
                  </RadioGroup>
                </div>
              )}
              {desktopType === 'NotConsole' && (
                <div className="worker-create-field">
                  <Text strong className="worker-create-label">
                    {t('worker.create.fields.resolution')}
                  </Text>
                  <Input
                    placeholder={t('worker.create.fields.resolutionPlaceholder')}
                    value={displaySize}
                    onChange={setDisplaySize}
                    showClear
                  />
                </div>
              )}
              <div className="worker-create-field">
                <Text strong className="worker-create-label">
                  {t('worker.create.fields.forceLogin')}
                </Text>
                <RadioGroup value={forceLogin} onChange={(e) => setForceLogin(e.target.value)}>
                  <Radio value={true}>{t('common.yes')}</Radio>
                  <Radio value={false}>{t('common.no')}</Radio>
                </RadioGroup>
              </div>
            </div>
          </Card>

          <div className="worker-create-footer">
            <Button onClick={handleCancel}>{t('common.cancel')}</Button>
            <Button theme="solid" type="primary" onClick={handleSubmit} loading={submitting}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default WorkerCreate;
