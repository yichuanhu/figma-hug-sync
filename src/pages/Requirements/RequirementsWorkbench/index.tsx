import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Select,
} from '@douyinfe/semi-ui';
import DepartmentSelect from '@/components/DepartmentSelect';
import FilterPopover from '@/components/FilterPopover';
import { IconSearchStroked, IconDeleteStroked } from '@douyinfe/semi-icons';
import { Ellipsis, Pencil, Plus, Send, Trash2, RotateCcw, PowerOff, Undo2, Link2, FolderPlus, Columns3 } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';

import UserNameWithCard from '@/components/layout/UserNameWithCard';
import type { RequirementItem, RequirementQueryParams, RequirementStatus } from './types';
import {
  fetchRequirementList,
  deleteRequirement,
  
  updateRequirement,
  updateRequirementStatus,
  resubmitRequirement,
  withdrawRequirement,
  useSchemeFlags,
  MOCK_CURRENT_USER_ID,
  MOCK_PROJECT_POOL,
  getRequirementEffortSummary,
} from './mockData';
import { statusConfigV2, legacyStatusMap, statusOptionsV2 } from './statusConfig';
import RequirementFormModal from './components/RequirementFormModal';
import RequirementDetailDrawer from './components/RequirementDetailDrawer';
import WorkspacePickerModal from './components/RequirementDetailDrawer/WorkspacePickerModal';
import { findWorkspaceByRequirementId } from '../RequirementsProjects/mockData';
import StatusDot from './components/StatusDot';
import TitleCell from './components/TitleCell';
import RelativeTime from './components/RelativeTime';
import { buildSubmitConfirmContent } from './utils/submitConfirm';
import './index.less';

const { Title, Text } = Typography;

