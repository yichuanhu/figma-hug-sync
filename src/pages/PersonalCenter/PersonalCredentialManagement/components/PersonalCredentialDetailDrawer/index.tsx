import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  SideSheet,
  Typography,
  Button,
  Descriptions,
  Tabs,
  TabPane,
  Table,
  Divider,
  Tooltip,
  DatePicker,
  Row,
  Col,
  Space,
  Toast,
  Modal,
  Tag,
  Empty,
} from '@douyinfe/semi-ui';
import {
  IconEditStroked,
  IconDeleteStroked,
  IconMaximize,
  IconMinimize,
  IconClose,
  IconLink,
  IconUnlink,
} from '@douyinfe/semi-icons';
import type { PersonalCredential } from '../../index';

import './index.less';

const { Title, Text } = Typography;

// ============= 关联凭据类型 =============
interface LinkedCredential {
  credential_id: string;
  credential_name: string;
  description: string | null;
  linked_at: string;
}

// ============= 使用记录类型 =============
interface UsageRecord {
  id: string;
  usage_time: string;
  usage_type: 'DEBUG' | 'TASK';
  description: string;
  process_name: string;
  process_version: string;
  processRobot: string;
  task_number: string;
  screenshot: string | null;
}

// ============= Mock数据生成 =============
const generateMockLinkedCredentials = (): LinkedCredential[] => {
  const names = ['ERP系统凭据', 'CRM系统凭据', 'OA系统凭据', '邮件服务凭据', 'API网关凭据'];
  return Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
    credential_id: `cred-${Date.now()}-${i}`,
    credential_name: names[i % names.length],
    description: `这是${names[i % names.length]}的描述信息`,
    linked_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

const generateMockUsageRecords = (): UsageRecord[] => {
  const usageTypes: ('DEBUG' | 'TASK')[] = ['DEBUG', 'TASK'];
  const processes = ['订单处理流程', '数据同步流程', '报表生成流程', '邮件发送流程'];
  return Array.from({ length: 15 }, (_, i) => ({
    id: `usage-${i}`,
    usage_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    usage_type: usageTypes[Math.floor(Math.random() * usageTypes.length)],
    description: `第${i + 1}次使用记录`,
    process_name: processes[Math.floor(Math.random() * processes.length)],
    process_version: `1.0.${Math.floor(Math.random() * 10)}`,
    processRobot: `Robot-${Math.floor(Math.random() * 100)}`,
    task_number: `TASK-${Date.now()}-${i}`,
    screenshot: null,
  }));
};

// ============= 组件Props =============
interface PersonalCredentialDetailDrawerProps {
  visible: boolean;
  credential: PersonalCredential | null;
  onClose: () => void;
  onEdit: (credential: PersonalCredential) => void;
  onDelete: (credential: PersonalCredential) => void;
  onLinkCredential: (credential: PersonalCredential) => void;
  onRefresh: () => void;
}

const PersonalCredentialDetailDrawer = ({
  visible,
  credential,
  onClose,
  onEdit,
  onDelete,
  onLinkCredential,
  onRefresh,
}: PersonalCredentialDetailDrawerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('linkedCredentials');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('personalCredentialDetailDrawerWidth');
    return saved ? Math.max(Number(saved), 576) : 576;
  });

  // 关联凭据数据
  const [linkedCredentials, setLinkedCredentials] = useState<LinkedCredential[]>([]);
  const [linkedCredentialsLoading, setLinkedCredentialsLoading] = useState(false);

  // 使用记录数据
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageDateRange, setUsageDateRange] = useState<[Date, Date] | null>(null);
  const [usagePage, setUsagePage] = useState(1);
  const [usageTotal, setUsageTotal] = useState(0);

  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(drawerWidth);

  // 加载关联凭据
  const loadLinkedCredentials = useCallback(async () => {
    if (!credential) return;
    setLinkedCredentialsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setLinkedCredentials(generateMockLinkedCredentials());
    } catch (error) {
      console.error('加载关联凭据失败:', error);
    } finally {
      setLinkedCredentialsLoading(false);
    }
  }, [credential]);

  // 加载使用记录
  const loadUsageRecords = useCallback(async () => {
    if (!credential) return;
    setUsageLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const records = generateMockUsageRecords();
      setUsageRecords(records);
      setUsageTotal(records.length);
    } catch (error) {
      console.error('加载使用记录失败:', error);
    } finally {
      setUsageLoading(false);
    }
  }, [credential]);

  // 当抽屉可见或凭据变化时加载数据
  useEffect(() => {
    if (visible && credential) {
      loadLinkedCredentials();
      loadUsageRecords();
      setActiveTab('linkedCredentials');
    }
  }, [visible, credential?.credential_id]);

  // 拖拽调整宽度
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = drawerWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        const diff = startX.current - e.clientX;
        setDrawerWidth(Math.min(Math.max(startWidth.current + diff, 576), window.innerWidth - 100));
      };
      const handleMouseUp = () => {
        isResizing.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [drawerWidth],
  );

  useEffect(() => {
    localStorage.setItem('personalCredentialDetailDrawerWidth', String(drawerWidth));
  }, [drawerWidth]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // 解除关联
  const handleUnlink = useCallback((linkedCredential: LinkedCredential) => {
    Modal.confirm({
      title: t('personalCredential.linkedCredentials.unlinkConfirmTitle'),
      content: t('personalCredential.linkedCredentials.unlinkConfirmMessage'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setLinkedCredentials((prev) => prev.filter((c) => c.credential_id !== linkedCredential.credential_id));
        Toast.success(t('personalCredential.linkedCredentials.unlinkSuccess'));
        onRefresh();
      },
    });
  }, [t, onRefresh]);

  // 跳转到凭据详情
  const handleCredentialClick = useCallback((credentialId: string) => {
    navigate(`/dev-center/business-assets/credentials?detail=${credentialId}`);
  }, [navigate]);

  // 删除凭据
  const handleDelete = useCallback(() => {
    if (!credential) return;
    Modal.confirm({
      title: t('personalCredential.deleteModal.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: t('personalCredential.deleteModal.confirmMessage'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        Toast.success(t('personalCredential.deleteModal.success'));
        onDelete(credential);
        onClose();
      },
    });
  }, [credential, t, onDelete, onClose]);

  // 关联凭据表格列
  const linkedCredentialsColumns = useMemo(() => [
    {
      title: t('personalCredential.linkedCredentials.credentialName'),
      dataIndex: 'credential_name',
      key: 'credential_name',
      width: 200,
      render: (text: string, record: LinkedCredential) => (
        <Typography.Text
          link
          onClick={() => handleCredentialClick(record.credential_id)}
          style={{ cursor: 'pointer' }}
        >
          {text}
        </Typography.Text>
      ),
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description',
      render: (text: string | null) => (
        <Tooltip content={text || '-'}>
          <Text ellipsis={{ showTooltip: false }} style={{ maxWidth: 200 }}>
            {text || '-'}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      render: (_: unknown, record: LinkedCredential) => (
        <Button
          icon={<IconUnlink />}
          theme="borderless"
          type="danger"
          size="small"
          onClick={() => handleUnlink(record)}
        >
          {t('personalCredential.linkedCredentials.unlink')}
        </Button>
      ),
    },
  ], [t, handleCredentialClick, handleUnlink]);

  // 使用记录表格列
  const usageColumns = useMemo(() => [
    {
      title: t('personalCredential.usage.usageTime'),
      dataIndex: 'usage_time',
      key: 'usage_time',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: t('personalCredential.usage.usageType'),
      dataIndex: 'usage_type',
      key: 'usage_type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'DEBUG' ? 'blue' : 'green'} type="light">
          {type === 'DEBUG' ? t('personalCredential.usage.typeDebug') : t('personalCredential.usage.typeTask')}
        </Tag>
      ),
    },
    {
      title: t('personalCredential.usage.processName'),
      dataIndex: 'process_name',
      key: 'process_name',
      width: 150,
    },
    {
      title: t('personalCredential.usage.processVersion'),
      dataIndex: 'process_version',
      key: 'process_version',
      width: 100,
    },
  ], [t]);

  // 基本信息描述数据
  const descriptionData = useMemo(() => {
    if (!credential) return [];
    return [
      {
        key: t('personalCredential.table.name'),
        value: credential.credential_name,
      },
      {
        key: t('personalCredential.table.username'),
        value: credential.username,
      },
      {
        key: t('common.description'),
        value: credential.description || '-',
      },
      {
        key: t('common.createTime'),
        value: new Date(credential.created_at).toLocaleString('zh-CN'),
      },
      {
        key: t('common.updateTime'),
        value: new Date(credential.updated_at).toLocaleString('zh-CN'),
      },
    ];
  }, [credential, t]);

  if (!credential) return null;

  return (
    <SideSheet
      visible={visible}
      onCancel={onClose}
      closable={false}
      mask={false}
      width={isFullscreen ? '100%' : drawerWidth}
      className="card-sidesheet personal-credential-detail-drawer"
      headerStyle={{ padding: '12px 16px' }}
      bodyStyle={{ padding: 0 }}
      title={
        <div className="personal-credential-detail-drawer-header">
          <div className="personal-credential-detail-drawer-header-left">
            <Title heading={5} style={{ margin: 0 }}>
              {credential.credential_name}
            </Title>
          </div>
          <div className="personal-credential-detail-drawer-header-right">
            <Space spacing={4}>
              <Tooltip content={t('common.edit')}>
                <Button
                  icon={<IconEditStroked />}
                  theme="borderless"
                  type="tertiary"
                  onClick={() => onEdit(credential)}
                />
              </Tooltip>
              <Tooltip content={t('personalCredential.actions.linkCredential')}>
                <Button
                  icon={<IconLink />}
                  theme="borderless"
                  type="tertiary"
                  onClick={() => onLinkCredential(credential)}
                />
              </Tooltip>
              <Tooltip content={t('common.delete')}>
                <Button
                  icon={<IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />}
                  theme="borderless"
                  type="tertiary"
                  onClick={handleDelete}
                />
              </Tooltip>
            </Space>
            <Divider layout="vertical" style={{ margin: '0 8px 0 4px', height: 16 }} />
            <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
              <Button
                icon={isFullscreen ? <IconMinimize /> : <IconMaximize />}
                theme="borderless"
                type="tertiary"
                onClick={toggleFullscreen}
              />
            </Tooltip>
            <Tooltip content={t('common.close')}>
              <Button
                icon={<IconClose />}
                theme="borderless"
                type="tertiary"
                style={{ marginLeft: 4 }}
                onClick={onClose}
              />
            </Tooltip>
          </div>
        </div>
      }
    >
      {/* 拖拽调整宽度手柄 */}
      {!isFullscreen && (
        <div className="personal-credential-detail-drawer-resize-handle" onMouseDown={handleMouseDown} />
      )}

      {/* 基本信息 */}
      <div className="personal-credential-detail-drawer-content">
        <div className="personal-credential-detail-drawer-info">
          <Descriptions
            data={descriptionData}
            row
            size="small"
          />
        </div>

        {/* Tab内容 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="personal-credential-detail-drawer-tabs"
        >
          <TabPane
            tab={t('personalCredential.detail.tabs.linkedCredentials')}
            itemKey="linkedCredentials"
          >
            <div className="personal-credential-detail-drawer-tab-content">
              <Row type="flex" justify="end" style={{ marginBottom: 12 }}>
                <Button
                  icon={<IconLink />}
                  theme="light"
                  type="primary"
                  size="small"
                  onClick={() => onLinkCredential(credential)}
                >
                  {t('personalCredential.actions.linkCredential')}
                </Button>
              </Row>
              <Table
                columns={linkedCredentialsColumns}
                dataSource={linkedCredentials}
                rowKey="credential_id"
                loading={linkedCredentialsLoading}
                pagination={false}
                empty={<Empty description={t('personalCredential.linkedCredentials.empty')} />}
              />
            </div>
          </TabPane>
          <TabPane
            tab={t('personalCredential.detail.tabs.usageRecords')}
            itemKey="usageRecords"
          >
            <div className="personal-credential-detail-drawer-tab-content">
              <Row type="flex" justify="start" style={{ marginBottom: 12 }}>
                <DatePicker
                  type="dateRange"
                  placeholder={[t('common.startDate'), t('common.endDate')]}
                  value={usageDateRange}
                  onChange={(dates) => {
                    setUsageDateRange(dates as [Date, Date] | null);
                    setUsagePage(1);
                  }}
                  style={{ width: 260 }}
                />
              </Row>
              <Table
                columns={usageColumns}
                dataSource={usageRecords}
                rowKey="id"
                loading={usageLoading}
                pagination={{
                  currentPage: usagePage,
                  pageSize: 10,
                  total: usageTotal,
                  onPageChange: setUsagePage,
                }}
                empty={<Empty description={t('personalCredential.usage.empty')} />}
              />
            </div>
          </TabPane>
        </Tabs>
      </div>
    </SideSheet>
  );
};

export default PersonalCredentialDetailDrawer;
