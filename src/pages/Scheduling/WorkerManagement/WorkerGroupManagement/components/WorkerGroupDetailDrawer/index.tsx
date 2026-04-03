import { useState, useEffect, useCallback, useMemo } from 'react';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import {
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
  Tabs,
  TabPane,
} from '@douyinfe/semi-ui';
import EmptyState from '@/components/EmptyState';
import DetailSkeleton from '@/components/DetailSkeleton';
import TableSkeleton from '@/components/TableSkeleton';
import ExpandableText from '@/components/ExpandableText';
import {
  IconEditStroked,
  IconDeleteStroked,
  IconSearchStroked,
  IconPlusStroked,
  IconMoreStroked,
  IconEyeOpenedStroked,
  IconMinusCircleStroked,
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
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';
import CollaboratorTab from '@/components/CollaboratorManager/CollaboratorTab';
import { useCollaboratorPermission } from '@/hooks/useCollaboratorPermission';
import './index.less';

const { Text } = Typography;

interface WorkerGroupDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  groupData: LYWorkerGroupResponse | null;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  dataList?: LYWorkerGroupResponse[];
  onNavigate?: (group: LYWorkerGroupResponse) => void;
  pagination?: PaginationInfo;
  onPageChange?: (page: number, direction: 'prev' | 'next') => void;
  onNavigateToWorkerDetail?: (workerId: string) => void;
  onScrollToRow?: (id: string) => void;
  initialTab?: string;
}

// Mock成员Data
const mockMembers: LYWorkerGroupMemberResponse[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001', name: 'Finance Bot-01', description: 'Bot for financial process automation',
    status: 'IDLE', sync_status: 'SYNCED', ip_address: '10.0.1.100', priority: 'HIGH', client_version: 'v6.7.0',
    last_heartbeat_time: '2025-01-08 10:25:33', receive_tasks: true, username: 'DOMAIN\\robot01', desktop_type: 'Console',
    enable_auto_unlock: true, force_login: false, device_token: 'abc123xyz789', machine_code: 'F11FD4447A215F380A40',
    host_name: 'WIN-SERVER-01', os: 'Windows Server 2019', arch: 'x64', cpu_model: 'Intel Xeon', cpu_cores: 8,
    memory_capacity: '32 GB', robot_count: 1, created_at: '2025-01-05 14:30:00', creator_id: 'admin',
    group_id: 'group-001', joined_at: '2025-01-06 10:00:00',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002', name: 'Finance Bot-02', description: 'Bot for financial report automation',
    status: 'BUSY', sync_status: 'PENDING', ip_address: '10.0.1.101', priority: 'MEDIUM', client_version: 'v6.7.0',
    last_heartbeat_time: '2025-01-08 10:20:15', receive_tasks: true, username: 'DOMAIN\\robot02', desktop_type: 'NotConsole',
    display_size: '1920x1080', force_login: true, device_token: 'def456ghi012', machine_code: 'A22GE5558B326G491B51',
    host_name: 'WIN-SERVER-02', os: 'Windows Server 2019', arch: 'x64', cpu_model: 'Intel Xeon', cpu_cores: 8,
    memory_capacity: '16 GB', robot_count: 2, created_at: '2025-01-06 09:15:00', creator_id: 'admin',
    group_id: 'group-001', joined_at: '2025-01-06 11:00:00',
  },
];

const fetchGroupMembers = async (params: GetWorkerGroupMembersParams): Promise<LYListResponseLYWorkerGroupMemberResponse> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  let data = mockMembers.filter(m => m.group_id === params.group_id);
  if (params.keyword?.trim()) {
    const keyword = params.keyword.toLowerCase().trim();
    data = data.filter(item => item.name.toLowerCase().includes(keyword) || item.ip_address.toLowerCase().includes(keyword));
  }
  if (params.status) data = data.filter(item => item.status === params.status);
  const total = data.length;
  const offset = params.offset || 0;
  const size = params.size || 20;
  return { range: { offset, size, total }, list: data.slice(offset, offset + size) };
};

