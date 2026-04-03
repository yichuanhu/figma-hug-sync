import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  // Breadcrumb removed - now handled by RouteBreadcrumb
  Typography,
  Input,
  Button,
  Table,
  Tag,
  Dropdown,
  Tooltip,
  Row,
  Col,
  Modal,
  Toast,
  Space,
} from '@douyinfe/semi-ui';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import FilterPopover from '@/components/FilterPopover';
import {
  IconSearchStroked,
  IconPlusStroked,
  IconMoreStroked,
  IconExternalOpenStroked,
  IconEditStroked,
  IconPlayCircle,
  IconDeleteStroked,
} from '@douyinfe/semi-icons';
import { UserPlus } from 'lucide-react';
// AppLayout removed - now handled at route level
import CreateProcessModal from './components/CreateProcessModal';
import EditProcessModal from './components/EditProcessModal';
import ProcessDetailDrawer from './components/ProcessDetailDrawer';
import { useOpenProcess } from './hooks/useOpenProcess';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import CollaboratorAddModal from '@/components/CollaboratorManager/CollaboratorAddModal';
import type { LYProcessResponse, GetProcessesParams, LYListResponseLYProcessResponse, CollaboratorAssetType } from '@/api';
import './index.less';

const { Title, Text } = Typography;

// ============= 工具函数 =============

// generationUUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ============= MockDatageneration - 基for APIType =============

// generation符合LYProcessResponseFormat's MockData
const generateMockLYProcessResponse = (index: number): LYProcessResponse => {
  const processNames = [
    'Auto Order Processing',
    'Expense Reimbursement Approval',
    'Employee Onboarding Flow',
    'Purchase Request Process',
    'Contract Approval Process',
    'Invoice Recognition Processing',
    'Customer Info Sync',
    'Inventory Audit Process',
    'Sales Data Summary',
    'Auto Report Generation',
  ];

  const descriptions = [
    'Auto-process sales orders including order validation, inventory check, and shipment notification',
    'Auto-process expense reimbursement flow including invoice recognition, amount verification, and approval notification',
    'Automate new employee onboarding process including account creation, permission assignment, and training scheduling',
    'Auto-process purchase requests including supplier comparison, approval process, and order generation',
    'Automate contract approval process including template matching, clause review, and signing process',
    'Auto-recognize and process various invoices including OCR recognition, info extraction, and accounting processing',
    'Auto-sync customer info to all business systems to maintain data consistency',
    'Auto-execute inventory audit tasks, generate variance reports, and trigger replenishment process',
    'Auto-aggregate sales data from all channels, generate analysis reports, and send to stakeholders',
    'Scheduled auto-generation of various business reports with multi-format export and distribution',
  ];

  const creatorIds = ['user-001', 'user-002', 'user-003', 'user-004', 'user-005'];
  const statuses = ['DEVELOPING', 'PUBLISHED', 'ARCHIVED'];
  const languages = ['Python', 'JavaScript', 'Java'];
  const processTypes = ['RPA', 'AI', 'Hybrid'];

  const createDate = new Date(2025, 0, 1 + (index % 20), 10 + (index % 12), (index * 7) % 60, 0);
  const updateDate = new Date(createDate.getTime() + (index % 10) * 24 * 60 * 60 * 1000);

  return {
    id: generateUUID(),
    name: processNames[index % processNames.length],
    description: descriptions[index % descriptions.length],
    language: languages[index % languages.length] || null,
    process_type: processTypes[index % processTypes.length],
    timeout: 60 + (index % 5) * 30,
    status: statuses[index % 3],
    current_version_id: index % 2 === 0 ? `ver-${generateUUID().substring(0, 8)}` : null,
    creator_id: creatorIds[index % creatorIds.length],
    requirement_id: index % 3 === 0 ? `req-${generateUUID().substring(0, 8)}` : null,
    created_at: createDate.toISOString(),
    updated_at: updateDate.toISOString(),
  };
};

// generationMockProcessList
const generateMockProcessList = (): LYProcessResponse[] => {
  return Array(46)
    .fill(null)
    .map((_, index) => generateMockLYProcessResponse(index));
};

// MockData存储
let mockProcessData = generateMockProcessList();

