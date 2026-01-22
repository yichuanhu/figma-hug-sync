import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  Button,
  Select,
  Table,
  Tag,
  Toast,
  Row,
  Col,
  DatePicker,
  Image,
} from '@douyinfe/semi-ui';
import { IconDownload } from '@douyinfe/semi-icons';
import AppLayout from '@/components/layout/AppLayout';
import type { LYRangeResponse } from '@/api/index';

import './index.less';

// 使用记录类型
type UsageType = 'debug' | 'task';

// 使用记录响应类型
interface CredentialUsageRecord {
  id: string;
  user_id: string;
  user_name: string;
  usage_time: string;
  usage_type: UsageType;
  process_id: string;
  process_name: string;
  process_version: string;
  worker_id: string;
  worker_name: string;
  task_id: string | null;
  screenshot_url: string | null;
}

interface CredentialUsageListResponse {
  data: CredentialUsageRecord[];
  range: LYRangeResponse;
}

// Mock数据生成
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const generateMockUsageRecord = (index: number, context: 'development' | 'scheduling'): CredentialUsageRecord => {
  const users = ['张三', '李四', '王五', '赵六', '钱七'];
  const processes = ['订单处理流程', '数据同步流程', '报表生成流程', '审批流程', '通知发送流程'];
  const workers = ['Worker-01', 'Worker-02', 'Worker-03', 'Worker-04'];
  const versions = ['1.0.0', '1.0.1', '1.1.0', '2.0.0'];

  return {
    id: generateUUID(),
    user_id: generateUUID(),
    user_name: users[index % users.length],
    usage_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    usage_type: context === 'development' ? 'debug' : 'task',
    process_id: generateUUID(),
    process_name: processes[index % processes.length],
    process_version: versions[index % versions.length],
    worker_id: generateUUID(),
    worker_name: workers[index % workers.length],
    task_id: context === 'scheduling' ? `TASK-${String(index + 1).padStart(6, '0')}` : null,
    screenshot_url: index % 3 === 0 ? 'https://via.placeholder.com/800x600' : null,
  };
};

const generateMockUsageList = (context: 'development' | 'scheduling'): CredentialUsageRecord[] => {
  return Array.from({ length: 25 }, (_, i) => generateMockUsageRecord(i, context));
};

// 模拟API调用
const fetchUsageList = async (
  params: {
    credentialId: string;
    context: 'development' | 'scheduling';
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    offset?: number;
    size?: number;
  }
): Promise<CredentialUsageListResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  let data = generateMockUsageList(params.context);

  // 使用者筛选
  if (params.userId) {
    data = data.filter((item) => item.user_id === params.userId);
  }

  // 时间段筛选
  if (params.startDate) {
    data = data.filter((item) => new Date(item.usage_time) >= params.startDate!);
  }
  if (params.endDate) {
    data = data.filter((item) => new Date(item.usage_time) <= params.endDate!);
  }

  const total = data.length;
  const offset = params.offset || 0;
  const size = params.size || 20;
  const pagedData = data.slice(offset, offset + size);

  return {
    data: pagedData,
    range: {
      offset,
      size: pagedData.length,
      total,
    },
  };
};

// 获取所有使用者列表
const fetchUserList = async (): Promise<{ value: string; label: string }[]> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return [
    { value: '', label: '全部使用者' },
    { value: 'user-1', label: '张三' },
    { value: 'user-2', label: '李四' },
    { value: 'user-3', label: '王五' },
    { value: 'user-4', label: '赵六' },
  ];
};

interface QueryParams {
  page: number;
  pageSize: number;
}

const CredentialUsagePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { credentialId } = useParams<{ credentialId: string }>();
  const { t } = useTranslation();

  // 判断当前入口上下文
  const context: 'development' | 'scheduling' = location.pathname.startsWith('/scheduling')
    ? 'scheduling'
    : 'development';

  // 从URL查询参数获取凭据名称
  const searchParams = new URLSearchParams(location.search);
  const credentialName = searchParams.get('name') || '';

  // 查询参数
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    pageSize: 20,
  });

  // 筛选条件
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);

  // 列表数据
  const [listResponse, setListResponse] = useState<CredentialUsageListResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // 使用者列表
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);

  // 加载使用者列表
  useEffect(() => {
    fetchUserList().then(setUserOptions);
  }, []);

  // 加载数据
  const loadData = useCallback(async () => {
    if (!credentialId) return;

    setLoading(true);
    try {
      const response = await fetchUsageList({
        credentialId,
        context,
        userId: selectedUser || undefined,
        startDate: dateRange?.[0],
        endDate: dateRange?.[1],
        offset: (queryParams.page - 1) * queryParams.pageSize,
        size: queryParams.pageSize,
      });
      setListResponse(response);
    } catch (error) {
      console.error('加载使用记录失败:', error);
      Toast.error(t('credential.usage.loadError'));
    } finally {
      setLoading(false);
    }
  }, [credentialId, context, selectedUser, dateRange, queryParams, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 筛选变化
  const handleUserFilter = (value: string) => {
    setSelectedUser(value);
    setQueryParams((prev) => ({ ...prev, page: 1 }));
  };

  const handleDateRangeChange = (dates: [Date, Date] | null) => {
    setDateRange(dates);
    setQueryParams((prev) => ({ ...prev, page: 1 }));
  };

  // 分页变化
  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  // 导出
  const handleExport = async () => {
    Toast.info(t('credential.usage.exporting'));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    Toast.success(t('credential.usage.exportSuccess'));
  };

  // 返回凭据列表
  const handleBack = () => {
    const basePath = context === 'development'
      ? '/dev-center/business-assets/credentials'
      : '/scheduling-center/business-assets/credentials';
    navigate(basePath);
  };

  // 格式化时间
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 表格列定义
  const columns = [
    {
      title: t('credential.usage.table.user'),
      dataIndex: 'user_name',
      key: 'user_name',
      width: 120,
      render: (text: string) => (
        <span className="credential-usage-page-table-user">{text}</span>
      ),
    },
    {
      title: t('credential.usage.table.usageTime'),
      dataIndex: 'usage_time',
      key: 'usage_time',
      width: 180,
      render: (text: string) => formatDateTime(text),
    },
    {
      title: t('credential.usage.table.type'),
      dataIndex: 'usage_type',
      key: 'usage_type',
      width: 100,
      render: (type: UsageType) => (
        <Tag color={type === 'debug' ? 'blue' : 'green'}>
          {t(`credential.usage.type.${type}`)}
        </Tag>
      ),
    },
    {
      title: t('credential.usage.table.process'),
      dataIndex: 'process_name',
      key: 'process_name',
      width: 160,
      render: (text: string) => (
        <span className="credential-usage-page-table-process">{text}</span>
      ),
    },
    {
      title: t('credential.usage.table.processVersion'),
      dataIndex: 'process_version',
      key: 'process_version',
      width: 100,
    },
    {
      title: t('credential.usage.table.worker'),
      dataIndex: 'worker_name',
      key: 'worker_name',
      width: 120,
    },
    {
      title: t('credential.usage.table.taskId'),
      dataIndex: 'task_id',
      key: 'task_id',
      width: 140,
      render: (text: string | null) => (
        <span className="credential-usage-page-table-task">{text || '-'}</span>
      ),
    },
    {
      title: t('credential.usage.table.screenshot'),
      dataIndex: 'screenshot_url',
      key: 'screenshot_url',
      width: 100,
      render: (url: string | null) =>
        url ? (
          <Image
            src={url}
            width={60}
            height={40}
            preview
            style={{ cursor: 'pointer', borderRadius: 4 }}
          />
        ) : (
          '-'
        ),
    },
  ];

  // 面包屑配置
  const breadcrumbItems = context === 'development'
    ? [
        { name: t('credential.breadcrumb.developmentCenter'), path: '/development-workbench' },
        { name: t('sidebar.businessAssetConfig') },
        { name: t('sidebar.credentials'), path: '/dev-center/business-assets/credentials' },
        { name: t('credential.usage.title') },
      ]
    : [
        { name: t('credential.breadcrumb.schedulingCenter'), path: '/scheduling-workbench' },
        { name: t('sidebar.businessAssetConfig') },
        { name: t('sidebar.credentials'), path: '/scheduling-center/business-assets/credentials' },
        { name: t('credential.usage.title') },
      ];

  // 分页信息
  const range = listResponse?.range;
  const total = range?.total || 0;
  const start = range ? range.offset + 1 : 0;
  const end = range ? range.offset + (listResponse?.data?.length || 0) : 0;

  return (
    <AppLayout>
      <div className="credential-usage-page">
        {/* 面包屑 */}
        <div className="credential-usage-page-breadcrumb">
          <Breadcrumb>
            {breadcrumbItems.map((item, index) => (
              <Breadcrumb.Item
                key={index}
                onClick={item.path ? () => navigate(item.path!) : undefined}
              >
                {item.name}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </div>

        {/* 标题工具栏 */}
        <div className="credential-usage-page-header">
          <Row type="flex" justify="space-between" align="middle">
            <Col>
              <Row type="flex" align="middle">
                <h1 className="credential-usage-page-header-title">
                  {t('credential.usage.title')}
                </h1>
                {credentialName && (
                  <span className="credential-usage-page-header-subtitle">
                    - {credentialName}
                  </span>
                )}
              </Row>
            </Col>
            <Col>
              <Button icon={<IconDownload />} onClick={handleExport}>
                {t('common.export')}
              </Button>
            </Col>
          </Row>
        </div>

        {/* 筛选工具栏 */}
        <div className="credential-usage-page-toolbar">
          <Row type="flex" gutter={12}>
            <Col>
              <Select
                className="credential-usage-page-toolbar-select"
                placeholder={t('credential.usage.filter.user')}
                optionList={userOptions}
                value={selectedUser}
                onChange={handleUserFilter}
              />
            </Col>
            <Col>
              <DatePicker
                className="credential-usage-page-toolbar-date"
                type="dateRange"
                placeholder={[t('common.startTime'), t('common.endTime')]}
                value={dateRange || undefined}
                onChange={(dates) => handleDateRangeChange(dates as [Date, Date] | null)}
              />
            </Col>
          </Row>
        </div>

        {/* 表格 */}
        <div className="credential-usage-page-table">
          <Table
            columns={columns}
            dataSource={listResponse?.data || []}
            rowKey="id"
            loading={loading}
            pagination={{
              currentPage: queryParams.page,
              pageSize: queryParams.pageSize,
              total,
              onPageChange: handlePageChange,
            }}
            scroll={{ y: 'calc(100vh - 320px)' }}
          />
        </div>

        {/* 分页信息 */}
        {total > 0 && (
          <div className="credential-usage-page-pagination-info">
            {t('common.showingRecords', { start, end, total })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CredentialUsagePage;
