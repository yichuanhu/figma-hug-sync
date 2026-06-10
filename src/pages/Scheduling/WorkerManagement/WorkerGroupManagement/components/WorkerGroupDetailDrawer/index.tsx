import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Pagination,
  Popover,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import EmptyState from '@/components/EmptyState';
import DetailSkeleton from '@/components/DetailSkeleton';
import TableSkeleton from '@/components/TableSkeleton';
import ExpandableText from '@/components/ExpandableText';
import DepartmentPath from '@/components/DepartmentPath';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';
import AddMembersModal from '../AddMembersModal';
import UpgradeDeviceModal from '../../../components/UpgradeDeviceModal';
import {
  WorkerWithUpgrade,
  isUpgradeAvailable,
  aggregateSelectedDevices,
  groupWorkersByDevice,
} from '../../../utils/upgrade';
import { getEnabledVersion } from '@/mocks/clientVersionData';
import type {
  LYWorkerGroupResponse,
  LYWorkerGroupMemberResponse,
  LYListResponseLYWorkerGroupMemberResponse,
  GetWorkerGroupMembersParams,
} from '@/api';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';
import StatusDot, { type StatusDotColor } from '@/components/StatusDot';
import './index.less';
import { Ellipsis, Eye, MinusCircle, Pencil, Plus, Trash2, ArrowUpCircle, AlertCircle, Loader2 } from 'lucide-react';

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
const mockMembers: (LYWorkerGroupMemberResponse & {
  upgrade_status?: 'NONE' | 'UPGRADING' | 'FAILED';
  upgrade_target_version?: string | null;
  upgrade_failed_reason?: string | null;
})[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001', name: 'Finance Bot-01', description: 'Bot for financial process automation',
    status: 'IDLE', sync_status: 'SYNCED', ip_address: '10.0.1.100', priority: 'HIGH', client_version: 'v6.7.0',
    last_heartbeat_time: '2025-01-08 10:25:33', receive_tasks: true, username: 'DOMAIN\\robot01', desktop_type: 'Console',
    enable_auto_unlock: true, force_login: false, device_token: 'abc123xyz789', machine_code: 'F11FD4447A215F380A40',
    host_name: 'WIN-SERVER-01', os: 'Windows Server 2019', arch: 'x64', cpu_model: 'Intel Xeon', cpu_cores: 8,
    memory_capacity: '32 GB', robot_count: 1, created_at: '2025-01-05 14:30:00', creator_id: 'admin',
    group_id: 'group-001', joined_at: '2025-01-06 10:00:00', upgrade_status: 'NONE',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002', name: 'Finance Bot-02', description: 'Bot for financial report automation',
    status: 'BUSY', sync_status: 'PENDING', ip_address: '10.0.1.101', priority: 'MEDIUM', client_version: 'v6.7.0',
    last_heartbeat_time: '2025-01-08 10:20:15', receive_tasks: true, username: 'DOMAIN\\robot02', desktop_type: 'NotConsole',
    display_size: '1920x1080', force_login: true, device_token: 'def456ghi012', machine_code: 'A22GE5558B326G491B51',
    host_name: 'WIN-SERVER-02', os: 'Windows Server 2019', arch: 'x64', cpu_model: 'Intel Xeon', cpu_cores: 8,
    memory_capacity: '16 GB', robot_count: 2, created_at: '2025-01-06 09:15:00', creator_id: 'admin',
    group_id: 'group-001', joined_at: '2025-01-06 11:00:00',
    upgrade_status: 'UPGRADING', upgrade_target_version: 'v6.8.0',
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

  // 升级相关 state
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [upgradeDevices, setUpgradeDevices] = useState<{ machineCode: string; workers: WorkerWithUpgrade[] }[]>([]);

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
      title: t('workerGroup.removeMember.title'),      content: t('workerGroup.removeMember.confirmMessage', { name: member.name }),
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
    { key: t('common.owningDepartment'), value: <DepartmentPath departmentId={groupData.owning_department_id} /> },
    { key: t('common.owner'), value: groupData.owner_name ? <UserNameWithCard name={groupData.owner_name} userId={groupData.owner_id || ''} /> : '-' },
    { key: t('workerGroup.table.memberCount'), value: `${groupData.member_count} ${t('workerGroup.table.memberUnit')}` },
    { key: t('common.creator'), value: groupData.creator_name ? <UserNameWithCard name={groupData.creator_name} userId={groupData.creator_id} /> : '-' },
    { key: t('common.createTime'), value: groupData.created_at },
  ];

  const { range, list } = membersResponse;
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  // 设备维度聚合
  const workerList = list as unknown as WorkerWithUpgrade[];
  const deviceMap = groupWorkersByDevice(workerList);
  const getDevicePeers = (record: WorkerWithUpgrade) =>
    deviceMap.get(record.machine_code || record.id) || [record];

  const triggerUpgrade = (workerIds: string[]) => {
    const enabled = workerIds.some((id) => {
      const w = workerList.find((x) => x.id === id);
      return w && getEnabledVersion(w.desktop_type);
    });
    if (!enabled) {
      Toast.warning(t('worker.upgrade.noEnabledVersion'));
      return;
    }
    const devices = aggregateSelectedDevices(workerList, workerIds);
    setUpgradeDevices(devices);
    setUpgradeModalVisible(true);
  };

  const handleConfirmUpgrade = (machineCodes: string[]) => {
    setMembersResponse((prev) => ({
      ...prev,
      list: prev.list.map((w) => {
        const code = (w as WorkerWithUpgrade).machine_code || w.id;
        if (!machineCodes.includes(code)) return w;
        const target = getEnabledVersion(w.desktop_type);
        return {
          ...w,
          upgrade_status: 'UPGRADING',
          upgrade_target_version: target?.version || null,
          upgrade_failed_reason: null,
        } as LYWorkerGroupMemberResponse;
      }),
    }));
    setUpgradeModalVisible(false);
    setSelectedRowKeys([]);
    Toast.success(t('worker.upgrade.upgradingStarted', { count: machineCodes.length }));
  };

  const memberColumns = [
    { title: t('worker.table.workerName'), dataIndex: 'name', key: 'name', width: 180, ellipsis: true, render: (name: string, record: LYWorkerGroupMemberResponse) => (<div><div>{name}</div><div>{record.username || '-'}</div></div>) },
    { title: t('worker.table.status'), dataIndex: 'status', key: 'status', width: 90, render: (status: WorkerStatus | undefined) => { if (!status) return null; const config = statusConfig[status]; return <Tag color={config.color as any} type="light">{config.text}</Tag>; } },
    { title: t('worker.table.ipAddress'), dataIndex: 'ip_address', key: 'ip_address', width: 120 },
    {
      title: t('worker.table.clientVersion'),
      dataIndex: 'client_version',
      key: 'client_version',
      width: 180,
      render: (version: string | null, record: LYWorkerGroupMemberResponse) => {
        const w = record as unknown as WorkerWithUpgrade;
        const peers = getDevicePeers(w);
        const deviceStatus = peers.find((p) => p.upgrade_status && p.upgrade_status !== 'NONE')?.upgrade_status;
        const target = getEnabledVersion(w.desktop_type);
        const upgradable = isUpgradeAvailable(w);

        if (deviceStatus === 'UPGRADING') {
          const targetVersion = peers.find((p) => p.upgrade_target_version)?.upgrade_target_version || target?.version;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={(e) => e.stopPropagation()}>
              <span>{version}</span>
              <Tooltip content={t('worker.upgrade.upgrading.tooltip', { version: targetVersion })}>
                <Tag
                  color="blue"
                  type="solid"
                  size="small"
                  prefixIcon={<Loader2 size={12} strokeWidth={2} className="upgrade-spin" />}
                >
                  {t('worker.upgrade.upgrading.tag')}
                </Tag>
              </Tooltip>
            </div>
          );
        }
        if (deviceStatus === 'FAILED') {
          const failedReason = peers.find((p) => p.upgrade_failed_reason)?.upgrade_failed_reason
            || w.upgrade_failed_reason
            || t('worker.upgrade.failed.defaultReason');
          const failedPopover = (
            <div style={{ padding: 12, width: 280 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <AlertCircle size={14} strokeWidth={2} color="var(--semi-color-danger)" />
                <Text strong>{t('worker.upgrade.failed.title')}</Text>
              </div>
              <div style={{ marginBottom: 10 }}>
                <Text type="tertiary" size="small">{t('worker.upgrade.failed.reasonLabel')}：</Text>
                <div style={{ marginTop: 4 }}>
                  <Text size="small">{failedReason}</Text>
                </div>
              </div>
              <Button
                theme="solid"
                type="primary"
                size="small"
                icon={<ArrowUpCircle size={14} strokeWidth={2} />}
                block
                onClick={() => triggerUpgrade([w.id])}
              >
                {t('worker.upgrade.failed.retry')}
              </Button>
            </div>
          );
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={(e) => e.stopPropagation()}>
              <span>{version}</span>
              <Popover content={failedPopover} trigger="hover" position="top" showArrow>
                <Tag color="red" type="light" size="small" prefixIcon={<AlertCircle size={12} strokeWidth={2} />} style={{ cursor: 'pointer' }}>
                  {t('worker.upgrade.failed.tag')}
                </Tag>
              </Popover>
            </div>
          );
        }
        if (upgradable && target) {
          const popoverContent = (
            <div style={{ padding: 12, width: 280 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <ArrowUpCircle size={14} strokeWidth={2} color="var(--semi-color-warning)" />
                <Text strong>{t('worker.upgrade.popover.title')}</Text>
              </div>
              <div style={{ marginBottom: 6 }}>
                <Text type="tertiary" size="small">{t('worker.upgrade.popover.targetVersion')}：</Text>
                <Text size="small" strong style={{ marginLeft: 4 }}>{target.version}</Text>
              </div>
              <Button
                theme="solid"
                type="primary"
                size="small"
                icon={<ArrowUpCircle size={14} strokeWidth={2} />}
                block
                onClick={() => triggerUpgrade([w.id])}
              >
                {t('worker.upgrade.popover.button')}
              </Button>
            </div>
          );
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={(e) => e.stopPropagation()}>
              <span>{version}</span>
              <Popover content={popoverContent} trigger="hover" position="top" showArrow>
                <Tag color="orange" type="light" size="small" prefixIcon={<ArrowUpCircle size={12} strokeWidth={2} />} style={{ cursor: 'pointer' }}>
                  {t('worker.upgrade.upgradable.tag')}
                </Tag>
              </Popover>
            </div>
          );
        }
        return <span>{version}</span>;
      },
    },
    { title: t('worker.table.lastHeartbeat'), dataIndex: 'last_heartbeat_time', key: 'last_heartbeat_time', width: 160 },
    { title: t('common.actions'), dataIndex: 'action', key: 'action', width: 60, render: (_: unknown, record: LYWorkerGroupMemberResponse) => (
      <Dropdown trigger="click" position="bottomRight" stopPropagation clickToHide render={
        <Dropdown.Menu>
          <Dropdown.Item icon={<Eye size={16} strokeWidth={2} />} onClick={() => { if (onNavigateToWorkerDetail) { onClose(); onNavigateToWorkerDetail(record.id); } }}>{t('workerGroup.actions.viewDetail')}</Dropdown.Item>
          {(() => {
            const w = record as unknown as WorkerWithUpgrade;
            const peers = getDevicePeers(w);
            const deviceStatus = peers.find((p) => p.upgrade_status && p.upgrade_status !== 'NONE')?.upgrade_status;
            const upgradable = isUpgradeAvailable(w);
            if (deviceStatus !== 'UPGRADING' && upgradable) {
              return (
                <Dropdown.Item icon={<ArrowUpCircle size={16} strokeWidth={2} />} onClick={() => triggerUpgrade([record.id])}>
                  {t('worker.upgrade.menu')}
                </Dropdown.Item>
              );
            }
            return null;
          })()}
          <Dropdown.Item icon={<MinusCircle size={16} strokeWidth={2} />} type="warning" onClick={() => { handleRemoveMember(record); }}>{t('workerGroup.actions.removeFromGroup')}</Dropdown.Item>
        </Dropdown.Menu>
      }><Button icon={<Ellipsis size={16} strokeWidth={2} />} theme="borderless" onClick={(e) => e.stopPropagation()} /></Dropdown>
    ) },
  ];

  const extraActions = (
    <>
      <Tooltip content={t('common.edit')}>
        <Button icon={<Pencil size={16} strokeWidth={2} />} theme="borderless" type="tertiary" size="small" onClick={onEdit} />
      </Tooltip>
    </>
  );

  const deleteAction = (
    <Tooltip content={t('common.delete')}>
      <Button icon={<Trash2 size={16} strokeWidth={2} color="var(--semi-color-danger)" />} theme="borderless" type="tertiary" size="small" onClick={onDelete} />
    </Tooltip>
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
      deleteAction={deleteAction}
      collaboratorProps={{
        assetType: 'WORKER_GROUP',
        assetId: groupData.id,
        context: 'scheduling',
        canManage: true,
      }}
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
                  <Space>
                    {selectedRowKeys.length > 0 && (() => {
                      const selectedDevices = aggregateSelectedDevices(workerList, selectedRowKeys);
                      const hasUpgradable = selectedDevices.some((d) =>
                        d.workers.some(isUpgradeAvailable) && !d.workers.some((w) => w.upgrade_status === 'UPGRADING')
                      );
                      return (
                        <>
                          <Text type="tertiary" size="small">
                            {t('worker.upgrade.batchSelected', { count: selectedRowKeys.length })}
                          </Text>
                          {hasUpgradable && (
                            <Button
                              icon={<ArrowUpCircle size={16} strokeWidth={2} />}
                              onClick={() => triggerUpgrade(selectedRowKeys)}
                            >
                              {t('worker.upgrade.batchButton')}
                            </Button>
                          )}
                        </>
                      );
                    })()}
                    <Button icon={<Plus size={16} strokeWidth={2} />} theme="solid" type="primary" onClick={() => setAddMembersVisible(true)}>{t('workerGroup.detail.addMember')}</Button>
                  </Space>
                </Col>
              </Row>
              <div className="worker-group-detail-drawer-members-table">
                <Table
                  size="small"
                  columns={memberColumns}
                  dataSource={list}
                  loading={membersLoading}
                  rowKey="id"
                  empty={<EmptyState variant={queryParams.keyword ? 'noResult' : 'noData'} description={queryParams.keyword ? t('common.noResult') : t('workerGroup.detail.noMembers')} />}
                  pagination={false}
                  scroll={{ y: 'calc(100vh - 400px)' }}
                  rowSelection={{
                    selectedRowKeys,
                    onChange: (keys) => setSelectedRowKeys((keys || []) as string[]),
                  }}
                />
                {total > pageSize * 2 && (
                  <div style={{ paddingTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                    <Pagination
                      total={total}
                      pageSize={pageSize}
                      currentPage={currentPage}
                      onPageChange={(page) => setQueryParams(prev => ({ ...prev, offset: (page - 1) * pageSize }))}
                      onPageSizeChange={(newPageSize) => setQueryParams(prev => ({ ...prev, offset: 0, size: newPageSize }))}
                      showTotal
                      showSizeChanger
                      size="small"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabPane>
      </Tabs>
      <AddMembersModal visible={addMembersVisible} onCancel={() => setAddMembersVisible(false)} groupId={groupData.id} groupName={groupData.name} onSuccess={handleAddMembersSuccess} />
      <UpgradeDeviceModal
        visible={upgradeModalVisible}
        onCancel={() => setUpgradeModalVisible(false)}
        onOk={handleConfirmUpgrade}
        devices={upgradeDevices}
      />
    </DetailDrawerWrapper>
  );
};

export default WorkerGroupDetailDrawer;
