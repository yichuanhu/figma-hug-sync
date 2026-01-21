import { useState, useEffect, useCallback } from 'react';
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
  Space,
  Modal,
  Toast,
} from '@douyinfe/semi-ui';
import {
  IconSearch,
  IconPlus,
  IconDownload,
  IconMore,
  IconExternalOpenStroked,
  IconEditStroked,
  IconPlay,
  IconDeleteStroked,
} from '@douyinfe/semi-icons';
import CreateProcessModal from './components/CreateProcessModal';
import EditProcessModal from './components/EditProcessModal';
import ProcessDetailDrawer from './components/ProcessDetailDrawer';
import { useOpenProcess } from './hooks/useOpenProcess';
import type { LYProcessResponse, GetProcessesParams, LYRangeResponse } from '@/api';
import './index.less';

const { Title, Text } = Typography;

// ============= 类型定义 - 直接使用API类型 =============

// 流程状态枚举 - 与API LYProcessResponse.status对应
type ProcessStatus = 'DEVELOPING' | 'PUBLISHED' | 'ARCHIVED';

// 前端流程列表项接口 - 扩展自LYProcessResponse
export interface ProcessItem extends Pick<LYProcessResponse, 'id' | 'name' | 'language' | 'timeout'> {
  description: string;
  status: ProcessStatus;
  creatorName: string;
  createTime: string;
  updateTime: string;
  processType?: string;
  currentVersionId?: string | null;
  creatorId?: string;
  requirementId?: string | null;
}

// 查询参数接口 - 映射自API GetProcessesParams
interface QueryParams {
  page: number;
  pageSize: number;
  keyword: string;
  sortBy: 'createTime' | 'updateTime' | 'name';
  sortOrder: 'asc' | 'desc';
}

// 分页信息接口 - 映射自API LYRangeResponse
interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============= 工具函数 =============

// 生成UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// 格式化日期时间
const formatDateTime = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toISOString().replace('T', ' ').substring(0, 19);
  } catch {
    return dateStr;
  }
};

// 将前端QueryParams转换为API GetProcessesParams
const toApiParams = (params: QueryParams): GetProcessesParams => {
  const sortByMap: Record<string, string> = {
    createTime: 'created_at',
    updateTime: 'updated_at',
    name: 'name',
  };

  return {
    keyword: params.keyword || undefined,
    sort_by: sortByMap[params.sortBy] || 'updated_at',
    sort_order: params.sortOrder,
    offset: (params.page - 1) * params.pageSize,
    size: params.pageSize,
  };
};

// 将API LYProcessResponse转换为前端ProcessItem
const toProcessItem = (response: LYProcessResponse, creatorNameMap?: Record<string, string>): ProcessItem => {
  return {
    id: response.id,
    name: response.name,
    description: response.description || '',
    status: (response.status as ProcessStatus) || 'DEVELOPING',
    creatorName: creatorNameMap?.[response.creator_id] || response.creator_id,
    createTime: formatDateTime(response.created_at),
    updateTime: formatDateTime(response.updated_at),
    language: response.language,
    processType: response.process_type,
    timeout: response.timeout,
    currentVersionId: response.current_version_id,
    creatorId: response.creator_id,
    requirementId: response.requirement_id,
  };
};

