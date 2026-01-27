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
  Avatar,
  Dropdown,
  Tooltip,
  Row,
  Col,
  Modal,
  Toast,
  Popover,
  CheckboxGroup,
  Space,
} from '@douyinfe/semi-ui';
import TableSkeleton from '@/components/Skeleton/TableSkeleton';
import EmptyState from '@/components/EmptyState';
import {
  IconSearch,
  IconPlus,
  IconMore,
  IconExternalOpenStroked,
  IconEditStroked,
  IconPlayCircle,
  IconDeleteStroked,
  IconFilter,
} from '@douyinfe/semi-icons';
import AppLayout from '@/components/layout/AppLayout';
import CreateProcessModal from './components/CreateProcessModal';
import EditProcessModal from './components/EditProcessModal';
import ProcessDetailDrawer from './components/ProcessDetailDrawer';
import { useOpenProcess } from './hooks/useOpenProcess';
import type { LYProcessResponse, GetProcessesParams, LYListResponseLYProcessResponse } from '@/api';
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
    '订单自动处理',
    '财务报销审批',
    '人事入职流程',
    '采购申请流程',
    '合同审批流程',
    '发票识别处理',
    '客户信息同步',
    '库存盘点流程',
    '销售数据汇总',
    '报表自动生成',
  ];

  const descriptions = [
    '自动处理销售订单，包括订单验证、库存检查、发货通知',
    '自动处理财务报销审批流程，包括发票识别、金额核对、审批通知',
    '自动化处理新员工入职流程，包括账号创建、权限分配、培训安排',
    '自动处理采购申请，包括供应商比价、审批流程、订单生成',
    '自动化合同审批流程，包括合同模板匹配、条款审核、签章流程',
    '自动识别和处理各类发票，包括OCR识别、信息提取、入账处理',
    '自动同步客户信息到各个业务系统，保持数据一致性',
    '自动执行库存盘点任务，生成差异报告，触发补货流程',
    '自动汇总各渠道销售数据，生成分析报告，发送给相关负责人',
    '定时自动生成各类业务报表，支持多种格式导出和分发',
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

// 模拟创建者ID到名称的映射
const mockCreatorNameMap: Record<string, string> = {
  'user-001': '张三',
  'user-002': '李四',
  'user-003': '王五',
  'user-004': '赵六',
  'user-005': '钱七',
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

// ============= 组件 =============

const ProcessDevelopment = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // 查询参数 - 直接使用API GetProcessesParams
  const [queryParams, setQueryParams] = useState<GetProcessesParams>({
    offset: 0,
    size: 20,
    keyword: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);

  // 列表响应数据 - 直接使用API LYListResponseLYProcessResponse
  const [listResponse, setListResponse] = useState<LYListResponseLYProcessResponse>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });
  const [selectedProcess, setSelectedProcess] = useState<LYProcessResponse | null>(null);
  const [editingProcess, setEditingProcess] = useState<LYProcessResponse | null>(null);

  const { openProcess, OpenProcessModal } = useOpenProcess();

  // 状态选项
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

  // 搜索 - 使用防抖处理
  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams((prev) => ({ ...prev, offset: 0, keyword: value }));
      }, 500),
    []
  );

  // 打开流程详情抽屉
  const openProcessDetail = (record: LYProcessResponse) => {
    setSelectedProcess(record);
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
      render: (description: string | null) => (
        <Tooltip content={description || '-'} position="top">
          <div className="process-development-cell-ellipsis">{description || '-'}</div>
        </Tooltip>
      ),
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
      render: (creatorId: string) => {
        const creatorName = mockCreatorNameMap[creatorId] || creatorId;
        return (
          <div className="process-development-cell-creator">
            <Avatar size="small" className="avatar-creator">
              {creatorName.charAt(0)}
            </Avatar>
            <span>{creatorName}</span>
          </div>
        );
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
          <Button icon={<IconMore />} theme="borderless" onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="process-development">
      {/* 固定面包屑 */}
      <div className="process-development-breadcrumb">
        <Breadcrumb>
          <Breadcrumb.Item onClick={() => navigate('/')}>{t('common.home')}</Breadcrumb.Item>
          <Breadcrumb.Item>{t('development.processDevelopment.breadcrumb.developmentCenter')}</Breadcrumb.Item>
          <Breadcrumb.Item>{t('development.processDevelopment.breadcrumb.automationProcess')}</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* 标题区域 */}
      <div className="process-development-header">
        <div className="process-development-header-title">
          <Title heading={3} className="title">
            {t('development.processDevelopment.title')}
          </Title>
          <Text type="tertiary">{t('development.processDevelopment.description')}</Text>
        </div>

        {/* 操作栏 */}
        <Row type="flex" justify="space-between" align="middle" className="process-development-header-toolbar">
          <Col>
            <Space>
              <Input
                prefix={<IconSearch />}
                placeholder={t('development.processDevelopment.searchPlaceholder')}
                className="process-development-search-input"
                value={queryParams.keyword || ''}
                onChange={handleSearch}
                showClear
                maxLength={100}
              />
              <Popover
                visible={filterPopoverVisible}
                onVisibleChange={setFilterPopoverVisible}
                trigger="click"
                position="bottomLeft"
                content={
                  <div className="filter-popover">
                    <div className="filter-popover-section">
                      <Text strong className="filter-popover-label">
                        {t('common.status')}
                      </Text>
                      <CheckboxGroup
                        value={statusFilter}
                        onChange={(values) => {
                          setStatusFilter(values as string[]);
                          setQueryParams((prev) => ({ ...prev, offset: 0 }));
                        }}
                        options={statusOptions}
                        direction="horizontal"
                      />
                    </div>
                    <div className="filter-popover-footer">
                      <Button theme="borderless" onClick={() => {
                        setStatusFilter([]);
                        setQueryParams((prev) => ({ ...prev, offset: 0 }));
                      }} disabled={statusFilter.length === 0}>
                        {t('common.reset')}
                      </Button>
                      <Button theme="solid" type="primary" onClick={() => setFilterPopoverVisible(false)}>
                        {t('common.confirm')}
                      </Button>
                    </div>
                  </div>
                }
              >
                <Button
                  icon={<IconFilter />}
                  type={statusFilter.length > 0 ? 'primary' : 'tertiary'}
                  theme={statusFilter.length > 0 ? 'solid' : 'light'}
                >
                  {t('common.filter')}{statusFilter.length > 0 ? ` (${statusFilter.length})` : ''}
                </Button>
              </Popover>
            </Space>
          </Col>
          <Col>
            <Button icon={<IconPlus />} theme="solid" type="primary" onClick={() => setCreateModalVisible(true)}>
              {t('development.processDevelopment.createProcess')}
            </Button>
          </Col>
        </Row>
      </div>

      {/* 表格区域 */}
      <div className="process-development-table">
        {isInitialLoad ? (
          <TableSkeleton columns={[{ width: '15%' }, { width: '30%' }, { width: '10%' }, { width: '12%' }, { width: '15%' }, { width: '15%' }, { width: '8%' }]} rows={10} />
        ) : (
          <Table
            columns={columns}
            dataSource={list}
            loading={loading}
            rowKey="id"
            empty={<EmptyState description={t('development.processDevelopment.noData')} />}
            onRow={(record) => {
              const isSelected = selectedProcess?.id === record?.id && detailDrawerVisible;
              return {
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

      {/* 新建流程弹窗 */}
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

      {/* 编辑流程弹窗 */}
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

      {/* 流程详情抽屉 */}
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
      />

      {/* 打开流程确认弹窗 */}
      <OpenProcessModal />
      </div>
    </AppLayout>
  );
};

export default ProcessDevelopment;
