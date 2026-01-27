import { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal, Input, Table, Typography, Checkbox, Toast, Select, Tag, Space } from '@douyinfe/semi-ui';
import { IconSearch, IconClose } from '@douyinfe/semi-icons';
import EmptyState from '@/components/EmptyState';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';
import type { 
  LYWorkerResponse, 
  LYListResponseLYWorkerResponse,
  GetAvailableWorkersForGroupParams,
} from '@/api';
import './index.less';

// 状态类型定义
type WorkerStatus = 'OFFLINE' | 'IDLE' | 'BUSY' | 'FAULT' | 'MAINTENANCE';

const { Text, Title } = Typography;

interface AddMembersModalProps {
  visible: boolean;
  onCancel: () => void;
  groupId: string;
  groupName: string;
  onSuccess: () => void;
}

// Mock可添加的机器人数据
const mockAvailableWorkers: LYWorkerResponse[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    name: '财务机器人-03',
    description: '用于发票处理的机器人',
    status: 'IDLE',
    sync_status: 'SYNCED',
    ip_address: '10.0.1.102',
    priority: 'HIGH',
    client_version: 'v6.6.0',
    last_heartbeat_time: '2025-01-07 16:30:22',
    receive_tasks: true,
    username: 'DOMAIN\\robot03',
    desktop_type: 'Console',
    enable_auto_unlock: false,
    force_login: false,
    device_token: 'ghi012jkl345',
    machine_code: 'B33HF6669C437H502C62',
    host_name: 'WIN-SERVER-03',
    os: 'Windows 10 Pro',
    arch: 'x64',
    cpu_model: 'Intel i7',
    cpu_cores: 6,
    memory_capacity: '16 GB',
    robot_count: 1,
    created_at: '2025-01-04 11:20:00',
    creator_id: 'admin',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    name: '人力机器人-02',
    description: '用于人事审批流程的机器人',
    status: 'OFFLINE',
    sync_status: 'SYNCED',
    ip_address: '10.0.1.103',
    priority: 'LOW',
    client_version: 'v6.5.0',
    last_heartbeat_time: '2025-01-06 09:15:00',
    receive_tasks: false,
    username: 'DOMAIN\\hr02',
    desktop_type: 'Console',
    enable_auto_unlock: true,
    force_login: true,
    device_token: 'jkl345mno678',
    machine_code: 'C44IG7770D548I613D73',
    host_name: 'WIN-HR-02',
    os: 'Windows 10 Pro',
    arch: 'x64',
    cpu_model: 'Intel i5',
    cpu_cores: 6,
    memory_capacity: '8 GB',
    robot_count: 1,
    created_at: '2025-01-03 15:45:00',
    creator_id: 'hr_admin',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    name: '运维机器人-02',
    description: '用于运维巡检的机器人',
    status: 'IDLE',
    sync_status: 'SYNCED',
    ip_address: '10.0.2.51',
    priority: 'MEDIUM',
    client_version: 'v6.7.0',
    last_heartbeat_time: '2025-01-08 10:22:00',
    receive_tasks: true,
    username: 'ops02',
    desktop_type: 'NotConsole',
    display_size: '1920x1080',
    force_login: false,
    device_token: 'mno678pqr901',
    machine_code: 'D55JH8881E659J724E84',
    host_name: 'WIN-OPS-02',
    os: 'Windows Server 2022',
    arch: 'x64',
    cpu_model: 'AMD Ryzen 9',
    cpu_cores: 12,
    memory_capacity: '64 GB',
    robot_count: 1,
    created_at: '2025-01-02 08:30:00',
    creator_id: 'ops_admin',
  },
];

