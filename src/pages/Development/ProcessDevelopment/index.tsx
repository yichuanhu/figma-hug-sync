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
import './index.less';

const { Title, Text } = Typography;

// 流程状态枚举
type ProcessStatus = 'DEVELOPING' | 'PUBLISHED' | 'ARCHIVED';

// 流程列表项接口 - 根据需求文档5.1.2定义
export interface ProcessItem {
  id: string; // UUID
  name: string; // 流程名称，1-100字符
  description: string; // 流程描述，最大500字符
  status: ProcessStatus; // 流程状态
  creatorName: string; // 创建者名称
  createTime: string; // 创建时间，格式：YYYY-MM-DD HH:mm:ss
  updateTime: string; // 更新时间，格式：YYYY-MM-DD HH:mm:ss
}

// 查询参数接口 - 根据需求文档5.1.1定义
interface QueryParams {
  page: number; // 页码，>= 1，默认1
  pageSize: number; // 每页数量，1-100，默认20
  keyword: string; // 搜索关键词，1-100字符
  sortBy: 'createTime' | 'updateTime' | 'name'; // 排序字段
  sortOrder: 'asc' | 'desc'; // 排序方向
}

// 分页信息接口 - 根据需求文档5.1.3定义
interface PaginationInfo {
  total: number; // 总记录数
  page: number; // 当前页码
  pageSize: number; // 每页数量
  totalPages: number; // 总页数
}

// 状态配置 - 使用 Semi UI 支持的 TagColor 类型
const statusConfig: Record<ProcessStatus, { color: 'grey' | 'green' | 'orange'; i18nKey: string }> = {
  DEVELOPING: { color: 'grey', i18nKey: 'development.processDevelopment.status.developing' },
  PUBLISHED: { color: 'green', i18nKey: 'development.processDevelopment.status.published' },
  ARCHIVED: { color: 'orange', i18nKey: 'development.processDevelopment.status.archived' },
};

// 生成UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// 生成模拟数据
const generateMockProcessList = (): ProcessItem[] => {
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

  const creators = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
  const statuses: ProcessStatus[] = ['DEVELOPING', 'PUBLISHED', 'ARCHIVED'];

  return Array(46)
    .fill(null)
    .map((_, index) => {
      const status = statuses[index % 3];
      const createDate = new Date(2025, 0, 1 + (index % 20), 10 + (index % 12), (index * 7) % 60, 0);
      const updateDate = new Date(createDate.getTime() + (index % 10) * 24 * 60 * 60 * 1000);

      return {
        id: generateUUID(),
        name: processNames[index % processNames.length],
        description: descriptions[index % descriptions.length],
        status,
        creatorName: creators[index % creators.length],
        createTime: createDate.toISOString().replace('T', ' ').substring(0, 19),
        updateTime: updateDate.toISOString().replace('T', ' ').substring(0, 19),
      };
    });
};

// 模拟数据存储
let mockProcessData = generateMockProcessList();

// 模拟API请求 - 获取流程列表
const fetchProcessList = async (params: QueryParams): Promise<{ data: ProcessItem[]; pagination: PaginationInfo }> => {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 500));

  let filteredData = [...mockProcessData];

  // 搜索过滤 - 同时匹配流程名称和描述（OR关系）
  if (params.keyword?.trim()) {
    const keyword = params.keyword.toLowerCase().trim();
    filteredData = filteredData.filter(
      (item) => item.name.toLowerCase().includes(keyword) || item.description.toLowerCase().includes(keyword),
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
        valueA = a.updateTime;
        valueB = b.updateTime;
        break;
      case 'createTime':
      default:
        valueA = a.createTime;
        valueB = b.createTime;
        break;
    }

    const comparison = valueA.localeCompare(valueB);
    return params.sortOrder === 'asc' ? comparison : -comparison;
  });

  // 计算分页
  const total = filteredData.length;
  const totalPages = Math.ceil(total / params.pageSize) || 1;
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const paginatedData = filteredData.slice(start, end);

  return {
    data: paginatedData,
    pagination: {
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages,
    },
  };
};

const ProcessDevelopment = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    pageSize: 20, // 默认每页20条
    keyword: '',
    sortBy: 'createTime',
    sortOrder: 'desc', // 默认按创建时间降序
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

  // 搜索（支持防抖可在Input组件层实现）
  const handleSearch = (keyword: string) => {
    setQueryParams((prev) => ({ ...prev, page: 1, keyword }));
  };

  // 打开流程详情抽屉或切换内容
  const openProcessDetail = (record: ProcessItem) => {
    setSelectedProcess(record);
    if (!detailDrawerVisible) {
      setDetailDrawerVisible(true);
    }
  };

  // 操作处理函数
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
          await new Promise((resolve, reject) => {
            setTimeout(() => {
              // 模拟成功（实际场景中根据API响应处理）
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
          // 显示错误提示
          Toast.error(t('development.processDevelopment.deleteModal.error'));
          throw error; // 抛出错误让 Modal 保持打开状态
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
