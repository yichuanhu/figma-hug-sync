import { useState, useMemo, useEffect } from 'react';
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
  Pagination,
  Skeleton,
  Empty
} from '@douyinfe/semi-ui';
import { IllustrationNoResult, IllustrationNoResultDark } from '@douyinfe/semi-illustrations';
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
import WorkerDetailDrawer from './components/WorkerDetailDrawer';
import WorkerKeyModal from './components/WorkerKeyModal';
import WorkerDeleteModal from './components/WorkerDeleteModal';

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

// 状态配置 - 去掉图标
const statusConfig: Record<WorkerStatus, { color: string; text: string }> = {
  OFFLINE: { color: 'grey', text: '离线' },
  IDLE: { color: 'green', text: '空闲' },
  BUSY: { color: 'blue', text: '忙碌' },
  FAULT: { color: 'red', text: '故障' },
  MAINTENANCE: { color: 'orange', text: '维护中' },
};

// 优先级配置 - 使用Tag颜色
const priorityConfig: Record<Priority, { text: string; color: string }> = {
  HIGH: { text: '高', color: 'red' },
  MEDIUM: { text: '中', color: 'blue' },
  LOW: { text: '低', color: 'grey' },
};

// 筛选选项
const filterOptions = {
  status: [
    { label: '离线', value: 'OFFLINE' },
    { label: '空闲', value: 'IDLE' },
    { label: '忙碌', value: 'BUSY' },
    { label: '故障', value: 'FAULT' },
    { label: '维护中', value: 'MAINTENANCE' },
  ],
  syncStatus: [
    { label: '已同步', value: 'SYNCED' },
    { label: '待同步', value: 'PENDING' },
  ],
  priority: [
    { label: '高', value: 'HIGH' },
    { label: '中', value: 'MEDIUM' },
    { label: '低', value: 'LOW' },
  ],
};

interface FilterState {
  status: string[];
  syncStatus: string[];
  priority: string[];
}