const RequirementsWorkbench = () => {
  const { t } = useTranslation();
  const { hasApproval, hasAssessment, submittedStatus } = useSchemeFlags();
  const location = useLocation();
  const navigate = useNavigate();

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
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [projectFilter, setProjectFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<RequirementStatus[]>([]);
  const [statusFilterVisible, setStatusFilterVisible] = useState(false);

  // 状态
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // createModalVisible 已废弃：新建走 /requirements/list/create 独立页面
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RequirementItem | null>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RequirementItem | null>(null);
  
  const [pickerRecord, setPickerRecord] = useState<RequirementItem | null>(null);

  // 可选列（持久化到 localStorage）
  const OPTIONAL_COLUMNS_KEY = 'requirements.list.optionalColumns';
  type OptionalColumnKey = 'effort_estimate' | 'effort_actual' | 'completion_rate';
  const [optionalColumns, setOptionalColumns] = useState<OptionalColumnKey[]>(() => {
    try {
      const raw = localStorage.getItem(OPTIONAL_COLUMNS_KEY);
      if (raw) return JSON.parse(raw) as OptionalColumnKey[];
    } catch { /* ignore */ }
    return [];
  });
  const toggleOptionalColumn = (key: OptionalColumnKey) => {
    setOptionalColumns((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      try { localStorage.setItem(OPTIONAL_COLUMNS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  // 列表数据
  const [listResponse, setListResponse] = useState<{
    range: { offset: number; size: number; total: number };
    list: RequirementItem[];
  }>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchRequirementList({
        ...queryParams,
        departmentFilter,
        projectFilter,
        statusFilter,
      });
      setListResponse(response);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [queryParams, departmentFilter, projectFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 跨页跳转：来自流程列表「关联需求」Tag 的 navigate(state)
  useEffect(() => {
    const openId = (location.state as { openRequirementId?: string } | null)?.openRequirementId;
    if (!openId) return;
    const hit = listResponse.list.find((r) => r.id === openId);
    if (hit) {
      setSelectedRecord(hit);
      setDetailDrawerVisible(true);
      // 清理 state，避免重复触发
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, listResponse.list, navigate]);

  // URL 直达：?openDevResponse=1&requirementId=xxx[&changeLogId=xxx]
  // 由项目模块的红点跳转过来，自动打开对应需求抽屉，
  // 抽屉内的 effect 会进一步弹出响应面板（已有逻辑）。
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('openDevResponse') !== '1') return;
    const reqId = params.get('requirementId');
    if (!reqId) return;
    const hit = listResponse.list.find((r) => r.id === reqId);
    if (hit) {
      setSelectedRecord(hit);
      setDetailDrawerVisible(true);
    }
  }, [location.search, listResponse.list]);

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

  // 重新提交（REJECTED / WITHDRAWN）—— 文案与目标状态由当前模版标志驱动
  const handleResubmit = (record: RequirementItem) => {
    const resubmitLabel = t('requirements.detail.resubmit');
    Modal.confirm({
      title: hasApproval
        ? t('requirements.detail.resubmitConfirmTitle')
        : t('requirements.detail.submitDirectConfirmTitle'),
      content: hasApproval
        ? t('requirements.detail.resubmitConfirmContent')
        : buildSubmitConfirmContent(false, hasAssessment, t),
      okText: resubmitLabel,
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await resubmitRequirement(record.id);
          loadData();
          Toast.success(
            hasApproval
              ? t('requirements.detail.resubmitSuccess')
              : t('requirements.detail.submitDirectSuccess'),
          );
        } catch (err) {
          Toast.error((err as Error).message);
        }
      },
    });
  };

  // 撤回（PENDING_APPROVAL + 提交人）
  const handleWithdraw = (record: RequirementItem) => {
    Modal.confirm({
      title: t('requirements.detail.withdrawConfirmTitle'),
      content: t('requirements.detail.withdrawConfirmContent'),
      okText: t('requirements.detail.withdraw'),
      okButtonProps: { type: 'danger' },
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await withdrawRequirement(record.id);
          loadData();
          Toast.success(t('requirements.detail.withdrawSuccess'));
        } catch (err) {
          Toast.error((err as Error).message);
        }
      },
    });
  };

  // 下线（LAUNCHED）
  const handleOffline = (record: RequirementItem) => {
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
  };

  // 分页信息
  const { range, list } = listResponse;
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  // 操作可见性（兼容旧/新状态）
  const canEdit = (status: string) =>
    status === 'DRAFT' ||
    status === 'WITHDRAWN' ||
    status === 'REJECTED' ||
    // STORY-014: 立项后阶段也允许编辑（走草稿 + 发布变更流程）
    status === 'PENDING_PROJECT' ||
    status === 'DEVELOPING' ||
    status === 'LAUNCHED' ||
    status === 'OFFLINE';
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
      title: t('requirements.fields.linkedProject', '所属项目'),
      dataIndex: 'linkedProject',
      key: 'linkedProject',
      width: 160,
      ellipsis: { showTitle: false },
      render: (_: unknown, record: RequirementItem) =>
        record.linkedProject ? (
          <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 140 }}>
            {record.linkedProject.name}
          </Text>
        ) : (
          <Text type="tertiary">-</Text>
        ),
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
              {(() => {
                const isResubmit =
                  (record.status === 'REJECTED' || record.status === 'WITHDRAWN') &&
                  record.creatorId === MOCK_CURRENT_USER_ID;
                const canSubmit = record.status === 'DRAFT';
                if (!canSubmit && !isResubmit) return null;
                if (isResubmit) {
                  return (
                    <Dropdown.Item
                      icon={<Send size={16} strokeWidth={2} />}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleResubmit(record);
                      }}
                    >
                      {t('requirements.detail.resubmit', '重新提交')}
                    </Dropdown.Item>
                  );
                }
                const submitLabel = hasApproval
                  ? t('requirements.detail.submitForApproval')
                  : t('requirements.detail.submitRequirement');
                return (
                  <Dropdown.Item
                    icon={<Send size={16} strokeWidth={2} />}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      Modal.confirm({
                        title: hasApproval
                          ? t('requirements.detail.submitConfirmTitle')
                          : t('requirements.detail.submitDirectConfirmTitle'),
                        content: buildSubmitConfirmContent(hasApproval, hasAssessment, t),
                        okText: submitLabel,
                        cancelText: t('common.cancel'),
                        onOk: async () => {
                          await updateRequirementStatus(record.id, submittedStatus, 'Submitted.');
                          loadData();
                          Toast.success(
                            hasApproval
                              ? t('requirements.detail.submitSuccess')
                              : t('requirements.detail.submitDirectSuccess'),
                          );
                        },
                      });
                    }}
                  >
                    {submitLabel}
                  </Dropdown.Item>
                );
              })()}
              {(record.status === 'PENDING_APPROVAL' || record.status === 'PENDING_ASSESSMENT') && record.creatorId === MOCK_CURRENT_USER_ID && (
                <Dropdown.Item
                  icon={<Undo2 size={16} strokeWidth={2} />}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleWithdraw(record);
                  }}
                >
                  {t('requirements.detail.withdraw')}
                </Dropdown.Item>
              )}
              {record.status === 'PENDING_PROJECT' && !findWorkspaceByRequirementId(record.id) && (
                <>
                  <Dropdown.Item
                    icon={<Link2 size={16} strokeWidth={2} />}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setPickerRecord(record);
                    }}
                  >
                    {t('requirements.detail.pendingProject.linkExisting')}
                  </Dropdown.Item>
                  <Dropdown.Item
                    icon={<FolderPlus size={16} strokeWidth={2} />}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      navigate('/requirements/projects', {
                        state: { openCreate: true, prefilledRequirementId: record.id },
                      });
                    }}
                  >
                    {t('requirements.detail.pendingProject.createProject')}
                  </Dropdown.Item>
                </>
              )}
              {record.status === 'LAUNCHED' && (
                <Dropdown.Item
                  icon={<PowerOff size={16} strokeWidth={2} />}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleOffline(record);
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
              <Select
                placeholder={t('common.filterProject')}
                value={projectFilter}
                onChange={(v) => {
                  setProjectFilter((v as string[]) || []);
                  setQueryParams((prev) => ({ ...prev, offset: 0 }));
                }}
                multiple
                showClear
                maxTagCount={1}
                style={{ width: 'auto', minWidth: 150, maxWidth: 600 }}
                optionList={MOCK_PROJECT_POOL.map((p) => ({ label: p.name, value: p.id }))}
              />
              <FilterPopover
                visible={statusFilterVisible}
                onVisibleChange={setStatusFilterVisible}
                sections={[
                  {
                    key: 'status',
                    label: t('common.status'),
                    type: 'checkbox',
                    options: statusOptionsV2.map((s) => ({
                      label: t(s.i18nKey),
                      value: s.value,
                    })),
                    value: statusFilter,
                  },
                ]}
                onConfirm={(values) => {
                  setStatusFilter((values.status as RequirementStatus[]) || []);
                  setQueryParams((prev) => ({ ...prev, offset: 0 }));
                }}
              />
            </Space>
          </Col>
          <Col>
            <Button icon={<Plus size={16} strokeWidth={2} />} theme="solid" type="primary" onClick={() => navigate('/requirements/list/create')}>
              {t('requirements.workbench.newRequirement')}
            </Button>
          </Col>
        </Row>
      </div>

      {/* 内容区域 */}
      <div className="requirements-workbench-table">
        {isInitialLoad ? (
          <TableSkeleton
            rows={10}
            columns={7}
            columnWidths={['22%', '10%', '10%', '8%', '12%', '12%', '14%']}
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

      {/* 新建需求改用独立页面 /requirements/list/create */}

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
        onPublished={() => {
          loadData();
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
        onResubmit={(record) => handleResubmit(record)}
        onOffline={(record) => handleOffline(record)}
        onStatusChange={async (id, newStatus, comment) => {
          await updateRequirementStatus(id, newStatus, comment);
          loadData();
          // Refresh the selected record
          const updated = (await fetchRequirementList({ ...queryParams, departmentFilter, projectFilter })).list.find(r => r.id === id);
          if (updated) setSelectedRecord(updated);
        }}
        onRefresh={async () => {
          loadData();
          if (selectedRecord) {
            const updated = (await fetchRequirementList({ ...queryParams, departmentFilter, projectFilter })).list.find(r => r.id === selectedRecord.id);
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

      {/* 关联到已有工作空间 */}
      <WorkspacePickerModal
        visible={!!pickerRecord}
        requirementId={pickerRecord?.id ?? ''}
        departmentId={pickerRecord?.owning_department_id ?? ''}
        onClose={() => setPickerRecord(null)}
        onSuccess={() => {
          setPickerRecord(null);
          loadData();
        }}
      />
    </div>
  );
};

export default RequirementsWorkbench;
