import { useState, useMemo, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import {
  Breadcrumb, 
  Typography, 
  Input, 
  Button, 
  Table, 
  Tag, 
  Dropdown,
  Switch,
  Checkbox,
  Row,
  Col,
  Space,
  Modal,
  Toast,
  Select,
} from '@douyinfe/semi-ui';
import DepartmentSelect from '@/components/DepartmentSelect';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import FilterPopover from '@/components/FilterPopover';
import { Ellipsis, Eye, Key, MinusCircle, Pencil, Plus, Trash2, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WorkerDetailDrawer from './components/WorkerDetailDrawer';
import WorkerKeyModal from './components/WorkerKeyModal';
import CreateWorkerModal from './components/CreateWorkerModal';
import EditWorkerModal from './components/EditWorkerModal';
import AddToGroupModal from './components/AddToGroupModal';
import type { LYWorkerResponse, LYListResponseLYWorkerResponse, GetWorkersParams } from '@/api';
import { useCollaboratorAction } from '@/hooks/useCollaboratorAction';
import './index.less';

const { Title, Text } = Typography;
const CheckboxGroup = Checkbox.Group;

// Mockbot组Data
const mockWorkerGroups = [
  { id: 'group-001', name: 'Finance Bot Group' },
  { id: 'group-002', name: 'HR Bot Group' },
  { id: 'group-003', name: 'Ops Inspection Bot Group' },
];

// MockData - usingAPIType
const mockWorkers: LYWorkerResponse[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Finance Bot-01',
    description: 'Core enterprise finance automation bot handling complex financial tasks including invoice recognition, expense report review, financial report generation, bank reconciliation, and tax filing data preparation. Configured for high availability with 24/7 operation support and complete error recovery and task checkpoint capabilities.',
    status: 'IDLE',
    sync_status: 'SYNCED',
    ip_address: '10.0.1.100',
    priority: 'HIGH',
    client_version: 'v6.7.0',
    last_heartbeat_time: '2025-01-08 10:25:33',
    receive_tasks: true,
    username: 'DOMAIN\\robot01',
    desktop_type: 'Console',
    enable_auto_unlock: true,
    force_login: false,
    device_token: 'abc123xyz789def456ghi012jkl345mno678pqr901stu234vwx567yzabc890',
    machine_code: 'F11FD4447A215F380A40',
    host_name: 'WIN-SERVER-01',
    os: 'Windows Server 2019 Standard 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz',
    cpu_cores: 8,
    memory_capacity: '32 GB',
    robot_count: 1,
    group_id: 'group-001',
    group_name: 'Finance Bot Group',
    owning_department_name: 'Finance Department',
    created_at: '2025-01-05 14:30:00',
    creator_id: 'admin',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Finance Bot-02',
    description: 'Bot for financial report automation',
    status: 'BUSY',
    sync_status: 'PENDING',
    ip_address: '10.0.1.101',
    priority: 'MEDIUM',
    client_version: 'v6.7.0',
    last_heartbeat_time: '2025-01-08 10:20:15',
    receive_tasks: true,
    username: 'DOMAIN\\robot02',
    desktop_type: 'NotConsole',
    display_size: '1920x1080',
    force_login: true,
    device_token: 'def456ghi012jkl345mno678pqr901stu234vwx567yzabc890abc123xyz789',
    machine_code: 'A22GE5558B326G491B51',
    host_name: 'WIN-SERVER-02',
    os: 'Windows Server 2019 Standard 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz',
    cpu_cores: 8,
    memory_capacity: '16 GB',
    robot_count: 2,
    group_id: 'group-001',
    group_name: 'Finance Bot Group',
    owning_department_name: 'Finance Department',
    created_at: '2025-01-06 09:15:00',
    creator_id: 'admin',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Finance Bot-03',
    description: 'Bot for invoice processing',
    status: 'OFFLINE',
    sync_status: 'SYNCED',
    ip_address: '10.0.1.102',
    priority: 'HIGH',
    client_version: 'v6.6.0',
    last_heartbeat_time: '2025-01-07 16:30:22',
    receive_tasks: false,
    username: 'DOMAIN\\robot03',
    desktop_type: 'Console',
    enable_auto_unlock: false,
    force_login: false,
    device_token: 'ghi012jkl345mno678pqr901stu234vwx567yzabc890abc123xyz789def456',
    machine_code: 'B33HF6669C437H502C62',
    host_name: 'WIN-SERVER-03',
    os: 'Windows 10 Pro 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Core(TM) i7-8700 @ 3.20GHz',
    cpu_cores: 6,
    memory_capacity: '16 GB',
    robot_count: 1,
    group_id: null,
    group_name: null,
    owning_department_name: 'R&D Center',
    created_at: '2025-01-04 11:20:00',
    creator_id: 'admin',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'HR Bot-01',
    description: 'Bot for HR approval processes',
    status: 'FAULT',
    sync_status: 'SYNCED',
    ip_address: '10.0.1.103',
    priority: 'LOW',
    client_version: 'v6.5.0',
    last_heartbeat_time: '2025-01-06 09:15:00',
    receive_tasks: false,
    username: 'DOMAIN\\hr01',
    desktop_type: 'Console',
    enable_auto_unlock: true,
    force_login: true,
    device_token: 'jkl345mno678pqr901stu234vwx567yzabc890abc123xyz789def456ghi012',
    machine_code: 'C44IG7770D548I613D73',
    host_name: 'WIN-HR-01',
    os: 'Windows 10 Pro 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Core(TM) i5-8400 @ 2.80GHz',
    cpu_cores: 6,
    memory_capacity: '8 GB',
    robot_count: 1,
    group_id: 'group-002',
    group_name: 'HR Bot Group',
    owning_department_name: 'Human Resources Department',
    created_at: '2025-01-03 15:45:00',
    creator_id: 'hr_admin',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'Ops Bot-01',
    description: 'Bot for ops inspection',
    status: 'IDLE',
    sync_status: 'SYNCED',
    ip_address: '10.0.2.50',
    priority: 'MEDIUM',
    client_version: 'v6.7.0',
    last_heartbeat_time: '2025-01-08 10:22:00',
    receive_tasks: true,
    username: 'ops01',
    desktop_type: 'NotConsole',
    display_size: '2560x1440',
    force_login: false,
    device_token: 'mno678pqr901stu234vwx567yzabc890abc123xyz789def456ghi012jkl345',
    machine_code: 'D55JH8881E659J724E84',
    host_name: 'WIN-OPS-01',
    os: 'Windows Server 2022 Standard 64-bit',
    arch: 'x64',
    cpu_model: 'AMD Ryzen 9 5900X 12-Core Processor',
    cpu_cores: 12,
    memory_capacity: '64 GB',
    robot_count: 1,
    group_id: 'group-003',
    group_name: 'Ops Inspection Bot Group',
    owning_department_name: 'Enterprise Business Center',
    created_at: '2025-01-02 08:30:00',
    creator_id: 'ops_admin',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'Test Bot-01',
    description: 'Bot for automation testing',
    status: 'MAINTENANCE',
    sync_status: 'SYNCED',
    ip_address: '10.0.3.10',
    priority: 'LOW',
    client_version: 'v6.7.0',
    last_heartbeat_time: '2025-01-08 09:00:00',
    receive_tasks: false,
    username: 'DOMAIN\\test01',
    desktop_type: 'Console',
    enable_auto_unlock: true,
    force_login: false,
    device_token: 'pqr901stu234vwx567yzabc890abc123xyz789def456ghi012jkl345mno678',
    machine_code: 'E66KI9992F760K835F95',
    host_name: 'WIN-TEST-01',
    os: 'Windows 11 Pro 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Core(TM) i9-12900K @ 3.20GHz',
    cpu_cores: 16,
    memory_capacity: '32 GB',
    robot_count: 1,
    group_id: null,
    group_name: null,
    owning_department_name: 'R&D Center',
    created_at: '2025-01-01 10:00:00',
    creator_id: 'qa_admin',
  },
];

// 特殊Filter值常量
const UNGROUPED_FILTER_VALUE = '__UNGROUPED__';

interface FilterState {
  status: string[];
  sync_status: string[];
  group_id: string[];
}

interface SortState {
  sortBy?: string;
  sortOrder?: 'ascend' | 'descend';
}

// ============= Data获取 - BackLYListResponseLYWorkerResponse =============

// StatusSortPriority
const STATUS_ORDER: Record<string, number> = {
  BUSY: 1,
  IDLE: 2,
  MAINTENANCE: 3,
  FAULT: 4,
  OFFLINE: 5,
};

const fetchWorkerList = async (params: GetWorkersParams & { filters?: FilterState; sort?: SortState }): Promise<LYListResponseLYWorkerResponse> => {
  // 模拟Network延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let data = [...mockWorkers];

  // 关键词Search(Name或IP)
  if (params.keyword?.trim()) {
    const keyword = params.keyword.toLowerCase().trim();
    data = data.filter(item => 
      item.name.toLowerCase().includes(keyword) ||
      item.ip_address.toLowerCase().includes(keyword)
    );
  }

  // StatusFilter
  if (params.filters?.status && params.filters.status.length > 0) {
    data = data.filter(item => params.filters!.status.includes(item.status));
  }

  // 同步StatusFilter
  if (params.filters?.sync_status && params.filters.sync_status.length > 0) {
    data = data.filter(item => params.filters!.sync_status.includes(item.sync_status));
  }

  // bot组Filter
  if (params.filters?.group_id && params.filters.group_id.length > 0) {
    data = data.filter(item => {
      const selectedGroups = params.filters!.group_id;
      if (selectedGroups.includes(UNGROUPED_FILTER_VALUE)) {
        if (!item.group_id) return true;
      }
      if (item.group_id && selectedGroups.includes(item.group_id)) {
        return true;
      }
      return false;
    });
  }

  // 归属部门Filter
  if ((params as any).owning_department_name) {
    data = data.filter(item => (item as any).owning_department_name === (params as any).owning_department_name);
  }

  // Sortprocessing
  if (params.sort?.sortBy && params.sort?.sortOrder) {
    const { sortBy, sortOrder } = params.sort;
    data.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name, 'zh-CN');
      } else if (sortBy === 'status') {
        comparison = (STATUS_ORDER[a.status] || 99) - (STATUS_ORDER[b.status] || 99);
      }
      
      return sortOrder === 'descend' ? -comparison : comparison;
    });
  }

  const total = data.length;
  const offset = params.offset || 0;
  const size = params.size || 20;
  const paginatedData = data.slice(offset, offset + size);

  // BackLYListResponseLYWorkerResponseFormat
  return {
    range: {
      offset,
      size,
      total,
    },
    list: paginatedData,
  };
};

