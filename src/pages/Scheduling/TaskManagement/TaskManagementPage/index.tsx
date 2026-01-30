import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  Typography,
  Input,
  Button,
  Table,
  Tag,
  Dropdown,
  Tooltip,
  Row,
  Col,
  Modal,
  Toast,
  Space,
} from '@douyinfe/semi-ui';
import AppLayout from '@/components/layout/AppLayout';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import FilterPopover from '@/components/FilterPopover';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskDetailDrawer from '../components/TaskDetailDrawer';
import {
  IconSearch,
  IconPlus,
  IconMore,
  IconRefresh,
  IconMinusCircleStroked,
  IconClose,
  IconPlayCircle,
  IconDeleteStroked,
} from '@douyinfe/semi-icons';
import type { 
  LYTaskResponse, 
  GetTasksParams, 
  LYListResponseLYTaskResponse,
  TaskStatus,
  ExecutionStatus,
  TriggerSource,
  TaskPriority,
} from '@/api';
import './index.less';

const { Title } = Typography;

// ============= 工具函数 =============

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ============= Mock数据生成 =============

const mockCreatorNameMap: Record<string, string> = {
  'user-001': '张三',
  'user-002': '李四',
  'user-003': '王五',
  'user-004': '赵六',
  'user-005': '钱七',
};

