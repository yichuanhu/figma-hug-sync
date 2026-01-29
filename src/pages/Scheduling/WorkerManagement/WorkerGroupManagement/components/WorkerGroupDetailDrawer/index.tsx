import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  SideSheet, 
  Typography, 
  Descriptions, 
  Button, 
  Table, 
  Tag, 
  Input,
  Select,
  Row,
  Col,
  Space,
  Modal,
  Toast,
  Dropdown,
  Tooltip,
  Divider,
  Tabs,
  TabPane,
} from '@douyinfe/semi-ui';
import EmptyState from '@/components/EmptyState';
import DetailSkeleton from '@/components/DetailSkeleton';
import TableSkeleton from '@/components/TableSkeleton';
import { 
  IconEditStroked, 
  IconDeleteStroked, 
  IconSearch,
  IconPlus,
  IconMore,
  IconEyeOpenedStroked,
  IconMinusCircleStroked,
  IconMaximize,
  IconMinimize,
  IconChevronDown,
  IconChevronUp,
  IconChevronLeft,
  IconChevronRight,
  IconClose,
} from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';
import AddMembersModal from '../AddMembersModal';
import type { 
  LYWorkerGroupResponse, 
  LYWorkerGroupMemberResponse, 
  LYListResponseLYWorkerGroupMemberResponse,
  GetWorkerGroupMembersParams,
} from '@/api';
import './index.less';

const { Title, Text } = Typography;

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
}

interface WorkerGroupDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  groupData: LYWorkerGroupResponse | null;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  // 导航相关
  dataList?: LYWorkerGroupResponse[];
  onNavigate?: (group: LYWorkerGroupResponse) => void;
  // 分页相关 - 用于自动翻页
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => Promise<LYWorkerGroupResponse[] | void>;
  // 跳转到机器人详情
  onNavigateToWorkerDetail?: (workerId: string) => void;
  // 滚动到行
  onScrollToRow?: (id: string) => void;
}

// 描述展开收起的阈值（字符数）
const DESCRIPTION_COLLAPSE_THRESHOLD = 100;

// Mock成员数据
const mockMembers: LYWorkerGroupMemberResponse[] = [
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
    device_token: 'abc123xyz789',
    machine_code: 'F11FD4447A215F380A40',
    host_name: 'WIN-SERVER-01',
    os: 'Windows Server 2019',
    arch: 'x64',
    cpu_model: 'Intel Xeon',
    cpu_cores: 8,
    memory_capacity: '32 GB',
    robot_count: 1,
    created_at: '2025-01-05 14:30:00',
    creator_id: 'admin',
    group_id: 'group-001',
    joined_at: '2025-01-06 10:00:00',
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
    device_token: 'def456ghi012',
    machine_code: 'A22GE5558B326G491B51',
    host_name: 'WIN-SERVER-02',
    os: 'Windows Server 2019',
    arch: 'x64',
    cpu_model: 'Intel Xeon',
    cpu_cores: 8,
    memory_capacity: '16 GB',
    robot_count: 2,
    created_at: '2025-01-06 09:15:00',
    creator_id: 'admin',
    group_id: 'group-001',
    joined_at: '2025-01-06 11:00:00',
  },
];

