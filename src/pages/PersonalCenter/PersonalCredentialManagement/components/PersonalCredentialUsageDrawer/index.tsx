import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SideSheet, Table, DatePicker, Tag, Typography, Empty } from '@douyinfe/semi-ui';
import type { PersonalCredential } from '../../index';

import './index.less';

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
        <Tag color={type === 'DEBUG' ? 'blue' : 'green'}>
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

  const { Title, Text } = Typography;

  return (
    <SideSheet
      title={
        <div className="usage-drawer-title">
          <Title heading={5}>{t('personalCredential.usage.title')}</Title>
          {credential && (
            <Text type="tertiary" size="small">
              {credential.credential_name}
            </Text>
          )}
        </div>
      }
      visible={visible}
      onCancel={onClose}
      width={900}
      className="personal-credential-usage-drawer"
    >
      <div className="usage-drawer-content">
        {/* 筛选区域 */}
        <div className="usage-drawer-filter">
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
