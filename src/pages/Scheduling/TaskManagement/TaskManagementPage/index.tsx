import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
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
import { IconSearchStroked } from '@douyinfe/semi-icons';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import FilterPopover from '@/components/FilterPopover';
import DepartmentSelect from '@/components/DepartmentSelect';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskDetailDrawer from '../components/TaskDetailDrawer';
import { Bot, ClipboardClock, Component, Ellipsis, MinusCircle, PlayCircle, Plus, RefreshCw, UserPlus, XCircle } from 'lucide-react';
import type { 
  LYTaskResponse, 
  GetTasksParams, 
  LYListResponseLYTaskResponse,
  LYExecutionTemplateResponse,
  TaskStatus,
  ExecutionStatus,
  TriggerSource,
  TaskPriority,
} from '@/api';
import { useCollaboratorAction } from '@/hooks/useCollaboratorAction';
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

// ============= MockDatageneration =============

const mockCreatorNameMap: Record<string, string> = {
  'user-001': 'John Smith',
  'user-002': 'Jane Doe',
  'user-003': 'Mike Wang',
  'user-004': 'David Zhao',
  'user-005': 'Chris Qian',
};

const generateMockTaskResponse = (index: number): LYTaskResponse => {
  const processNames = [
    'Auto Order Processing',
    'Expense Reimbursement Approval',
    'Employee Onboarding Flow',
    'Purchase Request Process',
    'Contract Approval Process',
  ];

  const targetNames = [
    'Order Processing Group',
    'Finance Approval Group',
    'HR Management Group',
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

  const deptNames = ['Finance Department', 'Enterprise Business Center', 'Human Resources Department', 'R&D Center', 'Finance Department'];

  return {
    task_id: `TASK-${String(100000 + index).substring(1)}`,
    process_id: generateUUID(),
    process_name: processNames[index % processNames.length],
    owning_department_name: deptNames[index % deptNames.length],
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
      error_message: taskStatus === 'FAILED' ? 'ExecuteTimeout: NetworkConnectionFailed' : null,
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
      error_message: i > 0 ? 'Execution failed: Target element not found' : null,
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

  // Search过滤
  if (params.keyword?.trim()) {
    const keyword = params.keyword.toLowerCase().trim();
    filteredData = filteredData.filter((item) =>
      item.task_id.toLowerCase().includes(keyword) ||
      item.process_name.toLowerCase().includes(keyword)
    );
  }

  // taskStatusFilter
  if (params.task_status && params.task_status.length > 0) {
    filteredData = filteredData.filter((item) => params.task_status!.includes(item.task_status));
  }

  // ExecuteStatusFilter
  if (params.execution_status && params.execution_status.length > 0) {
    filteredData = filteredData.filter((item) => 
      item.execution_status && params.execution_status!.includes(item.execution_status)
    );
  }

  // Trigger源Filter
  if (params.trigger_source && params.trigger_source.length > 0) {
    filteredData = filteredData.filter((item) => params.trigger_source!.includes(item.trigger_source));
  }

  // 归属部门Filter
  if ((params as any).owning_department_name && (params as any).owning_department_name.length > 0) {
    const deptNames: string[] = (params as any).owning_department_name;
    filteredData = filteredData.filter((item) => deptNames.includes((item as any).owning_department_name));
  }

  // Time范围Filter
  if (params.start_time) {
    const startDate = new Date(params.start_time);
    filteredData = filteredData.filter((item) => new Date(item.create_time) >= startDate);
  }
  if (params.end_time) {
    const endDate = new Date(params.end_time);
    filteredData = filteredData.filter((item) => new Date(item.create_time) <= endDate);
  }

  // Sort
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

// ============= StatusConfig =============

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
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { openCollaborator, renderCollaboratorPanel } = useCollaboratorAction();

  const [searchValue, setSearchValue] = useState('');
  const [queryParams, setQueryParams] = useState<GetTasksParams>({
    offset: 0,
    size: 20,
    keyword: '',
    sort_by: 'create_time',
    sort_order: 'desc',
  });

  // FilterStatus
  const [taskStatusFilter, setTaskStatusFilter] = useState<string[]>([]);
  const [executionStatusFilter, setExecutionStatusFilter] = useState<string[]>([]);
  const [triggerSourceFilter, setTriggerSourceFilter] = useState<string[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // from首页快捷入口跳转时auto-open新建Modal
  useEffect(() => {
    if ((location.state as any)?.openCreate) {
      setCreateModalVisible(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [initialTemplate, setInitialTemplate] = useState<LYExecutionTemplateResponse | null>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [initialTab, setInitialTab] = useState<'basicInfo' | 'executionHistory'>('basicInfo');

  const [listResponse, setListResponse] = useState<LYListResponseLYTaskResponse>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });
  const [selectedTask, setSelectedTask] = useState<LYTaskResponse | null>(null);

  // Filter选项
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

  // departmentOptions removed - using DepartmentSelect with tree data

  // LoadingData
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchTaskList({
        ...queryParams,
        task_status: taskStatusFilter.length > 0 ? taskStatusFilter as TaskStatus[] : undefined,
        execution_status: executionStatusFilter.length > 0 ? executionStatusFilter as ExecutionStatus[] : undefined,
        trigger_source: triggerSourceFilter.length > 0 ? triggerSourceFilter as TriggerSource[] : undefined,
        owning_department_name: departmentFilter,
        start_time: dateRange?.[0]?.toISOString(),
        end_time: dateRange?.[1]?.toISOString(),
      } as any);
      setListResponse(response);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [queryParams, taskStatusFilter, executionStatusFilter, triggerSourceFilter, departmentFilter, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // from URL Parameter恢复DrawerStatus(usefor from录屏页面Back)或open新建taskModal(fromTemplate页面跳转)
  useEffect(() => {
    const taskIdFromUrl = searchParams.get('taskId');
    const activeTabFromUrl = searchParams.get('activeTab');
    const templateIdFromUrl = searchParams.get('templateId');

    // processingTemplateID - from localStorage 获取TemplateData并open新建taskModal
    if (templateIdFromUrl) {
      // from sessionStorage 获取传递's TemplateData
      const templateDataStr = sessionStorage.getItem(`template_${templateIdFromUrl}`);
      if (templateDataStr) {
        try {
          const templateData = JSON.parse(templateDataStr) as LYExecutionTemplateResponse;
          setInitialTemplate(templateData);
          setCreateModalVisible(true);
          // Cleanup sessionStorage
          sessionStorage.removeItem(`template_${templateIdFromUrl}`);
        } catch (e) {
          console.error('Failed to parse template data:', e);
        }
      }
      // 清除 URL Parameter
      setSearchParams({}, { replace: true });
      return;
    }

    // processingtaskID - openDetails drawer
    if (taskIdFromUrl && listResponse.list.length > 0) {
      const task = listResponse.list.find((t) => t.task_id === taskIdFromUrl);
      if (task) {
        setSelectedTask(task);
        // Settings初始 tab
        if (activeTabFromUrl === 'executionHistory') {
          setInitialTab('executionHistory');
        } else {
          setInitialTab('basicInfo');
        }
        setDetailDrawerVisible(true);
        // 清除 URL Parameter
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, listResponse.list, setSearchParams]);

  // Searchdebounced
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

  // openDetails drawer
  const openTaskDetail = (record: LYTaskResponse) => {
    setSelectedTask(record);
    setDetailDrawerVisible(true);
  };

  // Canceltask
  const handleCancelTask = (task: LYTaskResponse) => {
    if (task.task_status !== 'PENDING') {
      Toast.warning('Can only cancel tasks in pending execution status');
      return;
    }

    Modal.confirm({
      title: t('task.cancelModal.title'),      content: (
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
          Toast.error(t('task.cancelModal.error', { message: 'Please retry' }));
        }
      },
    });
  };

  // Stoptask
  const handleStopTask = (task: LYTaskResponse) => {
    if (task.execution_status !== 'RUNNING') {
      Toast.warning('Can only stop running tasks');
      return;
    }

    Modal.confirm({
      title: t('task.stopModal.title'),      content: (
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
          Toast.error(t('task.stopModal.error', { message: 'Please retry' }));
        }
      },
    });
  };

  // 重新Execute
  const handleRetryTask = (task: LYTaskResponse) => {
    if (task.task_status !== 'FAILED') {
      Toast.warning('Can only retry failed tasks');
      return;
    }

    Modal.confirm({
      title: t('task.retryModal.title'),      content: (
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
          Toast.error(t('task.retryModal.error', { message: 'Please retry' }));
        }
      },
    });
  };

  // FilterConfirm
  const handleFilterConfirm = (values: Record<string, unknown>) => {
    setTaskStatusFilter((values.taskStatus as string[]) || []);
    setExecutionStatusFilter((values.executionStatus as string[]) || []);
    setTriggerSourceFilter((values.triggerSource as string[]) || []);
    setDateRange((values.dateRange as [Date, Date] | null) || null);
  };

  // 分页Info
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
      ellipsis: true,
    },
    {
      title: t('task.table.processName'),
      dataIndex: 'process_name',
      key: 'process_name',
      width: 160,
      ellipsis: true,
    },
    {
      title: t('task.table.executionTarget'),
      dataIndex: 'execution_target_name',
      key: 'execution_target_name',
      width: 160,
      ellipsis: true,
      render: (text: string, record: any) => {
        const isGroup = record.execution_target_type === 'BOT_GROUP';
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '100%' }}>
            {isGroup ? (
              <Component size={14} strokeWidth={2} style={{ flexShrink: 0, color: '#3b82f6' }} />
            ) : (
              <Bot size={14} strokeWidth={2} style={{ flexShrink: 0, color: '#f97316' }} />
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text || '-'}</span>
          </span>
        );
      },
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
      title: t('common.owningDepartment'),
      dataIndex: 'owning_department_name',
      key: 'owning_department_name',
      width: 140,
      ellipsis: true,
      render: (text: string | null) => text || '-',
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
        return (
          <Dropdown
            trigger="click"
            position="bottomRight"
            clickToHide
            render={
              <Dropdown.Menu>
                {record.task_status === 'PENDING' && (
                  <Dropdown.Item
                    icon={<XCircle size={16} strokeWidth={2} />}
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
                    icon={<MinusCircle size={16} strokeWidth={2} />}
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
                    icon={<PlayCircle size={16} strokeWidth={2} />}
                    onClick={(e) => {
                      e?.stopPropagation();
                      handleRetryTask(record);
                    }}
                  >
                    {t('task.actions.retry')}
                  </Dropdown.Item>
                )}
                <Dropdown.Item
                    icon={<UserPlus size={14} strokeWidth={2} />}
                    onClick={(e) => {
                      e?.stopPropagation();
                      openCollaborator(record.task_id);
                    }}
                  >
                    {t('collaborator.actions.addCollaborator')}
                  </Dropdown.Item>
              </Dropdown.Menu>
            }
          >
            <Button
              icon={<Ellipsis size={16} strokeWidth={2} />}
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
      <div className="task-management-page">

        <div className="task-management-page-header">
          <div className="task-management-page-header-title">
            <Title heading={3}>{t('task.title')}</Title>
            <Button
              icon={<ClipboardClock size={16} strokeWidth={2} />}
              onClick={() => navigate('/scheduling-center/task-execution/templates')}
            >
              {t('template.entryButton')}
            </Button>
          </div>
          <Row type="flex" justify="space-between" align="middle" className="task-management-page-header-toolbar">
            <Col>
              <Space>
                <Input
                  prefix={<IconSearchStroked />}
                  placeholder={t('task.searchPlaceholder')}
                  style={{ width: 320 }}
                  value={searchValue}
                  onChange={handleSearch}
                  showClear
                />
                <DepartmentSelect
                  placeholder={t('common.filterDepartment')}
                  value={departmentFilter}
                  onChange={(v) => {
                    setDepartmentFilter(v);
                    setQueryParams(prev => ({ ...prev, offset: 0 }));
                  }}
                  multiple
                  showClear
                  maxTagCount={1}
                  useNameAsValue
                  style={{ width: 'auto', minWidth: 120, maxWidth: 600 }}
                />
                <FilterPopover
                  visible={filterPopoverVisible}
                  onVisibleChange={setFilterPopoverVisible}
                  onConfirm={handleFilterConfirm}
                  sections={[
                    {
                      key: 'taskStatus',
                      label: t('task.filter.taskStatus'),
                      type: 'checkbox',
                      options: taskStatusOptions,
                      value: taskStatusFilter,
                    },
                    {
                      key: 'executionStatus',
                      label: t('task.filter.executionStatus'),
                      type: 'checkbox',
                      options: executionStatusOptions,
                      value: executionStatusFilter,
                    },
                    {
                      key: 'triggerSource',
                      label: t('task.filter.triggerSource'),
                      type: 'checkbox',
                      options: triggerSourceOptions,
                      value: triggerSourceFilter,
                    },
                    {
                      key: 'dateRange',
                      label: t('task.filter.dateRange'),
                      type: 'dateRange',
                      value: dateRange,
                    },
                  ]}
                />
              </Space>
            </Col>
            <Col>
              <Space>
                <Button icon={<RefreshCw size={16} strokeWidth={2} />} onClick={handleRefresh}>
                  {t('task.refresh')}
                </Button>
                <Button
                  icon={<Plus size={16} strokeWidth={2} />}
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
              size="small"
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
                showTotal: true,
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
          onCancel={() => {
            setCreateModalVisible(false);
            setInitialTemplate(null);
          }}
          onSuccess={() => {
            setCreateModalVisible(false);
            setInitialTemplate(null);
            loadData();
          }}
          initialTemplate={initialTemplate}
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
          initialTab={initialTab}
          collaboratorProps={selectedTask ? {
            assetType: 'TASK',
            assetId: selectedTask.task_id,
            context: 'scheduling',
            canManage: true,
          } : undefined}
          pagination={{
            currentPage,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          }}
          onPageChange={async (page, direction) => {
            setQueryParams((prev) => ({ ...prev, offset: (page - 1) * pageSize }));
            const response = await fetchTaskList({
              ...queryParams,
              offset: (page - 1) * pageSize,
              task_status: taskStatusFilter.length > 0 ? taskStatusFilter as TaskStatus[] : undefined,
              execution_status: executionStatusFilter.length > 0 ? executionStatusFilter as ExecutionStatus[] : undefined,
              trigger_source: triggerSourceFilter.length > 0 ? triggerSourceFilter as TriggerSource[] : undefined,
            });
            setListResponse(response);
          }}
        />
        {renderCollaboratorPanel('TASK', 'scheduling')}
      </div>
  );
};

export default TaskManagementPage;
