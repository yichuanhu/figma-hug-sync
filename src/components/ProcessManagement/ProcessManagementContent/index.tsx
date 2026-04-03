import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
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
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import TableSkeleton from '@/components/TableSkeleton';
import FilterPopover from '@/components/FilterPopover';
import {
  IconSearchStroked,
  IconPlusStroked,
  IconMoreStroked,
  IconExternalOpenStroked,
  IconEditStroked,
  IconDeleteStroked,
} from '@douyinfe/semi-icons';
import { PlayCircle, UserPlus } from 'lucide-react';
import CreateProcessModal from './components/CreateProcessModal';
import EditProcessModal from './components/EditProcessModal';
import ProcessDetailDrawer from './components/ProcessDetailDrawer';
import { useOpenProcess } from './hooks/useOpenProcess';
import CollaboratorAddModal from '@/components/CollaboratorManager/CollaboratorAddModal';
import type { LYProcessResponse, GetProcessesParams, LYListResponseLYProcessResponse, CollaboratorAssetType } from '@/api';
import './index.less';

const { Title, Text } = Typography;

// ============= 工具函数 =============

// 生成UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ============= Mock数据生成 - 基于API类型 =============

// 生成符合LYProcessResponse格式的Mock数据
const generateMockLYProcessResponse = (index: number): LYProcessResponse => {
  const processNames = [
    'Auto Order Processing',
    'Expense Reimbursement Approval',
    'Employee Onboarding Flow',
    'Purchase Request Flow',
    'Contract Approval Flow',
    'Invoice Recognition Processing',
    'Customer Info Sync',
    'Inventory Check Flow',
    'Sales Data Summary',
    'Auto Report Generation',
  ];

  const descriptions = [
    'A comprehensive automation process for testing text expand/collapse. It includes data collection, multi-dimensional analysis, business rule validation, anomaly detection, and report generation with multi-channel distribution. Supports breakpoint resume, error retry, and manual intervention.',
    'Automated expense reimbursement approval including invoice recognition, amount verification, and approval notification',
    'Automated employee onboarding process including account creation, permission assignment, training scheduling. Covers HR notification, email setup, OA permissions, VPN access, training courses, and badge requests. Auto-matches permission templates and training plans by department.',
    'Automated purchase request processing including supplier comparison, approval flow, and order generation',
    'Automated contract approval including template matching, clause review, and signing process',
    'Auto-recognize and process various invoices including OCR recognition, info extraction, and accounting',
    'Auto-sync customer info across business systems to maintain data consistency',
    'Automated inventory check with variance reporting and replenishment triggering. Compares system data with actual counts, identifies discrepancies, and triggers replenishment when thresholds are exceeded. Supports multi-warehouse parallel counting.',
    'Auto-aggregate sales data from all channels, generate analysis reports, and distribute to stakeholders',
    'Scheduled auto-generation of business reports with multi-format export and distribution support',
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

// 生成Mock流程列表
const generateMockProcessList = (): LYProcessResponse[] => {
  return Array(46)
    .fill(null)
    .map((_, index) => generateMockLYProcessResponse(index));
};

// Mock数据存储
let mockProcessData = generateMockProcessList();

// 模拟创建者ID到详细信息的映射
const mockCreatorInfoMap: Record<string, { name: string; department?: string; role?: string; email?: string }> = {
  'user-001': { name: 'John Smith', department: 'R&D Dept', role: 'Senior Engineer', email: 'john.smith@example.com' },
  'user-002': { name: 'Jane Doe', department: 'Product Dept', role: 'Product Manager', email: 'jane.doe@example.com' },
  'user-003': { name: 'Mike Wang', department: 'Ops Dept', role: 'Ops Engineer', email: 'mike.wang@example.com' },
  'user-004': { name: 'David Zhao', department: 'QA Dept', role: 'QA Engineer', email: 'david.zhao@example.com' },
  'user-005': { name: 'Chris Qian', department: 'R&D Dept', role: 'Architect', email: 'chris.qian@example.com' },
};

// ============= 数据获取 - 返回LYListResponseLYProcessResponse =============

const fetchProcessList = async (params: GetProcessesParams & { statusFilter?: string[] }): Promise<LYListResponseLYProcessResponse> => {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  console.log('API参数:', params);

  let filteredData = [...mockProcessData];

  // 搜索过滤
  if (params.keyword?.trim()) {
    const keyword = params.keyword.toLowerCase().trim();
    filteredData = filteredData.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) || (item.description?.toLowerCase().includes(keyword) ?? false),
    );
  }

  // 状态筛选
  if (params.statusFilter && params.statusFilter.length > 0) {
    filteredData = filteredData.filter((item) => params.statusFilter!.includes(item.status));
  }

  // 排序处理
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

  // 计算分页
  const total = filteredData.length;
  const offset = params.offset || 0;
  const size = params.size || 20;
  const paginatedData = filteredData.slice(offset, offset + size);

  // 返回LYListResponseLYProcessResponse格式
  return {
    range: {
      offset,
      size,
      total,
    },
    list: paginatedData,
  };
};

