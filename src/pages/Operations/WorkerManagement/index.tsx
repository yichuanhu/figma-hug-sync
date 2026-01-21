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
import WorkerDeleteModal from './components/WorkerDeleteModal';
import './index.less';

const { Title, Text } = Typography;
const CheckboxGroup = Checkbox.Group;

// 机器人状态类型
type WorkerStatus = 'OFFLINE' | 'IDLE' | 'BUSY' | 'FAULT' | 'MAINTENANCE';
type SyncStatus = 'SYNCED' | 'PENDING';
type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

// 机器人数据接口
export interface WorkerData {
  id: string;
  name: string;
  description: string;
  status: WorkerStatus;
  syncStatus: SyncStatus;
  ipAddress: string;
  priority: Priority;
  clientVersion: string;
  lastHeartbeatTime: string;
  receiveTasks: boolean;
  username: string;
  desktopType: 'Console' | 'NotConsole';
  displaySize?: string;
  enableAutoUnlock?: boolean;
  forceLogin: boolean;
  deviceToken: string;
  // 主机信息
  machineCode: string;
  hostName: string;
  os: string;
  arch: string;
  cpuModel: string;
  cpuCores: number;
  memoryCapacity: string;
  robotCount: number;
  createdAt: string;
  creator: string;
}

// Mock数据
const mockWorkers: WorkerData[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: '财务机器人-01',
    description: '用于财务流程自动化的机器人',
    status: 'IDLE',
    syncStatus: 'SYNCED',
    ipAddress: '10.0.1.100',
    priority: 'HIGH',
    clientVersion: 'v6.7.0',
    lastHeartbeatTime: '2025-01-08 10:25:33',
    receiveTasks: true,
    username: 'DOMAIN\\robot01',
    desktopType: 'Console',
    enableAutoUnlock: true,
    forceLogin: false,
    deviceToken: 'abc123xyz789def456ghi012jkl345mno678pqr901stu234vwx567yzabc890',
    machineCode: 'F11FD4447A215F380A40',
    hostName: 'WIN-SERVER-01',
    os: 'Windows Server 2019 Standard 64位',
    arch: 'x64',
    cpuModel: 'Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz',
    cpuCores: 8,
    memoryCapacity: '32 GB',
    robotCount: 1,
    createdAt: '2025-01-05 14:30:00',
    creator: 'admin',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: '财务机器人-02',
    description: '用于财务报表自动化的机器人',
    status: 'BUSY',
    syncStatus: 'PENDING',
    ipAddress: '10.0.1.101',
    priority: 'MEDIUM',
    clientVersion: 'v6.7.0',
    lastHeartbeatTime: '2025-01-08 10:20:15',
    receiveTasks: true,
    username: 'DOMAIN\\robot02',
    desktopType: 'NotConsole',
    displaySize: '1920x1080',
    forceLogin: true,
    deviceToken: 'def456ghi012jkl345mno678pqr901stu234vwx567yzabc890abc123xyz789',
    machineCode: 'A22GE5558B326G491B51',
    hostName: 'WIN-SERVER-02',
    os: 'Windows Server 2019 Standard 64位',
    arch: 'x64',
    cpuModel: 'Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz',
    cpuCores: 8,
    memoryCapacity: '16 GB',
    robotCount: 2,
    createdAt: '2025-01-06 09:15:00',
    creator: 'admin',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: '财务机器人-03',
    description: '用于发票处理的机器人',
    status: 'OFFLINE',
    syncStatus: 'SYNCED',
    ipAddress: '10.0.1.102',
    priority: 'HIGH',
    clientVersion: 'v6.6.0',
    lastHeartbeatTime: '2025-01-07 16:30:22',
    receiveTasks: false,
    username: 'DOMAIN\\robot03',
    desktopType: 'Console',
    enableAutoUnlock: false,
    forceLogin: false,
    deviceToken: 'ghi012jkl345mno678pqr901stu234vwx567yzabc890abc123xyz789def456',
    machineCode: 'B33HF6669C437H502C62',
    hostName: 'WIN-SERVER-03',
    os: 'Windows 10 Pro 64位',
    arch: 'x64',
    cpuModel: 'Intel(R) Core(TM) i7-8700 @ 3.20GHz',
    cpuCores: 6,
    memoryCapacity: '16 GB',
    robotCount: 1,
    createdAt: '2025-01-04 11:20:00',
    creator: 'admin',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: '人力机器人-01',
    description: '用于人事审批流程的机器人',
    status: 'FAULT',
    syncStatus: 'SYNCED',
    ipAddress: '10.0.1.103',
    priority: 'LOW',
    clientVersion: 'v6.5.0',
    lastHeartbeatTime: '2025-01-06 09:15:00',
    receiveTasks: false,
    username: 'DOMAIN\\hr01',
    desktopType: 'Console',
    enableAutoUnlock: true,
    forceLogin: true,
    deviceToken: 'jkl345mno678pqr901stu234vwx567yzabc890abc123xyz789def456ghi012',
    machineCode: 'C44IG7770D548I613D73',
    hostName: 'WIN-HR-01',
    os: 'Windows 10 Pro 64位',
    arch: 'x64',
    cpuModel: 'Intel(R) Core(TM) i5-8400 @ 2.80GHz',
    cpuCores: 6,
    memoryCapacity: '8 GB',
    robotCount: 1,
    createdAt: '2025-01-03 15:45:00',
    creator: 'hr_admin',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: '运维机器人-01',
    description: '用于运维巡检的机器人',
    status: 'IDLE',
    syncStatus: 'SYNCED',
    ipAddress: '10.0.2.50',
    priority: 'MEDIUM',
    clientVersion: 'v6.7.0',
    lastHeartbeatTime: '2025-01-08 10:22:00',
    receiveTasks: true,
    username: 'ops01',
    desktopType: 'NotConsole',
    displaySize: '2560x1440',
    forceLogin: false,
    deviceToken: 'mno678pqr901stu234vwx567yzabc890abc123xyz789def456ghi012jkl345',
    machineCode: 'D55JH8881E659J724E84',
    hostName: 'WIN-OPS-01',
    os: 'Windows Server 2022 Standard 64位',
    arch: 'x64',
    cpuModel: 'AMD Ryzen 9 5900X 12-Core Processor',
    cpuCores: 12,
    memoryCapacity: '64 GB',
    robotCount: 1,
    createdAt: '2025-01-02 08:30:00',
    creator: 'ops_admin',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: '测试机器人-01',
    description: '用于自动化测试的机器人',
    status: 'MAINTENANCE',
    syncStatus: 'SYNCED',
    ipAddress: '10.0.3.10',
    priority: 'LOW',
    clientVersion: 'v6.7.0',
    lastHeartbeatTime: '2025-01-08 09:00:00',
    receiveTasks: false,
    username: 'DOMAIN\\test01',
    desktopType: 'Console',
    enableAutoUnlock: true,
    forceLogin: false,
    deviceToken: 'pqr901stu234vwx567yzabc890abc123xyz789def456ghi012jkl345mno678',
    machineCode: 'E66KI9992F760K835F95',
    hostName: 'WIN-TEST-01',
    os: 'Windows 11 Pro 64位',
    arch: 'x64',
    cpuModel: 'Intel(R) Core(TM) i9-12900K @ 3.20GHz',
    cpuCores: 16,
    memoryCapacity: '32 GB',
    robotCount: 1,
    createdAt: '2025-01-01 10:00:00',
    creator: 'qa_admin',
  },
];

