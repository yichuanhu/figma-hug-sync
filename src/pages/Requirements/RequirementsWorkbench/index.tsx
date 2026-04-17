import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Input,
  Button,
  Table,
  Tag,
  Dropdown,
  Row,
  Col,
  Modal,
  Toast,
  Space,
  Select,
} from '@douyinfe/semi-ui';
import DepartmentSelect from '@/components/DepartmentSelect';
import { IconSearchStroked, IconDeleteStroked } from '@douyinfe/semi-icons';
import { Ellipsis, Eye, Pencil, Plus, Send, Trash2, Upload } from 'lucide-react';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag/interface';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import FilterPopover from '@/components/FilterPopover';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import type { RequirementItem, RequirementQueryParams, RequirementStatus } from './types';
import {
  priorityConfig,
  fetchRequirementList,
  deleteRequirement,
  createRequirement,
  updateRequirement,
  updateRequirementStatus,
} from './mockData';
import { statusConfigV2, statusOptionsV2, legacyStatusMap } from './statusConfig';
import RequirementFormModal from './components/RequirementFormModal';
import RequirementDetailDrawer from './components/RequirementDetailDrawer';
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

  // 列表数据
  const [listResponse, setListResponse] = useState<{
    range: { offset: number; size: number; total: number };
    list: RequirementItem[];
  }>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });

  // 筛选选项
  const statusOptions = useMemo(
    () => [
      { value: 'DRAFT', label: t('requirements.status.draft') },
      { value: 'PENDING', label: t('requirements.status.pending') },
      { value: 'APPROVED', label: t('requirements.status.approved') },
      { value: 'REJECTED', label: t('requirements.status.rejected') },
      { value: 'ASSESSING', label: t('requirements.status.assessing') },
      { value: 'DEVELOPING', label: t('requirements.status.developing') },
      { value: 'DEVELOPED', label: t('requirements.status.developed') },
      { value: 'RUNNING', label: t('requirements.status.running') },
      { value: 'STOPPED', label: t('requirements.status.stopped') },
      { value: 'ARCHIVED', label: t('requirements.status.archived') },
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

  // 操作可见性
  const canEdit = (status: string) => status === 'DRAFT';
  const canDelete = (status: string) => status === 'DRAFT' || status === 'REJECTED';

  // 表格列
  const columns = [
    {
      title: t('requirements.fields.title'),
      dataIndex: 'title',
      key: 'title',
      width: 260,
      ellipsis: true,
      sorter: true,
      onHeaderCell: () => ({ onClick: () => handleSort('title') }),
    },
    {
      title: t('common.owningDepartment'),
      dataIndex: 'owning_department_name',
      key: 'owning_department_name',
      width: 140,
      ellipsis: true,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => {
        const cfg = statusConfig[status as keyof typeof statusConfig];
        return (
          <Tag color={cfg?.color || 'grey'} type="light">
            {t(cfg?.i18nKey || 'requirements.status.draft')}
          </Tag>
        );
      },
    },
    {
      title: t('requirements.fields.priority'),
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (priority: string) => {
        const cfg = priorityConfig[priority as keyof typeof priorityConfig];
        return (
          <Tag color={cfg?.color || 'grey'} type="light">
            {t(cfg?.i18nKey || 'requirements.priority.low')}
          </Tag>
        );
      },
    },
    {
      title: t('common.creator'),
      dataIndex: 'creatorId',
      key: 'creatorId',
      width: 130,
      ellipsis: true,
      render: (_: string, record: RequirementItem) => (
        <UserNameWithCard
          name={record.creatorName}
          userId={record.creatorId}
          department={record.creatorDepartment}
          role={record.creatorRole}
          email={record.creatorEmail}
        />
      ),
    },
    {
      title: t('requirements.fields.expectedLaunchDate'),
      dataIndex: 'expectedLaunchDate',
      key: 'expectedLaunchDate',
      width: 130,
      ellipsis: true,
      render: (value: string | null) => (value ? value.substring(0, 10) : '-'),
    },
    {
      title: t('common.updateTime'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      ellipsis: true,
      sorter: true,
      onHeaderCell: () => ({ onClick: () => handleSort('updated_at') }),
      render: (value: string | null) => (value ? value.replace('T', ' ').substring(0, 19) : '-'),
    },
    {
      title: t('common.actions'),
      dataIndex: 'action',
      key: 'action',
      width: 60,
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
                placeholder={t('requirements.fields.department')}
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
            </Space>
          </Col>
        </Row>
      </div>

      {/* 表格区域 */}
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
            scroll={{ y: 'calc(100vh - 320px)' }}
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