const generateMockTaskResponse = (index: number): LYTaskResponse => {
  const processNames = [
    '订单自动处理',
    '财务报销审批',
    '人事入职流程',
    '采购申请流程',
    '合同审批流程',
  ];

  const targetNames = [
    '订单处理组',
    '财务审批组',
    '人事管理组',
    'RPA-BOT-001',
    'RPA-BOT-002',
  ];

  const taskStatuses: TaskStatus[] = ['PENDING', 'ASSIGNED', 'WAITING', 'COMPLETED', 'FAILED', 'CANCELLED'];
  const executionStatuses: ExecutionStatus[] = ['RUNNING', 'SUCCESS', 'FAILED', 'STOPPED', 'TIMEOUT'];
  const priorities: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW', 'MANUAL_QUEUE_BREAKER'];
  const triggerSources: TriggerSource[] = ['MANUAL', 'SCHEDULED', 'QUEUE', 'TEMPLATE'];
  const targetTypes = ['BOT_GROUP', 'BOT_IN_GROUP', 'UNGROUPED_BOT'] as const;
  const creatorIds = Object.keys(mockCreatorNameMap);

  const createDate = new Date(2026, 0, 1 + (index % 28), 10 + (index % 12), (index * 7) % 60);
  const expireDate = new Date(createDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const taskStatus = taskStatuses[index % taskStatuses.length];
  const hasExecution = ['ASSIGNED', 'WAITING', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(taskStatus);
  const creatorId = creatorIds[index % creatorIds.length];

  return {
    task_id: `TASK-${String(100000 + index).substring(1)}`,
    process_id: generateUUID(),
    process_name: processNames[index % processNames.length],
    process_version_id: generateUUID(),
    process_version: `v${(index % 5) + 1}.0.0`,
    execution_target_type: targetTypes[index % targetTypes.length],
    execution_target_id: generateUUID(),
    execution_target_name: targetNames[index % targetNames.length],
    task_status: taskStatus,
    execution_status: hasExecution ? executionStatuses[index % executionStatuses.length] : null,
    priority: priorities[index % priorities.length],
    trigger_source: triggerSources[index % triggerSources.length],
    create_time: createDate.toISOString(),
    expire_time: expireDate.toISOString(),
    max_execution_duration: 3600,
    enable_recording: index < 10 || index % 2 === 0,
    input_parameters: { targetUrl: 'https://example.com', maxCount: 100 },
    output_result: taskStatus === 'COMPLETED' ? { status: 'success', count: 50 } : null,
    total_execution_count: hasExecution ? (index % 3) + 1 : 0,
    current_execution_id: hasExecution ? generateUUID() : null,
    completed_execution_id: taskStatus === 'COMPLETED' ? generateUUID() : null,
    current_execution: hasExecution ? {
      execution_id: generateUUID(),
      task_id: `TASK-${String(100000 + index).substring(1)}`,
      status: executionStatuses[index % executionStatuses.length],
      start_time: createDate.toISOString(),
      end_time: taskStatus === 'COMPLETED' ? new Date(createDate.getTime() + 300000).toISOString() : null,
      duration: taskStatus === 'COMPLETED' ? 300 : null,
      bot_id: generateUUID(),
      bot_name: `RPA-BOT-${String(index % 5 + 1).padStart(3, '0')}`,
      error_message: taskStatus === 'FAILED' ? '执行超时：网络连接失败' : null,
      log_count: 50 + (index % 50),
      screenshot_count: 5 + (index % 10),
    } : null,
    executions: hasExecution ? Array((index % 3) + 1).fill(null).map((_, i) => ({
      execution_id: generateUUID(),
      task_id: `TASK-${String(100000 + index).substring(1)}`,
      status: i === 0 ? executionStatuses[index % executionStatuses.length] : 'FAILED',
      start_time: new Date(createDate.getTime() - i * 600000).toISOString(),
      end_time: new Date(createDate.getTime() - i * 600000 + 300000).toISOString(),
      duration: 300,
      bot_id: generateUUID(),
      bot_name: `RPA-BOT-${String((index + i) % 5 + 1).padStart(3, '0')}`,
      error_message: i > 0 ? '执行失败：目标元素未找到' : null,
      log_count: 50 + (index % 50),
      screenshot_count: 5 + (index % 10),
    })) : [],
    creator_id: creatorId,
    creator_name: mockCreatorNameMap[creatorId],
  };
};

const generateMockTaskList = (): LYTaskResponse[] => {
  return Array(58).fill(null).map((_, index) => generateMockTaskResponse(index));
};

let mockTaskData = generateMockTaskList();

const fetchTaskList = async (params: GetTasksParams): Promise<LYListResponseLYTaskResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  let filteredData = [...mockTaskData];

  // 搜索过滤
  if (params.keyword?.trim()) {
    const keyword = params.keyword.toLowerCase().trim();
    filteredData = filteredData.filter((item) =>
      item.task_id.toLowerCase().includes(keyword) ||
      item.process_name.toLowerCase().includes(keyword)
    );
  }

  // 任务状态筛选
  if (params.task_status && params.task_status.length > 0) {
    filteredData = filteredData.filter((item) => params.task_status!.includes(item.task_status));
  }

  // 执行状态筛选
  if (params.execution_status && params.execution_status.length > 0) {
    filteredData = filteredData.filter((item) => 
      item.execution_status && params.execution_status!.includes(item.execution_status)
    );
  }

  // 触发来源筛选
  if (params.trigger_source && params.trigger_source.length > 0) {
    filteredData = filteredData.filter((item) => params.trigger_source!.includes(item.trigger_source));
  }

  // 时间范围筛选
  if (params.start_time) {
    const startDate = new Date(params.start_time);
    filteredData = filteredData.filter((item) => new Date(item.create_time) >= startDate);
  }
  if (params.end_time) {
    const endDate = new Date(params.end_time);
    filteredData = filteredData.filter((item) => new Date(item.create_time) <= endDate);
  }

  // 排序
  filteredData.sort((a, b) => {
    const valueA = params.sort_by === 'priority' ? a.priority : a.create_time;
    const valueB = params.sort_by === 'priority' ? b.priority : b.create_time;
    const comparison = String(valueA).localeCompare(String(valueB));
    return params.sort_order === 'asc' ? comparison : -comparison;
  });

  const total = filteredData.length;
  const offset = params.offset || 0;
  const size = params.size || 20;
  const paginatedData = filteredData.slice(offset, offset + size);

  return {
    range: { offset, size, total },
    list: paginatedData,
  };
};

// ============= 状态配置 =============

const taskStatusConfig: Record<TaskStatus, { color: 'grey' | 'blue' | 'orange' | 'green' | 'red'; i18nKey: string }> = {
  PENDING: { color: 'grey', i18nKey: 'task.status.pending' },
  ASSIGNED: { color: 'blue', i18nKey: 'task.status.assigned' },
  WAITING: { color: 'orange', i18nKey: 'task.status.waiting' },
  COMPLETED: { color: 'green', i18nKey: 'task.status.completed' },
  FAILED: { color: 'red', i18nKey: 'task.status.failed' },
  CANCELLED: { color: 'grey', i18nKey: 'task.status.cancelled' },
};

const executionStatusConfig: Record<ExecutionStatus, { color: 'blue' | 'green' | 'red' | 'grey' | 'orange'; i18nKey: string }> = {
  RUNNING: { color: 'blue', i18nKey: 'task.executionStatus.running' },
  SUCCESS: { color: 'green', i18nKey: 'task.executionStatus.success' },
  FAILED: { color: 'red', i18nKey: 'task.executionStatus.failed' },
  STOPPED: { color: 'grey', i18nKey: 'task.executionStatus.stopped' },
  TIMEOUT: { color: 'orange', i18nKey: 'task.executionStatus.timeout' },
};

const priorityConfig: Record<TaskPriority, { color: 'red' | 'orange' | 'grey' | 'blue'; i18nKey: string }> = {
  HIGH: { color: 'red', i18nKey: 'task.priority.high' },
  MEDIUM: { color: 'orange', i18nKey: 'task.priority.medium' },
  LOW: { color: 'grey', i18nKey: 'task.priority.low' },
  MANUAL_QUEUE_BREAKER: { color: 'blue', i18nKey: 'task.priority.manualQueueBreaker' },
};

// ============= 组件 =============

const TaskManagementPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [searchValue, setSearchValue] = useState('');
  const [queryParams, setQueryParams] = useState<GetTasksParams>({
    offset: 0,
    size: 20,
    keyword: '',
    sort_by: 'create_time',
    sort_order: 'desc',
  });

  // 筛选状态
  const [taskStatusFilter, setTaskStatusFilter] = useState<string[]>([]);
  const [executionStatusFilter, setExecutionStatusFilter] = useState<string[]>([]);
  const [triggerSourceFilter, setTriggerSourceFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [initialTab] = useState<'basicInfo'>('basicInfo');

  const [listResponse, setListResponse] = useState<LYListResponseLYTaskResponse>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });
  const [selectedTask, setSelectedTask] = useState<LYTaskResponse | null>(null);

  // 筛选选项
  const taskStatusOptions = useMemo(() => [
    { value: 'PENDING', label: t('task.status.pending') },
    { value: 'ASSIGNED', label: t('task.status.assigned') },
    { value: 'WAITING', label: t('task.status.waiting') },
    { value: 'COMPLETED', label: t('task.status.completed') },
    { value: 'FAILED', label: t('task.status.failed') },
    { value: 'CANCELLED', label: t('task.status.cancelled') },
  ], [t]);

  const executionStatusOptions = useMemo(() => [
    { value: 'RUNNING', label: t('task.executionStatus.running') },
    { value: 'SUCCESS', label: t('task.executionStatus.success') },
    { value: 'FAILED', label: t('task.executionStatus.failed') },
    { value: 'STOPPED', label: t('task.executionStatus.stopped') },
    { value: 'TIMEOUT', label: t('task.executionStatus.timeout') },
  ], [t]);

  const triggerSourceOptions = useMemo(() => [
    { value: 'MANUAL', label: t('task.triggerSource.manual') },
    { value: 'SCHEDULED', label: t('task.triggerSource.scheduled') },
    { value: 'QUEUE', label: t('task.triggerSource.queue') },
    { value: 'TEMPLATE', label: t('task.triggerSource.template') },
  ], [t]);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchTaskList({
        ...queryParams,
        task_status: taskStatusFilter.length > 0 ? taskStatusFilter as TaskStatus[] : undefined,
        execution_status: executionStatusFilter.length > 0 ? executionStatusFilter as ExecutionStatus[] : undefined,
        trigger_source: triggerSourceFilter.length > 0 ? triggerSourceFilter as TriggerSource[] : undefined,
        start_time: dateRange?.[0]?.toISOString(),
        end_time: dateRange?.[1]?.toISOString(),
      });
      setListResponse(response);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [queryParams, taskStatusFilter, executionStatusFilter, triggerSourceFilter, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 搜索防抖
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setQueryParams((prev) => ({ ...prev, offset: 0, keyword: value }));
    }, 500),
    []
  );

  const handleSearch = (value: string) => {
    setSearchValue(value);
    debouncedSearch(value);
  };

  const handleRefresh = () => {
    loadData();
  };

  // 打开详情抽屉
  const openTaskDetail = (record: LYTaskResponse) => {
    setSelectedTask(record);
    setDetailDrawerVisible(true);
  };


  // 取消任务
  const handleCancelTask = (task: LYTaskResponse) => {
    if (task.task_status !== 'PENDING') {
      Toast.warning('只能取消待执行状态的任务');
      return;
    }

    Modal.confirm({
      title: t('task.cancelModal.title'),
      icon: <IconClose style={{ color: 'var(--semi-color-warning)' }} />,
      content: (
        <>
          <div>{t('task.cancelModal.confirmMessage', { taskId: task.task_id })}</div>
          <div style={{ color: 'var(--semi-color-text-2)', marginTop: 8 }}>
            {t('task.cancelModal.warning')}
          </div>
        </>
      ),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'warning' },
      onOk: async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));
          mockTaskData = mockTaskData.map((item) =>
            item.task_id === task.task_id ? { ...item, task_status: 'CANCELLED' as TaskStatus } : item
          );
          loadData();
          Toast.success(t('task.cancelModal.success'));
        } catch (error) {
          Toast.error(t('task.cancelModal.error', { message: '请重试' }));
        }
      },
    });
  };

  // 停止任务
  const handleStopTask = (task: LYTaskResponse) => {
    if (task.execution_status !== 'RUNNING') {
      Toast.warning('只能停止运行中的任务');
      return;
    }

    Modal.confirm({
      title: t('task.stopModal.title'),
      icon: <IconMinusCircleStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: (
        <>
          <div>{t('task.stopModal.confirmMessage', { taskId: task.task_id })}</div>
          <div style={{ color: 'var(--semi-color-text-2)', marginTop: 8 }}>
            {t('task.stopModal.warning')}
          </div>
        </>
      ),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));
          mockTaskData = mockTaskData.map((item) =>
            item.task_id === task.task_id ? { ...item, execution_status: 'STOPPED' as ExecutionStatus } : item
          );
          loadData();
          Toast.success(t('task.stopModal.success'));
        } catch (error) {
          Toast.error(t('task.stopModal.error', { message: '请重试' }));
        }
      },
    });
  };

  // 重新执行
  const handleRetryTask = (task: LYTaskResponse) => {
    if (task.task_status !== 'FAILED') {
      Toast.warning('只能重新执行失败的任务');
      return;
    }

    Modal.confirm({
      title: t('task.retryModal.title'),
      icon: <IconPlayCircle style={{ color: 'var(--semi-color-primary)' }} />,
      content: (
        <>
          <div>{t('task.retryModal.confirmMessage', { taskId: task.task_id })}</div>
          <div style={{ color: 'var(--semi-color-text-2)', marginTop: 8 }}>
            {t('task.retryModal.hint')}
          </div>
        </>
      ),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));
          mockTaskData = mockTaskData.map((item) =>
            item.task_id === task.task_id ? {
              ...item,
              task_status: 'PENDING' as TaskStatus,
              execution_status: null,
              total_execution_count: item.total_execution_count + 1,
            } : item
          );
          loadData();
          Toast.success(t('task.retryModal.success'));
        } catch (error) {
          Toast.error(t('task.retryModal.error', { message: '请重试' }));
        }
      },
    });
  };

  // 重置筛选
  const handleResetFilter = () => {
    setTaskStatusFilter([]);
    setExecutionStatusFilter([]);
    setTriggerSourceFilter([]);
    setDateRange(null);
  };

  // 分页信息
  const { range, list } = listResponse;
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  const columns = [
    {
      title: t('task.table.taskId'),
      dataIndex: 'task_id',
      key: 'task_id',
      width: 140,
      render: (taskId: string, record: LYTaskResponse) => (
        <span
          className="task-management-page-cell-taskid"
          onClick={(e) => {
            e.stopPropagation();
            openTaskDetail(record);
          }}
        >
          {taskId}
        </span>
      ),
    },
    {
      title: t('task.table.processName'),
      dataIndex: 'process_name',
      key: 'process_name',
      width: 160,
      render: (name: string) => (
        <Tooltip content={name} position="top">
          <div className="task-management-page-cell-ellipsis">{name}</div>
        </Tooltip>
      ),
    },
    {
      title: t('task.table.executionTarget'),
      dataIndex: 'execution_target_name',
      key: 'execution_target_name',
      width: 140,
      render: (name: string) => (
        <Tooltip content={name} position="top">
          <div className="task-management-page-cell-ellipsis">{name}</div>
        </Tooltip>
      ),
    },
    {
      title: t('task.table.taskStatus'),
      dataIndex: 'task_status',
      key: 'task_status',
      width: 100,
      render: (status: TaskStatus) => (
        <Tag color={taskStatusConfig[status]?.color || 'grey'} type="light">
          {t(taskStatusConfig[status]?.i18nKey || 'task.status.pending')}
        </Tag>
      ),
    },
    {
      title: t('task.table.executionStatus'),
      dataIndex: 'execution_status',
      key: 'execution_status',
      width: 100,
      render: (status: ExecutionStatus | null) => status ? (
        <Tag color={executionStatusConfig[status]?.color || 'grey'} type="light">
          {t(executionStatusConfig[status]?.i18nKey || '')}
        </Tag>
      ) : '-',
    },
    {
      title: t('task.table.priority'),
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: TaskPriority) => (
        <Tag color={priorityConfig[priority]?.color || 'grey'} type="light">
          {t(priorityConfig[priority]?.i18nKey || 'task.priority.medium')}
        </Tag>
      ),
    },
    {
      title: t('task.table.triggerSource'),
      dataIndex: 'trigger_source',
      key: 'trigger_source',
      width: 100,
      render: (source: TriggerSource) => t(`task.triggerSource.${source.toLowerCase()}`),
    },
    {
      title: t('task.table.createTime'),
      dataIndex: 'create_time',
      key: 'create_time',
      width: 160,
      render: (value: string) => value?.replace('T', ' ').substring(0, 19) || '-',
    },
    {
      title: t('common.actions'),
      dataIndex: 'action',
      key: 'action',
      width: 60,
      render: (_: unknown, record: LYTaskResponse) => {
        // 判断是否有可用操作
        const hasStatusActions = 
          record.task_status === 'PENDING' ||
          record.execution_status === 'RUNNING' ||
          record.task_status === 'FAILED';
        
        // 执行历史入口：只要有过执行记录就显示
        const hasExecutions = record.total_execution_count > 0;
        
        const hasActions = hasStatusActions || hasExecutions;

        if (!hasActions) {
          return null;
        }

        return (
          <Dropdown
            trigger="click"
            position="bottomRight"
            clickToHide
            render={
              <Dropdown.Menu>
                {record.task_status === 'PENDING' && (
                  <Dropdown.Item
                    icon={<IconClose />}
                    onClick={(e) => {
                      e?.stopPropagation();
                      handleCancelTask(record);
                    }}
                  >
                    {t('task.actions.cancel')}
                  </Dropdown.Item>
                )}
                {record.execution_status === 'RUNNING' && (
                  <Dropdown.Item
                    icon={<IconMinusCircleStroked />}
                    onClick={(e) => {
                      e?.stopPropagation();
                      handleStopTask(record);
                    }}
                  >
                    {t('task.actions.stop')}
                  </Dropdown.Item>
                )}
                {record.task_status === 'FAILED' && (
                  <Dropdown.Item
                    icon={<IconPlayCircle />}
                    onClick={(e) => {
                      e?.stopPropagation();
                      handleRetryTask(record);
                    }}
                  >
                    {t('task.actions.retry')}
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
        );
      },
    },
  ];

  return (
    <AppLayout>
      <div className="task-management-page">
        <div className="task-management-page-breadcrumb">
          <Breadcrumb>
            <Breadcrumb.Item onClick={() => navigate('/')}>{t('common.home')}</Breadcrumb.Item>
            <Breadcrumb.Item>{t('task.breadcrumb.schedulingCenter')}</Breadcrumb.Item>
            <Breadcrumb.Item>{t('task.breadcrumb.taskExecution')}</Breadcrumb.Item>
            <Breadcrumb.Item>{t('task.breadcrumb.taskList')}</Breadcrumb.Item>
          </Breadcrumb>
        </div>

        <div className="task-management-page-header">
          <div className="task-management-page-header-title">
            <Title heading={4}>{t('task.title')}</Title>
          </div>
          <Row type="flex" justify="space-between" align="middle" className="task-management-page-header-toolbar">
            <Col>
              <Space>
                <Input
                  prefix={<IconSearch />}
                  placeholder={t('task.searchPlaceholder')}
                  style={{ width: 320 }}
                  value={searchValue}
                  onChange={handleSearch}
                  showClear
                />
                <FilterPopover
                  visible={filterPopoverVisible}
                  onVisibleChange={setFilterPopoverVisible}
                  sections={[
                    {
                      key: 'taskStatus',
                      label: t('task.filter.taskStatus'),
                      type: 'checkbox',
                      options: taskStatusOptions,
                      value: taskStatusFilter,
                      onChange: (value) => setTaskStatusFilter(value as string[]),
                    },
                    {
                      key: 'executionStatus',
                      label: t('task.filter.executionStatus'),
                      type: 'checkbox',
                      options: executionStatusOptions,
                      value: executionStatusFilter,
                      onChange: (value) => setExecutionStatusFilter(value as string[]),
                    },
                    {
                      key: 'triggerSource',
                      label: t('task.filter.triggerSource'),
                      type: 'checkbox',
                      options: triggerSourceOptions,
                      value: triggerSourceFilter,
                      onChange: (value) => setTriggerSourceFilter(value as string[]),
                    },
                    {
                      key: 'dateRange',
                      label: t('task.filter.dateRange'),
                      type: 'dateRange',
                      value: dateRange,
                      onChange: (value) => setDateRange(value as [Date, Date] | null),
                    },
                  ]}
                  onReset={handleResetFilter}
                />
              </Space>
            </Col>
            <Col>
              <Space>
                <Button icon={<IconRefresh />} onClick={handleRefresh}>
                  {t('task.refresh')}
                </Button>
                <Button
                  icon={<IconPlus />}
                  theme="solid"
                  type="primary"
                  onClick={() => setCreateModalVisible(true)}
                >
                  {t('task.createTask')}
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <div className="task-management-page-table">
          {isInitialLoad ? (
            <TableSkeleton />
          ) : list.length === 0 ? (
            <EmptyState
              variant={searchValue || taskStatusFilter.length > 0 || executionStatusFilter.length > 0 ? 'noResult' : 'noData'}
              description={
                searchValue || taskStatusFilter.length > 0 || executionStatusFilter.length > 0
                  ? t('task.empty.filterDescription')
                  : t('task.empty.defaultDescription')
              }
            />
          ) : (
            <Table
              size="middle"
              columns={columns}
              dataSource={list}
              rowKey="task_id"
              loading={loading && !isInitialLoad}
              pagination={{
                total,
                pageSize,
                currentPage,
                onPageChange: (page) => {
                  setQueryParams((prev) => ({ ...prev, offset: (page - 1) * pageSize }));
                },
                onPageSizeChange: (size) => {
                  setQueryParams((prev) => ({ ...prev, offset: 0, size }));
                },
                showSizeChanger: true,
                pageSizeOpts: [10, 20, 50, 100],
              }}
              onRow={(record) => ({
                onClick: () => openTaskDetail(record as LYTaskResponse),
                style: { cursor: 'pointer' },
                className: selectedTask?.task_id === (record as LYTaskResponse).task_id && detailDrawerVisible ? 'task-row-selected' : '',
              })}
            />
          )}
        </div>

        <CreateTaskModal
          visible={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          onSuccess={() => {
            setCreateModalVisible(false);
            loadData();
          }}
        />

        <TaskDetailDrawer
          visible={detailDrawerVisible}
          task={selectedTask}
          onClose={() => {
            setDetailDrawerVisible(false);
            setSelectedTask(null);
          }}
          onCancel={handleCancelTask}
          onStop={handleStopTask}
          onRetry={handleRetryTask}
          dataSource={list}
          onSelectTask={setSelectedTask}
          currentPage={currentPage}
          totalPages={Math.ceil(total / pageSize)}
          initialTab={initialTab}
          onPageChange={async (page) => {
            setQueryParams((prev) => ({ ...prev, offset: (page - 1) * pageSize }));
            const response = await fetchTaskList({
              ...queryParams,
              offset: (page - 1) * pageSize,
              task_status: taskStatusFilter.length > 0 ? taskStatusFilter as TaskStatus[] : undefined,
              execution_status: executionStatusFilter.length > 0 ? executionStatusFilter as ExecutionStatus[] : undefined,
              trigger_source: triggerSourceFilter.length > 0 ? triggerSourceFilter as TriggerSource[] : undefined,
            });
            setListResponse(response);
            return response.list;
          }}
        />
      </div>
    </AppLayout>
  );
};

export default TaskManagementPage;