// 获取可添加的机器人列表
const fetchAvailableWorkers = async (params: GetAvailableWorkersForGroupParams & { statusFilter?: WorkerStatus[] }): Promise<LYListResponseLYWorkerResponse> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let data = [...mockAvailableWorkers];
  
  if (params.keyword?.trim()) {
    const keyword = params.keyword.toLowerCase().trim();
    data = data.filter(item => 
      item.name.toLowerCase().includes(keyword) ||
      item.ip_address.toLowerCase().includes(keyword)
    );
  }

  // 状态筛选
  if (params.statusFilter && params.statusFilter.length > 0) {
    data = data.filter(item => params.statusFilter!.includes(item.status as WorkerStatus));
  }

  const total = data.length;
  const offset = params.offset || 0;
  const size = params.size || 20;
  const paginatedData = data.slice(offset, offset + size);

  return {
    range: { offset, size, total },
    list: paginatedData,
  };
};

// 状态配置
const statusConfig: Record<WorkerStatus, { color: 'green' | 'blue' | 'orange' | 'red' | 'grey'; i18nKey: string }> = {
  IDLE: { color: 'green', i18nKey: 'worker.status.idle' },
  BUSY: { color: 'blue', i18nKey: 'worker.status.busy' },
  MAINTENANCE: { color: 'orange', i18nKey: 'worker.status.maintenance' },
  FAULT: { color: 'red', i18nKey: 'worker.status.fault' },
  OFFLINE: { color: 'grey', i18nKey: 'worker.status.offline' },
};