// 获取成员列表
const fetchGroupMembers = async (params: GetWorkerGroupMembersParams): Promise<LYListResponseLYWorkerGroupMemberResponse> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let data = mockMembers.filter(m => m.group_id === params.group_id);
  
  if (params.keyword?.trim()) {
    const keyword = params.keyword.toLowerCase().trim();
    data = data.filter(item => 
      item.name.toLowerCase().includes(keyword) ||
      item.ip_address.toLowerCase().includes(keyword)
    );
  }

  if (params.status) {
    data = data.filter(item => item.status === params.status);
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

const WorkerGroupDetailDrawer: React.FC<WorkerGroupDetailDrawerProps> = ({
  visible,
  onClose,
  groupData,
  onEdit,
  onDelete,
  onRefresh,
  dataList = [],
  onNavigate,
  pagination,
  onPageChange,
  onNavigateToWorkerDetail,
  onScrollToRow,
}) => {
  const { t } = useTranslation();
  
  // 抽屉状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('workerGroupDetailDrawerWidth');
    return saved ? Math.max(Number(saved), 576) : 900;
  });
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(drawerWidth);
  
  // 成员列表状态
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersResponse, setMembersResponse] = useState<LYListResponseLYWorkerGroupMemberResponse>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });
  const [queryParams, setQueryParams] = useState<GetWorkerGroupMembersParams>({
    group_id: '',
    offset: 0,
    size: 20,
    keyword: undefined,
  });
  const [statusFilter, setStatusFilter] = useState<WorkerStatus[]>([]);
  const [addMembersVisible, setAddMembersVisible] = useState(false);

  // 状态筛选选项
  const statusOptions = useMemo(() => [
    { value: 'IDLE', label: t('worker.status.idle') },
    { value: 'BUSY', label: t('worker.status.busy') },
    { value: 'MAINTENANCE', label: t('worker.status.maintenance') },
    { value: 'FAULT', label: t('worker.status.fault') },
    { value: 'OFFLINE', label: t('worker.status.offline') },
  ], [t]);

  // 当groupData变化时，重置描述展开状态
  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [groupData?.id]);

  // 拖拽调整宽度
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = drawerWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        const diff = startX.current - e.clientX;
        setDrawerWidth(Math.min(Math.max(startWidth.current + diff, 576), window.innerWidth - 100));
      };
      const handleMouseUp = () => {
        isResizing.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [drawerWidth],
  );

  // 保存宽度到localStorage
  useEffect(() => {
    localStorage.setItem('workerGroupDetailDrawerWidth', String(drawerWidth));
  }, [drawerWidth]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // 导航逻辑
  const currentIndex = useMemo(() => {
    if (!groupData || dataList.length === 0) return -1;
    return dataList.findIndex(item => item.id === groupData.id);
  }, [groupData, dataList]);

  // 判断是否可以导航（考虑分页）
  const canGoPrev = useMemo(() => {
    if (currentIndex > 0) return true;
    if (pagination && pagination.currentPage > 1) return true;
    return false;
  }, [currentIndex, pagination]);

  const canGoNext = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < dataList.length - 1) return true;
    if (pagination && pagination.currentPage < pagination.totalPages) return true;
    return false;
  }, [currentIndex, dataList.length, pagination]);

  const [isNavigating, setIsNavigating] = useState(false);

  const handlePrev = useCallback(async () => {
    if (isNavigating) return;
    
    if (currentIndex > 0 && onNavigate) {
      const target = dataList[currentIndex - 1];
      onNavigate(target);
      onScrollToRow?.(target.id);
    } else if (pagination && pagination.currentPage > 1 && onPageChange) {
      setIsNavigating(true);
      try {
        const newList = await onPageChange(pagination.currentPage - 1);
        if (newList && newList.length > 0 && onNavigate) {
          const target = newList[newList.length - 1];
          onNavigate(target);
          onScrollToRow?.(target.id);
        }
      } finally {
        setIsNavigating(false);
      }
    }
  }, [currentIndex, dataList, onNavigate, pagination, onPageChange, isNavigating, onScrollToRow]);

  const handleNext = useCallback(async () => {
    if (isNavigating) return;
    
    if (currentIndex >= 0 && currentIndex < dataList.length - 1 && onNavigate) {
      const target = dataList[currentIndex + 1];
      onNavigate(target);
      onScrollToRow?.(target.id);
    } else if (pagination && pagination.currentPage < pagination.totalPages && onPageChange) {
      setIsNavigating(true);
      try {
        const newList = await onPageChange(pagination.currentPage + 1);
        if (newList && newList.length > 0 && onNavigate) {
          const target = newList[0];
          onNavigate(target);
          onScrollToRow?.(target.id);
        }
      } finally {
        setIsNavigating(false);
      }
    }
  }, [currentIndex, dataList, onNavigate, pagination, onPageChange, isNavigating, onScrollToRow]);

  // 状态配置
  type WorkerStatus = 'OFFLINE' | 'IDLE' | 'BUSY' | 'FAULT' | 'MAINTENANCE';
  const statusConfig: Record<WorkerStatus, { color: string; text: string }> = useMemo(() => ({
    OFFLINE: { color: 'grey', text: t('worker.status.offline') },
    IDLE: { color: 'green', text: t('worker.status.idle') },
    BUSY: { color: 'blue', text: t('worker.status.busy') },
    FAULT: { color: 'red', text: t('worker.status.fault') },
    MAINTENANCE: { color: 'orange', text: t('worker.status.maintenance') },
  }), [t]);

  // 加载成员数据
  const loadMembers = useCallback(async () => {
    if (!groupData?.id) return;
    
    setMembersLoading(true);
    try {
      // 将 statusFilter 添加到请求参数
      const statusParam = statusFilter.length === 1 ? statusFilter[0] : undefined;
      const response = await fetchGroupMembers({
        ...queryParams,
        group_id: groupData.id,
        status: statusParam,
      });
      // 如果多选状态，在前端过滤
      if (statusFilter.length > 1) {
        response.list = response.list.filter(item => statusFilter.includes(item.status as WorkerStatus));
        response.range.total = response.list.length;
      }
      setMembersResponse(response);
    } finally {
      setMembersLoading(false);
    }
  }, [groupData?.id, queryParams, statusFilter]);

  useEffect(() => {
    if (visible && groupData?.id) {
      setQueryParams(prev => ({ ...prev, group_id: groupData.id, offset: 0 }));
      setStatusFilter([]);
    }
  }, [visible, groupData?.id]);

  // 状态筛选变化时重置分页
  const handleStatusFilterChange = (values: WorkerStatus[]) => {
    setStatusFilter(values);
    setQueryParams(prev => ({ ...prev, offset: 0 }));
  };

  useEffect(() => {
    if (visible && queryParams.group_id) {
      loadMembers();
    }
  }, [visible, queryParams, loadMembers]);

  // 搜索 - 防抖处理
  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams(prev => ({ ...prev, keyword: value || undefined, offset: 0 }));
      }, 500),
    []
  );

  // 移除成员
  const handleRemoveMember = (member: LYWorkerGroupMemberResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    Modal.confirm({
      title: t('workerGroup.removeMember.title'),
      icon: <IconMinusCircleStroked style={{ color: 'var(--semi-color-warning)' }} />,
      content: t('workerGroup.removeMember.confirmMessage', { name: member.name }),
      okText: t('workerGroup.removeMember.confirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          Toast.success(t('workerGroup.removeMember.success'));
          loadMembers();
          onRefresh();
        } catch (error) {
          Toast.error(t('workerGroup.removeMember.error'));
        }
      },
    });
  };

  // 添加成员成功
  const handleAddMembersSuccess = () => {
    loadMembers();
    onRefresh();
  };

  if (!groupData) return null;

  // 处理描述展示
  const description = groupData.description || '-';
  const isDescriptionLong = description.length > DESCRIPTION_COLLAPSE_THRESHOLD;
  const displayDescription = isDescriptionLong && !isDescriptionExpanded 
    ? description.slice(0, DESCRIPTION_COLLAPSE_THRESHOLD) + '...' 
    : description;

  const renderDescriptionValue = () => {
    if (description === '-') return '-';
    
    return (
      <div className="worker-group-detail-drawer-description">
        <span className="worker-group-detail-drawer-description-text">{displayDescription}</span>
        {isDescriptionLong && (
          <Button
            theme="borderless"
            size="small"
            type="tertiary"
            className="worker-group-detail-drawer-description-toggle"
            icon={isDescriptionExpanded ? <IconChevronUp /> : <IconChevronDown />}
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
          >
            {isDescriptionExpanded ? t('common.collapse') : t('common.expand')}
          </Button>
        )}
      </div>
    );
  };

  // 基本信息
  const basicInfoData = [
    { key: t('workerGroup.detail.fields.groupName'), value: groupData.name },
    { key: t('common.description'), value: renderDescriptionValue() },
    { key: t('workerGroup.table.memberCount'), value: `${groupData.member_count} ${t('workerGroup.table.memberUnit')}` },
    { key: t('common.creator'), value: groupData.creator_name || '-' },
    { key: t('common.createTime'), value: groupData.created_at },
  ];

  const { range, list } = membersResponse;
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  const memberColumns = [
    {
      title: t('worker.table.workerName'),
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (name: string, record: LYWorkerGroupMemberResponse) => (
        <div className="member-name-cell">
          <div className="member-name-cell-name">{name}</div>
          <div className="member-name-cell-username">{record.username || '-'}</div>
        </div>
      ),
    },
    {
      title: t('worker.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 90,
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
    },
    {
      title: t('common.actions'),
      dataIndex: 'action',
      key: 'action',
      width: 60,
      render: (_: unknown, record: LYWorkerGroupMemberResponse) => (
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
                  if (onNavigateToWorkerDetail) {
                    onClose();
                    onNavigateToWorkerDetail(record.id);
                  }
                }}
              >
                {t('workerGroup.actions.viewDetail')}
              </Dropdown.Item>
              <Dropdown.Item 
                icon={<IconMinusCircleStroked />} 
                type="warning"
                onClick={(e) => {
                  e?.stopPropagation?.();
                  handleRemoveMember(record);
                }}
              >
                {t('workerGroup.actions.removeFromGroup')}
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
    <SideSheet
      title={
        <Row type="flex" justify="space-between" align="middle" className="worker-group-detail-drawer-header">
          <Col>
            <Title heading={5} className="worker-group-detail-drawer-header-title">
              {groupData.name}
            </Title>
          </Col>
          <Col>
            <Space spacing={8}>
              <Tooltip content={t('common.previous')}>
                <Button icon={<IconChevronLeft />} theme="borderless" size="small" disabled={!canGoPrev || isNavigating} onClick={handlePrev} loading={isNavigating} />
              </Tooltip>
              <Tooltip content={t('common.next')}>
                <Button icon={<IconChevronRight />} theme="borderless" size="small" disabled={!canGoNext || isNavigating} onClick={handleNext} loading={isNavigating} />
              </Tooltip>
              <Divider layout="vertical" className="worker-group-detail-drawer-header-divider" />
              <Tooltip content={t('common.edit')}>
                <Button icon={<IconEditStroked />} theme="borderless" size="small" onClick={onEdit} />
              </Tooltip>
              <Tooltip content={t('common.delete')}>
                <Button icon={<IconDeleteStroked className="worker-group-detail-drawer-header-delete-icon" />} theme="borderless" size="small" onClick={onDelete} />
              </Tooltip>
              <Divider layout="vertical" className="worker-group-detail-drawer-header-divider" />
              <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
                <Button icon={isFullscreen ? <IconMinimize /> : <IconMaximize />} theme="borderless" size="small" onClick={toggleFullscreen} />
              </Tooltip>
              <Tooltip content={t('common.close')}>
                <Button icon={<IconClose />} theme="borderless" size="small" onClick={onClose} className="worker-group-detail-drawer-header-close-btn" />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      }
      visible={visible}
      onCancel={onClose}
      placement="right"
      width={isFullscreen ? '100%' : drawerWidth}
      mask={false}
      footer={null}
      closable={false}
      className={`card-sidesheet resizable-sidesheet worker-group-detail-drawer ${isFullscreen ? 'fullscreen-sidesheet' : ''}`}
    >
      {!isFullscreen && <div className="worker-group-detail-drawer-resize-handle" onMouseDown={handleMouseDown} />}
      {isNavigating ? (
        <DetailSkeleton rows={5} showTabs={true} sections={1} />
      ) : (
        <Tabs type="line" className="worker-group-detail-drawer-tabs">
          <TabPane tab={t('workerGroup.detail.basicInfo')} itemKey="basicInfo">
            <div className="worker-group-detail-drawer-tab-content">
              <div className="worker-group-detail-drawer-info-section">
                <Descriptions data={basicInfoData} align="left" />
              </div>
            </div>
          </TabPane>
          <TabPane tab={t('workerGroup.detail.memberList')} itemKey="members">
            <div className="worker-group-detail-drawer-tab-content">
              <div className="worker-group-detail-drawer-members">
                <Row type="flex" justify="space-between" align="middle" className="worker-group-detail-drawer-members-toolbar">
                  <Col>
                    <Space>
                      <Input 
                        prefix={<IconSearch />}
                        placeholder={t('workerGroup.detail.searchMemberPlaceholder')}
                        className="worker-group-detail-drawer-members-search"
                        onChange={handleSearch}
                        showClear
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
                  </Col>
                  <Col>
                    <Button 
                      icon={<IconPlus />} 
                      theme="solid" 
                      type="primary"
                      onClick={() => setAddMembersVisible(true)}
                    >
                      {t('workerGroup.detail.addMember')}
                    </Button>
                  </Col>
                </Row>

                <div className="worker-group-detail-drawer-members-table">
                  <Table 
                    columns={memberColumns} 
                    dataSource={list}
                    loading={membersLoading}
                    rowKey="id"
                    empty={
                      <EmptyState 
                        variant={queryParams.keyword ? 'noResult' : 'noData'}
                        description={queryParams.keyword ? t('common.noResult') : t('workerGroup.detail.noMembers')} 
                      />
                    }
                    pagination={{
                      total,
                      pageSize,
                      currentPage,
                      onPageChange: (page) => {
                        setQueryParams(prev => ({ ...prev, offset: (page - 1) * pageSize }));
                      },
                      showSizeChanger: true,
                      showTotal: true,
                    }}
                    scroll={{ y: 'calc(100vh - 400px)' }}
                  />
                </div>
              </div>
            </div>
          </TabPane>
        </Tabs>
      )}
      {/* 添加成员弹窗 */}
      <AddMembersModal
        visible={addMembersVisible}
        onCancel={() => setAddMembersVisible(false)}
        groupId={groupData.id}
        groupName={groupData.name}
        onSuccess={handleAddMembersSuccess}
      />
    </SideSheet>
  );
};

export default WorkerGroupDetailDrawer;