interface FilterState {
  status: string[];
  syncStatus: string[];
  priority: string[];
}

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

// 模拟API请求 - 获取机器人列表
const fetchWorkerList = async (params: {
  page: number;
  pageSize: number;
  keyword?: string;
  filters?: FilterState;
}): Promise<{ data: WorkerData[]; total: number }> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let data = [...mockWorkers];

  // 关键词搜索（名称或IP）
  if (params.keyword?.trim()) {
    const keyword = params.keyword.toLowerCase().trim();
    data = data.filter(item => 
      item.name.toLowerCase().includes(keyword) ||
      item.ipAddress.toLowerCase().includes(keyword)
    );
  }

  // 状态筛选
  if (params.filters?.status && params.filters.status.length > 0) {
    data = data.filter(item => params.filters!.status.includes(item.status));
  }

  // 同步状态筛选
  if (params.filters?.syncStatus && params.filters.syncStatus.length > 0) {
    data = data.filter(item => params.filters!.syncStatus.includes(item.syncStatus));
  }

  // 优先级筛选
  if (params.filters?.priority && params.filters.priority.length > 0) {
    data = data.filter(item => params.filters!.priority.includes(item.priority));
  }

  // 模拟分页
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const paginatedData = data.slice(start, end);

  return {
    data: paginatedData,
    total: data.length,
  };
};

