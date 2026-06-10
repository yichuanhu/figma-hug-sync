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
  
  Modal,
  Toast,
  Space,
  Pagination,
  Select,
  DatePicker,
  
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import FilterPopover from '@/components/FilterPopover';
import DepartmentSearchSelect, { expandDepartmentValues } from '@/components/DepartmentSearchSelect';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskDetailDrawer from '../components/TaskDetailDrawer';
import { Bot, ClipboardClock, Component, Download, Ellipsis, History, MinusCircle, PlayCircle, Plus, RefreshCw, X, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

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

import './index.less';

const { Title, Text } = Typography;

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

// 流程列表（与任务 mock 对齐）
const mockProcessList = [
  { process_id: 'proc-001', process_name: 'Auto Order Processing' },
  { process_id: 'proc-002', process_name: 'Expense Reimbursement Approval' },
  { process_id: 'proc-003', process_name: 'Employee Onboarding Flow' },
  { process_id: 'proc-004', process_name: 'Purchase Request Process' },
  { process_id: 'proc-005', process_name: 'Contract Approval Process' },
];

// 执行目标 mock
const mockWorkerList = [
  { id: 'worker-001', name: 'RPA-BOT-001' },
  { id: 'worker-002', name: 'RPA-BOT-002' },
  { id: 'worker-003', name: 'RPA-BOT-003' },
  { id: 'worker-004', name: 'RPA-BOT-004' },
  { id: 'worker-005', name: 'RPA-BOT-005' },
];

const mockWorkerGroupList = [
  { id: 'group-001', name: 'Order Processing Group' },
  { id: 'group-002', name: 'Finance Approval Group' },
  { id: 'group-003', name: 'HR Management Group' },
];

// 触发器 mock
const mockTriggerList = [
  { trigger_id: 'trg-001', trigger_name: 'Daily Order Sync', trigger_source: 'SCHEDULED' as const },
  { trigger_id: 'trg-002', trigger_name: 'Weekly Report', trigger_source: 'SCHEDULED' as const },
  { trigger_id: 'trg-003', trigger_name: 'Order Queue Trigger', trigger_source: 'QUEUE' as const },
  { trigger_id: 'trg-004', trigger_name: 'Reimburse Queue', trigger_source: 'QUEUE' as const },
];

const generateMockTaskResponse = (index: number): LYTaskResponse & { trigger_id: string | null; trigger_name: string | null; worker_id: string | null; worker_group_id: string | null; has_screenshot: boolean } => {
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

  const triggerSource = triggerSources[index % triggerSources.length];
  const matchedTrigger =
    triggerSource === 'SCHEDULED' || triggerSource === 'QUEUE'
      ? mockTriggerList.filter((t) => t.trigger_source === triggerSource)[index % 2]
      : null;
  const targetType = targetTypes[index % targetTypes.length];
  const isGroupTarget = targetType === 'BOT_GROUP';
  const targetEntity = isGroupTarget
    ? mockWorkerGroupList[index % mockWorkerGroupList.length]
    : mockWorkerList[index % mockWorkerList.length];
  const targetName = targetEntity.name;
  const processEntity = mockProcessList[index % mockProcessList.length];

  return {
    task_id: `TASK-${String(100000 + index).substring(1)}`,
    process_id: processEntity.process_id,
    process_name: processEntity.process_name,
    owning_department_name: deptNames[index % deptNames.length],
    process_version_id: generateUUID(),
    process_version: `v${(index % 5) + 1}.0.0`,
    execution_target_type: targetType,
    execution_target_id: targetEntity.id,
    execution_target_name: targetName,

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
    trigger_id: matchedTrigger?.trigger_id ?? null,
    trigger_name: matchedTrigger?.trigger_name ?? null,
    worker_id: isGroupTarget ? null : targetEntity.id,
    worker_group_id: isGroupTarget ? targetEntity.id : null,
    has_screenshot: hasExecution && (index % 3 !== 0),
  };
};

const generateMockTaskList = (): LYTaskResponseExt[] => {
  return Array(58).fill(null).map((_, index) => generateMockTaskResponse(index));
};

type LYTaskResponseExt = LYTaskResponse & {
  trigger_id: string | null;
  trigger_name: string | null;
  worker_id: string | null;
  worker_group_id: string | null;
  has_screenshot: boolean;
};

let mockTaskData = generateMockTaskList();


type ExtTasksParams = GetTasksParams & {
  owning_department_name?: string[];
  process_ids?: string[];
  trigger_ids?: string[];
  execution_target_type?: 'WORKER' | 'WORKER_GROUP' | null;
  execution_target_ids?: string[];
  priorities?: string[];
  enable_recording?: boolean | null;
  has_screenshot?: boolean | null;
  created_at_start?: string;
  created_at_end?: string;
};

const fetchTaskList = async (params: ExtTasksParams): Promise<LYListResponseLYTaskResponse> => {
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

  // 流程过滤
  if (params.process_ids && params.process_ids.length > 0) {
    filteredData = filteredData.filter((item) => params.process_ids!.includes(item.process_id));
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

  // 所属触发器（多选并集）
  if (params.trigger_ids && params.trigger_ids.length > 0) {
    filteredData = filteredData.filter((item) => item.trigger_id && params.trigger_ids!.includes(item.trigger_id));
  }

  // 执行目标（多选并集）
  if (params.execution_target_type && params.execution_target_ids && params.execution_target_ids.length > 0) {
    const ids = params.execution_target_ids;
    filteredData = filteredData.filter((item) => {
      if (params.execution_target_type === 'WORKER_GROUP') {
        return item.worker_group_id ? ids.includes(item.worker_group_id) : false;
      }
      return item.worker_id ? ids.includes(item.worker_id) : false;
    });
  }

  // 优先级
  if (params.priorities && params.priorities.length > 0) {
    filteredData = filteredData.filter((item) => params.priorities!.includes(item.priority));
  }

  // 录屏
  if (params.enable_recording === true || params.enable_recording === false) {
    filteredData = filteredData.filter((item) => item.enable_recording === params.enable_recording);
  }

  // 截图
  if (params.has_screenshot === true) {
    filteredData = filteredData.filter((item) => item.has_screenshot === true);
  }

  // 归属部门Filter
  if (params.owning_department_name && params.owning_department_name.length > 0) {
    const deptNames = params.owning_department_name;
    filteredData = filteredData.filter((item) => deptNames.includes((item as any).owning_department_name));
  }

  // 创建时间范围
  if (params.created_at_start) {
    const startDate = new Date(params.created_at_start);
    filteredData = filteredData.filter((item) => new Date(item.create_time) >= startDate);
  }
  if (params.created_at_end) {
    const endDate = new Date(params.created_at_end);
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
  

  const [searchValue, setSearchValue] = useState('');
  const [queryParams, setQueryParams] = useState<GetTasksParams>({
    offset: 0,
    size: 20,
    keyword: '',
    sort_by: 'create_time',
    sort_order: 'desc',
  });

  // FilterStatus
  // 顶部常驻
  const [processFilter, setProcessFilter] = useState<string[]>([]);
  const [taskStatusFilter, setTaskStatusFilter] = useState<string[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [includeSubDepts, setIncludeSubDepts] = useState(false);
  const effectiveDepartmentFilter = useMemo(() => expandDepartmentValues(departmentFilter, includeSubDepts, true), [departmentFilter, includeSubDepts]);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  // 收纳面板
  const [executionStatusFilter, setExecutionStatusFilter] = useState<string[]>([]);
  const [triggerSourceFilter, setTriggerSourceFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [triggerIdFilter, setTriggerIdFilter] = useState<string[]>([]);
  const [executionTargetType, setExecutionTargetType] = useState<'WORKER' | 'WORKER_GROUP' | null>(null);
  const [executionTargetIds, setExecutionTargetIds] = useState<string[]>([]);
  const [enableRecordingFilter, setEnableRecordingFilter] = useState<boolean | null>(null);
  const [hasScreenshotFilter, setHasScreenshotFilter] = useState<boolean | null>(null);
  const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);

  // 批量选择
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);


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

  // 优先级选项
  const priorityOptions = useMemo(() => [
    { value: 'HIGH', label: t('task.priority.high') },
    { value: 'MEDIUM', label: t('task.priority.medium') },
    { value: 'LOW', label: t('task.priority.low') },
    { value: 'MANUAL_QUEUE_BREAKER', label: t('task.priority.manualQueueBreaker') },
  ], [t]);

  // 触发器选项（根据触发来源动态过滤）
  const triggerOptions = useMemo(() => {
    return mockTriggerList
      .filter((trg) => triggerSourceFilter.length === 0 || triggerSourceFilter.includes(trg.trigger_source))
      .map((trg) => ({ value: trg.trigger_id, label: trg.trigger_name }));
  }, [triggerSourceFilter]);

  // 流程选项
  const processOptions = useMemo(() =>
    mockProcessList.map((p) => ({ value: p.process_id, label: p.process_name })), []);

  // 执行目标选项（按 type）
  const executionTargetOptions = useMemo(() => {
    if (executionTargetType === 'WORKER_GROUP') {
      return mockWorkerGroupList.map((g) => ({ value: g.id, label: g.name }));
    }
    return mockWorkerList.map((w) => ({ value: w.id, label: w.name }));
  }, [executionTargetType]);

  // LoadingData
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchTaskList({
        ...queryParams,
        task_status: taskStatusFilter.length > 0 ? taskStatusFilter as TaskStatus[] : undefined,
        execution_status: executionStatusFilter.length > 0 ? executionStatusFilter as ExecutionStatus[] : undefined,
        trigger_source: triggerSourceFilter.length > 0 ? triggerSourceFilter as TriggerSource[] : undefined,
        owning_department_name: effectiveDepartmentFilter,
        process_ids: processFilter,
        priorities: priorityFilter,
        trigger_ids: triggerIdFilter,
        execution_target_type: executionTargetType,
        execution_target_ids: executionTargetIds,
        enable_recording: enableRecordingFilter,
        has_screenshot: hasScreenshotFilter,
        created_at_start: dateRange?.[0]?.toISOString(),
        created_at_end: dateRange?.[1]?.toISOString(),
      });
      setListResponse(response);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [queryParams, taskStatusFilter, executionStatusFilter, triggerSourceFilter, departmentFilter, includeSubDepts, dateRange, processFilter, priorityFilter, triggerIdFilter, executionTargetType, executionTargetIds, enableRecordingFilter, hasScreenshotFilter]);


  useEffect(() => {
    loadData();
  }, [loadData]);

  // 切换筛选条件或分页时清空选中
  useEffect(() => {
    setSelectedRowKeys([]);
  }, [queryParams.offset, queryParams.size, queryParams.keyword, processFilter, taskStatusFilter, departmentFilter, includeSubDepts, dateRange, executionStatusFilter, triggerSourceFilter, priorityFilter, triggerIdFilter, executionTargetType, executionTargetIds, enableRecordingFilter, hasScreenshotFilter]);

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

    // processingtaskID - openDetails drawer（mock 环境下未命中则演示用打开第一条）
    if (taskIdFromUrl && listResponse.list.length > 0) {
      const task =
        listResponse.list.find((t) => t.task_id === taskIdFromUrl) || listResponse.list[0];
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

  // 导出任务清单（按当前筛选条件）
  const [exporting, setExporting] = useState(false);
  const EXPORT_LIMIT = 10000;

  const buildCurrentFilterParams = (): ExtTasksParams => ({
    ...queryParams,
    offset: 0,
    size: EXPORT_LIMIT + 1,
    task_status: taskStatusFilter.length > 0 ? (taskStatusFilter as TaskStatus[]) : undefined,
    execution_status: executionStatusFilter.length > 0 ? (executionStatusFilter as ExecutionStatus[]) : undefined,
    trigger_source: triggerSourceFilter.length > 0 ? (triggerSourceFilter as TriggerSource[]) : undefined,
    owning_department_name: effectiveDepartmentFilter,
    process_ids: processFilter,
    priorities: priorityFilter,
    trigger_ids: triggerIdFilter,
    execution_target_type: executionTargetType,
    execution_target_ids: executionTargetIds,
    enable_recording: enableRecordingFilter,
    has_screenshot: hasScreenshotFilter,
    created_at_start: dateRange?.[0]?.toISOString(),
    created_at_end: dateRange?.[1]?.toISOString(),
  });

  const formatExportDateTime = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const buildExportRows = (rows: LYTaskResponseExt[]) => {
    const headers = [
      '任务编号', '流程名称', '任务状态', '执行目标', '所属触发器',
      '任务创建时间', '优先级', '是否录屏', '是否包含任务截图', '创建人', '所属部门',
    ];
    const body = rows.map((r) => [
      r.task_id,
      r.process_name,
      t(taskStatusConfig[r.task_status].i18nKey),
      r.execution_target_name ?? '',
      r.trigger_name ?? r.trigger_id ?? t(`task.triggerSource.${r.trigger_source.toLowerCase()}`),
      formatExportDateTime(r.create_time),
      t(priorityConfig[r.priority].i18nKey),
      r.enable_recording ? '是' : '否',
      r.has_screenshot ? '是' : '否',
      r.creator_name ?? '',
      (r as unknown as { owning_department_name?: string }).owning_department_name ?? '',
    ]);
    return [headers, ...body];
  };

  const writeExportFile = (rows: LYTaskResponseExt[]) => {
    const aoa = buildExportRows(rows);
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [
      { wch: 14 }, { wch: 28 }, { wch: 10 }, { wch: 22 }, { wch: 20 },
      { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 22 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '任务清单');
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const fileName = `任务清单_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const collectActiveFilterSummary = (): string[] => {
    const items: string[] = [];
    if (queryParams.keyword?.trim()) items.push(`关键词：${queryParams.keyword.trim()}`);
    if (processFilter.length) items.push(`流程：${processFilter.length} 项`);
    if (taskStatusFilter.length) items.push(`任务状态：${taskStatusFilter.length} 项`);
    if (departmentFilter.length) items.push(`所属部门：${departmentFilter.length} 项${includeSubDepts ? '（含子部门）' : ''}`);
    if (dateRange) items.push('创建时间：已设置');
    if (executionStatusFilter.length) items.push(`执行状态：${executionStatusFilter.length} 项`);
    if (triggerSourceFilter.length) items.push(`触发来源：${triggerSourceFilter.length} 项`);
    if (priorityFilter.length) items.push(`优先级：${priorityFilter.length} 项`);
    if (triggerIdFilter.length) items.push(`所属触发器：${triggerIdFilter.length} 项`);
    if (executionTargetType && executionTargetIds.length) items.push(`执行目标：${executionTargetIds.length} 项`);
    if (enableRecordingFilter !== null) items.push(`是否录屏：${enableRecordingFilter ? '是' : '否'}`);
    if (hasScreenshotFilter === true) items.push('仅包含截图：是');
    return items;
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const params = buildCurrentFilterParams();
      const resp = await fetchTaskList(params);
      const count = resp.range?.total ?? 0;
      if (count === 0) {
        Toast.info('当前筛选条件下没有可导出的任务');
        return;
      }
      if (count > EXPORT_LIMIT) {
        Toast.warning(`当前筛选结果共 ${count} 条，超过单次导出上限 ${EXPORT_LIMIT} 条，请缩小筛选范围后重新导出`);
        return;
      }
      const summary = collectActiveFilterSummary();
      const visibleSummary = summary.slice(0, 8);
      const extra = summary.length - visibleSummary.length;
      Modal.confirm({
        title: '导出任务清单',
        content: (
          <div style={{ lineHeight: '22px' }}>
            <div>导出范围：当前筛选条件下的全部任务</div>
            <div style={{ marginTop: 4 }}>
              预计导出数量：<strong>{count}</strong> 条
            </div>
            {summary.length > 0 && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--semi-color-fill-0)', borderRadius: 6 }}>
                <div style={{ color: 'var(--semi-color-text-2)', marginBottom: 4, fontSize: 12 }}>当前筛选条件</div>
                {visibleSummary.map((s) => (
                  <div key={s} style={{ fontSize: 13 }}>· {s}</div>
                ))}
                {extra > 0 && (
                  <div style={{ fontSize: 13, color: 'var(--semi-color-text-2)' }}>等 {extra} 项筛选</div>
                )}
              </div>
            )}
          </div>
        ),
        okText: '确认导出',
        cancelText: '取消',
        onOk: async () => {
          try {
            const rows = (resp.list as LYTaskResponseExt[]).slice(0, count);
            writeExportFile(rows);
            console.info('[audit] export_task_list', { total: count, filters: summary });
            Toast.success(`导出成功，共 ${count} 条`);
          } catch (e) {
            console.error('export failed', e);
            Toast.error('导出失败，请稍后重试');
          }
        },
      });
    } catch (e) {
      console.error('export prefetch failed', e);
      Toast.error('导出失败，请稍后重试');
    } finally {
      setExporting(false);
    }
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

  // FilterConfirm（仅处理收纳面板内的条件）
  const handleFilterConfirm = (values: Record<string, unknown>) => {
    setExecutionStatusFilter((values.executionStatus as string[]) || []);
    setTriggerSourceFilter((values.triggerSource as string[]) || []);
    setPriorityFilter((values.priority as string[]) || []);
    setTriggerIdFilter((values.triggerId as string[]) || []);
    setEnableRecordingFilter(values.enableRecording === true || values.enableRecording === false ? values.enableRecording as boolean : null);
    setHasScreenshotFilter((values.hasScreenshot as boolean[] | undefined)?.includes(true) ? true : null);
    const target = values.executionTarget as { type: 'WORKER' | 'WORKER_GROUP' | null; ids: string[] } | null;
    setExecutionTargetType(target?.type ?? null);
    setExecutionTargetIds(target?.ids ?? []);
    setQueryParams((prev) => ({ ...prev, offset: 0 }));
  };

  // 清除所有筛选
  const handleClearAllFilters = () => {
    setSearchValue('');
    setProcessFilter([]);
    setTaskStatusFilter([]);
    setDepartmentFilter([]);
    setDateRange(null);
    setExecutionStatusFilter([]);
    setTriggerSourceFilter([]);
    setPriorityFilter([]);
    setTriggerIdFilter([]);
    setExecutionTargetType(null);
    setExecutionTargetIds([]);
    setEnableRecordingFilter(null);
    setHasScreenshotFilter(null);
    setQueryParams((prev) => ({ ...prev, offset: 0, keyword: '' }));
  };

  // 批量取消
  const handleBulkCancel = () => {
    const selectedTasks = list.filter((t) => selectedRowKeys.includes(t.task_id));
    const cancellable = selectedTasks.filter((t) => t.task_status === 'PENDING');
    const uncancellable = selectedTasks.length - cancellable.length;

    if (selectedTasks.length > 100) {
      Toast.warning('单次最多取消 100 个任务');
      return;
    }

    Modal.confirm({
      title: '批量取消任务',
      content: (
        <div style={{ lineHeight: '22px' }}>
          <div>已选择 <strong>{selectedTasks.length}</strong> 个任务</div>
          <div>当前可取消 <strong style={{ color: 'var(--semi-color-success)' }}>{cancellable.length}</strong> 个</div>
          <div>不可取消 <strong style={{ color: 'var(--semi-color-text-2)' }}>{uncancellable}</strong> 个</div>
          <div style={{ color: 'var(--semi-color-text-2)', marginTop: 8 }}>最终结果以服务端返回为准</div>
        </div>
      ),
      okText: '确认取消',
      cancelText: '取消',
      okButtonProps: { type: 'warning' },
      onOk: async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const cancellableIds = new Set(cancellable.map((t) => t.task_id));
        const items: Array<{ task_id: string; success: boolean; message?: string }> = [];
        mockTaskData = mockTaskData.map((item) => {
          if (cancellableIds.has(item.task_id)) {
            items.push({ task_id: item.task_id, success: true });
            return { ...item, task_status: 'CANCELLED' as TaskStatus };
          }
          if (selectedRowKeys.includes(item.task_id)) {
            items.push({ task_id: item.task_id, success: false, message: '任务状态不可取消' });
          }
          return item;
        });
        console.log('[audit] bulk_cancel_tasks', { total: selectedTasks.length, items });
        loadData();
        setSelectedRowKeys([]);
        if (uncancellable === 0) {
          Toast.success(`已取消 ${cancellable.length} 个任务`);
        } else {
          Toast.warning(`成功 ${cancellable.length} 个，失败 ${uncancellable} 个`);
          const failedItems = items.filter((it) => !it.success);
          Modal.info({
            title: '批量取消结果',
            content: (
              <div style={{ lineHeight: '22px' }}>
                <div style={{ marginBottom: 8 }}>
                  共 <strong>{selectedTasks.length}</strong> 个：
                  成功 <strong style={{ color: 'var(--semi-color-success)' }}>{cancellable.length}</strong> 个，
                  失败 <strong style={{ color: 'var(--semi-color-danger)' }}>{uncancellable}</strong> 个
                </div>
                <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid var(--semi-color-border)', borderRadius: 6 }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--semi-color-fill-0)' }}>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '6px 12px' }}>任务 ID</th>
                        <th style={{ textAlign: 'left', padding: '6px 12px' }}>失败原因</th>
                      </tr>
                    </thead>
                    <tbody>
                      {failedItems.map((it) => (
                        <tr key={it.task_id} style={{ borderTop: '1px solid var(--semi-color-border)' }}>
                          <td style={{ padding: '6px 12px', fontFamily: 'monospace' }}>{it.task_id}</td>
                          <td style={{ padding: '6px 12px', color: 'var(--semi-color-text-2)' }}>{it.message || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ),
            okText: '知道了',
            hasCancel: false,
            width: 560,
          });
        }
      },
    });
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
        fixed: 'right' as const,
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
                <Dropdown.Item
                  icon={<History size={16} strokeWidth={2} />}
                  onClick={(e) => {
                    e?.stopPropagation();
                    setSelectedTask(record);
                    setInitialTab('executionHistory');
                    setDetailDrawerVisible(true);
                  }}
                >
                  {t('task.actions.viewExecutionHistory')}
                </Dropdown.Item>
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
          <div className="task-management-page-toolbar">
            <div className="toolbar-filters">
                <Input
                  className="toolbar-search"
                  prefix={<IconSearchStroked />}
                  placeholder={t('task.searchPlaceholder')}
                  value={searchValue}
                  onChange={handleSearch}
                  showClear
                />
                <Select
                  className="toolbar-select-process"
                  placeholder="流程"
                  value={processFilter}
                  onChange={(v) => { setProcessFilter((v as string[]) || []); setQueryParams((p) => ({ ...p, offset: 0 })); }}
                  optionList={processOptions}
                  multiple
                  maxTagCount={1}
                  showClear
                />
                <Select
                  className="toolbar-select-status"
                  placeholder="任务状态"
                  value={taskStatusFilter}
                  onChange={(v) => { setTaskStatusFilter((v as string[]) || []); setQueryParams((p) => ({ ...p, offset: 0 })); }}
                  optionList={taskStatusOptions}
                  multiple
                  maxTagCount={1}
                  showClear
                />
                <DepartmentSearchSelect
                  placeholder={t('common.filterDepartment')}
                  value={departmentFilter}
                  includeChildren={includeSubDepts}
                  onIncludeChildrenChange={setIncludeSubDepts}
                  onChange={(v) => { setDepartmentFilter((v as string[]) || []); setQueryParams((p) => ({ ...p, offset: 0 })); }}
                  multiple
                  showClear
                  maxTagCount={1}
                  useNameAsValue
                  style={{ width: 168, flexShrink: 0 }}
                />
                <DatePicker
                  type="dateTimeRange"
                  density="compact"
                  value={dateRange ?? undefined}
                  onChange={(d) => { setDateRange(Array.isArray(d) && d.length === 2 && d[0] && d[1] ? (d as [Date, Date]) : null); setQueryParams((p) => ({ ...p, offset: 0 })); }}
                  placeholder={['创建开始时间', '创建结束时间']}
                  style={{ width: 340, flexShrink: 0 }}
                />
                <FilterPopover
                  visible={filterPopoverVisible}
                  onVisibleChange={setFilterPopoverVisible}
                  onConfirm={handleFilterConfirm}
                  sections={[
                    {
                      key: 'executionTarget',
                      label: '执行目标',
                      type: 'custom',
                      value: { type: executionTargetType, ids: executionTargetIds },
                      render: (val, onChange) => {
                        const v = (val as { type: 'WORKER' | 'WORKER_GROUP' | null; ids: string[] }) || { type: null, ids: [] };
                        const targetList = v.type === 'WORKER_GROUP' ? mockWorkerGroupList : mockWorkerList;
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <Select
                              placeholder="目标类型"
                              value={v.type ?? undefined}
                              onChange={(tp) => onChange({ type: (tp as 'WORKER' | 'WORKER_GROUP') || null, ids: [] })}
                              optionList={[
                                { value: 'WORKER', label: '机器人' },
                                { value: 'WORKER_GROUP', label: '机器人组' },
                              ]}
                              showClear
                              style={{ width: '100%' }}
                            />
                            <Select
                              placeholder="选择目标（可多选）"
                              multiple
                              maxTagCount={1}
                              value={v.ids}
                              onChange={(ids) => onChange({ type: v.type, ids: (ids as string[]) || [] })}
                              optionList={targetList.map((x) => ({ value: x.id, label: x.name }))}
                              disabled={!v.type}
                              showClear
                              style={{ width: '100%' }}
                            />
                          </div>
                        );
                      },
                    },
                    {
                      key: 'priority',
                      label: t('task.table.priority'),
                      type: 'checkbox',
                      options: priorityOptions,
                      value: priorityFilter,
                    },
                    {
                      key: 'triggerSource',
                      label: t('task.filter.triggerSource'),
                      type: 'checkbox',
                      options: triggerSourceOptions,
                      value: triggerSourceFilter,
                    },
                    {
                      key: 'triggerId',
                      label: '所属触发器',
                      type: 'multiSelect',
                      placeholder: '选择触发器（可多选）',
                      options: triggerOptions,
                      value: triggerIdFilter,
                    },
                    {
                      key: 'executionStatus',
                      label: t('task.filter.executionStatus'),
                      type: 'checkbox',
                      options: executionStatusOptions,
                      value: executionStatusFilter,
                    },
                    {
                      key: 'enableRecording',
                      label: '是否录屏',
                      type: 'booleanTri',
                      value: enableRecordingFilter,
                    },
                    {
                      key: 'hasScreenshot',
                      label: '包含任务截图',
                      type: 'checkbox',
                      options: [{ value: true, label: '仅包含截图' }],
                      value: hasScreenshotFilter === true ? [true] : [],
                    },
                  ]}
                />
            </div>
            <div className="toolbar-actions">
              <Button icon={<RefreshCw size={16} strokeWidth={2} />} onClick={handleRefresh}>
                {t('task.refresh')}
              </Button>
              <Button
                icon={<Download size={16} strokeWidth={2} />}
                onClick={handleExport}
                loading={exporting}
                disabled={loading}
              >
                导出
              </Button>
              <Button
                icon={<Plus size={16} strokeWidth={2} />}
                theme="solid"
                type="primary"
                onClick={() => setCreateModalVisible(true)}
              >
                {t('task.createTask')}
              </Button>
            </div>
          </div>


          {/* 活动筛选标签 */}
          {(() => {
            const chips: Array<{ key: string; label: string; onClose: () => void }> = [];
            if (searchValue) chips.push({ key: 'kw', label: `关键词: ${searchValue}`, onClose: () => { setSearchValue(''); setQueryParams((p) => ({ ...p, keyword: '', offset: 0 })); } });
            processFilter.forEach((pid) => {
              const p = mockProcessList.find((x) => x.process_id === pid);
              chips.push({ key: `proc-${pid}`, label: `流程: ${p?.process_name || pid}`, onClose: () => setProcessFilter((arr) => arr.filter((x) => x !== pid)) });
            });
            taskStatusFilter.forEach((s) => chips.push({ key: `ts-${s}`, label: `任务状态: ${t(taskStatusConfig[s as TaskStatus]?.i18nKey || s)}`, onClose: () => setTaskStatusFilter((arr) => arr.filter((x) => x !== s)) }));
            departmentFilter.forEach((d) => chips.push({ key: `dept-${d}`, label: `部门: ${d}`, onClose: () => setDepartmentFilter((arr) => arr.filter((x) => x !== d)) }));
            if (dateRange) chips.push({ key: 'date', label: `创建时间: ${dateRange[0].toLocaleDateString()} ~ ${dateRange[1].toLocaleDateString()}`, onClose: () => setDateRange(null) });
            if (executionTargetType && executionTargetIds.length > 0) {
              const list = executionTargetType === 'WORKER_GROUP' ? mockWorkerGroupList : mockWorkerList;
              executionTargetIds.forEach((tid) => {
                const entity = list.find((x) => x.id === tid);
                chips.push({
                  key: `target-${tid}`,
                  label: `执行目标: ${entity?.name || tid}`,
                  onClose: () => setExecutionTargetIds((arr) => {
                    const next = arr.filter((x) => x !== tid);
                    if (next.length === 0) setExecutionTargetType(null);
                    return next;
                  }),
                });
              });
            }
            priorityFilter.forEach((p) => chips.push({ key: `pr-${p}`, label: `优先级: ${t(priorityConfig[p as TaskPriority]?.i18nKey || p)}`, onClose: () => setPriorityFilter((arr) => arr.filter((x) => x !== p)) }));
            triggerSourceFilter.forEach((s) => chips.push({ key: `tr-${s}`, label: `触发来源: ${t(`task.triggerSource.${s.toLowerCase()}`)}`, onClose: () => setTriggerSourceFilter((arr) => arr.filter((x) => x !== s)) }));
            triggerIdFilter.forEach((tid) => {
              const trg = mockTriggerList.find((x) => x.trigger_id === tid);
              chips.push({ key: `trg-${tid}`, label: `触发器: ${trg?.trigger_name || tid}`, onClose: () => setTriggerIdFilter((arr) => arr.filter((x) => x !== tid)) });
            });
            executionStatusFilter.forEach((s) => chips.push({ key: `es-${s}`, label: `执行状态: ${t(executionStatusConfig[s as ExecutionStatus]?.i18nKey || s)}`, onClose: () => setExecutionStatusFilter((arr) => arr.filter((x) => x !== s)) }));
            if (enableRecordingFilter !== null) chips.push({ key: 'rec', label: `录屏: ${enableRecordingFilter ? '启用' : '关闭'}`, onClose: () => setEnableRecordingFilter(null) });
            if (hasScreenshotFilter === true) chips.push({ key: 'shot', label: '仅包含截图', onClose: () => setHasScreenshotFilter(null) });
            if (chips.length === 0) return null;
            return (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center' }}>
                <Text type="tertiary" style={{ fontSize: 13 }}>搜索条件：</Text>
                {chips.map((c) => (
                  <Tag key={c.key} closable onClose={c.onClose} color="blue" type="light">{c.label}</Tag>
                ))}
                <Button theme="borderless" type="tertiary" size="small" onClick={handleClearAllFilters}>清除全部</Button>
              </div>
            );
          })()}

          {/* 批量操作栏 */}
          {selectedRowKeys.length > 0 && (() => {
            const selectedTasks = list.filter((t) => selectedRowKeys.includes(t.task_id));
            const cancellableCount = selectedTasks.filter((t) => t.task_status === 'PENDING').length;
            return (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--semi-color-fill-0)', borderRadius: 8, marginBottom: 16 }}>
                <Space>
                  <Text>已选择 {selectedRowKeys.length} 项</Text>
                  <Button icon={<X size={14} strokeWidth={2} />} size="small" theme="borderless" onClick={() => setSelectedRowKeys([])}>清除选择</Button>
                </Space>
                <Tooltip content={cancellableCount === 0 ? '没有可取消任务' : ''} trigger={cancellableCount === 0 ? 'hover' : 'custom'}>
                  <Button icon={<XCircle size={16} strokeWidth={2} />} type="warning" disabled={cancellableCount === 0} onClick={handleBulkCancel}>批量取消</Button>
                </Tooltip>
              </div>
            );
          })()}
        </div>

        <div className="task-management-page-table">
          {isInitialLoad ? (
            <TableSkeleton />
          ) : (
            <Table
              size="small"
              columns={columns}
              dataSource={list}
              rowKey="task_id"
              loading={loading && !isInitialLoad}
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) = scroll={{ x: 1500 }}> setSelectedRowKeys((keys as string[]) || []),
                getCheckboxProps: (record) => ({
                  disabled: (record as LYTaskResponse).task_status !== 'PENDING',
                }),
              }}
              empty={
                <EmptyState
                  variant={searchValue || processFilter.length > 0 || taskStatusFilter.length > 0 || executionStatusFilter.length > 0 || triggerSourceFilter.length > 0 || departmentFilter.length > 0 || priorityFilter.length > 0 || triggerIdFilter.length > 0 || executionTargetIds.length > 0 || enableRecordingFilter !== null || hasScreenshotFilter === true || dateRange ? 'noResult' : 'noData'}
                  description={
                    searchValue || processFilter.length > 0 || taskStatusFilter.length > 0 || executionStatusFilter.length > 0 || triggerSourceFilter.length > 0 || departmentFilter.length > 0 || priorityFilter.length > 0 || triggerIdFilter.length > 0 || executionTargetIds.length > 0 || enableRecordingFilter !== null || hasScreenshotFilter === true || dateRange
                      ? '未找到匹配任务'
                      : t('task.empty.defaultDescription')
                  }
                />
              }
              pagination={false}
              onRow={(record) => ({
                onClick: () => openTaskDetail(record as LYTaskResponse),
                style: { cursor: 'pointer' },
                className: selectedTask?.task_id === (record as LYTaskResponse).task_id && detailDrawerVisible ? 'task-row-selected' : '',
              })}
            />
          )}

          {total > 0 && (
            <div className="list-pagination">
              <Text type="tertiary">
                {t('common.showingRecords', {
                  start: (currentPage - 1) * pageSize + 1,
                  end: Math.min(currentPage * pageSize, total),
                  total,
                })}
              </Text>
              <div className="list-pagination-right">
                <Text type="tertiary">{t('common.totalPages', { total: Math.ceil(total / pageSize) })}</Text>
                <Pagination
                  currentPage={currentPage}
                  pageSize={pageSize}
                  total={total}
                  showSizeChanger
                  pageSizeOpts={[10, 20, 50, 100]}
                  onPageChange={(page: number) => {
                    setQueryParams((prev) => ({ ...prev, offset: (page - 1) * pageSize }));
                  }}
                  onPageSizeChange={(size: number) => {
                    setQueryParams((prev) => ({ ...prev, offset: 0, size }));
                  }}
                />
              </div>
            </div>
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
        
      </div>
  );
};

export default TaskManagementPage;
