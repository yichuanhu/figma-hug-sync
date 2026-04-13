import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
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
  Tooltip,
} from '@douyinfe/semi-ui';
import DepartmentSelect from '@/components/DepartmentSelect';
import { IconSearchStroked } from '@douyinfe/semi-icons';
// AppLayout removed
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import { ChevronLeft, Ellipsis, ExternalLink, Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import type { 
  LYExecutionTemplateResponse,
  LYListResponseLYExecutionTemplateResponse,
  TaskPriority,
  ExecutionTargetType,
} from '@/api';
import CreateTemplateModal from './components/CreateTemplateModal';
import EditTemplateModal from './components/EditTemplateModal';
import TemplateDetailDrawer from './components/TemplateDetailDrawer';
import { useCollaboratorAction } from '@/hooks/useCollaboratorAction';
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

// ============= MockDatageneration =============

const mockProcesses = [
  { process_id: 'proc-001', process_name: 'Auto Order Processing', owning_department_name: 'Finance Department' },
  { process_id: 'proc-002', process_name: 'Expense Reimbursement Approval', owning_department_name: 'Enterprise Business Center' },
  { process_id: 'proc-003', process_name: 'Employee Onboarding Flow', owning_department_name: 'Human Resources Department' },
  { process_id: 'proc-004', process_name: 'Data Collection Flow', owning_department_name: 'R&D Center' },
];

const mockCreatorNames = ['John Smith', 'Jane Doe', 'Mike Wang', 'David Zhao', 'Chris Qian'];

const generateMockTemplateResponse = (index: number): LYExecutionTemplateResponse & {
  created_at: string;
  updated_at: string;
  created_by_id: string;
  created_by_name: string;
} => {
  const process = mockProcesses[index % mockProcesses.length];
  const priorities: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW'];
  const targetTypes: ExecutionTargetType[] = ['BOT_GROUP', 'BOT_IN_GROUP', 'UNGROUPED_BOT'];
  const targetNames = ['Order Processing Group', 'Finance Approval Group', 'HR Management Group', 'RPA-BOT-001', 'RPA-BOT-002'];
  
  const createDate = new Date(2026, 0, 1 + (index % 28), 10 + (index % 12), (index * 7) % 60);

  return {
    template_id: `tpl-${generateUUID().substring(0, 8)}`,
    template_name: `${process.process_name}Template${index + 1}`,
    description: index === 0 
      ? 'This is a fully-featured execution template supporting automated order processing, smart data validation, anomaly handling, and multi-channel notifications. Integrates complete log tracking, error retry mechanisms, and manual intervention processes for stable and reliable task execution. Suitable for large-scale batch automation scenarios.'
      : (index % 3 === 0 ? null : `This is ${process.process_name}'s ExecuteTemplate, for quickly creating tasks`),
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
    owning_department_name: process.owning_department_name,
    created_at: createDate.toISOString(),
    updated_at: createDate.toISOString(),
    created_by_id: `user-00${(index % 5) + 1}`,
    created_by_name: mockCreatorNames[index % mockCreatorNames.length],
  };
};

// generation mock Data
const generateMockTemplates = (count: number) => {
  return Array.from({ length: count }, (_, i) => generateMockTemplateResponse(i));
};

const allMockTemplates = generateMockTemplates(35);

interface GetTemplatesParams {
  offset?: number;
  size?: number;
  keyword?: string;
  process_id?: string;
  owning_department_name?: string;
}

// ============= 组件 =============

const TemplateManagementPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ListDataStatus
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
    owning_department_name: undefined,
  });

  // SelectedStatus(Drawer)
  const [selectedTemplate, setSelectedTemplate] = useState<LYExecutionTemplateResponse | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [detailInitialTab, setDetailInitialTab] = useState('basicInfo');
  const { openCollaborator, renderCollaboratorPanel } = useCollaboratorAction();

  // ModalStatus
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LYExecutionTemplateResponse | null>(null);

  // from响应直接获取分页Info
  const { range, list } = listResponse;
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  // calculation分页
  const totalPages = Math.ceil(total / pageSize);

  // 模拟LoadingData
  const loadData = useCallback(async (params: GetTemplatesParams) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      let filtered = [...allMockTemplates];

      // 关键词Search
      if (params.keyword) {
        const kw = params.keyword.toLowerCase();
        filtered = filtered.filter(
          (tpl) =>
            tpl.template_name.toLowerCase().includes(kw) ||
            (tpl.description && tpl.description.toLowerCase().includes(kw))
        );
      }

      // byProcessFilter
      if (params.process_id) {
        filtered = filtered.filter((tpl) => tpl.process_id === params.process_id);
      }

      // by归属部门Filter
      if (params.owning_department_name) {
        filtered = filtered.filter((tpl: any) => tpl.owning_department_name === params.owning_department_name);
      }

      const offset = params.offset || 0;
      const size = params.size || 20;
      const paged = filtered.slice(offset, offset + size);

      setListResponse({
        range: { offset, size, total: filtered.length },
        list: paged,
      });
    } catch (error) {
      console.error('LoadingTemplateListFailed:', error);
      Toast.error(t('common.loadError'));
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [t]);

  useEffect(() => {
    loadData(queryParams);
  }, [queryParams, loadData]);

  // Searchdebounced
  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams((prev) => ({ ...prev, offset: 0, keyword: value }));
      }, 500),
    []
  );

  // ProcessFilter
  const handleProcessFilter = (processId: string | undefined) => {
    setQueryParams((prev) => ({ ...prev, offset: 0, process_id: processId }));
  };

  // CreateTemplateSuccess
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    loadData(queryParams);
  };

  // EditTemplate
  const handleEditTemplate = (template: LYExecutionTemplateResponse) => {
    setEditingTemplate(template);
    setEditModalVisible(true);
  };

  // EditTemplateSuccess
  const handleEditSuccess = () => {
    setEditModalVisible(false);
    setEditingTemplate(null);
    setDrawerVisible(false);
    setSelectedTemplate(null);
    loadData(queryParams);
  };

  // openDetails drawer
  const handleOpenDrawer = (template: LYExecutionTemplateResponse) => {
    setSelectedTemplate(template);
    setDetailInitialTab('basicInfo');
    setDrawerVisible(true);
  };

  // CloseDetails drawer
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setSelectedTemplate(null);
    setDetailInitialTab('basicInfo');
  };

  // fromDrawerEdit
  const handleEditFromDrawer = (template: LYExecutionTemplateResponse) => {
    setEditingTemplate(template);
    setEditModalVisible(true);
  };

  // fromDrawerDelete
  const handleDeleteFromDrawer = (template: LYExecutionTemplateResponse) => {
    handleDeleteTemplate(template);
    setDrawerVisible(false);
    setSelectedTemplate(null);
  };

  // 翻页Loading
  const handlePageChangeForDrawer = async (page: number): Promise<LYExecutionTemplateResponse[]> => {
    const newOffset = (page - 1) * pageSize;
    setQueryParams((prev) => ({ ...prev, offset: newOffset }));
    
    // 模拟获取新页Data
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

  // usingTemplate
  const handleUseTemplate = (template: LYExecutionTemplateResponse) => {
    // 将TemplateData存入 sessionStorage, 以便task页面读取
    sessionStorage.setItem(`template_${template.template_id}`, JSON.stringify(template));
    navigate(`/scheduling-center/task-execution/task-list?templateId=${template.template_id}`);
  };

  // DeleteTemplate
  const handleDeleteTemplate = (template: LYExecutionTemplateResponse) => {
    Modal.confirm({
      title: t('template.deleteModal.title'),
      icon: <Trash2 size={16} strokeWidth={2} color="var(--semi-color-danger)" />,
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

  // Table列定义
  const columns = [
    {
      title: t('template.table.name'),
      dataIndex: 'template_name',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      width: 200,
      ellipsis: true,
      render: (text: string | null) => text || '-',
    },
    {
      title: t('template.table.processName'),
      dataIndex: 'process_name',
      width: 160,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: t('common.owningDepartment'),
      dataIndex: 'owning_department_name',
      width: 140,
      ellipsis: true,
      render: (text: string | null) => text || '-',
    },
    {
      title: t('template.table.creator'),
      dataIndex: 'created_by_name',
      width: 120,
      ellipsis: true,
      render: (text: string, record: any) => text ? <UserNameWithCard name={text} userId={record.created_by_id} /> : '-',
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
      render: (_: unknown, record: LYExecutionTemplateResponse) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          clickToHide
          render={
            <Dropdown.Menu>
              <Dropdown.Item
                icon={<ExternalLink size={16} strokeWidth={2} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUseTemplate(record);
                }}
              >
                {t('template.actions.use')}
              </Dropdown.Item>
              <Dropdown.Item
                icon={<Pencil size={16} strokeWidth={2} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditTemplate(record);
                }}
              >
                {t('template.actions.edit')}
              </Dropdown.Item>
              <Dropdown.Item
                icon={<UserPlus size={14} strokeWidth={2} />}
                onClick={(e) => {
                  e.stopPropagation();
                  openCollaborator(record.template_id);
                }}
              >
                {t('collaborator.actions.addCollaborator')}
              </Dropdown.Item>
              <Dropdown.Item
                icon={<Trash2 size={16} strokeWidth={2} />}
                type="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTemplate(record);
                }}
              >
                {t('template.actions.delete')}
              </Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Button 
            icon={<Ellipsis size={16} strokeWidth={2} />} 
            theme="borderless" 
            type="tertiary"
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  // departmentOptions removed - using DepartmentSelect with tree data

  const hasFilters = queryParams.keyword || queryParams.process_id || queryParams.owning_department_name;

  return (
      <div className="template-management">

        {/* Back and  */}
        <div className="template-management-header">
          <div className="template-management-header-title">
            <Tooltip content={t('common.back')} position="bottom">
              <Button
                icon={<ChevronLeft size={16} strokeWidth={2} />}
                theme="borderless"
                onClick={() => navigate('/scheduling-center/task-execution/task-list')}
                className="template-management-back-btn"
              />
            </Tooltip>
            <Title heading={3} className="title">
              {t('template.pageTitle')}
            </Title>
          </div>

          {/* Operation */}
          <Row
            type="flex"
            justify="space-between"
            align="middle"
            className="template-management-header-toolbar"
          >
            <Col>
              <Space>
                <Input
                  prefix={<IconSearchStroked />}
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
                  style={{ width: 200 }}
                  optionList={mockProcesses.map((p) => ({
                    value: p.process_id,
                    label: p.process_name,
                  }))}
                />
                <DepartmentSelect
                  placeholder={t('common.owningDepartment')}
                  value={queryParams.owning_department_name}
                  onChange={(v) => setQueryParams(prev => ({ ...prev, offset: 0, owning_department_name: v as string | undefined }))}
                  showClear
                  useNameAsValue
                  style={{ width: 200 }}
                />
              </Space>
            </Col>
            <Col>
              <Button
                icon={<Plus size={16} strokeWidth={2} />}
                theme="solid"
                type="primary"
                onClick={() => setCreateModalVisible(true)}
              >
                {t('template.actions.create')}
              </Button>
            </Col>
          </Row>
        </div>

        {/* Table area */}
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
              size="small"
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
                showTotal: true,
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

        {/* CreateTemplateModal */}
        <CreateTemplateModal
          visible={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          onSuccess={handleCreateSuccess}
        />

        {/* EditTemplateModal */}
        <EditTemplateModal
          visible={editModalVisible}
          template={editingTemplate}
          onCancel={() => {
            setEditModalVisible(false);
            setEditingTemplate(null);
          }}
          onSuccess={handleEditSuccess}
        />

        {/* TemplateDetails drawer */}
        <TemplateDetailDrawer
          visible={drawerVisible}
          template={selectedTemplate}
          onClose={handleCloseDrawer}
          onUse={handleUseTemplate}
          onEdit={handleEditFromDrawer}
          onDelete={handleDeleteFromDrawer}
          dataSource={list}
          onSelectTemplate={setSelectedTemplate}
          pagination={{
            currentPage,
            pageSize,
            total,
            totalPages,
          }}
          onPageChange={handlePageChangeForDrawer}
          initialTab={detailInitialTab}
        />

        {renderCollaboratorPanel('TASK_TEMPLATE', 'scheduling')}
      </div>
  );
};

export default TemplateManagementPage;
