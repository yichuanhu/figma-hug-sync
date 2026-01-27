import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  SideSheet, 
  Table, 
  DatePicker, 
  Tag, 
  Typography, 
  Empty, 
  Button, 
  Tooltip, 
  Divider, 
  Row, 
  Col, 
  Space 
} from '@douyinfe/semi-ui';
import { 
  IconClose, 
  IconMaximize, 
  IconMinimize 
} from '@douyinfe/semi-icons';
import type { PersonalCredential } from '../../index';

import './index.less';

const { Title, Text } = Typography;

interface UsageRecord {
  id: string;
  usage_time: string;
  usage_type: 'DEBUG' | 'TASK';
  description: string;
  process_name: string;
  process_version: string;
  process_robot: string;
  task_number: string;
  screenshot: string | null;
}

interface PersonalCredentialUsageDrawerProps {
  visible: boolean;
  credential: PersonalCredential | null;
  onClose: () => void;
}

// Mock数据生成
const generateMockUsageRecords = (): UsageRecord[] => {
  return Array.from({ length: 15 }, (_, i) => ({
    id: `usage-${i}`,
    usage_time: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    usage_type: Math.random() > 0.5 ? 'DEBUG' : 'TASK',
    description: `凭据[企业邮箱]被成功获取`,
    process_name: ['邮件发送流程', '数据同步流程', '报表生成流程'][i % 3],
    process_version: `v1.${i % 5}.0`,
    process_robot: `robot-00${(i % 5) + 1}`,
    task_number: `TASK-2025-${String(i + 1).padStart(4, '0')}`,
    screenshot: null,
  }));
};

const PersonalCredentialUsageDrawer = ({
  visible,
  credential,
  onClose,
}: PersonalCredentialUsageDrawerProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  // 抽屉状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('personalCredentialUsageDrawerWidth');
    return saved ? Math.max(Number(saved), 576) : 800;
  });
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(drawerWidth);

  const loadData = useCallback(async () => {
    if (!credential) return;
    
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      const records = generateMockUsageRecords();
      setUsageRecords(records);
      setTotal(records.length);
    } catch (error) {
      console.error('加载使用记录失败:', error);
    } finally {
      setLoading(false);
    }
  }, [credential, dateRange, page]);

  useEffect(() => {
    if (visible && credential) {
      loadData();
    }
  }, [visible, credential, loadData]);

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
    localStorage.setItem('personalCredentialUsageDrawerWidth', String(drawerWidth));
  }, [drawerWidth]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const columns = [
    {
      title: t('personalCredential.usage.table.usageTime'),
      dataIndex: 'usage_time',
      key: 'usage_time',
      width: 160,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: t('personalCredential.usage.table.type'),
      dataIndex: 'usage_type',
      key: 'usage_type',
      width: 80,
      render: (type: 'DEBUG' | 'TASK') => (
        <Tag color={type === 'DEBUG' ? 'blue' : 'green'} type="light">
          {t(`personalCredential.usage.type.${type.toLowerCase()}`)}
        </Tag>
      ),
    },
    {
      title: t('personalCredential.usage.table.description'),
      dataIndex: 'description',
      key: 'description',
      width: 200,
    },
    {
      title: t('personalCredential.usage.table.process'),
      dataIndex: 'process_name',
      key: 'process_name',
      width: 140,
    },
    {
      title: t('personalCredential.usage.table.processVersion'),
      dataIndex: 'process_version',
      key: 'process_version',
      width: 100,
    },
    {
      title: t('personalCredential.usage.table.worker'),
      dataIndex: 'process_robot',
      key: 'process_robot',
      width: 120,
    },
    {
      title: t('personalCredential.usage.table.taskId'),
      dataIndex: 'task_number',
      key: 'task_number',
      width: 140,
    },
  ];

  return (
    <SideSheet
      title={
        <Row type="flex" justify="space-between" align="middle" className="personal-credential-usage-drawer-header">
          <Col>
            <div className="personal-credential-usage-drawer-header-title-wrapper">
              <Title heading={5} className="personal-credential-usage-drawer-header-title">
                {t('personalCredential.usage.title')}
              </Title>
              {credential && (
                <Text type="tertiary" size="small">
                  {credential.credential_name}
                </Text>
              )}
            </div>
          </Col>
          <Col>
            <Space spacing={8}>
              <Divider layout="vertical" className="personal-credential-usage-drawer-header-divider" />
              <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
                <Button icon={isFullscreen ? <IconMinimize /> : <IconMaximize />} theme="borderless" size="small" onClick={toggleFullscreen} />
              </Tooltip>
              <Tooltip content={t('common.close')}>
                <Button icon={<IconClose />} theme="borderless" size="small" onClick={onClose} className="personal-credential-usage-drawer-header-close-btn" />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      }
      visible={visible}
      onCancel={onClose}
      placement="right"
      width={isFullscreen ? '100%' : drawerWidth}
      mask={false}
      footer={null}
      closable={false}
      className={`card-sidesheet resizable-sidesheet personal-credential-usage-drawer ${isFullscreen ? 'fullscreen-sidesheet' : ''}`}
    >
      {!isFullscreen && <div className="personal-credential-usage-drawer-resize-handle" onMouseDown={handleMouseDown} />}
      <div className="personal-credential-usage-drawer-content">
        {/* 筛选区域 */}
        <div className="personal-credential-usage-drawer-filter">
          <DatePicker
            type="dateTimeRange"
            placeholder={[t('common.startTime'), t('common.endTime')]}
            value={dateRange}
            onChange={(value) => {
              setDateRange(value as [Date, Date] | null);
              setPage(1);
            }}
          />
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={usageRecords}
          rowKey="id"
          loading={loading}
          pagination={{
            currentPage: page,
            pageSize: 10,
            total,
            onPageChange: setPage,
          }}
          scroll={{ y: 'calc(100vh - 280px)' }}
          empty={<Empty description={t('personalCredential.usage.empty')} />}
        />
      </div>
    </SideSheet>
  );
};

export default PersonalCredentialUsageDrawer;