const WorkerManagement = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    syncStatus: [],
    priority: [],
  });
  const [filterVisible, setFilterVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 模拟加载数据
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // 抽屉和弹窗状态
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerData | null>(null);
  const [keyModalVisible, setKeyModalVisible] = useState(false);
  const [keyModalWorker, setKeyModalWorker] = useState<WorkerData | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteModalWorker, setDeleteModalWorker] = useState<WorkerData | null>(null);

  const handleFilterChange = (key: keyof FilterState, values: string[]) => {
    setFilters(prev => ({ ...prev, [key]: values }));
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      syncStatus: [],
      priority: [],
    });
  };

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);
  const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);

  // 筛选后的数据
  const filteredData = useMemo(() => {
    let data = mockWorkers;

    // 关键词搜索（名称或IP）
    if (searchValue.trim()) {
      const keyword = searchValue.toLowerCase().trim();
      data = data.filter(item => 
        item.name.toLowerCase().includes(keyword) ||
        item.ipAddress.toLowerCase().includes(keyword)
      );
    }

    // 状态筛选
    if (filters.status.length > 0) {
      data = data.filter(item => filters.status.includes(item.status));
    }

    // 同步状态筛选
    if (filters.syncStatus.length > 0) {
      data = data.filter(item => filters.syncStatus.includes(item.syncStatus));
    }

    // 优先级筛选
    if (filters.priority.length > 0) {
      data = data.filter(item => filters.priority.includes(item.priority));
    }

    return data;
  }, [searchValue, filters]);

  const filterContent = (
    <div style={{ padding: 16, width: 280 }}>
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>机器人状态</Text>
        <CheckboxGroup
          value={filters.status}
          onChange={(values) => handleFilterChange('status', values as string[])}
          options={filterOptions.status}
          direction="horizontal"
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>同步状态</Text>
        <CheckboxGroup
          value={filters.syncStatus}
          onChange={(values) => handleFilterChange('syncStatus', values as string[])}
          options={filterOptions.syncStatus}
          direction="horizontal"
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>任务调度优先级</Text>
        <CheckboxGroup
          value={filters.priority}
          onChange={(values) => handleFilterChange('priority', values as string[])}
          options={filterOptions.priority}
          direction="horizontal"
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--semi-color-border)', paddingTop: 12 }}>
        <Button theme="borderless" onClick={clearFilters} disabled={!hasActiveFilters}>
          重置
        </Button>
        <Button theme="solid" type="primary" onClick={() => setFilterVisible(false)}>
          确定
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
    // 这里可以添加实际的删除逻辑
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

  // 骨架屏数据
  const skeletonData = Array(6).fill(null).map((_, index) => ({ id: `skeleton-${index}` }));

  // 骨架屏列配置
  const skeletonColumns = [
    {
      title: '流程机器人名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: () => (
        <div>
          <Skeleton placeholder={<Skeleton.Paragraph rows={1} style={{ width: 120 }} />} loading active />
          <Skeleton placeholder={<Skeleton.Paragraph rows={1} style={{ width: 80, marginTop: 4 }} />} loading active />
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} style={{ width: 50 }} />} loading active />,
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} style={{ width: 90 }} />} loading active />,
    },
    {
      title: '任务调度优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} style={{ width: 40 }} />} loading active />,
    },
    {
      title: '客户端版本',
      dataIndex: 'clientVersion',
      key: 'clientVersion',
      width: 100,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} style={{ width: 50 }} />} loading active />,
    },
    {
      title: '最近连接时间',
      dataIndex: 'lastHeartbeatTime',
      key: 'lastHeartbeatTime',
      width: 160,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} style={{ width: 120 }} />} loading active />,
    },
    {
      title: '接收任务',
      dataIndex: 'receiveTasks',
      key: 'receiveTasks',
      width: 90,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} style={{ width: 40 }} />} loading active />,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 60,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} style={{ width: 24 }} />} loading active />,
    },
  ];

  const columns = [
    {
      title: '流程机器人名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: WorkerData) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 500 }}>{name}</span>
            {record.syncStatus === 'PENDING' && (
              <Tag color="orange" size="small" type="light">待同步</Tag>
            )}
          </div>
          <div style={{ color: 'var(--semi-color-text-2)', fontSize: 12, marginTop: 2 }}>
            {record.username || '-'}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
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
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
    },
    {
      title: '任务调度优先级',
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
      title: '客户端版本',
      dataIndex: 'clientVersion',
      key: 'clientVersion',
      width: 100,
    },
    {
      title: '最近连接时间',
      dataIndex: 'lastHeartbeatTime',
      key: 'lastHeartbeatTime',
      width: 160,
      sorter: true,
    },
    {
      title: '接收任务',
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
              // 这里可以添加实际的状态更新逻辑
            }}
          />
        );
      },
    },
    {
      title: '操作',
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
                查看详情
              </Dropdown.Item>
              <Dropdown.Item 
                icon={<IconKey />} 
                onClick={(e) => {
                  e?.stopPropagation?.();
                  openKeyModal(record);
                }}
              >
                查看密钥
              </Dropdown.Item>
              <Dropdown.Item 
                icon={<IconEditStroked />} 
                onClick={(e) => {
                  e?.stopPropagation?.();
                  handleEdit(record);
                }}
              >
                编辑
              </Dropdown.Item>
              <Dropdown.Item 
                icon={<IconDeleteStroked />} 
                type="danger" 
                onClick={(e) => {
                  e?.stopPropagation?.();
                  openDeleteModal(record);
                }}
              >
                删除
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 固定面包屑 */}
      <div style={{ 
        padding: '12px 24px',
        flexShrink: 0,
      }}>
        <Breadcrumb>
          <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>首页</Breadcrumb.Item>
          <Breadcrumb.Item>开发中心</Breadcrumb.Item>
          <Breadcrumb.Item>流程机器人管理</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* 标题区域 */}
      <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <div style={{ marginBottom: 24 }}>
          <Title heading={3} style={{ marginBottom: 8 }}>流程机器人管理</Title>
          <Text type="tertiary">管理无人值守流程机器人，配置机器人参数和连接信息</Text>
        </div>

        {/* 操作栏 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16 
        }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Input 
              prefix={<IconSearch />}
              placeholder="搜索流程机器人名称、IP地址..."
              style={{ width: 280 }}
              value={searchValue}
              onChange={(value) => setSearchValue(value)}
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
                筛选{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Button>
            </Popover>
          </div>
          <Button 
            icon={<IconPlus />} 
            theme="solid" 
            type="primary"
            onClick={() => navigate('/worker-management/create')}
          >
            新建流程机器人
          </Button>
        </div>
      </div>

      {/* 表格区域 */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden', 
        padding: '0 24px',
        minHeight: 0,
      }}>
        {loading ? (
          <Table 
            columns={skeletonColumns} 
            dataSource={skeletonData}
            rowKey="id"
            pagination={false}
            scroll={{ y: 'calc(100vh - 320px)' }}
            style={{ 
              borderRadius: 8, 
              overflow: 'hidden',
            }}
          />
        ) : (
          <Table 
            columns={columns} 
            dataSource={filteredData}
            rowKey="id"
            empty={
              <Empty
                image={<IllustrationNoResult style={{ width: 150, height: 150 }} />}
                darkModeImage={<IllustrationNoResultDark style={{ width: 150, height: 150 }} />}
                title="暂无数据"
                description={hasActiveFilters || searchValue ? "没有找到匹配的机器人，请尝试调整筛选条件" : "还没有创建任何机器人，点击「新建流程机器人」开始"}
              />
            }
            onRow={(record) => ({
              onClick: () => openDetail(record as WorkerData),
              style: { cursor: 'pointer' }
            })}
            pagination={false}
            scroll={{ y: 'calc(100vh - 320px)' }}
            style={{ 
              borderRadius: 8, 
              overflow: 'hidden',
            }}
          />
        )}
      </div>

      {/* 分页区域 */}
      <div style={{ 
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <Text type="tertiary" style={{ fontSize: 14 }}>
          显示第 1 条-第 {Math.min(10, filteredData.length)} 条，共 {filteredData.length} 条
        </Text>
        <Pagination 
          total={filteredData.length} 
          pageSize={10} 
          currentPage={1}
          showSizeChanger
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