// 模拟Create者IDtoName's 映射
const mockCreatorNameMap: Record<string, { name: string; department?: string; role?: string; email?: string }> = {
  'user-001': { name: 'John Smith', department: 'Engineering', role: 'Senior Engineer', email: 'john.smith@example.com' },
  'user-002': { name: 'Jane Doe', department: 'Product', role: 'Product Manager', email: 'jane.doe@example.com' },
  'user-003': { name: 'Mike Wang', department: 'Operations', role: 'Ops Engineer', email: 'mike.wang@example.com' },
  'user-004': { name: 'David Zhao', department: 'QA', role: 'QA Engineer', email: 'david.zhao@example.com' },
  'user-005': { name: 'Chris Qian', department: 'Engineering', role: 'Architect', email: 'chris.qian@example.com' },
};

// ============= Data获取 - BackLYListResponseLYProcessResponse =============

const fetchProcessList = async (params: GetProcessesParams & { statusFilter?: string[] }): Promise<LYListResponseLYProcessResponse> => {
  // 模拟Network延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  console.log('APIParameter:', params);

  let filteredData = [...mockProcessData];

  // Search过滤
  if (params.keyword?.trim()) {
    const keyword = params.keyword.toLowerCase().trim();
    filteredData = filteredData.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) || (item.description?.toLowerCase().includes(keyword) ?? false),
    );
  }

  // StatusFilter
  if (params.statusFilter && params.statusFilter.length > 0) {
    filteredData = filteredData.filter((item) => params.statusFilter!.includes(item.status));
  }

  // Sortprocessing
  filteredData.sort((a, b) => {
    let valueA: string;
    let valueB: string;

    switch (params.sort_by) {
      case 'name':
        valueA = a.name;
        valueB = b.name;
        break;
      case 'updated_at':
        valueA = a.updated_at || '';
        valueB = b.updated_at || '';
        break;
      case 'created_at':
      default:
        valueA = a.created_at || '';
        valueB = b.created_at || '';
        break;
    }

    const comparison = valueA.localeCompare(valueB);
    return params.sort_order === 'asc' ? comparison : -comparison;
  });

  // calculation分页
  const total = filteredData.length;
  const offset = params.offset || 0;
  const size = params.size || 20;
  const paginatedData = filteredData.slice(offset, offset + size);

  // BackLYListResponseLYProcessResponseFormat
  return {
    range: {
      offset,
      size,
      total,
    },
    list: paginatedData,
  };
};

// ============= StatusConfig =============

const statusConfig: Record<string, { color: 'grey' | 'green' | 'orange'; i18nKey: string }> = {
  DEVELOPING: { color: 'grey', i18nKey: 'development.processDevelopment.status.developing' },
  PUBLISHED: { color: 'green', i18nKey: 'development.processDevelopment.status.published' },
  ARCHIVED: { color: 'orange', i18nKey: 'development.processDevelopment.status.archived' },
};

// ============= 组件 =============

