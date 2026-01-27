import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Breadcrumb, 
  Typography, 
  Input, 
  Button, 
  Table, 
  Tag, 
  Dropdown,
  Switch,
  Popover,
  Checkbox,
  Row,
  Col,
  Space,
  Modal,
  Toast,
} from '@douyinfe/semi-ui';
import {
  IconSearch, 
  IconFilter,
  IconPlus, 
  IconMore, 
  IconEyeOpenedStroked, 
  IconEditStroked, 
  IconDeleteStroked,
  IconKey
} from '@douyinfe/semi-icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WorkerDetailDrawer from './components/WorkerDetailDrawer';
import WorkerKeyModal from './components/WorkerKeyModal';
import CreateWorkerModal from './components/CreateWorkerModal';
import EditWorkerModal from './components/EditWorkerModal';
import type { LYWorkerResponse, LYListResponseLYWorkerResponse, GetWorkersParams } from '@/api';
import './index.less';

const { Title, Text } = Typography;
const CheckboxGroup = Checkbox.Group;

// Mock数据 - 使用API类型
const mockWorkers: LYWorkerResponse[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: '财务机器人-01',
    description: '用于财务流程自动化的机器人',
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
    os: 'Windows Server 2019 Standard 64位',
    arch: 'x64',
    cpu_model: 'Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz',
    cpu_cores: 8,
    memory_capacity: '32 GB',
    robot_count: 1,
    created_at: '2025-01-05 14:30:00',
    creator_id: 'admin',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: '财务机器人-02',
    description: '用于财务报表自动化的机器人',
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
    os: 'Windows Server 2019 Standard 64位',
    arch: 'x64',
    cpu_model: 'Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz',
    cpu_cores: 8,
    memory_capacity: '16 GB',
    robot_count: 2,
    created_at: '2025-01-06 09:15:00',
    creator_id: 'admin',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: '财务机器人-03',
    description: '用于发票处理的机器人',
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
    os: 'Windows 10 Pro 64位',
    arch: 'x64',
    cpu_model: 'Intel(R) Core(TM) i7-8700 @ 3.20GHz',
    cpu_cores: 6,
    memory_capacity: '16 GB',
    robot_count: 1,
    created_at: '2025-01-04 11:20:00',
    creator_id: 'admin',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: '人力机器人-01',
    description: '用于人事审批流程的机器人',
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
    os: 'Windows 10 Pro 64位',
    arch: 'x64',
    cpu_model: 'Intel(R) Core(TM) i5-8400 @ 2.80GHz',
    cpu_cores: 6,
    memory_capacity: '8 GB',
    robot_count: 1,
    created_at: '2025-01-03 15:45:00',
    creator_id: 'hr_admin',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: '运维机器人-01',
    description: '用于运维巡检的机器人',
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
    os: 'Windows Server 2022 Standard 64位',
    arch: 'x64',
    cpu_model: 'AMD Ryzen 9 5900X 12-Core Processor',
    cpu_cores: 12,
    memory_capacity: '64 GB',
    robot_count: 1,
    created_at: '2025-01-02 08:30:00',
    creator_id: 'ops_admin',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: '测试机器人-01',
    description: '用于自动化测试的机器人',
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
    os: 'Windows 11 Pro 64位',
    arch: 'x64',
    cpu_model: 'Intel(R) Core(TM) i9-12900K @ 3.20GHz',
    cpu_cores: 16,
    memory_capacity: '32 GB',
    robot_count: 1,
    created_at: '2025-01-01 10:00:00',
    creator_id: 'qa_admin',
  },
];

interface FilterState {
  status: string[];
  sync_status: string[];
}

interface SortState {
  sortBy?: string;
  sortOrder?: 'ascend' | 'descend';
}

// ============= 数据获取 - 返回LYListResponseLYWorkerResponse =============

// 状态排序优先级
const STATUS_ORDER: Record<string, number> = {
  BUSY: 1,
  IDLE: 2,
  MAINTENANCE: 3,
  FAULT: 4,
  OFFLINE: 5,
};

const fetchWorkerList = async (params: GetWorkersParams & { filters?: FilterState; sort?: SortState }): Promise<LYListResponseLYWorkerResponse> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let data = [...mockWorkers];

  // 关键词搜索（名称或IP）
  if (params.keyword?.trim()) {
    const keyword = params.keyword.toLowerCase().trim();
    data = data.filter(item => 
      item.name.toLowerCase().includes(keyword) ||
      item.ip_address.toLowerCase().includes(keyword)
    );
  }

  // 状态筛选
  if (params.filters?.status && params.filters.status.length > 0) {
    data = data.filter(item => params.filters!.status.includes(item.status));
  }

  // 同步状态筛选
  if (params.filters?.sync_status && params.filters.sync_status.length > 0) {
    data = data.filter(item => params.filters!.sync_status.includes(item.sync_status));
  }

  // 排序处理
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

  // 返回LYListResponseLYWorkerResponse格式
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
}

