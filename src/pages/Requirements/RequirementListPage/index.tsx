import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Button,
  Table,
  Tag,
  Input,
  Row,
  Col,
  Space,
  Dropdown,
  Toast,
  Modal,
  Tooltip,
} from '@douyinfe/semi-ui';
import {
  IconSearchStroked,
  IconPlusStroked,
  IconMoreStroked,
  IconDeleteStroked,
} from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
import type { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import EmptyState from '@/components/EmptyState';
import FilterPopover from '@/components/FilterPopover';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import RequirementFormModal from '../components/RequirementFormModal';
import RequirementDetailDrawer from '../components/RequirementDetailDrawer';
import RequirementStatusTag from '../components/RequirementStatusTag';
import RequirementBatchImportModal from '../components/RequirementBatchImportModal';
import type {
  LYRequirementResponse,
  LYListResponseLYRequirementResponse,
  GetRequirementsParams,
  RequirementPriority,
  ApprovalStatus,
  DevelopmentStatus,
  OperationStatus,
} from '@/api';

import './index.less';

const { Title, Text } = Typography;

// ==================== Mock Data Generator ====================

const generateMockRequirement = (index: number): LYRequirementResponse => {
  const titles = [
    'Monthly Financial Report Automation',
    'Customer Data Cleansing Pipeline',
    'Order Processing Workflow Optimization',
    'Employee Onboarding Automation',
    'Invoice Matching and Reconciliation',
    'Inventory Stock Check Automation',
    'Supplier Payment Processing',
    'Sales Lead Qualification Bot',
    'Contract Renewal Notification System',
    'Compliance Audit Report Generator',
    'HR Leave Request Processing',
    'Procurement Approval Workflow',
    'Customer Feedback Analysis Pipeline',
    'Vendor Registration Automation',
    'Daily Revenue Reconciliation',
    'IT Helpdesk Ticket Routing',
    'Warehouse Dispatch Notification',
    'Quality Inspection Reporting',
    'Budget Approval Workflow',
    'Marketing Campaign Data Sync',
  ];

  const descriptions = [
    'Automate the generation and distribution of monthly financial reports to department heads.',
    'Build a pipeline to cleanse and validate customer data from multiple data sources.',
    'Optimize the order processing workflow to reduce manual intervention and errors.',
    'Streamline the employee onboarding process with automated document collection.',
    'Automate invoice matching against purchase orders and flag discrepancies.',
    'Implement automated inventory checks across all warehouse locations.',
    'Process supplier payments with automated validation and approval routing.',
    'Qualify sales leads automatically using predefined scoring criteria.',
    'Send automated renewal notifications 90 days before contract expiration.',
    'Generate compliance audit reports from multiple system data sources.',
  ];

  const departments = ['Finance', 'IT', 'Operations', 'HR', 'Sales', 'Procurement', 'Marketing', 'Legal'];
  const owners = [
    { id: 'user-001', name: 'John Smith', department: 'Finance', role: 'Senior Analyst', email: 'john.smith@example.com' },
    { id: 'user-002', name: 'Sarah Chen', department: 'IT', role: 'Project Manager', email: 'sarah.chen@example.com' },
    { id: 'user-003', name: 'Mike Johnson', department: 'Operations', role: 'Process Engineer', email: 'mike.johnson@example.com' },
    { id: 'user-004', name: 'Emily Davis', department: 'HR', role: 'HR Specialist', email: 'emily.davis@example.com' },
    { id: 'user-005', name: 'David Wilson', department: 'Sales', role: 'Sales Director', email: 'david.wilson@example.com' },
  ];

  const priorities: RequirementPriority[] = ['HIGH', 'MEDIUM', 'LOW'];
  const approvalStatuses: ApprovalStatus[] = ['DRAFT', 'BUSINESS_PENDING', 'BUSINESS_APPROVED', 'BUSINESS_REJECTED', 'TECH_PENDING', 'TECH_APPROVED', 'TECH_REJECTED'];
  const devStatuses: DevelopmentStatus[] = ['NOT_STARTED', 'ASSESSING', 'IN_DEVELOPMENT', 'DEVELOPED'];
  const opStatuses: OperationStatus[] = ['NOT_LIVE', 'RUNNING', 'SUSPENDED', 'ARCHIVED'];

  const classificationKeys = ['Business Domain', 'Automation Type', 'Complexity Level'];
  const classificationValues: Record<string, string[]> = {
    'Business Domain': ['Finance', 'Supply Chain', 'Manufacturing', 'HR', 'CRM'],
    'Automation Type': ['RPA', 'IDP', 'Chatbot', 'API Integration'],
    'Complexity Level': ['Simple', 'Moderate', 'Complex'],
  };

  // Generate 1-3 random classifications
  const classCount = (index % 3) + 1;
  const classifications = Array.from({ length: classCount }, (_, ci) => {
    const key = classificationKeys[(index + ci) % classificationKeys.length];
    const values = classificationValues[key];
    return {
      classification_key: key,
      classification_value: values[(index + ci) % values.length],
      assigned_at: new Date(Date.now() - (index + ci) * 86400000).toISOString(),
    };
  });

  const owner = owners[index % owners.length];
  const date = new Date();
  date.setDate(date.getDate() - index * 2);

  return {
    id: `REQ-${String(index + 1).padStart(4, '0')}`,
    title: titles[index % titles.length],
    description: descriptions[index % descriptions.length],
    business_background: `This requirement addresses the need for improved efficiency in the ${departments[index % departments.length]} department.`,
    department_id: `dept-${(index % departments.length) + 1}`,
    department_name: departments[index % departments.length],
    contact_name: owner.name,
    contact_email: owner.email,
    expected_online_date: new Date(Date.now() + (30 + index * 7) * 86400000).toISOString().slice(0, 10),
    priority: priorities[index % priorities.length],
    approval_status: approvalStatuses[index % approvalStatuses.length],
    development_status: devStatuses[index % devStatuses.length],
    operation_status: opStatuses[index % opStatuses.length],
    classifications,
    creator_id: owner.id,
    creator_name: owner.name,
    creator_department: owner.department,
    creator_role: owner.role,
    creator_email: owner.email,
    created_at: date.toISOString(),
    updated_at: new Date(date.getTime() + 86400000).toISOString(),
  };
};

const generateMockListResponse = (
  params: GetRequirementsParams
): LYListResponseLYRequirementResponse => {
  const allData = Array.from({ length: 45 }, (_, i) => generateMockRequirement(i));

  let filtered = allData;

  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword) ||
        (item.description || '').toLowerCase().includes(keyword)
    );
  }

  if (params.approval_status) {
    filtered = filtered.filter((item) => item.approval_status === params.approval_status);
  }

  if (params.priority) {
    filtered = filtered.filter((item) => item.priority === params.priority);
  }

  if (params.department_id) {
    filtered = filtered.filter((item) => item.department_id === params.department_id);
  }

  const offset = params.offset || 0;
  const size = params.size || 20;
  const paginated = filtered.slice(offset, offset + size);

  return {
    range: { offset, size, total: filtered.length },
    list: paginated,
  };
};