const WorkerGroupDetailDrawer: React.FC<WorkerGroupDetailDrawerProps> = ({
  visible, onClose, groupData, onEdit, onDelete, onRefresh,
  dataList = [], onNavigate, pagination, onPageChange, onNavigateToWorkerDetail, onScrollToRow, initialTab = 'basicInfo',
}) => {
  const { t } = useTranslation();
  const { canManage: canManageCollaborators } = useCollaboratorPermission('WORKER_GROUP', groupData?.id);
  const [activeTab, setActiveTab] = useState(initialTab);

  const prevVisibleRef = useRef(false);
  useEffect(() => {
    if (visible && !prevVisibleRef.current) setActiveTab(initialTab);
    prevVisibleRef.current = visible;
  }, [visible, initialTab]);

  const [membersLoading, setMembersLoading] = useState(false);
  const [membersResponse, setMembersResponse] = useState<LYListResponseLYWorkerGroupMemberResponse>({ range: { offset: 0, size: 20, total: 0 }, list: [] });
  const [queryParams, setQueryParams] = useState<GetWorkerGroupMembersParams>({ group_id: '', offset: 0, size: 20, keyword: undefined });
  const [statusFilter, setStatusFilter] = useState<WorkerStatus[]>([]);
  const [addMembersVisible, setAddMembersVisible] = useState(false);

  type WorkerStatus = 'OFFLINE' | 'IDLE' | 'BUSY' | 'FAULT' | 'MAINTENANCE';

  const statusOptions = useMemo(() => [
    { value: 'IDLE', label: t('worker.status.idle') }, { value: 'BUSY', label: t('worker.status.busy') },
    { value: 'MAINTENANCE', label: t('worker.status.maintenance') }, { value: 'FAULT', label: t('worker.status.fault') },
    { value: 'OFFLINE', label: t('worker.status.offline') },
  ], [t]);

  const statusConfig: Record<WorkerStatus, { color: string; text: string }> = useMemo(() => ({
    OFFLINE: { color: 'grey', text: t('worker.status.offline') }, IDLE: { color: 'green', text: t('worker.status.idle') },
    BUSY: { color: 'blue', text: t('worker.status.busy') }, FAULT: { color: 'red', text: t('worker.status.fault') },
    MAINTENANCE: { color: 'orange', text: t('worker.status.maintenance') },
  }), [t]);

  const loadMembers = useCallback(async () => {
    if (!groupData?.id) return;
    setMembersLoading(true);
    try {
      const statusParam = statusFilter.length === 1 ? statusFilter[0] : undefined;
      const response = await fetchGroupMembers({ ...queryParams, group_id: groupData.id, status: statusParam });
      if (statusFilter.length > 1) {
        response.list = response.list.filter(item => statusFilter.includes(item.status as WorkerStatus));
        response.range.total = response.list.length;
      }
      setMembersResponse(response);
    } finally { setMembersLoading(false); }
  }, [groupData?.id, queryParams, statusFilter]);

  useEffect(() => {
    if (visible && groupData?.id) {
      setQueryParams(prev => ({ ...prev, group_id: groupData.id, offset: 0 }));
      setStatusFilter([]);
    }
  }, [visible, groupData?.id]);

  const handleStatusFilterChange = (values: WorkerStatus[]) => {
    setStatusFilter(values);
    setQueryParams(prev => ({ ...prev, offset: 0 }));
  };

  useEffect(() => {
    if (visible && queryParams.group_id) loadMembers();
  }, [visible, queryParams, loadMembers]);

  const handleSearch = useMemo(() => debounce((value: string) => {
    setQueryParams(prev => ({ ...prev, keyword: value || undefined, offset: 0 }));
  }, 500), []);

  const handleRemoveMember = (member: LYWorkerGroupMemberResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    Modal.confirm({
      title: t('workerGroup.removeMember.title'),
      icon: <IconMinusCircleStroked style={{ color: 'var(--semi-color-warning)' }} />,
      content: t('workerGroup.removeMember.confirmMessage', { name: member.name }),
      okText: t('workerGroup.removeMember.confirm'), cancelText: t('common.cancel'),
      onOk: async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        Toast.success(t('workerGroup.removeMember.success'));
        loadMembers();
        onRefresh();
      },
    });
  };

  const handleAddMembersSuccess = () => { loadMembers(); onRefresh(); };

  if (!groupData) return null;

  const basicInfoData = [
    { key: t('workerGroup.detail.fields.groupName'), value: groupData.name },
    { key: t('common.description'), value: <ExpandableText text={groupData.description} maxLines={3} /> },
    { key: t('workerGroup.table.memberCount'), value: `${groupData.member_count} ${t('workerGroup.table.memberUnit')}` },
    { key: t('common.creator'), value: groupData.creator_name ? <UserNameWithCard name={groupData.creator_name} userId={groupData.creator_id} /> : '-' },
    { key: t('common.createTime'), value: groupData.created_at },
  ];

  const { range, list } = membersResponse;
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  const memberColumns = [
    { title: t('worker.table.workerName'), dataIndex: 'name', key: 'name', width: 180, ellipsis: true, render: (name: string, record: LYWorkerGroupMemberResponse) => (<div><div>{name}</div><div>{record.username || '-'}</div></div>) },
    { title: t('worker.table.status'), dataIndex: 'status', key: 'status', width: 90, render: (status: WorkerStatus | undefined) => { if (!status) return null; const config = statusConfig[status]; return <Tag color={config.color as any} type="light">{config.text}</Tag>; } },
    { title: t('worker.table.ipAddress'), dataIndex: 'ip_address', key: 'ip_address', width: 120 },
    { title: t('worker.table.clientVersion'), dataIndex: 'client_version', key: 'client_version', width: 100 },
    { title: t('worker.table.lastHeartbeat'), dataIndex: 'last_heartbeat_time', key: 'last_heartbeat_time', width: 160 },
    { title: t('common.actions'), dataIndex: 'action', key: 'action', width: 60, render: (_: unknown, record: LYWorkerGroupMemberResponse) => (
      <Dropdown trigger="click" position="bottomRight" stopPropagation clickToHide render={
        <Dropdown.Menu>
          <Dropdown.Item icon={<IconEyeOpenedStroked />} onClick={(e) => { e?.stopPropagation?.(); if (onNavigateToWorkerDetail) { onClose(); onNavigateToWorkerDetail(record.id); } }}>{t('workerGroup.actions.viewDetail')}</Dropdown.Item>
          <Dropdown.Item icon={<IconMinusCircleStroked />} type="warning" onClick={(e) => { e?.stopPropagation?.(); handleRemoveMember(record); }}>{t('workerGroup.actions.removeFromGroup')}</Dropdown.Item>
        </Dropdown.Menu>
      }><Button icon={<IconMoreStroked />} theme="borderless" onClick={(e) => e.stopPropagation()} /></Dropdown>
    ) },
  ];

  const extraActions = (
    <>
      <Tooltip content={t('common.edit')}>
        <Button icon={<IconEditStroked />} theme="borderless" size="small" onClick={onEdit} />
      </Tooltip>
      <Tooltip content={t('common.delete')}>
        <Button icon={<IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />} theme="borderless" size="small" onClick={onDelete} />
      </Tooltip>
    </>
  );

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={onClose}
      title={groupData.name}
      dataList={dataList}
      currentId={groupData.id}
      getId={(item) => item.id}
      onNavigate={(item) => onNavigate?.(item)}
      pagination={pagination}
      onPageChange={onPageChange}
      onScrollToRow={onScrollToRow}
      extraActions={extraActions}
      defaultWidth={900}
      minWidth={576}
      storageKey="workerGroupDetailDrawerWidth"
      className="worker-group-detail-drawer"
    >
      <Tabs type="line" activeKey={activeTab} onChange={setActiveTab} className="worker-group-detail-drawer-tabs">
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
                    <Input prefix={<IconSearchStroked />} placeholder={t('workerGroup.detail.searchMemberPlaceholder')} className="worker-group-detail-drawer-members-search" onChange={handleSearch} showClear />
                    <Select placeholder={t('workerGroup.addMembers.statusFilter')} multiple maxTagCount={1} value={statusFilter} onChange={handleStatusFilterChange} style={{ width: 160 }} showClear>
                      {statusOptions.map(option => <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>)}
                    </Select>
                  </Space>
                </Col>
                <Col>
                  <Button icon={<IconPlusStroked />} theme="solid" type="primary" onClick={() => setAddMembersVisible(true)}>{t('workerGroup.detail.addMember')}</Button>
                </Col>
              </Row>
              <div className="worker-group-detail-drawer-members-table">
                <Table size="small" columns={memberColumns} dataSource={list} loading={membersLoading} rowKey="id" empty={<EmptyState variant={queryParams.keyword ? 'noResult' : 'noData'} description={queryParams.keyword ? t('common.noResult') : t('workerGroup.detail.noMembers')} />} pagination={{ total, pageSize, currentPage, onPageChange: (page) => setQueryParams(prev => ({ ...prev, offset: (page - 1) * pageSize })), showSizeChanger: true, showTotal: true }} scroll={{ y: 'calc(100vh - 400px)' }} />
              </div>
            </div>
          </div>
        </TabPane>
        <TabPane tab={t('collaborator.tabTitle')} itemKey="collaborators">
          <CollaboratorTab
            assetType="WORKER_GROUP"
            assetId={groupData.id}
            context="scheduling"
            canManage={canManageCollaborators}
          />
        </TabPane>
      </Tabs>
      <AddMembersModal visible={addMembersVisible} onCancel={() => setAddMembersVisible(false)} groupId={groupData.id} groupName={groupData.name} onSuccess={handleAddMembersSuccess} />
    </DetailDrawerWrapper>
  );
};

export default WorkerGroupDetailDrawer;