const WorkerManagement = ({ isActive = true }: WorkerManagementProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // 查询参数 - 使用API类型
  const [queryParams, setQueryParams] = useState<GetWorkersParams>({
    offset: 0,
    size: 20,
    keyword: undefined,
  });
  
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    sync_status: [],
  });
  const [sortState, setSortState] = useState<SortState>({});
  const [filterVisible, setFilterVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 列表响应数据 - 直接使用API LYListResponseLYWorkerResponse
  const [listResponse, setListResponse] = useState<LYListResponseLYWorkerResponse>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });
  
  // 抽屉和弹窗状态
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<LYWorkerResponse | null>(null);
  const [keyModalVisible, setKeyModalVisible] = useState(false);
  const [keyModalWorker, setKeyModalWorker] = useState<LYWorkerResponse | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingWorker, setEditingWorker] = useState<LYWorkerResponse | null>(null);

  // 状态配置
  type WorkerStatus = LYWorkerResponse['status'];
  
  const statusConfig: Record<WorkerStatus, { color: string; text: string }> = useMemo(() => ({
    OFFLINE: { color: 'grey', text: t('worker.status.offline') },
    IDLE: { color: 'green', text: t('worker.status.idle') },
    BUSY: { color: 'blue', text: t('worker.status.busy') },
    FAULT: { color: 'red', text: t('worker.status.fault') },
    MAINTENANCE: { color: 'orange', text: t('worker.status.maintenance') },
  }), [t]);

  // 筛选选项
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
  }), [t]);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchWorkerList({
        ...queryParams,
        filters,
        sort: sortState,
      });
      setListResponse(response);
    } finally {
      setLoading(false);
    }
  }, [queryParams, filters, sortState]);

  // 当Tab切换到非激活状态时，关闭抽屉
  useEffect(() => {
    if (!isActive) {
      setDetailDrawerVisible(false);
    }
  }, [isActive]);

  // 初始化加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 搜索
  const handleSearch = (value: string) => {
    setQueryParams(prev => ({ ...prev, keyword: value || undefined, offset: 0 }));
  };

  const handleFilterChange = (key: keyof FilterState, values: string[]) => {
    setFilters(prev => ({ ...prev, [key]: values }));
    setQueryParams(prev => ({ ...prev, offset: 0 }));
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      sync_status: [],
    });
    setQueryParams(prev => ({ ...prev, offset: 0 }));
  };

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);
  const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);

  // 切换接收任务状态
  const handleToggleReceiveTasks = async (worker: LYWorkerResponse, checked: boolean) => {
    // 更新本地数据
    setListResponse(prev => ({
      ...prev,
      list: prev.list.map(item => 
        item.id === worker.id ? { ...item, receive_tasks: checked } : item
      ),
    }));
    
    // 同时更新选中的worker（如果抽屉打开中）
    if (selectedWorker?.id === worker.id) {
      setSelectedWorker(prev => prev ? { ...prev, receive_tasks: checked } : null);
    }
    
    // 模拟API调用
    Toast.success(checked ? t('worker.receiveTasks.enabled') : t('worker.receiveTasks.disabled'));
  };

  const filterContent = (
    <div className="filter-popover">
      <div className="filter-popover-section">
        <Text strong className="filter-popover-label">{t('worker.filter.workerStatus')}</Text>
        <CheckboxGroup
          value={filters.status}
          onChange={(values) => handleFilterChange('status', values as string[])}
          options={filterOptions.status}
          direction="horizontal"
        />
      </div>
      <div className="filter-popover-section">
        <Text strong className="filter-popover-label">{t('worker.filter.syncStatus')}</Text>
        <CheckboxGroup
          value={filters.sync_status}
          onChange={(values) => handleFilterChange('sync_status', values as string[])}
          options={filterOptions.sync_status}
          direction="horizontal"
        />
      </div>
      <div className="filter-popover-footer">
        <Button theme="borderless" onClick={clearFilters} disabled={!hasActiveFilters}>
          {t('common.reset')}
        </Button>
        <Button theme="solid" type="primary" onClick={() => setFilterVisible(false)}>
          {t('common.confirm')}
        </Button>
      </div>
    </div>
  );

  // 打开详情抽屉
  const openDetail = (worker: LYWorkerResponse) => {
    setSelectedWorker(worker);
    setDetailDrawerVisible(true);
  };

  // 打开密钥弹窗
  const openKeyModal = (worker: LYWorkerResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setKeyModalWorker(worker);
    setKeyModalVisible(true);
  };

  // 删除确认
  const handleDeleteClick = (worker: LYWorkerResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    // 检查是否有未完成任务
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
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
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
          // 模拟删除 API 调用
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log('删除机器人:', worker.id);
          
          // 关闭抽屉
          setDetailDrawerVisible(false);
          setSelectedWorker(null);
          
          // 重新加载数据
          loadData();
          
          // 显示成功提示
          Toast.success(t('worker.deleteModal.success'));
        } catch (error) {
          // 显示错误提示
          Toast.error(t('worker.deleteModal.error'));
          throw error;
        }
      },
    });
  };

  // 从详情抽屉跳转到编辑
  const handleEditFromDrawer = () => {
    if (selectedWorker) {
      setEditingWorker(selectedWorker);
      setEditModalVisible(true);
    }
  };

  // 从详情抽屉删除
  const handleDeleteFromDrawer = () => {
    if (selectedWorker) {
      handleDeleteClick(selectedWorker);
    }
  };

  // 编辑机器人
  const handleEdit = (worker: LYWorkerResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingWorker(worker);
    setEditModalVisible(true);
  };

  // 创建成功回调
  const handleCreateSuccess = () => {
    loadData();
  };

  // 编辑成功回调
  const handleEditSuccess = (updatedWorker: LYWorkerResponse) => {
    // 更新列表数据
    setListResponse(prev => ({
      ...prev,
      list: prev.list.map(item => 
        item.id === updatedWorker.id ? updatedWorker : item
      ),
    }));
    // 同步更新选中的worker（如果抽屉打开中）
    if (selectedWorker?.id === updatedWorker.id) {
      setSelectedWorker(updatedWorker);
    }
  };

  // 从响应中获取分页信息
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
          <div className="worker-name-cell-header">
            <span className="worker-name-cell-name">{name}</span>
            {record.sync_status === 'PENDING' && (
              <Tag color="orange" size="small" type="light">{t('worker.syncStatus.pending')}</Tag>
            )}
          </div>
          <div className="worker-name-cell-username">
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
      title: t('worker.table.receiveTasks'),
      dataIndex: 'receive_tasks',
      key: 'receive_tasks',
      width: 90,
      render: (receiveTasks: boolean, record: LYWorkerResponse) => {
        // 只有在线且非故障状态才允许操作
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
                icon={<IconEyeOpenedStroked />} 
                onClick={(e) => {
                  e?.stopPropagation?.();
                  openDetail(record);
                }}
              >
                {t('worker.actions.viewDetail')}
              </Dropdown.Item>
              <Dropdown.Item 
                icon={<IconKey />} 
                onClick={(e) => {
                  e?.stopPropagation?.();
                  openKeyModal(record);
                }}
              >
                {t('worker.actions.viewKey')}
              </Dropdown.Item>
              <Dropdown.Item 
                icon={<IconEditStroked />} 
                onClick={(e) => {
                  e?.stopPropagation?.();
                  handleEdit(record);
                }}
              >
                {t('worker.actions.edit')}
              </Dropdown.Item>
              <Dropdown.Item 
                icon={<IconDeleteStroked />} 
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
            icon={<IconMore />} 
            theme="borderless" 
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="worker-management">
      {/* 操作栏 */}
      <div className="worker-management-header">
        {/* 操作栏 */}
        <Row type="flex" justify="space-between" align="middle" className="worker-management-header-toolbar">
          <Col>
            <Space>
              <Input 
                prefix={<IconSearch />}
                placeholder={t('worker.searchPlaceholder')}
                className="worker-management-search-input"
                value={queryParams.keyword || ''}
                onChange={handleSearch}
              />
              <Popover
                visible={filterVisible}
                onVisibleChange={setFilterVisible}
                trigger="click"
                position="bottomLeft"
                content={filterContent}
              >
                <Button 
                  icon={<IconFilter />} 
                  theme={hasActiveFilters ? 'solid' : 'light'}
                  type={hasActiveFilters ? 'primary' : 'tertiary'}
                >
                  {t('common.filter')}{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </Button>
              </Popover>
            </Space>
          </Col>
          <Col>
            <Button 
              icon={<IconPlus />} 
              theme="solid" 
              type="primary"
              onClick={() => setCreateModalVisible(true)}
            >
              {t('worker.createWorker')}
            </Button>
          </Col>
        </Row>
      </div>

      {/* 表格区域 */}
      <div className="worker-management-table">
        <Table 
          columns={columns} 
          dataSource={list}
          loading={loading}
          rowKey="id"
          onRow={(record) => {
            const isSelected = selectedWorker?.id === record?.id && detailDrawerVisible;
            return {
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
      </div>

      {/* 详情抽屉 */}
      <WorkerDetailDrawer
        visible={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
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
        dataList={list}
        onNavigate={(worker) => setSelectedWorker(worker)}
      />

      {/* 密钥弹窗 */}
      <WorkerKeyModal
        visible={keyModalVisible}
        onClose={() => setKeyModalVisible(false)}
        workerData={keyModalWorker}
      />

      {/* 创建弹窗 */}
      <CreateWorkerModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* 编辑弹窗 */}
      <EditWorkerModal
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        workerData={editingWorker}
        onSuccess={handleEditSuccess}
      />

    </div>
  );
};

export default WorkerManagement;
