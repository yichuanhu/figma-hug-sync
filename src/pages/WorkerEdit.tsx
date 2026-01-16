import { useState, useEffect } from 'react';
import { Breadcrumb, Typography, Input, TextArea, Select, RadioGroup, Radio, Button, Card, Toast, Modal, Spin } from '@douyinfe/semi-ui';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';

const { Title, Text } = Typography;

const WorkerEdit = () => {
  const navigate = useNavigate();
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
      Toast.error('必填字段不能为空');
      return;
    }
    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubmitting(false);
    Toast.success('保存成功');
    navigate('/worker-management');
  };

  if (loading) {
    return <AppLayout><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}><Spin size="large" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px', minHeight: '100%' }}>
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>首页</Breadcrumb.Item>
          <Breadcrumb.Item>开发中心</Breadcrumb.Item>
          <Breadcrumb.Item onClick={() => navigate('/worker-management')} style={{ cursor: 'pointer' }}>流程机器人管理</Breadcrumb.Item>
          <Breadcrumb.Item>编辑流程机器人</Breadcrumb.Item>
        </Breadcrumb>
        <div style={{ marginBottom: 24 }}>
          <Title heading={3} style={{ marginBottom: 8 }}>编辑流程机器人</Title>
          <Text type="tertiary">修改流程机器人的配置信息</Text>
        </div>
        <div style={{ maxWidth: 720 }}>
          <Card title="基本信息" style={{ marginBottom: 24 }}>
            <div style={{ padding: '0 16px' }}>
              <div style={{ marginBottom: 16 }}><Text strong style={{ display: 'block', marginBottom: 8 }}>流程机器人名称 *</Text><Input value={name} onChange={setName} showClear /></div>
              <div style={{ marginBottom: 16 }}><Text strong style={{ display: 'block', marginBottom: 8 }}>描述</Text><TextArea value={description} onChange={setDescription} rows={3} maxCount={500} /></div>
              <div style={{ marginBottom: 16 }}><Text strong style={{ display: 'block', marginBottom: 8 }}>任务调度优先级</Text><Select value={priority} onChange={(v) => setPriority(v as string)} style={{ width: '100%' }}><Select.Option value="HIGH">🔥 高</Select.Option><Select.Option value="MEDIUM">● 中</Select.Option><Select.Option value="LOW">○ 低</Select.Option></Select></div>
              <div style={{ marginBottom: 16 }}><Text strong style={{ display: 'block', marginBottom: 8 }}>是否接收任务</Text><RadioGroup value={receiveTasks} onChange={(e) => setReceiveTasks(e.target.value)}><Radio value={true}>是</Radio><Radio value={false}>否</Radio></RadioGroup></div>
            </div>
          </Card>
          <Card title="运行环境配置" style={{ marginBottom: 24 }}>
            <div style={{ padding: '0 16px' }}>
              <div style={{ marginBottom: 16 }}><Text strong style={{ display: 'block', marginBottom: 8 }}>桌面类型 *</Text><RadioGroup value={desktopType} onChange={(e) => setDesktopType(e.target.value)}><Radio value="Console">本地桌面型</Radio><Radio value="NotConsole">远程桌面型</Radio></RadioGroup></div>
            </div>
          </Card>
          <Card title="连接参数" style={{ marginBottom: 24 }}>
            <div style={{ padding: '0 16px' }}>
              <div style={{ marginBottom: 16 }}><Text strong style={{ display: 'block', marginBottom: 8 }}>帐户 *</Text><Input value={username} onChange={setUsername} showClear /></div>
              <div style={{ marginBottom: 16 }}><Text strong style={{ display: 'block', marginBottom: 8 }}>密码</Text><Input mode="password" placeholder="留空则不修改" value={password} onChange={setPassword} /></div>
              {desktopType === 'Console' && <div style={{ marginBottom: 16 }}><Text strong style={{ display: 'block', marginBottom: 8 }}>解锁屏幕</Text><RadioGroup value={enableAutoUnlock} onChange={(e) => setEnableAutoUnlock(e.target.value)}><Radio value={true}>是</Radio><Radio value={false}>否</Radio></RadioGroup></div>}
              {desktopType === 'NotConsole' && <div style={{ marginBottom: 16 }}><Text strong style={{ display: 'block', marginBottom: 8 }}>分辨率</Text><Input value={displaySize} onChange={setDisplaySize} showClear /></div>}
              <div style={{ marginBottom: 16 }}><Text strong style={{ display: 'block', marginBottom: 8 }}>强制挤占登录</Text><RadioGroup value={forceLogin} onChange={(e) => setForceLogin(e.target.value)}><Radio value={true}>是</Radio><Radio value={false}>否</Radio></RadioGroup></div>
            </div>
          </Card>
          <div style={{ display: 'flex', gap: 12, paddingBottom: 24 }}>
            <Button onClick={() => navigate('/worker-management')}>取消</Button>
            <Button theme="solid" type="primary" onClick={handleSubmit} loading={submitting}>保存</Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default WorkerEdit;
