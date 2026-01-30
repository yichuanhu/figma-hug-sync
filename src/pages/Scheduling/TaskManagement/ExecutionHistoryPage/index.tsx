import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  Typography,
  Button,
  Table,
  Tag,
  Dropdown,
  Tooltip,
} from '@douyinfe/semi-ui';
import {
  IconRefresh,
  IconMore,
  IconFile,
  IconVideo,
  IconArrowLeft,
} from '@douyinfe/semi-icons';
import AppLayout from '@/components/layout/AppLayout';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import type {
  LYTaskExecutionResponse,
  LYListResponseLYTaskExecutionResponse,
  ExecutionStatus,
  GetExecutionHistoryParams,
} from '@/api';
import './index.less';

const { Title, Text } = Typography;

// 执行状态配置
const executionStatusConfig: Record<ExecutionStatus, { color: 'blue' | 'green' | 'red' | 'grey' | 'orange'; i18nKey: string }> = {
  RUNNING: { color: 'blue', i18nKey: 'task.executionStatus.running' },
  SUCCESS: { color: 'green', i18nKey: 'task.executionStatus.success' },
  FAILED: { color: 'red', i18nKey: 'task.executionStatus.failed' },
  STOPPED: { color: 'grey', i18nKey: 'task.executionStatus.stopped' },
  TIMEOUT: { color: 'orange', i18nKey: 'task.executionStatus.timeout' },
};

// 生成UUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Mock数据生成
const generateMockExecution = (taskId: string, index: number): LYTaskExecutionResponse => {
  const statuses: ExecutionStatus[] = ['RUNNING', 'SUCCESS', 'FAILED', 'STOPPED', 'TIMEOUT'];
  const botNames = ['RPA-BOT-001', 'RPA-BOT-002', 'RPA-BOT-003', 'RPA-BOT-004', 'RPA-BOT-005'];
  const createDate = new Date(2026, 0, 28 - index, 10 + (index % 12), (index * 7) % 60);
  const status = statuses[index % statuses.length];
  
  return {
    execution_id: generateUUID(),
    task_id: taskId,
    status,
    start_time: createDate.toISOString(),
    end_time: status !== 'RUNNING' ? new Date(createDate.getTime() + 300000).toISOString() : null,
    duration: status !== 'RUNNING' ? 300 + (index * 10) : null,
    bot_id: generateUUID(),
    bot_name: botNames[index % botNames.length],
    error_message: status === 'FAILED' ? '执行失败：目标元素未找到' : status === 'TIMEOUT' ? '执行超时：超过最大执行时间' : null,
    log_count: 50 + (index % 50),
    screenshot_count: 5 + (index % 10),
  };
};

// Mock API调用
const fetchExecutionHistory = async (
  taskId: string,
  params: GetExecutionHistoryParams
): Promise<LYListResponseLYTaskExecutionResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  let mockData = Array(25).fill(null).map((_, index) => generateMockExecution(taskId, index));
  
  // 搜索过滤
  if (params.keyword?.trim()) {
    const keyword = params.keyword.toLowerCase().trim();
    mockData = mockData.filter((item) =>
      item.execution_id.toLowerCase().includes(keyword) ||
      item.bot_name.toLowerCase().includes(keyword)
    );
  }
  
  // 状态筛选
  if (params.status && params.status.length > 0) {
    mockData = mockData.filter((item) => params.status!.includes(item.status));
  }
  
  // 时间范围筛选
  if (params.start_time) {
    const startDate = new Date(params.start_time);
    mockData = mockData.filter((item) => new Date(item.start_time) >= startDate);
  }
  if (params.end_time) {
    const endDate = new Date(params.end_time);
    mockData = mockData.filter((item) => new Date(item.start_time) <= endDate);
  }
  
  const total = mockData.length;
  const offset = params.offset || 0;
  const size = params.size || 20;
  const paginatedData = mockData.slice(offset, offset + size);
  
  return {
    range: { offset, size, total },
    list: paginatedData,
  };
};

// 获取任务信息
const fetchTaskInfo = async (taskId: string): Promise<{ task_id: string; process_name: string; enable_recording: boolean }> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return {
    task_id: taskId,
    process_name: '订单自动处理',
    enable_recording: true,
  };
};

const ExecutionHistoryPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [queryParams, setQueryParams] = useState<GetExecutionHistoryParams>({
    offset: 0,
    size: 20,
  });
  
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [taskInfo, setTaskInfo] = useState<{ task_id: string; process_name: string; enable_recording: boolean } | null>(null);
  
  const [listResponse, setListResponse] = useState<LYListResponseLYTaskExecutionResponse>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });
  
  // 加载任务信息
  useEffect(() => {
    if (taskId) {
      fetchTaskInfo(taskId).then(setTaskInfo);
    }
  }, [taskId]);
  
  // 加载数据
  const loadData = useCallback(async () => {
    if (!taskId) return;
    
    setLoading(true);
    try {
      const response = await fetchExecutionHistory(taskId, queryParams);
      setListResponse(response);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [taskId, queryParams]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleRefresh = () => {
    loadData();
  };
  
  // 分页信息
  const { range, list } = listResponse;
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;
  
  // 表格列定义
  const columns = [
    {
      title: t('executionHistory.fields.executionId'),
      dataIndex: 'execution_id',
      key: 'execution_id',
      width: 180,
      render: (id: string) => (
        <Tooltip content={id}>
          <Text copyable={{ content: id }} className="execution-history-page-id-cell">
            {id.substring(0, 12)}...
          </Text>
        </Tooltip>
      ),
    },
    {
      title: t('executionHistory.fields.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ExecutionStatus) => (
        <Tag color={executionStatusConfig[status]?.color || 'grey'} type="light">
          {t(executionStatusConfig[status]?.i18nKey || '')}
        </Tag>
      ),
    },
    {
      title: t('executionHistory.fields.botName'),
      dataIndex: 'bot_name',
      key: 'bot_name',
      width: 140,
    },
    {
      title: t('executionHistory.fields.startTime'),
      dataIndex: 'start_time',
      key: 'start_time',
      width: 180,
      render: (value: string) => value?.replace('T', ' ').substring(0, 19) || '-',
    },
    {
      title: t('executionHistory.fields.endTime'),
      dataIndex: 'end_time',
      key: 'end_time',
      width: 180,
      render: (value: string | null) => value?.replace('T', ' ').substring(0, 19) || '-',
    },
    {
      title: t('executionHistory.fields.duration'),
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (value: number | null) => value ? `${value} ${t('task.detail.seconds')}` : '-',
    },
    {
      title: t('executionHistory.fields.errorMessage'),
      dataIndex: 'error_message',
      key: 'error_message',
      width: 200,
      render: (value: string | null) => value ? (
        <Tooltip content={value}>
          <span className="execution-history-page-error-message">{value.substring(0, 20)}...</span>
        </Tooltip>
      ) : '-',
    },
    {
      title: t('common.operations'),
      dataIndex: 'operation',
      key: 'operation',
      width: 80,
      fixed: 'right' as const,
      render: (_: unknown, record: LYTaskExecutionResponse) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          clickToHide
          render={
            <Dropdown.Menu>
              <Dropdown.Item
                icon={<IconFile />}
                onClick={(e) => {
                  e?.stopPropagation();
                  navigate(`/scheduling-center/task-execution/task-list/${record.execution_id}/logs`);
                }}
              >
                {t('task.actions.viewLogs')}
              </Dropdown.Item>
              {taskInfo?.enable_recording && (
                <Dropdown.Item
                  icon={<IconVideo />}
                  onClick={(e) => {
                    e?.stopPropagation();
                    navigate(`/scheduling-center/task-execution/task-list/${record.execution_id}/recording`);
                  }}
                >
                  {t('task.actions.viewRecording')}
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          }
        >
          <Button
            icon={<IconMore />}
            theme="borderless"
            type="tertiary"
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];
  
  return (
    <AppLayout>
      <div className="execution-history-page">
        <div className="execution-history-page-breadcrumb">
          <Breadcrumb>
            <Breadcrumb.Item onClick={() => navigate('/')}>{t('common.home')}</Breadcrumb.Item>
            <Breadcrumb.Item>{t('task.breadcrumb.schedulingCenter')}</Breadcrumb.Item>
            <Breadcrumb.Item>{t('task.breadcrumb.taskExecution')}</Breadcrumb.Item>
            <Breadcrumb.Item onClick={() => navigate('/scheduling-center/task-execution/task-list')}>
              {t('task.breadcrumb.taskList')}
            </Breadcrumb.Item>
            <Breadcrumb.Item>{t('executionHistory.breadcrumb.executionHistory')}</Breadcrumb.Item>
          </Breadcrumb>
        </div>
        
        <div className="execution-history-page-header">
          <div className="execution-history-page-header-title">
            <Button
              icon={<IconArrowLeft />}
              theme="borderless"
              type="tertiary"
              onClick={() => navigate('/scheduling-center/task-execution/task-list')}
              className="execution-history-page-back-btn"
            />
            <div className="execution-history-page-header-info">
              <Title heading={4}>{t('executionHistory.title')}</Title>
              {taskInfo && (
                <Text type="tertiary" size="small">
                  {t('executionHistory.taskInfo', { taskId: taskInfo.task_id, processName: taskInfo.process_name })}
                </Text>
              )}
            </div>
          </div>
          <div className="execution-history-page-header-toolbar">
            <Button icon={<IconRefresh />} onClick={handleRefresh}>
              {t('common.refresh')}
            </Button>
          </div>
        </div>
        
        <div className="execution-history-page-table">
          {isInitialLoad ? (
            <TableSkeleton rows={10} columns={8} />
          ) : (
            <Table
              size="middle"
              dataSource={list}
              rowKey="execution_id"
              loading={loading}
              columns={columns}
              scroll={{ x: 1200 }}
              empty={
                <EmptyState
                  variant="noData"
                  description={t('executionHistory.noData')}
                />
              }
              pagination={{
                total,
                pageSize,
                currentPage,
                showSizeChanger: true,
                pageSizeOpts: [10, 20, 50, 100],
                onPageChange: (page) => {
                  setQueryParams((prev) => ({ ...prev, offset: (page - 1) * pageSize }));
                },
                onPageSizeChange: (size) => {
                  setQueryParams((prev) => ({ ...prev, offset: 0, size }));
                },
              }}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ExecutionHistoryPage;
