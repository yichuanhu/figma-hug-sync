import { useState, useMemo } from 'react';
import { 
  Breadcrumb, 
  Typography, 
  Input, 
  Button, 
  Table, 
  Tag, 
  Dropdown,
  Select,
  Switch,
  Modal
} from '@douyinfe/semi-ui';
import { 
  IconSearch, 
  IconPlus, 
  IconMore, 
  IconEyeOpenedStroked, 
  IconEditStroked, 
  IconDeleteStroked,
  IconKey
} from '@douyinfe/semi-icons';
import { useNavigate } from 'react-router-dom';
import WorkerDetailDrawer from '@/components/worker/WorkerDetailDrawer';
import WorkerKeyModal from '@/components/worker/WorkerKeyModal';
import WorkerDeleteModal from '@/components/worker/WorkerDeleteModal';

const { Title, Text } = Typography;

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

const WorkerManagement = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [syncStatusFilter, setSyncStatusFilter] = useState<string>('all');
  
  // 抽屉和弹窗状态
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerData | null>(null);
  const [keyModalVisible, setKeyModalVisible] = useState(false);
  const [keyModalWorker, setKeyModalWorker] = useState<WorkerData | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteModalWorker, setDeleteModalWorker] = useState<WorkerData | null>(null);

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
    if (statusFilter !== 'all') {
      data = data.filter(item => item.status === statusFilter);
    }

    // 同步状态筛选
    if (syncStatusFilter !== 'all') {
      data = data.filter(item => item.syncStatus === syncStatusFilter);
    }

    return data;
  }, [searchValue, statusFilter, syncStatusFilter]);

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
      render: (status: WorkerStatus) => {
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
      render: (priority: Priority) => {
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
          render={
            <Dropdown.Menu>
              <Dropdown.Item 
                icon={<IconEyeOpenedStroked />} 
                onClick={() => openDetail(record)}
              >
                查看详情
              </Dropdown.Item>
              <Dropdown.Item 
                icon={<IconKey />} 
                onClick={() => openKeyModal(record)}
              >
                查看密钥
              </Dropdown.Item>
              <Dropdown.Item 
                icon={<IconEditStroked />} 
                onClick={() => handleEdit(record)}
              >
                编辑
              </Dropdown.Item>
              <Dropdown.Item 
                icon={<IconDeleteStroked />} 
                type="danger" 
                onClick={() => openDeleteModal(record)}
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
    <div style={{ padding: '20px 24px', minHeight: '100%' }}>
      {/* 面包屑 */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>首页</Breadcrumb.Item>
        <Breadcrumb.Item>开发中心</Breadcrumb.Item>
        <Breadcrumb.Item>流程机器人管理</Breadcrumb.Item>
      </Breadcrumb>

      {/* 标题区域 */}
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
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as string)}
            style={{ width: 140 }}
            placeholder="流程机器人状态"
          >
            <Select.Option value="all">全部状态</Select.Option>
            <Select.Option value="OFFLINE">⚪ 离线</Select.Option>
            <Select.Option value="IDLE">🟢 空闲</Select.Option>
            <Select.Option value="BUSY">🔵 忙碌</Select.Option>
            <Select.Option value="FAULT">🔴 故障</Select.Option>
            <Select.Option value="MAINTENANCE">🟡 维护中</Select.Option>
          </Select>
          <Select
            value={syncStatusFilter}
            onChange={(value) => setSyncStatusFilter(value as string)}
            style={{ width: 140 }}
            placeholder="属性同步状态"
          >
            <Select.Option value="all">全部</Select.Option>
            <Select.Option value="SYNCED">已同步</Select.Option>
            <Select.Option value="PENDING">待同步</Select.Option>
          </Select>
          <Input 
            prefix={<IconSearch />}
            placeholder="搜索流程机器人名称、IP地址..."
            style={{ width: 280 }}
            value={searchValue}
            onChange={(value) => setSearchValue(value)}
          />
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

      {/* 列表信息 */}
      <div style={{ marginBottom: 12 }}>
        <Text type="tertiary">流程机器人列表 (共 {filteredData.length} 条记录)</Text>
      </div>

      {/* 表格 */}
      <Table 
        columns={columns} 
        dataSource={filteredData}
        rowKey="id"
        onRow={(record) => ({
          onClick: () => openDetail(record as WorkerData),
          style: { cursor: 'pointer' }
        })}
        pagination={{
          currentPage: 1,
          pageSize: 10,
          total: filteredData.length,
          showTotal: true,
          showSizeChanger: true,
          formatPageText: (page) => `显示第 ${page?.currentStart} 条-第 ${page?.currentEnd} 条，共 ${page?.total} 条`,
        }}
        style={{ backgroundColor: '#fff' }}
      />

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