const AddMembersModal: React.FC<AddMembersModalProps> = ({
  visible,
  onCancel,
  groupId,
  groupName,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [workersResponse, setWorkersResponse] = useState<LYListResponseLYWorkerResponse>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });
  const [queryParams, setQueryParams] = useState<GetAvailableWorkersForGroupParams>({
    offset: 0,
    size: 20,
    keyword: undefined,
  });
  const [statusFilter, setStatusFilter] = useState<WorkerStatus[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<LYWorkerResponse[]>([]);

  // 状态筛选选项
  const statusOptions = useMemo(() => [
    { value: 'IDLE', label: t('worker.status.idle') },
    { value: 'BUSY', label: t('worker.status.busy') },
    { value: 'MAINTENANCE', label: t('worker.status.maintenance') },
    { value: 'FAULT', label: t('worker.status.fault') },
    { value: 'OFFLINE', label: t('worker.status.offline') },
  ], [t]);

  // 加载可选机器人列表
  const loadWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAvailableWorkers({ ...queryParams, statusFilter });
      setWorkersResponse(response);
    } finally {
      setLoading(false);
    }
  }, [queryParams, statusFilter]);

  useEffect(() => {
    if (visible) {
      setSelectedWorkers([]);
      setStatusFilter([]);
      setQueryParams({ offset: 0, size: 20, keyword: undefined });
    }
  }, [visible]);

  // 状态筛选变化时重置分页
  const handleStatusFilterChange = (values: WorkerStatus[]) => {
    setStatusFilter(values);
    setQueryParams(prev => ({ ...prev, offset: 0 }));
  };

  useEffect(() => {
    if (visible) {
      loadWorkers();
    }
  }, [visible, queryParams, loadWorkers]);

  // 搜索 - 防抖处理
  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams(prev => ({ ...prev, keyword: value || undefined, offset: 0 }));
      }, 500),
    []
  );

  // 选择/取消选择机器人
  const handleSelectWorker = (worker: LYWorkerResponse, checked: boolean) => {
    if (checked) {
      setSelectedWorkers(prev => [...prev, worker]);
    } else {
      setSelectedWorkers(prev => prev.filter(w => w.id !== worker.id));
    }
  };

  // 移除已选机器人
  const handleRemoveSelected = (workerId: string) => {
    setSelectedWorkers(prev => prev.filter(w => w.id !== workerId));
  };

  // 提交
  const handleSubmit = async () => {
    if (selectedWorkers.length === 0) {
      Toast.warning(t('workerGroup.addMembers.selectRequired'));
      return;
    }

    setSubmitting(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('添加成员到组:', groupId, selectedWorkers.map(w => w.id));
      
      Toast.success(t('workerGroup.addMembers.success', { count: selectedWorkers.length }));
      onCancel();
      onSuccess();
    } catch (error) {
      Toast.error(t('workerGroup.addMembers.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const { range, list } = workersResponse;
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  const columns = [
    {
      title: '',
      dataIndex: 'select',
      key: 'select',
      width: 50,
      render: (_: unknown, record: LYWorkerResponse) => {
        const isSelected = selectedWorkers.some(w => w.id === record.id);
        return (
          <Checkbox 
            checked={isSelected}
            onChange={(e) => handleSelectWorker(record, e.target.checked)}
          />
        );
      },
    },
    {
      title: t('worker.table.workerName'),
      dataIndex: 'name',
      key: 'name',
      width: 140,
    },
    {
      title: t('worker.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: WorkerStatus) => (
        <Tag color={statusConfig[status]?.color || 'grey'} type="light">
          {t(statusConfig[status]?.i18nKey || 'worker.status.offline')}
        </Tag>
      ),
    },
    {
      title: t('worker.table.ipAddress'),
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 120,
    },
  ];

  return (
    <Modal
      visible={visible}
      title={t('workerGroup.addMembers.title')}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText={selectedWorkers.length > 0 
        ? t('workerGroup.addMembers.addCount', { count: selectedWorkers.length })
        : t('workerGroup.addMembers.add')
      }
      okButtonProps={{ disabled: selectedWorkers.length === 0 }}
      cancelText={t('common.cancel')}
      confirmLoading={submitting}
      className="add-members-modal"
      centered
      width={800}
    >
      <div className="add-members-modal-content">
        {/* 左侧：可选机器人列表 */}
        <div className="add-members-modal-left">
          <div className="add-members-modal-left-header">
            <Text strong>{t('workerGroup.addMembers.availableWorkers')}</Text>
          </div>
          <div className="add-members-modal-left-filter">
            <Space>
              <Input 
                prefix={<IconSearch />}
                placeholder={t('workerGroup.addMembers.searchPlaceholder')}
                onChange={handleSearch}
                showClear
                style={{ width: 200 }}
              />
              <Select
                placeholder={t('workerGroup.addMembers.statusFilter')}
                multiple
                maxTagCount={1}
                value={statusFilter}
                onChange={handleStatusFilterChange}
                style={{ width: 160 }}
                showClear
              >
                {statusOptions.map(option => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Space>
          </div>
          <div className="add-members-modal-left-table">
            <Table 
              columns={columns} 
              dataSource={list}
              loading={loading}
              rowKey="id"
              empty={<EmptyState description={t('workerGroup.addMembers.noAvailableWorkers')} size={120} />}
              pagination={{
                total,
                pageSize,
                currentPage,
                onPageChange: (page) => {
                  setQueryParams(prev => ({ ...prev, offset: (page - 1) * pageSize }));
                },
                showTotal: true,
              }}
              scroll={{ y: 260 }}
              size="small"
            />
          </div>
        </div>

        {/* 右侧：已选机器人列表 */}
        <div className="add-members-modal-right">
          <div className="add-members-modal-right-header">
            <Text strong>
              {t('workerGroup.addMembers.selectedWorkers')} ({selectedWorkers.length})
            </Text>
          </div>
          {selectedWorkers.length > 0 ? (
            <div className="add-members-modal-right-list">
              {selectedWorkers.map(worker => (
                <div key={worker.id} className="add-members-modal-right-item">
                  <span className="add-members-modal-right-item-name">{worker.name}</span>
                  <IconClose 
                    className="add-members-modal-right-item-remove"
                    onClick={() => handleRemoveSelected(worker.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="add-members-modal-right-empty">
              <Text type="tertiary">{t('workerGroup.addMembers.noSelection')}</Text>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AddMembersModal;
