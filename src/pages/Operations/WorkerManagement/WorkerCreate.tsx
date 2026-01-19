import { useState } from 'react';
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
  Modal
} from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';

const { Title, Text } = Typography;

// Mock已有机器人列表
const existingWorkers = [
  { id: '1', name: '财务机器人-01' },
  { id: '2', name: '财务机器人-02' },
  { id: '3', name: '人力机器人-01' },
];

const WorkerCreate = () => {
  const navigate = useNavigate();
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
      Toast.error('流程机器人名称不能为空');
      return;
    }
    if (!username.trim()) {
      Toast.error('帐户不能为空');
      return;
    }

    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubmitting(false);
    
    Toast.success('创建成功');
    navigate('/worker-management');
  };

  const handleCancel = () => {
    if (name || description || username) {
      Modal.confirm({
        title: '确认取消',
        content: '确认取消新建机器人吗？已填写的信息将丢失。',
        onOk: () => navigate('/worker-management'),
      });
    } else {
      navigate('/worker-management');
    }
  };

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px', minHeight: '100%' }}>
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>首页</Breadcrumb.Item>
          <Breadcrumb.Item>开发中心</Breadcrumb.Item>
          <Breadcrumb.Item onClick={() => navigate('/worker-management')} style={{ cursor: 'pointer' }}>流程机器人管理</Breadcrumb.Item>
          <Breadcrumb.Item>新建流程机器人</Breadcrumb.Item>
        </Breadcrumb>

        <div style={{ marginBottom: 24 }}>
          <Title heading={3} style={{ marginBottom: 8 }}>新建流程机器人</Title>
          <Text type="tertiary">配置流程机器人的基本信息和运行环境参数</Text>
        </div>

        <div style={{ maxWidth: 720 }}>
          <Card title="基本信息" style={{ marginBottom: 24 }}>
            <div style={{ padding: '0 16px' }}>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>流程机器人名称 *</Text>
                <Input placeholder="请输入流程机器人名称" value={name} onChange={setName} showClear />
              </div>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>描述</Text>
                <TextArea placeholder="请输入描述（选填）" value={description} onChange={setDescription} rows={3} maxCount={500} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>任务调度优先级</Text>
                <Select value={priority} onChange={(v) => setPriority(v as string)} style={{ width: '100%' }}>
                  <Select.Option value="HIGH">🔥 高</Select.Option>
                  <Select.Option value="MEDIUM">● 中</Select.Option>
                  <Select.Option value="LOW">○ 低</Select.Option>
                </Select>
              </div>
            </div>
          </Card>

          <Card title="运行环境配置" style={{ marginBottom: 24 }}>
            <div style={{ padding: '0 16px' }}>
              <div style={{ marginBottom: 16 }}>
                <Checkbox checked={useSameDevice} onChange={(e) => setUseSameDevice(e.target.checked)}>
                  和已有流程机器人运行在同一机器上
                </Checkbox>
              </div>
              {useSameDevice && (
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>请选择流程机器人</Text>
                  <Select value={existingWorkerId} onChange={(v) => setExistingWorkerId(v as string)} style={{ width: '100%' }} placeholder="请选择">
                    {existingWorkers.map(w => <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>)}
                  </Select>
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>桌面类型 *</Text>
                <RadioGroup value={desktopType} onChange={(e) => setDesktopType(e.target.value)}>
                  <Radio value="Console">本地桌面型</Radio>
                  <Radio value="NotConsole">远程桌面型</Radio>
                </RadioGroup>
              </div>
            </div>
          </Card>

          <Card title="连接参数" style={{ marginBottom: 24 }}>
            <div style={{ padding: '0 16px' }}>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>帐户 *</Text>
                <Input placeholder="请输入帐户，如 DOMAIN\robot01" value={username} onChange={setUsername} showClear />
              </div>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>密码</Text>
                <Input mode="password" placeholder="请输入密码（选填）" value={password} onChange={setPassword} />
              </div>
              {desktopType === 'Console' && (
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>新建流程机器人时解锁屏幕</Text>
                  <RadioGroup value={enableAutoUnlock} onChange={(e) => setEnableAutoUnlock(e.target.value)}>
                    <Radio value={true}>是</Radio>
                    <Radio value={false}>否</Radio>
                  </RadioGroup>
                </div>
              )}
              {desktopType === 'NotConsole' && (
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>分辨率</Text>
                  <Input placeholder="如 1920x1080" value={displaySize} onChange={setDisplaySize} showClear />
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>帐户已登录时强制重新挤占登录</Text>
                <RadioGroup value={forceLogin} onChange={(e) => setForceLogin(e.target.value)}>
                  <Radio value={true}>是</Radio>
                  <Radio value={false}>否</Radio>
                </RadioGroup>
              </div>
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 12, paddingBottom: 24 }}>
            <Button onClick={handleCancel}>取消</Button>
            <Button theme="solid" type="primary" onClick={handleSubmit} loading={submitting}>保存</Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default WorkerCreate;