// ============= 状态配置 =============

const statusConfig: Record<string, { color: 'grey' | 'green' | 'orange'; i18nKey: string }> = {
  DEVELOPING: { color: 'grey', i18nKey: 'development.processDevelopment.status.developing' },
  PUBLISHED: { color: 'green', i18nKey: 'development.processDevelopment.status.published' },
  ARCHIVED: { color: 'orange', i18nKey: 'development.processDevelopment.status.archived' },
};

// ============= Props =============

interface ProcessManagementContentProps {
  context: 'development' | 'scheduling';
}

// ============= 组件 =============

const ProcessManagementContent = ({ context }: ProcessManagementContentProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // 根据context决定是否只显示已发布的流程
  const isSchedulingContext = context === 'scheduling';

  // 搜索框输入值（即时显示）
  const [searchValue, setSearchValue] = useState('');

  // 查询参数 - 直接使用API GetProcessesParams
  const [queryParams, setQueryParams] = useState<GetProcessesParams>({
    offset: 0,
    size: 20,
    keyword: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  // 状态筛选 - 调度中心默认只显示已发布
  const [statusFilter, setStatusFilter] = useState<string[]>(isSchedulingContext ? ['PUBLISHED'] : []);
  const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailInitialTab, setDetailInitialTab] = useState('detail');
  const [addCollaboratorModalVisible, setAddCollaboratorModalVisible] = useState(false);
  const [addCollaboratorAssetId, setAddCollaboratorAssetId] = useState('');

  // 列表响应数据 - 直接使用API LYListResponseLYProcessResponse
  const [listResponse, setListResponse] = useState<LYListResponseLYProcessResponse>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });
  const [selectedProcess, setSelectedProcess] = useState<LYProcessResponse | null>(null);
  const [editingProcess, setEditingProcess] = useState<LYProcessResponse | null>(null);

  const { openProcess, OpenProcessModal } = useOpenProcess();

  // 状态选项 - 调度中心隐藏筛选
  const statusOptions = useMemo(() => [
    { value: 'DEVELOPING', label: t('development.processDevelopment.status.developing') },
    { value: 'PUBLISHED', label: t('development.processDevelopment.status.published') },
    { value: 'ARCHIVED', label: t('development.processDevelopment.status.archived') },
  ], [t]);

  // 加载数据
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

  // 翻页并返回新数据（用于抽屉导航时自动翻页）
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

  // 初始化加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 搜索防抖
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams((prev) => ({ ...prev, offset: 0, keyword: value }));
      }, 500),
    []
  );

  // 搜索 - 使用防抖处理
  const handleSearch = (value: string) => {
    setSearchValue(value);  // 立即更新输入框显示
    debouncedSearch(value); // 防抖更新查询参数
  };

  // 打开流程详情抽屉
  const openProcessDetail = (record: LYProcessResponse) => {
    setSelectedProcess(record);
    setDetailInitialTab('detail');
    if (!detailDrawerVisible) {
      setDetailDrawerVisible(true);
    }
  };

  // 编辑操作
  const handleEdit = (record?: LYProcessResponse) => {
    const processRecord = record || selectedProcess;
    if (processRecord) {
      setEditingProcess(processRecord);
      setEditModalVisible(true);
    }
  };

  const handleRun = () => {
    console.log('运行流程:', selectedProcess?.id);
  };

  // 删除确认
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

          console.log('删除流程:', processToDelete.id);
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

  // 表格排序处理
  const handleSort = (sortBy: string) => {
    setQueryParams((prev) => ({
      ...prev,
      offset: 0,
      sort_by: sortBy,
      sort_order: prev.sort_by === sortBy && prev.sort_order === 'desc' ? 'asc' : 'desc',
    }));
  };

  // 从响应中获取分页信息
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
    // 调度中心不显示状态列（因为都是已发布）
    ...(isSchedulingContext ? [] : [{
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusConfig[status]?.color || 'grey'} type="light">
          {t(statusConfig[status]?.i18nKey || 'development.processDevelopment.status.developing')}
        </Tag>
      ),
    }]),
    {
      title: t('common.creator'),
      dataIndex: 'creator_id',
      key: 'creator_id',
      width: 120,
      ellipsis: true,
      render: (creatorId: string) => {
        const info = mockCreatorInfoMap[creatorId];
        return info ? <UserNameWithCard name={info.name} userId={creatorId} department={info.department} role={info.role} email={info.email} /> : (creatorId || '-');
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
              {/* 调度中心显示运行操作 */}
              <Dropdown.Item icon={<PlayCircle size={16} strokeWidth={2} />} onClick={(e) => {
                e.stopPropagation();
                handleRun();
              }}>
                {t('common.run')}
              </Dropdown.Item>
              {/* 开发中心显示更多操作 */}
              {!isSchedulingContext && (
                <>
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
                  <Dropdown.Item
                    icon={<UserPlus size={16} strokeWidth={2} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddCollaboratorAssetId(record.id);
                      setAddCollaboratorModalVisible(true);
                    }}
                  >
                    {t('collaborator.actions.addCollaborator')}
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
                </>
              )}
            </Dropdown.Menu>
          }
        >
          <Button icon={<IconMoreStroked />} theme="borderless" onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="process-management">



      {/* 标题区域 */}
      <div className="process-management-header">
        <div className="process-management-header-title">
          <Title heading={3} className="title">
            {t('development.processDevelopment.title')}
          </Title>
          <Text type="tertiary">
            {isSchedulingContext 
              ? t('scheduling.processDevelopment.description')
              : t('development.processDevelopment.description')
            }
          </Text>
        </div>

        {/* 操作栏 */}
        <Row type="flex" justify="space-between" align="middle" className="process-management-header-toolbar">
          <Col>
            <Space>
              <Input
                prefix={<IconSearchStroked />}
                placeholder={t('development.processDevelopment.searchPlaceholder')}
                className="process-management-search-input"
                value={searchValue}
                onChange={handleSearch}
                showClear
                maxLength={100}
              />
              {/* 调度中心不显示筛选 */}
              {!isSchedulingContext && (
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
              )}
            </Space>
          </Col>
          <Col>
            {/* 调度中心不显示新建按钮 */}
            {!isSchedulingContext && (
              <Button icon={<IconPlusStroked />} theme="solid" type="primary" onClick={() => setCreateModalVisible(true)}>
                {t('development.processDevelopment.createProcess')}
              </Button>
            )}
          </Col>
        </Row>
      </div>

      {/* 表格区域 */}
      <div className="process-management-table">
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
                onClick: () => record && openProcessDetail(record as LYProcessResponse),
                className: isSelected ? 'process-management-row-selected' : undefined,
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

      {/* 新建流程弹窗 - 仅开发中心 */}
      {!isSchedulingContext && (
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
      )}

      {/* 编辑流程弹窗 - 仅开发中心 */}
      {!isSchedulingContext && (
        <EditProcessModal
          visible={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          processData={editingProcess}
          onSuccess={(updatedProcess: LYProcessResponse) => {
            const index = mockProcessData.findIndex((item) => item.id === updatedProcess.id);
            if (index !== -1) {
              mockProcessData[index] = updatedProcess;
            }
            console.log('流程已更新:', updatedProcess);
            loadData();
          }}
        />
      )}

      {/* 流程详情抽屉 */}
      <ProcessDetailDrawer
        visible={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        processData={selectedProcess}
        onEdit={isSchedulingContext ? undefined : () => handleEdit()}
        onRun={handleRun}
        onDelete={isSchedulingContext ? undefined : () => handleDeleteClick()}
        onOpen={isSchedulingContext ? undefined : () => selectedProcess && openProcess(selectedProcess)}
        dataList={list}
        onNavigate={(process) => setSelectedProcess(process)}
        pagination={{
          currentPage,
          totalPages: Math.ceil(total / pageSize),
          pageSize,
          total,
        }}
        onPageChange={handleDrawerPageChange}
        context={context}
        initialTab={detailInitialTab}
      />

      {/* 打开流程确认弹窗 - 仅开发中心 */}
      {!isSchedulingContext && <OpenProcessModal />}

      <CollaboratorAddModal
        visible={addCollaboratorModalVisible}
        onClose={() => setAddCollaboratorModalVisible(false)}
        onSuccess={() => setAddCollaboratorModalVisible(false)}
        assetType={'PROCESS' as CollaboratorAssetType}
        assetId={addCollaboratorAssetId}
        existingCollaborators={[]}
      />
    </div>
  );
};

export default ProcessManagementContent;
