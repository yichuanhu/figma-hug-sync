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
  Dropdown,
  Tooltip,
  Row,
  Col,
  Modal,
  Toast,
  Space,
  Select,
} from '@douyinfe/semi-ui';
import AppLayout from '@/components/layout/AppLayout';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import {
  IconSearch,
  IconPlus,
  IconMore,
  IconDeleteStroked,
  IconPlayCircle,
  IconEditStroked,
} from '@douyinfe/semi-icons';
import type { 
  LYExecutionTemplateResponse,
  LYListResponseLYExecutionTemplateResponse,
  TaskPriority,
  ExecutionTargetType,
} from '@/api';
import CreateTemplateModal from './components/CreateTemplateModal';
import EditTemplateModal from './components/EditTemplateModal';
import TemplateDetailDrawer from './components/TemplateDetailDrawer';
import './index.less';

const { Title, Text } = Typography;

// ============= 工具函数 =============

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ============= Mock数据生成 =============

const mockProcesses = [
  { process_id: 'proc-001', process_name: '订单自动处理' },
  { process_id: 'proc-002', process_name: '财务报销审批' },
  { process_id: 'proc-003', process_name: '人事入职流程' },
  { process_id: 'proc-004', process_name: '采购申请流程' },
  { process_id: 'proc-005', process_name: '合同审批流程' },
];

const mockCreatorNames = ['张三', '李四', '王五', '赵六', '钱七'];

const generateMockTemplateResponse = (index: number): LYExecutionTemplateResponse & {
  created_at: string;
  updated_at: string;
  created_by_id: string;
  created_by_name: string;
} => {
  const process = mockProcesses[index % mockProcesses.length];
  const priorities: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW'];
  const targetTypes: ExecutionTargetType[] = ['BOT_GROUP', 'BOT_IN_GROUP', 'UNGROUPED_BOT'];
  const targetNames = ['订单处理组', '财务审批组', '人事管理组', 'RPA-BOT-001', 'RPA-BOT-002'];
  
  const createDate = new Date(2026, 0, 1 + (index % 28), 10 + (index % 12), (index * 7) % 60);

  return {
    template_id: `tpl-${generateUUID().substring(0, 8)}`,
    template_name: `${process.process_name}模板${index + 1}`,
    description: index % 3 === 0 ? null : `这是${process.process_name}的执行模板，用于快速创建任务`,
    process_id: process.process_id,
    process_name: process.process_name,
    execution_target_type: targetTypes[index % targetTypes.length],
    execution_target_id: `target-${index}`,
    execution_target_name: targetNames[index % targetNames.length],
    priority: priorities[index % priorities.length],
    max_execution_duration: 1800 + (index % 5) * 600,
    validity_days: 7 + (index % 7),
    enable_recording: index % 2 === 0,
    input_parameters: { targetUrl: 'https://example.com', maxCount: 100 },
    created_at: createDate.toISOString(),
    updated_at: createDate.toISOString(),
    created_by_id: `user-00${(index % 5) + 1}`,
    created_by_name: mockCreatorNames[index % mockCreatorNames.length],
  };
};

// 生成 mock 数据
const generateMockTemplates = (count: number) => {
  return Array.from({ length: count }, (_, i) => generateMockTemplateResponse(i));
};

const allMockTemplates = generateMockTemplates(35);

interface GetTemplatesParams {
  offset?: number;
  size?: number;
  keyword?: string;
  process_id?: string;
}

// ============= 组件 =============

const TemplateManagementPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 列表数据状态
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [listResponse, setListResponse] = useState<LYListResponseLYExecutionTemplateResponse>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });
  const [loading, setLoading] = useState(false);
  const [queryParams, setQueryParams] = useState<GetTemplatesParams>({
    offset: 0,
    size: 20,
    keyword: '',
    process_id: undefined,
  });

  // 选中状态（抽屉）
  const [selectedTemplate, setSelectedTemplate] = useState<LYExecutionTemplateResponse | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // 弹窗状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LYExecutionTemplateResponse | null>(null);

  // 从响应中直接获取分页信息
  const { range, list } = listResponse;
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  // 计算分页
  const totalPages = Math.ceil(total / pageSize);

  // 模拟加载数据
  const loadData = useCallback(async (params: GetTemplatesParams) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      let filtered = [...allMockTemplates];

      // 关键词搜索
      if (params.keyword) {
        const kw = params.keyword.toLowerCase();
        filtered = filtered.filter(
          (tpl) =>
            tpl.template_name.toLowerCase().includes(kw) ||
            (tpl.description && tpl.description.toLowerCase().includes(kw))
        );
      }

      // 按流程筛选
      if (params.process_id) {
        filtered = filtered.filter((tpl) => tpl.process_id === params.process_id);
      }

      const offset = params.offset || 0;
      const size = params.size || 20;
      const paged = filtered.slice(offset, offset + size);

      setListResponse({
        range: { offset, size, total: filtered.length },
        list: paged,
      });
    } catch (error) {
      console.error('加载模板列表失败:', error);
      Toast.error(t('common.loadError'));
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [t]);

  useEffect(() => {
    loadData(queryParams);
  }, [queryParams, loadData]);

  // 搜索防抖
  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams((prev) => ({ ...prev, offset: 0, keyword: value }));
      }, 500),
    []
  );

  // 流程筛选
  const handleProcessFilter = (processId: string | undefined) => {
    setQueryParams((prev) => ({ ...prev, offset: 0, process_id: processId }));
  };

  // 创建模板成功
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    loadData(queryParams);
  };

  // 编辑模板
  const handleEditTemplate = (template: LYExecutionTemplateResponse) => {
    setEditingTemplate(template);
    setEditModalVisible(true);
  };

  // 编辑模板成功
  const handleEditSuccess = () => {
    setEditModalVisible(false);
    setEditingTemplate(null);
    setDrawerVisible(false);
    setSelectedTemplate(null);
    loadData(queryParams);
  };

  // 打开详情抽屉
  const handleOpenDrawer = (template: LYExecutionTemplateResponse) => {
    setSelectedTemplate(template);
    setDrawerVisible(true);
  };

  // 关闭详情抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setSelectedTemplate(null);
  };

  // 从抽屉编辑
  const handleEditFromDrawer = (template: LYExecutionTemplateResponse) => {
    setEditingTemplate(template);
    setEditModalVisible(true);
  };

  // 从抽屉删除
  const handleDeleteFromDrawer = (template: LYExecutionTemplateResponse) => {
    handleDeleteTemplate(template);
    setDrawerVisible(false);
    setSelectedTemplate(null);
  };

  // 翻页加载
  const handlePageChangeForDrawer = async (page: number): Promise<LYExecutionTemplateResponse[]> => {
    const newOffset = (page - 1) * pageSize;
    setQueryParams((prev) => ({ ...prev, offset: newOffset }));
    
    // 模拟获取新页数据
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    let filtered = [...allMockTemplates];
    if (queryParams.keyword) {
      const kw = queryParams.keyword.toLowerCase();
      filtered = filtered.filter(
        (tpl) =>
          tpl.template_name.toLowerCase().includes(kw) ||
          (tpl.description && tpl.description.toLowerCase().includes(kw))
      );
    }
    if (queryParams.process_id) {
      filtered = filtered.filter((tpl) => tpl.process_id === queryParams.process_id);
    }
    
    const paged = filtered.slice(newOffset, newOffset + pageSize);
    return paged;
  };

  // 使用模板
  const handleUseTemplate = (template: LYExecutionTemplateResponse) => {
    navigate(`/scheduling-center/task-execution/task-list?templateId=${template.template_id}`);
  };

  // 删除模板
  const handleDeleteTemplate = (template: LYExecutionTemplateResponse) => {
    Modal.confirm({
      title: t('template.deleteModal.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: (
        <>
          <div>{t('template.deleteModal.confirmMessage', { name: template.template_name })}</div>
          <div style={{ color: 'var(--semi-color-text-2)', marginTop: 8 }}>
            {t('template.deleteModal.deleteWarning')}
          </div>
        </>
      ),
      okText: t('template.deleteModal.confirmDelete'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 300));
          Toast.success(t('template.deleteModal.success'));
          loadData(queryParams);
        } catch (error) {
          Toast.error(t('template.deleteModal.error'));
          throw error;
        }
      },
    });
  };

  // 表格列定义
  const columns = [
    {
      title: t('template.table.name'),
      dataIndex: 'template_name',
      width: 200,
      render: (text: string) => (
        <span className="template-management-table-name">{text}</span>
      ),
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      width: 200,
      render: (text: string | null) => (
        <Tooltip content={text} position="topLeft">
          <span className="template-management-table-desc">{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: t('template.table.processName'),
      dataIndex: 'process_name',
      width: 160,
      render: (text: string) => text || '-',
    },
    {
      title: t('template.table.creator'),
      dataIndex: 'created_by_name',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: t('template.table.createTime'),
      dataIndex: 'created_at',
      width: 180,
      render: (text: string) => (text ? new Date(text).toLocaleString('zh-CN') : '-'),
    },
    {
      title: t('common.actions'),
      dataIndex: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: unknown, record: LYExecutionTemplateResponse) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          clickToHide
          render={
            <Dropdown.Menu>
              <Dropdown.Item
                icon={<IconPlayCircle />}
                onClick={() => handleUseTemplate(record)}
              >
                {t('template.actions.use')}
              </Dropdown.Item>
              <Dropdown.Item
                icon={<IconEditStroked />}
                onClick={() => handleEditTemplate(record)}
              >
                {t('template.actions.edit')}
              </Dropdown.Item>
              <Dropdown.Item
                icon={<IconDeleteStroked />}
                type="danger"
                onClick={() => handleDeleteTemplate(record)}
              >
                {t('template.actions.delete')}
              </Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Button 
            icon={<IconMore />} 
            theme="borderless" 
            type="tertiary"
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  // 判断是否有筛选条件
  const hasFilters = queryParams.keyword || queryParams.process_id;

  return (
    <AppLayout>
      <div className="template-management">
        {/* 面包屑 */}
        <Breadcrumb className="template-management-breadcrumb">
          <Breadcrumb.Item>{t('sidebar.schedulingCenter')}</Breadcrumb.Item>
          <Breadcrumb.Item>{t('sidebar.taskExecution')}</Breadcrumb.Item>
          <Breadcrumb.Item>{t('template.pageTitle')}</Breadcrumb.Item>
        </Breadcrumb>

        {/* 标题区域 */}
        <div className="template-management-header">
          <div className="template-management-header-title">
            <Title heading={4} className="title">
              {t('template.pageTitle')}
            </Title>
          </div>

          {/* 操作栏 */}
          <Row
            type="flex"
            justify="space-between"
            align="middle"
            className="template-management-header-toolbar"
          >
            <Col>
              <Space>
                <Input
                  prefix={<IconSearch />}
                  placeholder={t('template.searchPlaceholder')}
                  onChange={handleSearch}
                  showClear
                  className="template-management-search-input"
                />
                <Select
                  placeholder={t('template.filterByProcess')}
                  value={queryParams.process_id}
                  onChange={(v) => handleProcessFilter(v as string | undefined)}
                  showClear
                  style={{ width: 180 }}
                  optionList={mockProcesses.map((p) => ({
                    value: p.process_id,
                    label: p.process_name,
                  }))}
                />
              </Space>
            </Col>
            <Col>
              <Button
                icon={<IconPlus />}
                theme="solid"
                type="primary"
                onClick={() => setCreateModalVisible(true)}
              >
                {t('template.actions.create')}
              </Button>
            </Col>
          </Row>
        </div>

        {/* 表格区域 */}
        <div className="template-management-table">
          {isInitialLoad ? (
            <TableSkeleton />
          ) : list.length === 0 ? (
            <EmptyState
              variant={hasFilters ? 'noResult' : 'noData'}
              description={hasFilters ? t('common.noResult') : t('template.noData')}
            />
          ) : (
            <Table
              size="middle"
              dataSource={list}
              rowKey="template_id"
              loading={loading && !isInitialLoad}
              columns={columns}
              onRow={(record) => ({
                onClick: () => handleOpenDrawer(record as LYExecutionTemplateResponse),
                style: { cursor: 'pointer' },
                className: selectedTemplate?.template_id === (record as LYExecutionTemplateResponse).template_id && drawerVisible ? 'template-row-selected' : '',
              })}
              pagination={{
                total,
                pageSize,
                currentPage,
                showSizeChanger: true,
                pageSizeOpts: [10, 20, 50, 100],
                onPageChange: (page) => {
                  setQueryParams((prev) => ({ ...prev, offset: (page - 1) * pageSize }));
                },
                onPageSizeChange: (size) => {
                  setQueryParams((prev) => ({ ...prev, offset: 0, size }));
                },
              }}
            />
          )}
        </div>

        {/* 创建模板弹窗 */}
        <CreateTemplateModal
          visible={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          onSuccess={handleCreateSuccess}
        />

        {/* 编辑模板弹窗 */}
        <EditTemplateModal
          visible={editModalVisible}
          template={editingTemplate}
          onCancel={() => {
            setEditModalVisible(false);
            setEditingTemplate(null);
          }}
          onSuccess={handleEditSuccess}
        />

        {/* 模板详情抽屉 */}
        <TemplateDetailDrawer
          visible={drawerVisible}
          template={selectedTemplate}
          onClose={handleCloseDrawer}
          onEdit={handleEditFromDrawer}
          onDelete={handleDeleteFromDrawer}
          dataSource={list}
          onSelectTemplate={setSelectedTemplate}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChangeForDrawer}
        />
      </div>
    </AppLayout>
  );
};

export default TemplateManagementPage;
