import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  Typography,
  Input,
  TextArea,
  Select,
  RadioGroup,
  Radio,
  Button,
  Card,
  Toast,
  Spin,
} from '@douyinfe/semi-ui';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import './index.less';

const { Title, Text } = Typography;

const WorkerEdit = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [receiveTasks, setReceiveTasks] = useState(true);
  const [desktopType, setDesktopType] = useState<string>('Console');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [enableAutoUnlock, setEnableAutoUnlock] = useState(true);
  const [displaySize, setDisplaySize] = useState('1920x1080');
  const [forceLogin, setForceLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setName('财务机器人-01');
      setDescription('用于财务流程自动化的机器人');
      setPriority('HIGH');
      setUsername('DOMAIN\\robot01');
      setLoading(false);
    }, 500);
  }, [id]);

  const handleSubmit = async () => {
    if (!name.trim() || !username.trim()) {
      Toast.error(t('worker.create.validation.requiredEmpty'));
      return;
    }
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitting(false);
    Toast.success(t('worker.edit.success'));
    navigate('/worker-management');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="worker-edit-loading">
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="worker-edit">
        <Breadcrumb className="worker-edit-breadcrumb">
          <Breadcrumb.Item onClick={() => navigate('/')} className="worker-edit-breadcrumb-clickable">
            {t('common.home')}
          </Breadcrumb.Item>
          <Breadcrumb.Item>{t('worker.breadcrumb.developmentCenter')}</Breadcrumb.Item>
          <Breadcrumb.Item onClick={() => navigate('/worker-management')} className="worker-edit-breadcrumb-clickable">
            {t('worker.breadcrumb.workerManagement')}
          </Breadcrumb.Item>
          <Breadcrumb.Item>{t('worker.edit.title')}</Breadcrumb.Item>
        </Breadcrumb>

        <div className="worker-edit-header">
          <Title heading={3} className="worker-edit-title">
            {t('worker.edit.title')}
          </Title>
          <Text type="tertiary">{t('worker.edit.description')}</Text>
        </div>

        <div className="worker-edit-content">
          <Card title={t('worker.create.basicInfo')} className="worker-edit-card">
            <div className="worker-edit-card-content">
              <div className="worker-edit-field">
                <Text strong className="worker-edit-label">
                  {t('worker.create.fields.workerName')} *
                </Text>
                <Input value={name} onChange={setName} showClear />
              </div>
              <div className="worker-edit-field">
                <Text strong className="worker-edit-label">
                  {t('common.description')}
                </Text>
                <TextArea value={description} onChange={setDescription} rows={3} maxCount={500} />
              </div>
              <div className="worker-edit-field">
                <Text strong className="worker-edit-label">
                  {t('worker.create.fields.priority')}
                </Text>
                <Select value={priority} onChange={(v) => setPriority(v as string)} className="worker-edit-select">
                  <Select.Option value="HIGH">🔥 {t('worker.priority.high')}</Select.Option>
                  <Select.Option value="MEDIUM">● {t('worker.priority.medium')}</Select.Option>
                  <Select.Option value="LOW">○ {t('worker.priority.low')}</Select.Option>
                </Select>
              </div>
              <div className="worker-edit-field">
                <Text strong className="worker-edit-label">
                  {t('worker.edit.fields.receiveTasks')}
                </Text>
                <RadioGroup value={receiveTasks} onChange={(e) => setReceiveTasks(e.target.value)}>
                  <Radio value={true}>{t('common.yes')}</Radio>
                  <Radio value={false}>{t('common.no')}</Radio>
                </RadioGroup>
              </div>
            </div>
          </Card>

          <Card title={t('worker.create.runtimeConfig')} className="worker-edit-card">
            <div className="worker-edit-card-content">
              <div className="worker-edit-field">
                <Text strong className="worker-edit-label">
                  {t('worker.create.fields.desktopType')} *
                </Text>
                <RadioGroup value={desktopType} onChange={(e) => setDesktopType(e.target.value)}>
                  <Radio value="Console">{t('worker.create.fields.localDesktop')}</Radio>
                  <Radio value="NotConsole">{t('worker.create.fields.remoteDesktop')}</Radio>
                </RadioGroup>
              </div>
            </div>
          </Card>

          <Card title={t('worker.create.connectionParams')} className="worker-edit-card">
            <div className="worker-edit-card-content">
              <div className="worker-edit-field">
                <Text strong className="worker-edit-label">
                  {t('worker.create.fields.account')} *
                </Text>
                <Input value={username} onChange={setUsername} showClear />
              </div>
              <div className="worker-edit-field">
                <Text strong className="worker-edit-label">
                  {t('worker.create.fields.password')}
                </Text>
                <Input
                  mode="password"
                  placeholder={t('worker.edit.fields.passwordPlaceholder')}
                  value={password}
                  onChange={setPassword}
                />
              </div>
              {desktopType === 'Console' && (
                <div className="worker-edit-field">
                  <Text strong className="worker-edit-label">
                    {t('worker.edit.fields.unlockScreen')}
                  </Text>
                  <RadioGroup value={enableAutoUnlock} onChange={(e) => setEnableAutoUnlock(e.target.value)}>
                    <Radio value={true}>{t('common.yes')}</Radio>
                    <Radio value={false}>{t('common.no')}</Radio>
                  </RadioGroup>
                </div>
              )}
              {desktopType === 'NotConsole' && (
                <div className="worker-edit-field">
                  <Text strong className="worker-edit-label">
                    {t('worker.create.fields.resolution')}
                  </Text>
                  <Input value={displaySize} onChange={setDisplaySize} showClear />
                </div>
              )}
              <div className="worker-edit-field">
                <Text strong className="worker-edit-label">
                  {t('worker.detail.fields.forceLogin')}
                </Text>
                <RadioGroup value={forceLogin} onChange={(e) => setForceLogin(e.target.value)}>
                  <Radio value={true}>{t('common.yes')}</Radio>
                  <Radio value={false}>{t('common.no')}</Radio>
                </RadioGroup>
              </div>
            </div>
          </Card>

          <div className="worker-edit-footer">
            <Button onClick={() => navigate('/worker-management')}>{t('common.cancel')}</Button>
            <Button theme="solid" type="primary" onClick={handleSubmit} loading={submitting}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default WorkerEdit;