const ProcessDevelopment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Search框input值(即is shown)
  const [searchValue, setSearchValue] = useState('');

  // queryParameter - 直接usingAPI GetProcessesParams
  const [queryParams, setQueryParams] = useState<GetProcessesParams>({
    offset: 0,
    size: 20,
    keyword: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  // StatusFilter
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // from首页快捷入口跳转时auto-open新建Modal
  useEffect(() => {
    if ((location.state as any)?.openCreate) {
      setCreateModalVisible(true);
      // 清除 state 避免RefreshRepeatopen
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);

  // List响应Data - 直接usingAPI LYListResponseLYProcessResponse
  const [listResponse, setListResponse] = useState<LYListResponseLYProcessResponse>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });
  const [selectedProcess, setSelectedProcess] = useState<LYProcessResponse | null>(null);
  const [editingProcess, setEditingProcess] = useState<LYProcessResponse | null>(null);

  const { openProcess, OpenProcessModal } = useOpenProcess();

  // Status选项
  const statusOptions = useMemo(() => [
    { value: 'DEVELOPING', label: t('development.processDevelopment.status.developing') },
    { value: 'PUBLISHED', label: t('development.processDevelopment.status.published') },
    { value: 'ARCHIVED', label: t('development.processDevelopment.status.archived') },
  ], [t]);

  // LoadingData
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchProcessList({ ...queryParams, statusFilter });
      setListResponse(response);
      return response.list;
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [queryParams, statusFilter]);

  // 翻页并Back新Data(usefor Drawer导航时auto-翻页)
  const handleDrawerPageChange = useCallback(async (page: number): Promise<LYProcessResponse[]> => {
    const currentPageSize = listResponse.range?.size || 20;
    const newOffset = (page - 1) * currentPageSize;
    setQueryParams(prev => ({ ...prev, offset: newOffset }));
    
    const response = await fetchProcessList({
      ...queryParams,
      offset: newOffset,
      statusFilter,
    });
    setListResponse(response);
    return response.list;
  }, [queryParams, statusFilter, listResponse.range?.size]);

  // 初始化Loading
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Searchdebounced
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams((prev) => ({ ...prev, offset: 0, keyword: value }));
      }, 500),
    []
  );

  // Search - usingdebouncedprocessing
  const handleSearch = (value: string) => {
    setSearchValue(value);  // Immediately update input display
    debouncedSearch(value); // Debounced query update
  };

  // openProcessDetails drawer
  const openProcessDetail = (record: LYProcessResponse) => {
    setSelectedProcess(record);
    if (!detailDrawerVisible) {
      setDetailDrawerVisible(true);
    }
  };

  // EditOperation
  const handleEdit = (record?: LYProcessResponse) => {
    const processRecord = record || selectedProcess;
    if (processRecord) {
      setEditingProcess(processRecord);
      setEditModalVisible(true);
    }
  };

  const handleRun = () => {
    console.log('RunningProcess:', selectedProcess?.id);
  };

  // DeleteConfirm
  const handleDeleteClick = (record?: LYProcessResponse) => {
    const processToDelete = record || selectedProcess;
    if (!processToDelete) return;

    Modal.confirm({
      title: t('development.processDevelopment.deleteModal.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: (
        <>
          <div>{t('development.processDevelopment.deleteModal.confirmMessage', { name: processToDelete.name })}</div>
          <div style={{ color: 'var(--semi-color-text-2)', marginTop: 8 }}>
            {t('development.processDevelopment.deleteModal.deleteWarning')}
          </div>
        </>
      ),
      okText: t('development.processDevelopment.deleteModal.confirmDelete'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        try {
          await new Promise((resolve) => {
            setTimeout(() => {
              mockProcessData = mockProcessData.filter((item) => item.id !== processToDelete.id);
              resolve(true);
            }, 500);
          });

          console.log('DeleteProcess:', processToDelete.id);
          setDetailDrawerVisible(false);
          setSelectedProcess(null);
          loadData();
          Toast.success(t('development.processDevelopment.deleteModal.success'));
        } catch (error) {
          Toast.error(t('development.processDevelopment.deleteModal.error'));
          throw error;
        }
      },
    });
  };

  // TableSortprocessing
  const handleSort = (sortBy: string) => {
    setQueryParams((prev) => ({
      ...prev,
      offset: 0,
      sort_by: sortBy,
      sort_order: prev.sort_by === sortBy && prev.sort_order === 'desc' ? 'asc' : 'desc',
    }));
  };

  // from响应获取分页Info
  const { range, list } = listResponse;
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  const columns = [
    {
      title: t('development.processDevelopment.fields.processName'),
      dataIndex: 'name',
      key: 'name',
      width: 160,
      ellipsis: true,
      sorter: true,
      onHeaderCell: () => ({
        onClick: () => handleSort('name'),
      }),
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description',
      width: 320,
      ellipsis: true,
      render: (description: string | null) => description || '-',
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusConfig[status]?.color || 'grey'} type="light">
          {t(statusConfig[status]?.i18nKey || 'development.processDevelopment.status.developing')}
        </Tag>
      ),
    },
    {
      title: t('common.creator'),
      dataIndex: 'creator_id',
      key: 'creator_id',
      width: 120,
      ellipsis: true,
      render: (creatorId: string) => {
        const creator = mockCreatorNameMap[creatorId];
        if (!creator) return creatorId;
        return <UserNameWithCard name={creator.name} userId={creatorId} department={creator.department} role={creator.role} email={creator.email} />;
      },
    },
    {
      title: t('common.createTime'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      sorter: true,
      onHeaderCell: () => ({
        onClick: () => handleSort('created_at'),
      }),
      render: (value: string | null) => (value ? value.replace('T', ' ').substring(0, 19) : '-'),
    },
    {
      title: t('common.updateTime'),
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 160,
      sorter: true,
      onHeaderCell: () => ({
        onClick: () => handleSort('updated_at'),
      }),
      render: (value: string | null) => (value ? value.replace('T', ' ').substring(0, 19) : '-'),
    },
    {
      title: t('common.actions'),
      dataIndex: 'action',
      key: 'action',
      width: 60,
      render: (_: unknown, record: LYProcessResponse) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          clickToHide
          render={
            <Dropdown.Menu>
              <Dropdown.Item
                icon={<IconExternalOpenStroked />}
                onClick={(e) => {
                  e.stopPropagation();
                  openProcess({ id: record.id, name: record.name });
                }}
              >
                {t('development.processDevelopment.actions.openProcess')}
              </Dropdown.Item>
              <Dropdown.Item
                icon={<IconEditStroked />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(record);
                }}
              >
                {t('common.edit')}
              </Dropdown.Item>
              <Dropdown.Item icon={<IconPlayCircle />} onClick={handleRun}>
                {t('common.run')}
              </Dropdown.Item>
              <Dropdown.Item
                icon={<IconDeleteStroked />}
                type="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(record);
                }}
              >
                {t('common.delete')}
              </Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Button icon={<IconMoreStroked />} theme="borderless" onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ];

  return (
      <div className="process-development">

      {/* Title area */}
      <div className="process-development-header">
        <div className="process-development-header-title">
          <Title heading={3} className="title">
            {t('development.processDevelopment.title')}
          </Title>
          <Text type="tertiary">{t('development.processDevelopment.description')}</Text>
        </div>

        {/* Operation */}
        <Row type="flex" justify="space-between" align="middle" className="process-development-header-toolbar">
          <Col>
            <Space>
              <Input
                prefix={<IconSearchStroked />}
                placeholder={t('development.processDevelopment.searchPlaceholder')}
                className="process-development-search-input"
                value={searchValue}
                onChange={handleSearch}
                showClear
                maxLength={100}
              />
              <FilterPopover
                visible={filterPopoverVisible}
                onVisibleChange={setFilterPopoverVisible}
                onConfirm={(values) => {
                  setStatusFilter((values.status as string[]) || []);
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
                ]}
              />
            </Space>
          </Col>
          <Col>
            <Button icon={<IconPlusStroked />} theme="solid" type="primary" onClick={() => setCreateModalVisible(true)}>
              {t('development.processDevelopment.createProcess')}
            </Button>
          </Col>
        </Row>
      </div>

      {/* Table area */}
      <div className="process-development-table">
        {isInitialLoad ? (
          <TableSkeleton rows={10} columns={6} columnWidths={['15%', '30%', '10%', '12%', '15%', '18%']} />
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
                description={queryParams.keyword ? t('common.noResult') : t('development.processDevelopment.noData')} 
              />
            }
            onRow={(record) => {
              const isSelected = selectedProcess?.id === record?.id && detailDrawerVisible;
              return {
                id: `process-row-${record?.id}`,
                onClick: () => record && openProcessDetail(record as LYProcessResponse),
                className: isSelected ? 'process-development-row-selected' : undefined,
                style: { cursor: 'pointer' },
              };
            }}
            pagination={{
              total,
              pageSize,
              currentPage,
              onPageChange: (page) => {
                setQueryParams((prev) => ({ ...prev, offset: (page - 1) * pageSize }));
              },
              onPageSizeChange: (newPageSize) => setQueryParams((prev) => ({ ...prev, offset: 0, size: newPageSize })),
              showSizeChanger: true,
              showTotal: true,
            }}
            scroll={{ y: 'calc(100vh - 320px)' }}
          />
        )}
      </div>

      {/* ProcessModal */}
      <CreateProcessModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={(newProcess: LYProcessResponse) => {
          mockProcessData.unshift(newProcess);
          loadData();
          setSelectedProcess(newProcess);
          setDetailDrawerVisible(true);
        }}
      />

      {/* EditProcessModal */}
      <EditProcessModal
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        processData={editingProcess}
        onSuccess={(updatedProcess: LYProcessResponse) => {
          const index = mockProcessData.findIndex((item) => item.id === updatedProcess.id);
          if (index !== -1) {
            mockProcessData[index] = updatedProcess;
          }
          console.log('ProcessAlreadyUpdate:', updatedProcess);
          loadData();
        }}
      />

      {/* ProcessDetails drawer */}
      <ProcessDetailDrawer
        visible={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        processData={selectedProcess}
        onEdit={() => handleEdit()}
        onRun={handleRun}
        onDelete={() => handleDeleteClick()}
        onOpen={() => selectedProcess && openProcess(selectedProcess)}
        dataList={list}
        onNavigate={(process) => setSelectedProcess(process)}
        pagination={{
          currentPage,
          totalPages: Math.ceil(total / pageSize),
          pageSize,
          total,
        }}
        onPageChange={handleDrawerPageChange}
        onScrollToRow={(id) => {
          const row = document.getElementById(`process-row-${id}`);
          row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }}
      />

      {/* ProcessConfirmModal */}
      <OpenProcessModal />
      </div>
  );
};

export default ProcessDevelopment;