// 将API LYRangeResponse转换为前端PaginationInfo
const toPaginationInfo = (range: LYRangeResponse | null | undefined, pageSize: number): PaginationInfo => {
  const total = range?.total || 0;
  const offset = range?.offset || 0;
  const page = Math.floor(offset / pageSize) + 1;
  const totalPages = Math.ceil(total / pageSize) || 1;

  return {
    total,
    page,
    pageSize,
    totalPages,
  };
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
  const statuses: ProcessStatus[] = ['DEVELOPING', 'PUBLISHED', 'ARCHIVED'];
  const languages = ['Python', 'JavaScript', 'Java'];
  const processTypes = ['RPA', 'AI', 'Hybrid'];

  const createDate = new Date(2025, 0, 1 + (index % 20), 10 + (index % 12), (index * 7) % 60, 0);
  const updateDate = new Date(createDate.getTime() + (index % 10) * 24 * 60 * 60 * 1000);

  return {
    id: generateUUID(),
    name: processNames[index % processNames.length],
    description: descriptions[index % descriptions.length],
    language: languages[index % languages.length],
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

// ============= 数据获取 =============

const fetchProcessList = async (params: QueryParams): Promise<{ data: ProcessItem[]; pagination: PaginationInfo }> => {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  // 转换为API参数格式（预留API调用）
  const apiParams = toApiParams(params);
  console.log('API参数:', apiParams);

  let filteredData = [...mockProcessData];

  // 搜索过滤
  if (params.keyword?.trim()) {
    const keyword = params.keyword.toLowerCase().trim();
    filteredData = filteredData.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) || (item.description?.toLowerCase().includes(keyword) ?? false),
    );
  }

  // 排序处理
  filteredData.sort((a, b) => {
    let valueA: string;
    let valueB: string;

    switch (params.sortBy) {
      case 'name':
        valueA = a.name;
        valueB = b.name;
        break;
      case 'updateTime':
        valueA = a.updated_at || '';
        valueB = b.updated_at || '';
        break;
      case 'createTime':
      default:
        valueA = a.created_at || '';
        valueB = b.created_at || '';
        break;
    }

    const comparison = valueA.localeCompare(valueB);
    return params.sortOrder === 'asc' ? comparison : -comparison;
  });

  // 计算分页
  const total = filteredData.length;
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const paginatedData = filteredData.slice(start, end);

  // 转换为前端格式
  const processItems = paginatedData.map((item) => toProcessItem(item, mockCreatorNameMap));

  // 构造模拟的LYRangeResponse
  const mockRange: LYRangeResponse = {
    offset: start,
    size: params.pageSize,
    total,
  };

  return {
    data: processItems,
    pagination: toPaginationInfo(mockRange, params.pageSize),
  };
};

// ============= 状态配置 =============

const statusConfig: Record<ProcessStatus, { color: 'grey' | 'green' | 'orange'; i18nKey: string }> = {
  DEVELOPING: { color: 'grey', i18nKey: 'development.processDevelopment.status.developing' },
  PUBLISHED: { color: 'green', i18nKey: 'development.processDevelopment.status.published' },
  ARCHIVED: { color: 'orange', i18nKey: 'development.processDevelopment.status.archived' },
};

// ============= 组件 =============

