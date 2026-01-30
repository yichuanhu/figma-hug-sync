import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Table,
  Tag,
  Dropdown,
  Tooltip,
  Typography,
} from '@douyinfe/semi-ui';
import {
  IconRefresh,
  IconMore,
  IconFile,
  IconVideo,
} from '@douyinfe/semi-icons';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import type {
  LYTaskExecutionResponse,
  LYListResponseLYTaskExecutionResponse,
  ExecutionStatus,
  GetExecutionHistoryParams,
} from '@/api';
import './index.less';

const { Text } = Typography;

interface ExecutionHistoryTabProps {
  taskId: string;
  enableRecording: boolean;
}

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
  
  const mockData = Array(15).fill(null).map((_, index) => generateMockExecution(taskId, index));
  
  const total = mockData.length;
  const offset = params.offset || 0;
  const size = params.size || 10;
  const paginatedData = mockData.slice(offset, offset + size);
  
  return {
    range: { offset, size, total },
    list: paginatedData,
  };
};

const ExecutionHistoryTab = ({ taskId, enableRecording }: ExecutionHistoryTabProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [queryParams, setQueryParams] = useState<GetExecutionHistoryParams>({
    offset: 0,
    size: 10,
  });
  
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const [listResponse, setListResponse] = useState<LYListResponseLYTaskExecutionResponse>({
    range: { offset: 0, size: 10, total: 0 },
    list: [],
  });
  
  // 加载数据
  const loadData = useCallback(async () => {
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
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 10)) + 1;
  const pageSize = range?.size || 10;
  const total = range?.total || 0;
  
  // 表格列定义
  const columns = [
    {
      title: t('executionHistory.fields.executionId'),
      dataIndex: 'execution_id',
      key: 'execution_id',
      width: 140,
      render: (id: string) => (
        <Tooltip content={id}>
          <Text copyable={{ content: id }} className="execution-history-tab-id-cell">
            {id.substring(0, 8)}...
          </Text>
        </Tooltip>
      ),
    },
    {
      title: t('executionHistory.fields.status'),
      dataIndex: 'status',
      key: 'status',
      width: 90,
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
      width: 120,
    },
    {
      title: t('executionHistory.fields.startTime'),
      dataIndex: 'start_time',
      key: 'start_time',
      width: 160,
      render: (value: string) => value?.replace('T', ' ').substring(0, 19) || '-',
    },
    {
      title: t('executionHistory.fields.duration'),
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (value: number | null) => value ? `${value}s` : '-',
    },
    {
      title: t('common.operations'),
      dataIndex: 'operation',
      key: 'operation',
      width: 60,
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
              {enableRecording && (
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
            size="small"
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];
  
  return (
    <div className="execution-history-tab">
      <div className="execution-history-tab-header">
        <Button icon={<IconRefresh />} size="small" onClick={handleRefresh}>
          {t('common.refresh')}
        </Button>
      </div>
      
      <div className="execution-history-tab-table">
        {isInitialLoad ? (
          <TableSkeleton rows={5} columns={6} />
        ) : (
          <Table
            size="small"
            dataSource={list}
            rowKey="execution_id"
            loading={loading}
            columns={columns}
            scroll={{ x: 700 }}
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
              pageSizeOpts: [10, 20, 50],
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
  );
};

export default ExecutionHistoryTab;
