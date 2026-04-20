import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Input,
  Button,
  
  Table,
  Dropdown,
  Row,
  Col,
  Modal,
  Toast,
  Space,
} from '@douyinfe/semi-ui';
import DepartmentSelect from '@/components/DepartmentSelect';
import { IconSearchStroked, IconDeleteStroked } from '@douyinfe/semi-icons';
import { Ellipsis, Eye, Pencil, Plus, Send, Trash2, Upload, LayoutGrid, List as ListIcon, RotateCcw, PowerOff } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import FilterPopover from '@/components/FilterPopover';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import type { RequirementItem, RequirementQueryParams, RequirementStatus, RequirementPriority } from './types';
import {
  fetchRequirementList,
  deleteRequirement,
  createRequirement,
  updateRequirement,
  updateRequirementStatus,
  resubmitRequirement,
  MOCK_CURRENT_USER_ID,
} from './mockData';
import { statusConfigV2, legacyStatusMap } from './statusConfig';
import RequirementFormModal from './components/RequirementFormModal';
import RequirementDetailDrawer from './components/RequirementDetailDrawer';
import PriorityIndicator from './components/PriorityIndicator';
import StatusDot from './components/StatusDot';
import ScoreBar from './components/ScoreBar';
import TitleCell from './components/TitleCell';
import RelativeTime from './components/RelativeTime';
import BoardView from './components/BoardView';
import './index.less';

const { Title, Text } = Typography;