interface WorkerManagementProps {
  isActive?: boolean;
  pendingWorkerId?: string | null;
  onWorkerDetailOpened?: () => void;
  openCreateFromHome?: boolean;
  onCreateFromHomeHandled?: () => void;
}

const WorkerManagement = ({ isActive = true, pendingWorkerId, onWorkerDetailOpened, openCreateFromHome, onCreateFromHomeHandled }: WorkerManagementProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Search框input值(即is shown)
  const [searchValue, setSearchValue] = useState('');
  
  // queryParameter - usingAPIType
  const [queryParams, setQueryParams] = useState<GetWorkersParams>({
    offset: 0,
    size: 20,
    keyword: undefined,
  });
  
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    sync_status: [],
    group_id: [],
  });
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [sortState, setSortState] = useState<SortState>({});
  const [filterVisible, setFilterVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // List响应Data - 直接usingAPI LYListResponseLYWorkerResponse
  const [listResponse, setListResponse] = useState<LYListResponseLYWorkerResponse>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });
  
  // Drawer and ModalStatus
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<LYWorkerResponse | null>(null);
  const [detailInitialTab, setDetailInitialTab] = useState('basic');
  const { openCollaborator, renderCollaboratorPanel } = useCollaboratorAction();
  const [keyModalVisible, setKeyModalVisible] = useState(false);
  const [keyModalWorker, setKeyModalWorker] = useState<LYWorkerResponse | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // from首页快捷入口跳转时auto-open新建Modal
  useEffect(() => {
    if (openCreateFromHome) {
      setCreateModalVisible(true);
      onCreateFromHomeHandled?.();
    }
  }, [openCreateFromHome, onCreateFromHomeHandled]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingWorker, setEditingWorker] = useState<LYWorkerResponse | null>(null);
  const [addToGroupModalVisible, setAddToGroupModalVisible] = useState(false);
  const [addToGroupWorker, setAddToGroupWorker] = useState<LYWorkerResponse | null>(null);

  // StatusConfig
  type WorkerStatus = LYWorkerResponse['status'];
  
  const statusConfig: Record<WorkerStatus, { color: string; text: string }> = useMemo(() => ({
    OFFLINE: { color: 'grey', text: t('worker.status.offline') },
    IDLE: { color: 'green', text: t('worker.status.idle') },
    BUSY: { color: 'blue', text: t('worker.status.busy') },
    FAULT: { color: 'red', text: t('worker.status.fault') },
    MAINTENANCE: { color: 'orange', text: t('worker.status.maintenance') },
  }), [t]);

  // Filter选项
  const filterOptions = useMemo(() => ({
    status: [
      { label: t('worker.status.offline'), value: 'OFFLINE' },
      { label: t('worker.status.idle'), value: 'IDLE' },
      { label: t('worker.status.busy'), value: 'BUSY' },
      { label: t('worker.status.fault'), value: 'FAULT' },
      { label: t('worker.status.maintenance'), value: 'MAINTENANCE' },
    ],
    sync_status: [
      { label: t('worker.syncStatus.synced'), value: 'SYNCED' },
      { label: t('worker.syncStatus.pending'), value: 'PENDING' },
    ],
    group_id: [
      { label: t('worker.filter.ungrouped'), value: UNGROUPED_FILTER_VALUE },
      ...mockWorkerGroups.map(g => ({ label: g.name, value: g.id })),
    ],
  }), [t]);

  // departmentOptions removed - using DepartmentSelect with tree data

  // LoadingData
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchWorkerList({
        ...queryParams,
        filters,
        sort: sortState,
        owning_department_name: departmentFilter,
      } as any);
      setListResponse(response);
      return response.list;
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [queryParams, filters, sortState, departmentFilter]);

  // 翻页并Back新Data(usefor Drawer导航时auto-翻页)
  const handleDrawerPageChange = useCallback(async (page: number): Promise<LYWorkerResponse[]> => {
    const currentPageSize = listResponse.range?.size || 20;
    const newOffset = (page - 1) * currentPageSize;
    setQueryParams(prev => ({ ...prev, offset: newOffset }));
    
    // 直接获取Data而notisWaitstateUpdate
    const response = await fetchWorkerList({
      ...queryParams,
      offset: newOffset,
      filters,
      sort: sortState,
      owning_department_name: departmentFilter,
    } as any);
    setListResponse(response);
    return response.list;
  }, [queryParams, filters, sortState, departmentFilter, listResponse.range?.size]);

  // 当Tab switchto非激活Status时, CloseDrawer
  useEffect(() => {
    if (!isActive) {
      setDetailDrawerVisible(false);
    }
  }, [isActive]);

  // 初始化Loading
  useEffect(() => {
    loadData();
  }, [loadData]);

  // processingfrombot组跳转过's 情况
  useEffect(() => {
    if (pendingWorkerId && listResponse.list.length > 0) {
      const worker = listResponse.list.find(w => w.id === pendingWorkerId);
      if (worker) {
        setSelectedWorker(worker);
        setDetailDrawerVisible(true);
        onWorkerDetailOpened?.();
      }
    }
  }, [pendingWorkerId, listResponse.list, onWorkerDetailOpened]);

  // Searchdebounced
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams(prev => ({ ...prev, keyword: value || undefined, offset: 0 }));
      }, 500),
    []
  );

  // Search
  const handleSearch = (value: string) => {
    setSearchValue(value);  // Immediately update input display
    debouncedSearch(value); // Debounced query update
  };

  const handleFilterConfirm = (values: Record<string, unknown>) => {
    setFilters(prev => ({
      ...prev,
      status: (values.status as string[]) || [],
      sync_status: (values.sync_status as string[]) || [],
    }));
    setQueryParams(prev => ({ ...prev, offset: 0 }));
  };

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);
  const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);

  // 切换接收taskStatus
  const handleToggleReceiveTasks = async (worker: LYWorkerResponse, checked: boolean) => {
    // Update本地Data
    setListResponse(prev => ({
      ...prev,
      list: prev.list.map(item => 
        item.id === worker.id ? { ...item, receive_tasks: checked } : item
      ),
    }));
    
    // alsoUpdateSelected's worker(ifDraweropen)
    if (selectedWorker?.id === worker.id) {
      setSelectedWorker(prev => prev ? { ...prev, receive_tasks: checked } : null);
    }
    
    // 模拟API调use
    Toast.success(checked ? t('worker.receiveTasks.enabled') : t('worker.receiveTasks.disabled'));
  };

  // filterContent removed - using FilterPopover directly

  // openDetails drawer
  const openDetail = (worker: LYWorkerResponse) => {
    setSelectedWorker(worker);
    setDetailInitialTab('basic');
    setDetailDrawerVisible(true);
  };

  // open密钥Modal
  const openKeyModal = (worker: LYWorkerResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setKeyModalWorker(worker);
    setKeyModalVisible(true);
  };

  // DeleteConfirm
  const handleDeleteClick = (worker: LYWorkerResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    // Checkis否has未Donetask
    if (worker.status === 'BUSY') {
      Modal.warning({
        title: t('worker.deleteModal.cannotDelete'),
        content: t('worker.deleteModal.hasPendingTasks'),
        okText: t('common.confirm'),
      });
      return;
    }

    Modal.confirm({
      title: t('worker.deleteModal.title'),
      icon: <Trash2 size={16} strokeWidth={2} color="var(--semi-color-danger)" />,
      content: (
        <>
          <div>{t('worker.deleteModal.confirmMessage', { name: worker.name })}</div>
          <div style={{ color: 'var(--semi-color-text-2)', marginTop: 8 }}>
            {t('worker.deleteModal.deleteWarning')}
          </div>
        </>
      ),
      okText: t('worker.deleteModal.confirmDelete'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        try {
          // 模拟Delete API 调use
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log('Deletebot:', worker.id);
          
          // CloseDrawer
          setDetailDrawerVisible(false);
          setSelectedWorker(null);
          
          // 重新LoadingData
          loadData();
          
          // displaySuccess提示
          Toast.success(t('worker.deleteModal.success'));
        } catch (error) {
          // displayError提示
          Toast.error(t('worker.deleteModal.error'));
          throw error;
        }
      },
    });
  };

  // fromDetails drawer跳转toEdit
  const handleEditFromDrawer = () => {
    if (selectedWorker) {
      setEditingWorker(selectedWorker);
      setEditModalVisible(true);
    }
  };

  // fromDetails drawerDelete
  const handleDeleteFromDrawer = () => {
    if (selectedWorker) {
      handleDeleteClick(selectedWorker);
    }
  };

  // Editbot
  const handleEdit = (worker: LYWorkerResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingWorker(worker);
    setEditModalVisible(true);
  };

  // add至分组
  const handleAddToGroup = (worker: LYWorkerResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAddToGroupWorker(worker);
    setAddToGroupModalVisible(true);
  };

  // CreateSuccess回调
  const handleCreateSuccess = () => {
    loadData();
  };

  // EditSuccess回调
  const handleEditSuccess = (updatedWorker: LYWorkerResponse) => {
    // UpdateListData
    setListResponse(prev => ({
      ...prev,
      list: prev.list.map(item => 
        item.id === updatedWorker.id ? updatedWorker : item
      ),
    }));
    // 同步UpdateSelected's worker(ifDraweropen)
    if (selectedWorker?.id === updatedWorker.id) {
      setSelectedWorker(updatedWorker);
    }
  };

  // add至分组Success回调
  const handleAddToGroupSuccess = (updatedWorker: LYWorkerResponse) => {
    // UpdateListData
    setListResponse(prev => ({
      ...prev,
      list: prev.list.map(item => 
        item.id === updatedWorker.id ? updatedWorker : item
      ),
    }));
    // 同步UpdateSelected's worker(ifDraweropen)
    if (selectedWorker?.id === updatedWorker.id) {
      setSelectedWorker(updatedWorker);
    }
  };

  // 移出分组
  const handleRemoveFromGroup = (worker: LYWorkerResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    Modal.confirm({
      title: t('worker.removeFromGroup.title'),
      icon: <Trash2 size={16} strokeWidth={2} color="var(--semi-color-danger)" />,
      content: t('worker.removeFromGroup.confirmMessage', { 
        name: worker.name,
        group: worker.group_name 
      }),
      okText: t('worker.removeFromGroup.confirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          // 模拟API调use
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const updatedWorker: LYWorkerResponse = {
            ...worker,
            group_id: null,
            group_name: null,
          };
          
          // UpdateListData
          setListResponse(prev => ({
            ...prev,
            list: prev.list.map(item => 
              item.id === updatedWorker.id ? updatedWorker : item
            ),
          }));
          
          // 同步UpdateSelected's worker(ifDraweropen)
          if (selectedWorker?.id === updatedWorker.id) {
            setSelectedWorker(updatedWorker);
          }
          
          Toast.success(t('worker.removeFromGroup.success'));
        } catch (error) {
          Toast.error(t('worker.removeFromGroup.error'));
          throw error;
        }
      },
    });
  };

  // from响应获取分页Info
  const { range, list } = listResponse;
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  const columns = [
    {
      title: t('worker.table.workerName'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: true,
      sortOrder: sortState.sortBy === 'name' ? sortState.sortOrder : undefined,
      render: (name: string, record: LYWorkerResponse) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{name}</span>
            {record.sync_status === 'PENDING' && (
              <Tag color="orange" size="small" type="light">{t('worker.syncStatus.pending')}</Tag>
            )}
          </div>
          <div>
            {record.username || '-'}
          </div>
        </div>
      ),
    },
    {
      title: t('worker.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      sorter: true,
      sortOrder: sortState.sortBy === 'status' ? sortState.sortOrder : undefined,
      render: (status: WorkerStatus | undefined) => {
        if (!status) return null;
        const config = statusConfig[status];
        return (
          <Tag color={config.color as 'grey' | 'green' | 'blue' | 'red' | 'orange'} type="light">
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: t('worker.table.workerGroup'),
      dataIndex: 'group_name',
      key: 'group_name',
      width: 150,
      ellipsis: true,
      render: (groupName: string | null | undefined) => groupName || t('worker.filter.ungrouped'),
    },
    {
      title: t('worker.table.ipAddress'),
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 120,
    },
    {
      title: t('worker.table.clientVersion'),
      dataIndex: 'client_version',
      key: 'client_version',
      width: 100,
    },
    {
      title: t('worker.table.lastHeartbeat'),
      dataIndex: 'last_heartbeat_time',
      key: 'last_heartbeat_time',
      width: 160,
      sorter: true,
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
      title: t('worker.table.receiveTasks'),
      dataIndex: 'receive_tasks',
      key: 'receive_tasks',
      width: 90,
      render: (receiveTasks: boolean, record: LYWorkerResponse) => {
        // 只hasOnline且非故障Status才允许Operation
        const canOperate = record.status !== 'OFFLINE' && record.status !== 'FAULT';
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Switch 
              checked={receiveTasks} 
              size="small" 
              disabled={!canOperate}
              onChange={(checked) => handleToggleReceiveTasks(record, checked)}
            />
          </div>
        );
      },
    },
    {
      title: t('worker.table.actions'),
      dataIndex: 'action',
      key: 'action',
      width: 60,
      render: (_: unknown, record: LYWorkerResponse) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          stopPropagation={true}
          clickToHide={true}
          render={
            <Dropdown.Menu>
              <Dropdown.Item 
                icon={<Eye size={16} strokeWidth={2} />} 
                onClick={(e) => {
                  e?.stopPropagation?.();
                  openDetail(record);
                }}
              >
                {t('worker.actions.viewDetail')}
              </Dropdown.Item>
              <Dropdown.Item 
                icon={<Key size={16} strokeWidth={2} />}
                onClick={(e) => {
                  e?.stopPropagation?.();
                  openKeyModal(record);
                }}
              >
                {t('worker.actions.viewKey')}
              </Dropdown.Item>
              <Dropdown.Item 
                icon={<Pencil size={16} strokeWidth={2} />} 
                onClick={(e) => {
                  e?.stopPropagation?.();
                  handleEdit(record);
                }}
              >
                {t('worker.actions.edit')}
              </Dropdown.Item>
              {/* 's bot""Operation */}
              {!record.group_id && (
                <Dropdown.Item 
                  icon={<Users size={16} strokeWidth={2} />}
                  onClick={(e) => {
                    e?.stopPropagation?.();
                    handleAddToGroup(record);
                  }}
                >
                  {t('worker.actions.addToGroup')}
                </Dropdown.Item>
              )}
              {/* Already's bot""Operation */}
              {record.group_id && (
                <Dropdown.Item 
                  icon={<MinusCircle size={16} strokeWidth={2} />}
                  onClick={(e) => {
                    e?.stopPropagation?.();
                    handleRemoveFromGroup(record);
                  }}
                >
                  {t('worker.actions.removeFromGroup')}
                </Dropdown.Item>
              )}
              <Dropdown.Item 
                icon={<UserPlus size={14} strokeWidth={2} />}
                onClick={(e) => {
                  e?.stopPropagation?.();
                  openCollaborator(record.id);
                }}
              >
                {t('collaborator.actions.addCollaborator')}
              </Dropdown.Item>
              <Dropdown.Item 
                icon={<Trash2 size={16} strokeWidth={2} />} 
                type="danger" 
                onClick={(e) => {
                  e?.stopPropagation?.();
                  handleDeleteClick(record);
                }}
              >
                {t('worker.actions.delete')}
              </Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Button 
            icon={<Ellipsis size={16} strokeWidth={2} />} 
            theme="borderless" 
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="worker-management">
      {/* Operation */}
      <div className="worker-management-header">
        {/* Operation */}
        <Row type="flex" justify="space-between" align="middle" className="worker-management-header-toolbar">
          <Col>
            <Space>
              <Input 
                prefix={<IconSearchStroked />}
                placeholder={t('worker.searchPlaceholder')}
                className="worker-management-search-input"
                value={searchValue}
                onChange={handleSearch}
              />
              <DepartmentSelect
                placeholder={t('common.owningDepartment')}
                value={departmentFilter}
                onChange={(v) => {
                  setDepartmentFilter(v);
                  setQueryParams(prev => ({ ...prev, offset: 0 }));
                }}
                multiple
                showClear
                maxTagCount={1}
                useNameAsValue
                style={{ width: 260 }}
              />
              <Select
                placeholder={t('worker.filter.workerGroup')}
                value={filters.group_id}
                onChange={(v) => {
                  setFilters(prev => ({ ...prev, group_id: v as string[] }));
                  setQueryParams(prev => ({ ...prev, offset: 0 }));
                }}
                multiple
                showClear
                maxTagCount={1}
                style={{ width: 180 }}
                optionList={filterOptions.group_id}
              />
              <FilterPopover
                visible={filterVisible}
                onVisibleChange={setFilterVisible}
                onConfirm={handleFilterConfirm}
                sections={[
                  {
                    key: 'status',
                    label: t('worker.filter.workerStatus'),
                    type: 'checkbox',
                    options: filterOptions.status,
                    value: filters.status,
                  },
                  {
                    key: 'sync_status',
                    label: t('worker.filter.syncStatus'),
                    type: 'checkbox',
                    options: filterOptions.sync_status,
                    value: filters.sync_status,
                  },
                ]}
              />
            </Space>
          </Col>
          <Col>
            <Button 
              icon={<Plus size={16} strokeWidth={2} />} 
              theme="solid" 
              type="primary"
              onClick={() => setCreateModalVisible(true)}
            >
              {t('worker.createWorker')}
            </Button>
          </Col>
        </Row>
      </div>

      {/* Table area */}
      <div className="worker-management-table">
        {isInitialLoad ? (
          <TableSkeleton rows={10} columns={7} columnWidths={['18%', '10%', '15%', '12%', '10%', '15%', '10%']} />
        ) : (
          <Table 
            size="small"
            columns={columns} 
            dataSource={list}
            loading={loading}
            rowKey="id"
            empty={
              <EmptyState 
                variant={queryParams.keyword ? 'noResult' : 'noData'}
                description={queryParams.keyword ? t('common.noResult') : t('worker.noData')} 
              />
            }
            onRow={(record) => {
              const isSelected = selectedWorker?.id === record?.id && detailDrawerVisible;
              return {
                id: `worker-row-${record?.id}`,
                onClick: () => openDetail(record as LYWorkerResponse),
                className: isSelected ? 'worker-management-row-selected' : undefined,
                style: { cursor: 'pointer' },
              };
            }}
            onChange={({ sorter }) => {
              if (sorter) {
                const { dataIndex, sortOrder } = sorter as { dataIndex?: string; sortOrder?: 'ascend' | 'descend' };
                setSortState({
                  sortBy: sortOrder ? dataIndex : undefined,
                  sortOrder: sortOrder || undefined,
                });
              }
            }}
            pagination={{
              total,
              pageSize,
              currentPage,
              onPageChange: (page) => {
                setQueryParams(prev => ({ ...prev, offset: (page - 1) * pageSize }));
              },
              onPageSizeChange: (newPageSize) => setQueryParams(prev => ({ ...prev, offset: 0, size: newPageSize })),
              showSizeChanger: true,
              showTotal: true,
            }}
            scroll={{ y: 'calc(100vh - 320px)' }}
          />
        )}
      </div>

      {/* Details drawer */}
      <WorkerDetailDrawer
        visible={detailDrawerVisible}
        onClose={() => { setDetailDrawerVisible(false); setDetailInitialTab('basic'); }}
        workerData={selectedWorker}
        onEdit={handleEditFromDrawer}
        onViewKey={() => {
          if (selectedWorker) {
            setKeyModalWorker(selectedWorker);
            setKeyModalVisible(true);
          }
        }}
        onDelete={handleDeleteFromDrawer}
        onToggleReceiveTasks={handleToggleReceiveTasks}
        onAddToGroup={(worker) => {
          setAddToGroupWorker(worker);
          setAddToGroupModalVisible(true);
        }}
        onRemoveFromGroup={handleRemoveFromGroup}
        dataList={list}
        onNavigate={(worker) => setSelectedWorker(worker)}
        pagination={{
          currentPage,
          totalPages: Math.ceil(total / pageSize),
          pageSize,
          total,
        }}
        onPageChange={handleDrawerPageChange}
        onScrollToRow={(id) => {
          const row = document.getElementById(`worker-row-${id}`);
          row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }}
        
      />

      {/* Modal */}
      <WorkerKeyModal
        visible={keyModalVisible}
        onClose={() => setKeyModalVisible(false)}
        workerData={keyModalWorker}
      />

      {/* Create modal */}
      <CreateWorkerModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit modal */}
      <EditWorkerModal
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        workerData={editingWorker}
        onSuccess={handleEditSuccess}
      />

      {/* Modal */}
      <AddToGroupModal
        visible={addToGroupModalVisible}
        onCancel={() => setAddToGroupModalVisible(false)}
        workerData={addToGroupWorker}
        onSuccess={handleAddToGroupSuccess}
      />

      {renderCollaboratorPanel('WORKER', 'scheduling')}
    </div>
  );
};

export default WorkerManagement;