const ProcessDevelopment = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    pageSize: 20,
    keyword: '',
    sortBy: 'createTime',
    sortOrder: 'desc',
  });
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [processListData, setProcessListData] = useState<ProcessItem[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<ProcessItem | null>(null);
  const [editingProcess, setEditingProcess] = useState<{
    id: string;
    name: string;
    description: string;
  } | null>(null);

  const { openProcess, OpenProcessModal } = useOpenProcess();

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchProcessList(queryParams);
      setProcessListData(result.data);
      setPaginationInfo(result.pagination);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  // 初始化加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 搜索
  const handleSearch = (keyword: string) => {
    setQueryParams((prev) => ({ ...prev, page: 1, keyword }));
  };

  // 打开流程详情抽屉
  const openProcessDetail = (record: ProcessItem) => {
    setSelectedProcess(record);
    if (!detailDrawerVisible) {
      setDetailDrawerVisible(true);
    }
  };

  // 编辑操作
  const handleEdit = (record?: ProcessItem) => {
    const processRecord = record || selectedProcess;

    if (processRecord) {
      setEditingProcess({
        id: processRecord.id,
        name: processRecord.name,
        description: processRecord.description,
      });
      setEditModalVisible(true);
    }
  };

  const handleRun = () => {
    console.log('运行流程:', selectedProcess?.id);
  };

  // 删除确认
  const handleDeleteClick = (record?: ProcessItem) => {
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
          // 模拟删除 API 调用
          await new Promise((resolve) => {
            setTimeout(() => {
              // 从mock数据中删除
              mockProcessData = mockProcessData.filter((item) => item.id !== processToDelete.id);
              resolve(true);
            }, 500);
          });

          console.log('删除流程:', processToDelete.id);

          // 关闭抽屉
          setDetailDrawerVisible(false);
          setSelectedProcess(null);

          // 重新加载数据
          loadData();

          // 显示成功提示
          Toast.success(t('development.processDevelopment.deleteModal.success'));
        } catch (error) {
          Toast.error(t('development.processDevelopment.deleteModal.error'));
          throw error;
        }
      },
    });
  };

  // 表格排序处理
  const handleSort = (sortBy: 'createTime' | 'updateTime' | 'name') => {
    setQueryParams((prev) => ({
      ...prev,
      page: 1,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  };

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
      render: (description: string) => (
        <Tooltip content={description} position="top">
          <div className="process-development-cell-ellipsis">{description}</div>
        </Tooltip>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ProcessStatus) => (
        <Tag color={statusConfig[status]?.color || 'grey'} type="light">
          {t(statusConfig[status]?.i18nKey || 'development.processDevelopment.status.developing')}
        </Tag>
      ),
    },
    {
      title: t('common.creator'),
      dataIndex: 'creatorName',
      key: 'creatorName',
      width: 120,
      render: (creatorName: string) => {
        if (!creatorName) return null;
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
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      sorter: true,
      onHeaderCell: () => ({
        onClick: () => handleSort('createTime'),
      }),
    },
    {
      title: t('common.updateTime'),
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 160,
      sorter: true,
      onHeaderCell: () => ({
        onClick: () => handleSort('updateTime'),
      }),
    },
    {
      title: t('common.actions'),
      dataIndex: 'action',
      key: 'action',
      width: 60,
      render: (_: unknown, record: ProcessItem) => (
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
              <Dropdown.Item icon={<IconPlay />} onClick={handleRun}>
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
            <Input
              prefix={<IconSearch />}
              placeholder={t('development.processDevelopment.searchPlaceholder')}
              className="process-development-search-input"
              value={queryParams.keyword}
              onChange={handleSearch}
              showClear
              maxLength={100}
            />
          </Col>
          <Col>
            <Space>
              <Button icon={<IconDownload />} theme="light">
                {t('development.processDevelopment.importProcess')}
              </Button>
              <Button icon={<IconPlus />} theme="solid" type="primary" onClick={() => setCreateModalVisible(true)}>
                {t('development.processDevelopment.createProcess')}
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* 表格区域 */}
      <div className="process-development-table">
        <Table
          columns={columns}
          dataSource={processListData}
          loading={loading}
          rowKey="id"
          onRow={(record) => {
            const isSelected = selectedProcess?.id === record?.id && detailDrawerVisible;
            return {
              onClick: () => record && openProcessDetail(record as ProcessItem),
              className: isSelected ? 'process-development-row-selected' : undefined,
              style: { cursor: 'pointer' },
            };
          }}
          pagination={{
            total: paginationInfo.total,
            pageSize: queryParams.pageSize,
            currentPage: queryParams.page,
            onPageChange: (page) => setQueryParams((prev) => ({ ...prev, page })),
            onPageSizeChange: (pageSize) => setQueryParams((prev) => ({ ...prev, page: 1, pageSize })),
            showSizeChanger: true,
            showTotal: true,
          }}
          scroll={{ y: 'calc(100vh - 320px)' }}
        />
      </div>

      {/* 新建流程弹窗 */}
      <CreateProcessModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={(processData) => {
          // 添加到mock数据
          const newMockProcess: LYProcessResponse = {
            id: processData.id,
            name: processData.name,
            description: processData.description,
            language: 'Python',
            process_type: 'RPA',
            timeout: 60,
            status: 'DEVELOPING',
            current_version_id: null,
            creator_id: 'user-001',
            requirement_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          mockProcessData.unshift(newMockProcess);

          // 重新加载数据
          loadData();

          // 创建新的ProcessItem并打开详情抽屉
          const newProcess: ProcessItem = {
            id: processData.id,
            name: processData.name,
            description: processData.description,
            status: 'DEVELOPING',
            creatorName: processData.creator,
            createTime: processData.createdAt,
            updateTime: processData.createdAt,
            language: 'Python',
            timeout: 60,
          };
          setSelectedProcess(newProcess);
          setDetailDrawerVisible(true);
        }}
      />

      {/* 编辑流程弹窗 */}
      <EditProcessModal
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        processData={editingProcess}
        onSuccess={(updatedData) => {
          // 更新mock数据
          const index = mockProcessData.findIndex((item) => item.id === updatedData.id);
          if (index !== -1) {
            mockProcessData[index] = {
              ...mockProcessData[index],
              name: updatedData.name,
              description: updatedData.description,
              updated_at: new Date().toISOString(),
            };
          }

          console.log('流程已更新:', updatedData);
          // 重新加载数据
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
      />

      {/* 打开流程确认弹窗 */}
      <OpenProcessModal />
    </div>
  );
};

export default ProcessDevelopment;