// ==================== Component ====================

interface RequirementListPageProps {
  defaultApprovalFilter?: ApprovalStatus;
}

const RequirementListPage: React.FC<RequirementListPageProps> = ({ defaultApprovalFilter }) => {
  const { t } = useTranslation();

  const [listResponse, setListResponse] = useState<LYListResponseLYRequirementResponse>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });
  const [loading, setLoading] = useState(false);
  const [queryParams, setQueryParams] = useState<GetRequirementsParams>({
    offset: 0,
    size: 20,
    keyword: '',
  });

  // Filter state
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    approval_status: ApprovalStatus[];
    priority: RequirementPriority[];
    department: string[];
  }>({
    approval_status: defaultApprovalFilter ? [defaultApprovalFilter] : [],
    priority: [],
    department: [],
  });

  // Form modal
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<LYRequirementResponse | null>(null);

  // Selected row & detail drawer
  const [selectedRequirement, setSelectedRequirement] = useState<LYRequirementResponse | null>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const selectedRequirementId = selectedRequirement?.id || null;

  // Batch import modal
  const [batchImportVisible, setBatchImportVisible] = useState(false);

  const { range, list } = listResponse;
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  const filterCount = activeFilters.approval_status.length + activeFilters.priority.length + activeFilters.department.length;

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const response = generateMockListResponse({
        ...queryParams,
        approval_status: activeFilters.approval_status.length === 1 ? activeFilters.approval_status[0] : undefined,
        priority: activeFilters.priority.length === 1 ? activeFilters.priority[0] : undefined,
        department_id: activeFilters.department.length === 1 ? activeFilters.department[0] : undefined,
      });
      setListResponse(response);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [queryParams, activeFilters]);

  // Search debounce
  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams((prev) => ({ ...prev, offset: 0, keyword: value }));
      }, 500),
    []
  );

  // Filter confirm
  const handleFilterConfirm = (values: Record<string, unknown>) => {
    setActiveFilters({
      approval_status: (values.approval_status as ApprovalStatus[]) || [],
      priority: (values.priority as RequirementPriority[]) || [],
      department: (values.department as string[]) || [],
    });
    setQueryParams((prev) => ({ ...prev, offset: 0 }));
  };

  // Row click
  const handleRowClick = (record: LYRequirementResponse) => {
    setSelectedRequirement(record);
    setDetailDrawerVisible(true);
  };

  // Delete
  const handleDelete = (record: LYRequirementResponse) => {
    Modal.confirm({
      title: t('requirement.list.deleteConfirmTitle'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: (
        <>
          <div>{t('requirement.list.deleteConfirmContent', { title: record.title })}</div>
          <div style={{ color: 'var(--semi-color-text-2)', marginTop: 8 }}>
            {t('requirement.list.deleteWarning')}
          </div>
        </>
      ),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        Toast.success(t('requirement.list.deleteSuccess'));
        loadData();
      },
    });
  };

  // Priority config
  const priorityConfig: Record<RequirementPriority, { color: 'red' | 'orange' | 'grey'; i18nKey: string }> = {
    HIGH: { color: 'red', i18nKey: 'requirement.priority.HIGH' },
    MEDIUM: { color: 'orange', i18nKey: 'requirement.priority.MEDIUM' },
    LOW: { color: 'grey', i18nKey: 'requirement.priority.LOW' },
  };

  const approvalStatusConfig: Record<ApprovalStatus, { color: 'grey' | 'orange' | 'green' | 'red'; i18nKey: string }> = {
    DRAFT: { color: 'grey', i18nKey: 'requirement.approvalStatus.DRAFT' },
    PENDING: { color: 'orange', i18nKey: 'requirement.approvalStatus.PENDING' },
    APPROVED: { color: 'green', i18nKey: 'requirement.approvalStatus.APPROVED' },
    REJECTED: { color: 'red', i18nKey: 'requirement.approvalStatus.REJECTED' },
  };

  const devStatusConfig: Record<DevelopmentStatus, { color: 'grey' | 'blue' | 'cyan' | 'green'; i18nKey: string }> = {
    NOT_STARTED: { color: 'grey', i18nKey: 'requirement.devStatus.NOT_STARTED' },
    ASSESSING: { color: 'blue', i18nKey: 'requirement.devStatus.ASSESSING' },
    IN_DEVELOPMENT: { color: 'cyan', i18nKey: 'requirement.devStatus.IN_DEVELOPMENT' },
    DEVELOPED: { color: 'green', i18nKey: 'requirement.devStatus.DEVELOPED' },
  };

  const columns: ColumnProps<LYRequirementResponse>[] = [
    {
      title: t('requirement.list.columns.title'),
      dataIndex: 'title',
      width: 240,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: t('requirement.list.columns.department'),
      dataIndex: 'department_name',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: t('requirement.list.columns.classifications'),
      dataIndex: 'classifications',
      width: 180,
      render: (_: unknown, record: LYRequirementResponse) => {
        const items = record.classifications || [];
        if (items.length === 0) return '-';
        const shown = items.slice(0, 2);
        const rest = items.length - 2;
        return (
          <Space spacing={4} wrap={false}>
            {shown.map((c, i) => (
              <Tag key={i} color="blue" size="small">{c.classification_value}</Tag>
            ))}
            {rest > 0 && (
              <Tooltip content={items.slice(2).map(c => c.classification_value).join(', ')}>
                <Tag size="small" color="blue">+{rest}</Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: t('requirement.list.columns.approvalStatus'),
      dataIndex: 'approval_status',
      width: 100,
      render: (status: ApprovalStatus) => {
        const config = approvalStatusConfig[status];
        return config ? <Tag color={config.color}>{t(config.i18nKey)}</Tag> : '-';
      },
    },
    {
      title: t('requirement.list.columns.devStatus'),
      dataIndex: 'development_status',
      width: 100,
      render: (status: DevelopmentStatus) => {
        const config = devStatusConfig[status];
        return config ? <Tag color={config.color}>{t(config.i18nKey)}</Tag> : '-';
      },
    },
    {
      title: t('requirement.list.columns.priority'),
      dataIndex: 'priority',
      width: 80,
      render: (priority: RequirementPriority) => {
        const config = priorityConfig[priority];
        return config ? <Tag color={config.color}>{t(config.i18nKey)}</Tag> : '-';
      },
    },
    {
      title: t('common.creator'),
      dataIndex: 'creator_name',
      width: 120,
      ellipsis: true,
      render: (_text: string, record: LYRequirementResponse) => {
        if (!record.creator_name) return '-';
        return (
          <UserNameWithCard
            name={record.creator_name}
            userId={record.creator_id}
            department={record.creator_department}
            role={record.creator_role}
            email={record.creator_email}
          />
        );
      },
    },
    {
      title: t('common.updateTime'),
      dataIndex: 'updated_at',
      width: 160,
      render: (time: string) => {
        if (!time) return '-';
        return new Date(time).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    {
      title: t('common.actions'),
      dataIndex: 'actions',
      width: 60,
      render: (_: unknown, record: LYRequirementResponse) => (
        <Dropdown
          trigger="click"
          clickToHide
          position="bottomRight"
          render={
            <Dropdown.Menu>
              <Dropdown.Item onClick={(e) => { e.stopPropagation(); handleRowClick(record); }}>
                {t('common.viewDetail')}
              </Dropdown.Item>
              <Dropdown.Item onClick={(e) => {
                e.stopPropagation();
                setEditingRequirement(record);
                setFormModalVisible(true);
              }}>
                {t('common.edit')}
              </Dropdown.Item>
              <Dropdown.Item type="danger" onClick={(e) => { e.stopPropagation(); handleDelete(record); }}>
                {t('common.delete')}
              </Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Button
            icon={<IconMoreStroked />}
            theme="borderless"
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  // Filter options
  const approvalOptions = Object.entries(approvalStatusConfig).map(([value, config]) => ({
    value,
    label: t(config.i18nKey),
  }));

  const priorityOptions = Object.entries(priorityConfig).map(([value, config]) => ({
    value,
    label: t(config.i18nKey),
  }));

  const departmentOptions = useMemo(() => {
    return ['Finance', 'IT', 'Operations', 'HR', 'Sales', 'Procurement', 'Marketing', 'Legal'].map((name, i) => ({
      value: `dept-${i + 1}`,
      label: name,
    }));
  }, []);

  return (
    <div className="requirement-list-page">
      {/* Header */}
      <div className="requirement-list-page-header">
        <div className="requirement-list-page-header-title">
          <Title heading={3} className="title">{t('requirement.list.title')}</Title>
          <Text type="tertiary">{t('requirement.list.description')}</Text>
        </div>

        {/* Toolbar */}
        <Row
          type="flex"
          justify="space-between"
          align="middle"
          className="requirement-list-page-header-toolbar"
        >
          <Col>
            <Space>
              <Input
                prefix={<IconSearchStroked />}
                placeholder={t('requirement.list.searchPlaceholder')}
                onChange={handleSearch}
                showClear
                className="requirement-list-page-search-input"
              />
              <FilterPopover
                visible={filterVisible}
                onVisibleChange={setFilterVisible}
                onConfirm={handleFilterConfirm}
                sections={[
                  {
                    key: 'approval_status',
                    label: t('requirement.list.columns.approvalStatus'),
                    type: 'checkbox',
                    value: activeFilters.approval_status,
                    options: approvalOptions,
                  },
                  {
                    key: 'priority',
                    label: t('requirement.list.columns.priority'),
                    type: 'checkbox',
                    value: activeFilters.priority,
                    options: priorityOptions,
                  },
                  {
                    key: 'department',
                    label: t('requirement.list.columns.department'),
                    type: 'checkbox',
                    value: activeFilters.department,
                    options: departmentOptions,
                  },
                ]}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                theme="light"
                onClick={() => setBatchImportVisible(true)}
              >
                {t('common.import')}
              </Button>
              <Button
                icon={<IconPlusStroked />}
                theme="solid"
                type="primary"
                onClick={() => {
                  setEditingRequirement(null);
                  setFormModalVisible(true);
                }}
              >
                {t('requirement.list.newRequirement')}
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Table */}
      <div className="requirement-list-page-table">
        <Table
          size="small"
          dataSource={list}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ y: 'calc(100vh - 320px)' }}
          empty={
            <EmptyState
              variant={queryParams.keyword || filterCount > 0 ? 'noResult' : 'noData'}
              description={
                queryParams.keyword || filterCount > 0
                  ? t('common.noResult')
                  : t('requirement.list.noData')
              }
            />
          }
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
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
            className: selectedRequirementId === record?.id ? 'requirement-list-page-row-selected' : '',
          })}
        />
      </div>

      {/* Form Modal */}
      <RequirementFormModal
        visible={formModalVisible}
        onCancel={() => {
          setFormModalVisible(false);
          setEditingRequirement(null);
        }}
        requirementData={editingRequirement}
        onSuccess={() => {
          setFormModalVisible(false);
          setEditingRequirement(null);
          loadData();
        }}
      />

      {/* Detail Drawer */}
      <RequirementDetailDrawer
        visible={detailDrawerVisible}
        requirement={selectedRequirement}
        requirementList={list}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedRequirement(null);
        }}
        onNavigate={(item) => setSelectedRequirement(item)}
        onDataChange={loadData}
      />

      {/* Batch Import Modal */}
      <RequirementBatchImportModal
        visible={batchImportVisible}
        onCancel={() => setBatchImportVisible(false)}
        onSuccess={() => {
          setBatchImportVisible(false);
          loadData();
        }}
      />
    </div>
  );
};

export default RequirementListPage;