const WorkerManagement = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    syncStatus: [],
    priority: [],
  });
  const [filterVisible, setFilterVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workerListData, setWorkerListData] = useState<WorkerData[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  // 抽屉和弹窗状态
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerData | null>(null);
  const [keyModalVisible, setKeyModalVisible] = useState(false);
  const [keyModalWorker, setKeyModalWorker] = useState<WorkerData | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteModalWorker, setDeleteModalWorker] = useState<WorkerData | null>(null);

  // 状态配置
  const statusConfig: Record<WorkerStatus, { color: string; text: string }> = useMemo(() => ({
    OFFLINE: { color: 'grey', text: t('worker.status.offline') },
    IDLE: { color: 'green', text: t('worker.status.idle') },
    BUSY: { color: 'blue', text: t('worker.status.busy') },
    FAULT: { color: 'red', text: t('worker.status.fault') },
    MAINTENANCE: { color: 'orange', text: t('worker.status.maintenance') },
  }), [t]);

  // 优先级配置
  const priorityConfig: Record<Priority, { text: string; color: string }> = useMemo(() => ({
    HIGH: { text: t('worker.priority.high'), color: 'red' },
    MEDIUM: { text: t('worker.priority.medium'), color: 'blue' },
    LOW: { text: t('worker.priority.low'), color: 'grey' },
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
    syncStatus: [
      { label: t('worker.syncStatus.synced'), value: 'SYNCED' },
      { label: t('worker.syncStatus.pending'), value: 'PENDING' },
    ],
    priority: [
      { label: t('worker.priority.high'), value: 'HIGH' },
      { label: t('worker.priority.medium'), value: 'MEDIUM' },
      { label: t('worker.priority.low'), value: 'LOW' },
    ],
  }), [t]);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchWorkerList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        keyword: searchValue,
        filters,
      });
      setWorkerListData(result.data);
      setPagination(prev => ({ ...prev, total: result.total }));
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchValue, filters]);

  // 初始化加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 搜索
  const handleSearch = (value: string) => {
    setSearchValue(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleFilterChange = (key: keyof FilterState, values: string[]) => {
    setFilters(prev => ({ ...prev, [key]: values }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      syncStatus: [],
      priority: [],
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);
  const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);

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
          value={filters.syncStatus}
          onChange={(values) => handleFilterChange('syncStatus', values as string[])}
          options={filterOptions.syncStatus}
          direction="horizontal"
        />
      </div>
      <div className="filter-popover-section">
        <Text strong className="filter-popover-label">{t('worker.filter.priority')}</Text>
        <CheckboxGroup
          value={filters.priority}
          onChange={(values) => handleFilterChange('priority', values as string[])}
          options={filterOptions.priority}
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
  const openDetail = (worker: WorkerData) => {
    setSelectedWorker(worker);
    setDetailDrawerVisible(true);
  };

  // 打开密钥弹窗
  const openKeyModal = (worker: WorkerData, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setKeyModalWorker(worker);
    setKeyModalVisible(true);
  };

  // 打开删除确认弹窗
  const openDeleteModal = (worker: WorkerData, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeleteModalWorker(worker);
    setDeleteModalVisible(true);
  };

  // 编辑机器人
  const handleEdit = (worker: WorkerData, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigate(`/worker-management/edit/${worker.id}`);
  };

  // 确认删除
  const handleDeleteConfirm = () => {
    console.log('删除机器人:', deleteModalWorker?.id);
    setDeleteModalVisible(false);
    setDeleteModalWorker(null);
    loadData();
  };

  // 从详情抽屉跳转到编辑
  const handleEditFromDrawer = () => {
    if (selectedWorker) {
      setDetailDrawerVisible(false);
      navigate(`/worker-management/edit/${selectedWorker.id}`);
    }
  };

  // 从详情抽屉删除
  const handleDeleteFromDrawer = () => {
    if (selectedWorker) {
      setDetailDrawerVisible(false);
      openDeleteModal(selectedWorker);
    }
  };

  const columns = [
    {
      title: t('worker.table.workerName'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: WorkerData) => (
        <div>
          <div className="worker-name-cell-header">
            <span className="worker-name-cell-name">{name}</span>
            {record.syncStatus === 'PENDING' && (
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
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
    },
    {
      title: t('worker.table.priority'),
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority: Priority | undefined) => {
        if (!priority) return null;
        const config = priorityConfig[priority];
        return (
          <Tag color={config.color as 'red' | 'blue' | 'grey'} type="light">
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: t('worker.table.clientVersion'),
      dataIndex: 'clientVersion',
      key: 'clientVersion',
      width: 100,
    },
    {
      title: t('worker.table.lastHeartbeat'),
      dataIndex: 'lastHeartbeatTime',
      key: 'lastHeartbeatTime',
      width: 160,
      sorter: true,
    },
    {
      title: t('worker.table.receiveTasks'),
      dataIndex: 'receiveTasks',
      key: 'receiveTasks',
      width: 90,
      render: (receiveTasks: boolean, record: WorkerData) => {
        // 只有在线且非故障状态才允许操作
        const canOperate = record.status !== 'OFFLINE' && record.status !== 'FAULT';
        return (
          <Switch 
            checked={receiveTasks} 
            size="small" 
            disabled={!canOperate}
            onChange={(checked) => {
              console.log('切换接收任务状态:', record.id, checked);
            }}
          />
        );
      },
    },
    {
      title: t('worker.table.actions'),
      dataIndex: 'action',
      key: 'action',
      width: 60,
      render: (_: unknown, record: WorkerData) => (
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
                  openDeleteModal(record);
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
      {/* 固定面包屑 */}
      <div className="worker-management-breadcrumb">
        <Breadcrumb>
          <Breadcrumb.Item onClick={() => navigate('/')}>{t('common.home')}</Breadcrumb.Item>
          <Breadcrumb.Item>{t('worker.breadcrumb.developmentCenter')}</Breadcrumb.Item>
          <Breadcrumb.Item>{t('worker.breadcrumb.workerManagement')}</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* 标题区域 */}
      <div className="worker-management-header">
        <div className="worker-management-header-title">
          <Title heading={3} className="title">{t('worker.title')}</Title>
          <Text type="tertiary">{t('worker.description')}</Text>
        </div>

        {/* 操作栏 */}
        <Row type="flex" justify="space-between" align="middle" className="worker-management-header-toolbar">
          <Col>
            <Space>
              <Input 
                prefix={<IconSearch />}
                placeholder={t('worker.searchPlaceholder')}
                className="worker-management-search-input"
                value={searchValue}
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
              onClick={() => navigate('/worker-management/create')}
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
          dataSource={workerListData}
          loading={loading}
          rowKey="id"
          onRow={(record) => ({
            onClick: () => openDetail(record as WorkerData),
            style: { cursor: 'pointer' }
          })}
          pagination={{
            total: pagination.total,
            pageSize: pagination.pageSize,
            currentPage: pagination.current,
            onPageChange: (page) => setPagination(prev => ({ ...prev, current: page })),
            onPageSizeChange: (pageSize) => setPagination(prev => ({ ...prev, current: 1, pageSize })),
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
        onDelete={handleDeleteFromDrawer}
      />

      {/* 密钥弹窗 */}
      <WorkerKeyModal
        visible={keyModalVisible}
        onClose={() => setKeyModalVisible(false)}
        workerData={keyModalWorker}
      />

      {/* 删除确认弹窗 */}
      <WorkerDeleteModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        workerData={deleteModalWorker}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default WorkerManagement;