const RequirementsWorkbench = () => {
  const { t } = useTranslation();

  // 搜索
  const [searchValue, setSearchValue] = useState('');

  // 查询参数
  const [queryParams, setQueryParams] = useState<RequirementQueryParams>({
    offset: 0,
    size: 20,
    keyword: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  // 筛选
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);

  // 状态
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RequirementItem | null>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RequirementItem | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');

  // 列表数据
  const [listResponse, setListResponse] = useState<{
    range: { offset: number; size: number; total: number };
    list: RequirementItem[];
  }>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });

  // 筛选选项（与 9 状态生命周期对齐）
  const statusOptions = useMemo(
    () => [
      { value: 'DRAFT',              label: t('requirements.status.draft') },
      { value: 'PENDING_APPROVAL',   label: t('requirements.status.pendingApproval') },
      { value: 'PENDING_ASSESSMENT', label: t('requirements.status.pendingAssessment') },
      { value: 'PENDING_PROJECT',    label: t('requirements.status.pendingProject') },
      { value: 'DEVELOPING',         label: t('requirements.status.developing') },
      { value: 'LAUNCHED',           label: t('requirements.status.launched') },
      { value: 'OFFLINE',            label: t('requirements.status.offline') },
      { value: 'REJECTED',           label: t('requirements.status.rejected') },
      { value: 'WITHDRAWN',          label: t('requirements.status.withdrawn') },
    ],
    [t],
  );

  const priorityOptions = useMemo(
    () => [
      { value: 'HIGH', label: t('requirements.priority.high') },
      { value: 'MEDIUM', label: t('requirements.priority.medium') },
      { value: 'LOW', label: t('requirements.priority.low') },
    ],
    [t],
  );

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchRequirementList({
        ...queryParams,
        statusFilter,
        departmentFilter,
        priorityFilter,
      });
      setListResponse(response);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [queryParams, statusFilter, departmentFilter, priorityFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 搜索防抖
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams((prev) => ({ ...prev, offset: 0, keyword: value }));
      }, 500),
    [],
  );

  const handleSearch = (value: string) => {
    setSearchValue(value);
    debouncedSearch(value);
  };

  // 排序
  const handleSort = (sortBy: string) => {
    setQueryParams((prev) => ({
      ...prev,
      offset: 0,
      sort_by: sortBy,
      sort_order: prev.sort_by === sortBy && prev.sort_order === 'desc' ? 'asc' : 'desc',
    }));
  };

  // 删除
  const handleDelete = (record: RequirementItem) => {
    Modal.confirm({
      title: t('requirements.deleteModal.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: (
        <>
          <div>{t('requirements.deleteModal.confirmMessage', { name: record.title })}</div>
          <div style={{ color: 'var(--semi-color-text-2)', marginTop: 8 }}>
            {t('requirements.deleteModal.warning')}
          </div>
        </>
      ),
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        try {
          await deleteRequirement(record.id);
          loadData();
          Toast.success(t('requirements.deleteModal.success'));
        } catch {
          Toast.error(t('requirements.deleteModal.error'));
        }
      },
    });
  };

  // 分页信息
  const { range, list } = listResponse;
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  // 操作可见性（兼容旧/新状态）
  const canEdit = (status: string) => status === 'DRAFT' || status === 'WITHDRAWN';
  const canDelete = (status: string) =>
    status === 'DRAFT' || status === 'REJECTED' || status === 'WITHDRAWN';

  // 兼容旧状态 → 新 9 状态映射
  const normalizeStatus = (s: string): RequirementStatus =>
    (statusConfigV2[s as RequirementStatus] ? (s as RequirementStatus) : legacyStatusMap[s]) || 'DRAFT';

  // 表格列（参考 PingCode：编号/标题左固定，操作右固定）
  const columns = [
    {
      title: t('requirements.fields.reqNo', '编号'),
      dataIndex: 'req_no',
      key: 'req_no',
      width: 130,
      fixed: 'left' as const,
      render: (v: string | undefined, r: RequirementItem) => (
        <Text type="tertiary" size="small" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {v || `REQ-${r.id.slice(0, 8)}`}
        </Text>
      ),
    },
    {
      title: t('requirements.fields.title'),
      dataIndex: 'title',
      key: 'title',
      width: 280,
      fixed: 'left' as const,
      ellipsis: true,
      sorter: true,
      onHeaderCell: () => ({ onClick: () => handleSort('title') }),
      render: (_: string, record: RequirementItem) => <TitleCell record={record} />,
    },
    {
      title: t('requirements.fields.priority'),
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (p: RequirementPriority) => <PriorityIndicator priority={p} />,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusDot status={normalizeStatus(status)} />,
    },
    {
      title: t('common.owningDepartment'),
      dataIndex: 'owning_department_name',
      key: 'owning_department_name',
      width: 140,
      ellipsis: { showTitle: false },
      render: (v: string) => (
        <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 120 }}>
          {v || '-'}
        </Text>
      ),
    },
    {
      title: t('requirements.fields.valueScore', '价值得分'),
      dataIndex: 'value_score',
      key: 'value_score',
      width: 130,
      render: (v: number | undefined) => <ScoreBar value={v} variant="value" />,
    },
    {
      title: t('requirements.fields.complexityScore', '复杂度得分'),
      dataIndex: 'complexity_score',
      key: 'complexity_score',
      width: 130,
      render: (v: number | undefined) => <ScoreBar value={v} variant="complexity" />,
    },
    {
      title: t('common.owner', t('common.creator') as string),
      dataIndex: 'owner_name',
      key: 'owner_name',
      width: 140,
      ellipsis: true,
      render: (_: string, record: RequirementItem) => (
        <UserNameWithCard
          name={record.owner_name || record.creatorName}
          userId={record.owner_id || record.creatorId}
          department={record.creatorDepartment}
          role={record.creatorRole}
          email={record.creatorEmail}
        />
      ),
    },
    {
      title: t('common.createTime', '创建时间'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      sorter: true,
      onHeaderCell: () => ({ onClick: () => handleSort('created_at') }),
      render: (value: string | null) => <RelativeTime value={value} />,
    },
    {
      title: t('common.actions'),
      dataIndex: 'action',
      key: 'action',
      width: 60,
      fixed: 'right' as const,
      render: (_: unknown, record: RequirementItem) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          clickToHide
          render={
            <Dropdown.Menu>
              <Dropdown.Item
                icon={<Eye size={16} strokeWidth={2} />}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('View requirement:', record.id);
                }}
              >
                {t('common.viewDetail')}
              </Dropdown.Item>
              {canEdit(record.status) && (
                <Dropdown.Item
                  icon={<Pencil size={16} strokeWidth={2} />}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setEditingRecord(record);
                    setEditModalVisible(true);
                  }}
                >
                  {t('common.edit')}
                </Dropdown.Item>
              )}
              {canEdit(record.status) && (
                <Dropdown.Item
                  icon={<Send size={16} strokeWidth={2} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    Modal.confirm({
                      title: t('requirements.detail.submitConfirmTitle'),
                      content: t('requirements.detail.submitConfirmContent'),
                      okText: t('requirements.detail.submitForApproval'),
                      cancelText: t('common.cancel'),
                      onOk: async () => {
                        await updateRequirementStatus(record.id, 'PENDING', 'Submitted for approval.');
                        loadData();
                        Toast.success(t('requirements.detail.submitSuccess'));
                      },
                    });
                  }}
                >
                  {t('requirements.detail.submitForApproval')}
                </Dropdown.Item>
              )}
              {record.status === 'REJECTED' && record.creatorId === MOCK_CURRENT_USER_ID && (
                <Dropdown.Item
                  icon={<RotateCcw size={16} strokeWidth={2} />}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    Modal.confirm({
                      title: t('requirements.detail.resubmitConfirmTitle', '确认重新提交？'),
                      content: t('requirements.detail.resubmitConfirmContent', '需求将重新进入审批流程（L1）。原审批历史会保留。'),
                      okText: t('requirements.detail.resubmit', '重新提交'),
                      cancelText: t('common.cancel'),
                      onOk: async () => {
                        try {
                          await resubmitRequirement(record.id);
                          loadData();
                          Toast.success(t('requirements.detail.resubmitSuccess', '已重新提交审批'));
                        } catch (err) {
                          Toast.error((err as Error).message);
                        }
                      },
                    });
                  }}
                >
                  {t('requirements.detail.resubmit', '重新提交')}
                </Dropdown.Item>
              )}
              {record.status === 'LAUNCHED' && (
                <Dropdown.Item
                  icon={<PowerOff size={16} strokeWidth={2} />}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    Modal.confirm({
                      title: t('requirements.detail.offlineConfirmTitle', '确认下线？'),
                      content: t('requirements.detail.offlineConfirmContent', '下线后该需求将停止运行，关联流程不会自动停用，请知悉。'),
                      okText: t('requirements.detail.offline', '下线'),
                      cancelText: t('common.cancel'),
                      okType: 'warning',
                      onOk: async () => {
                        await updateRequirementStatus(record.id, 'OFFLINE', 'Taken offline.');
                        loadData();
                        Toast.success(t('requirements.detail.offlineSuccess', '已下线'));
                      },
                    });
                  }}
                >
                  {t('requirements.detail.offline', '下线')}
                </Dropdown.Item>
              )}
              {canDelete(record.status) && (
                <Dropdown.Item
                  icon={<Trash2 size={16} strokeWidth={2} />}
                  type="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(record);
                  }}
                >
                  {t('common.delete')}
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          }
        >
          <Button icon={<Ellipsis size={16} strokeWidth={2} />} theme="borderless" onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="requirements-workbench">
      {/* 标题区域 */}
      <div className="requirements-workbench-header">
        <div className="requirements-workbench-header-title">
          <Title heading={3} className="title">
            {t('requirements.workbench.title')}
          </Title>
          <Text type="tertiary">{t('requirements.workbench.description')}</Text>
        </div>

        {/* 操作栏 */}
        <Row
          type="flex"
          justify="space-between"
          align="middle"
          className="requirements-workbench-header-toolbar"
        >
          <Col>
            <Space>
              <Input
                prefix={<IconSearchStroked />}
                placeholder={t('requirements.workbench.searchPlaceholder')}
                className="requirements-workbench-search-input"
                value={searchValue}
                onChange={handleSearch}
                showClear
                maxLength={100}
              />
              <DepartmentSelect
                placeholder={t('common.filterDepartment')}
                value={departmentFilter}
                onChange={(v) => {
                  setDepartmentFilter(v);
                  setQueryParams((prev) => ({ ...prev, offset: 0 }));
                }}
                multiple
                showClear
                maxTagCount={1}
                useNameAsValue
                style={{ width: 'auto', minWidth: 150, maxWidth: 600 }}
              />
              <FilterPopover
                visible={filterPopoverVisible}
                onVisibleChange={setFilterPopoverVisible}
                onConfirm={(values) => {
                  setStatusFilter((values.status as string[]) || []);
                  setPriorityFilter((values.priority as string[]) || []);
                  setQueryParams((prev) => ({ ...prev, offset: 0 }));
                }}
                sections={[
                  {
                    key: 'status',
                    label: t('common.status'),
                    type: 'checkbox',
                    options: statusOptions,
                    value: statusFilter,
                  },
                  {
                    key: 'priority',
                    label: t('requirements.fields.priority'),
                    type: 'checkbox',
                    options: priorityOptions,
                    value: priorityFilter,
                  },
                ]}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<Upload size={14} strokeWidth={2} />} theme="light" type="tertiary">
                {t('requirements.workbench.batchImport')}
              </Button>
              <Button icon={<Plus size={16} strokeWidth={2} />} theme="solid" type="primary" onClick={() => setCreateModalVisible(true)}>
                {t('requirements.workbench.newRequirement')}
              </Button>
              <div className="requirements-workbench-view-switcher">
                <button
                  type="button"
                  className={`requirements-workbench-view-switcher-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                  aria-label={t('requirements.workbench.viewTable')}
                >
                  <ListIcon size={16} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  className={`requirements-workbench-view-switcher-btn ${viewMode === 'board' ? 'active' : ''}`}
                  onClick={() => setViewMode('board')}
                  aria-label={t('requirements.workbench.viewBoard')}
                >
                  <LayoutGrid size={16} strokeWidth={2} />
                </button>
              </div>
            </Space>
          </Col>
        </Row>
      </div>

      {/* 内容区域：表格 / 看板 */}
      <div className="requirements-workbench-table">
        {isInitialLoad ? (
          <TableSkeleton
            rows={10}
            columns={7}
            columnWidths={['22%', '10%', '10%', '8%', '12%', '12%', '14%']}
          />
        ) : viewMode === 'board' ? (
          <BoardView
            list={list}
            selectedId={detailDrawerVisible ? selectedRecord?.id : undefined}
            onCardClick={(record) => {
              setSelectedRecord(record);
              if (!detailDrawerVisible) setDetailDrawerVisible(true);
            }}
          />
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
                description={
                  queryParams.keyword
                    ? t('common.noResult')
                    : t('requirements.workbench.noData')
                }
              />
            }
            onRow={(record) => {
              const isSelected = selectedRecord?.id === record?.id && detailDrawerVisible;
              return {
                id: `requirement-row-${record?.id}`,
                style: { cursor: 'pointer' },
                className: isSelected ? 'requirements-workbench-row-selected' : undefined,
                onClick: () => {
                  if (record) {
                    setSelectedRecord(record as RequirementItem);
                    if (!detailDrawerVisible) setDetailDrawerVisible(true);
                  }
                },
              };
            }}
            pagination={{
              total,
              pageSize,
              currentPage,
              onPageChange: (page) => {
                setQueryParams((prev) => ({ ...prev, offset: (page - 1) * pageSize }));
              },
              onPageSizeChange: (newPageSize) =>
                setQueryParams((prev) => ({ ...prev, offset: 0, size: newPageSize })),
              showSizeChanger: true,
              showTotal: true,
            }}
            scroll={{ y: 'calc(100vh - 320px)', x: 1310 }}
          />
        )}
      </div>

      {/* 新建需求弹窗 */}
      <RequirementFormModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={async (values) => {
          await createRequirement(values);
          loadData();
        }}
      />

      {/* 编辑需求弹窗 */}
      <RequirementFormModal
        visible={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingRecord(null);
        }}
        editData={editingRecord}
        onSuccess={async (values) => {
          if (editingRecord) {
            await updateRequirement(editingRecord.id, values);
            loadData();
          }
          setEditingRecord(null);
        }}
      />

      {/* 需求详情抽屉 */}
      <RequirementDetailDrawer
        visible={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        data={selectedRecord}
        dataList={list}
        onNavigate={(item) => setSelectedRecord(item)}
        onEdit={(record) => {
          setEditingRecord(record);
          setEditModalVisible(true);
        }}
        onDelete={(record) => handleDelete(record)}
        onStatusChange={async (id, newStatus, comment) => {
          await updateRequirementStatus(id, newStatus, comment);
          loadData();
          // Refresh the selected record
          const updated = (await fetchRequirementList({ ...queryParams, statusFilter, departmentFilter, priorityFilter })).list.find(r => r.id === id);
          if (updated) setSelectedRecord(updated);
        }}
        onRefresh={async () => {
          loadData();
          if (selectedRecord) {
            const updated = (await fetchRequirementList({ ...queryParams, statusFilter, departmentFilter, priorityFilter })).list.find(r => r.id === selectedRecord.id);
            if (updated) setSelectedRecord(updated);
          }
        }}
        pagination={{
          currentPage,
          totalPages: Math.ceil(total / pageSize),
          pageSize,
          total,
        }}
        onScrollToRow={(id) => {
          const row = document.getElementById(`requirement-row-${id}`);
          row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }}
      />
    </div>
  );
};

export default RequirementsWorkbench;
