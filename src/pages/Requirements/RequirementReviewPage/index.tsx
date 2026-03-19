import React, { useState, useMemo } from 'react';
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
  Tabs,
  TabPane,
  Toast,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
import type { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import EmptyState from '@/components/EmptyState';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import RequirementDetailDrawer from '../components/RequirementDetailDrawer';
import RequirementStatusTag from '../components/RequirementStatusTag';
import type {
  LYRequirementResponse,
  LYListResponseLYRequirementResponse,
  ApprovalStatus,
  ApprovalPermissions,
  RequirementPriority,
} from '@/api';

import './index.less';

const { Title, Text } = Typography;

// Mock current user permissions - in real app this would come from auth context
// This user has both business and tech approval permissions
const MOCK_PERMISSIONS: ApprovalPermissions = {
  canBusinessApprove: true,
  canTechApprove: true,
};

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
  // For review page, only show pending statuses predominantly
  const approvalStatuses: ApprovalStatus[] = [
    'BUSINESS_PENDING', 'BUSINESS_PENDING', 'TECH_PENDING', 'TECH_PENDING',
    'BUSINESS_APPROVED', 'TECH_APPROVED', 'BUSINESS_REJECTED', 'TECH_REJECTED',
  ];

  const owner = owners[index % owners.length];
  const date = new Date();
  date.setDate(date.getDate() - index * 2);
  const approvalStatus = approvalStatuses[index % approvalStatuses.length];

  const businessAdmins = [
    { id: 'admin-001', name: 'Robert Taylor', dept: 'Business Operations', role: 'Business Manager', email: 'robert.taylor@example.com' },
    { id: 'admin-002', name: 'Jennifer Lee', dept: 'Strategy', role: 'VP of Strategy', email: 'jennifer.lee@example.com' },
  ];
  const devAdmins = [
    { id: 'dev-001', name: 'Alex Thompson', dept: 'Engineering', role: 'Tech Lead', email: 'alex.thompson@example.com' },
    { id: 'dev-002', name: 'Chris Wang', dept: 'Engineering', role: 'Architect', email: 'chris.wang@example.com' },
  ];
  const ba = businessAdmins[index % 2];
  const da = devAdmins[index % 2];

  const records: import('@/api').LYApprovalRecord[] = [];
  const submittedAt = new Date(date.getTime() - 86400000 * 3).toISOString();
  const businessAt = new Date(date.getTime() - 86400000 * 2).toISOString();
  const techAt = new Date(date.getTime() - 86400000).toISOString();

  if (approvalStatus !== 'DRAFT') {
    records.push({
      id: `ar-r-${index}-1`, stage: 'BUSINESS', action: 'SUBMIT',
      operator_id: owner.id, operator_name: owner.name, operator_department: owner.department,
      operator_role: owner.role, operator_email: owner.email, operated_at: submittedAt,
    });
  }
  if (['BUSINESS_APPROVED', 'TECH_PENDING', 'TECH_APPROVED', 'TECH_REJECTED'].includes(approvalStatus)) {
    records.push({
      id: `ar-r-${index}-2`, stage: 'BUSINESS', action: 'APPROVE',
      operator_id: ba.id, operator_name: ba.name, operator_department: ba.dept,
      operator_role: ba.role, operator_email: ba.email, comment: 'Business value confirmed.',
      operated_at: businessAt,
    });
  }
  if (approvalStatus === 'BUSINESS_REJECTED') {
    records.push({
      id: `ar-r-${index}-2`, stage: 'BUSINESS', action: 'REJECT',
      operator_id: ba.id, operator_name: ba.name, operator_department: ba.dept,
      operator_role: ba.role, operator_email: ba.email, comment: 'Insufficient justification.',
      operated_at: businessAt,
    });
  }
  if (approvalStatus === 'TECH_APPROVED') {
    records.push({
      id: `ar-r-${index}-3`, stage: 'TECH', action: 'APPROVE',
      operator_id: da.id, operator_name: da.name, operator_department: da.dept,
      operator_role: da.role, operator_email: da.email, comment: 'Technically feasible.',
      operated_at: techAt,
    });
  }
  if (approvalStatus === 'TECH_REJECTED') {
    records.push({
      id: `ar-r-${index}-3`, stage: 'TECH', action: 'REJECT',
      operator_id: da.id, operator_name: da.name, operator_department: da.dept,
      operator_role: da.role, operator_email: da.email, comment: 'Architecture not supported.',
      operated_at: techAt,
    });
  }

  return {
    id: `REQ-${String(index + 1).padStart(4, '0')}`,
    title: titles[index % titles.length],
    description: `Automate the ${titles[index % titles.length].toLowerCase()} process.`,
    department_id: `dept-${(index % departments.length) + 1}`,
    department_name: departments[index % departments.length],
    contact_name: owner.name,
    contact_email: owner.email,
    expected_online_date: new Date(Date.now() + (30 + index * 7) * 86400000).toISOString().slice(0, 10),
    priority: priorities[index % priorities.length],
    approval_status: approvalStatus,
    development_status: 'NOT_STARTED',
    operation_status: 'NOT_LIVE',
    classifications: [],
    approval_records: records,
    creator_id: owner.id,
    creator_name: owner.name,
    creator_department: owner.department,
    creator_role: owner.role,
    creator_email: owner.email,
    created_at: date.toISOString(),
    updated_at: new Date(date.getTime() + 86400000).toISOString(),
  };
};

// ==================== Component ====================

type ReviewTab = 'pending' | 'approved' | 'all';

const RequirementReviewPage: React.FC = () => {
  const { t } = useTranslation();

  const [approvalPermissions] = useState<ApprovalPermissions>(MOCK_PERMISSIONS);
  const [activeTab, setActiveTab] = useState<ReviewTab>('pending');
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [allData] = useState(() => Array.from({ length: 30 }, (_, i) => generateMockRequirement(i)));

  // Detail drawer
  const [selectedRequirement, setSelectedRequirement] = useState<LYRequirementResponse | null>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const selectedRequirementId = selectedRequirement?.id || null;

  // Filter data based on tab and permissions (merged list)
  const filteredData = useMemo(() => {
    let data = allData;

    // Apply keyword filter
    if (keyword) {
      const kw = keyword.toLowerCase();
      data = data.filter(
        (item) => item.title.toLowerCase().includes(kw) || item.id.toLowerCase().includes(kw)
      );
    }

    if (activeTab === 'pending') {
      // Merge both business and tech pending based on user's permissions
      data = data.filter((item) => {
        if (approvalPermissions.canBusinessApprove && item.approval_status === 'BUSINESS_PENDING') return true;
        if (approvalPermissions.canTechApprove && item.approval_status === 'TECH_PENDING') return true;
        return false;
      });
    } else if (activeTab === 'approved') {
      // Show all items this user has reviewed (both business and tech)
      data = data.filter((item) => {
        if (approvalPermissions.canBusinessApprove && ['BUSINESS_APPROVED', 'BUSINESS_REJECTED', 'TECH_PENDING', 'TECH_APPROVED', 'TECH_REJECTED'].includes(item.approval_status)) return true;
        if (approvalPermissions.canTechApprove && ['TECH_APPROVED', 'TECH_REJECTED'].includes(item.approval_status)) return true;
        return false;
      });
    }

    return data;
  }, [allData, activeTab, approvalPermissions, keyword]);

  const handleSearch = useMemo(
    () => debounce((value: string) => setKeyword(value), 500),
    []
  );

  const handleRowClick = (record: LYRequirementResponse) => {
    setSelectedRequirement(record);
    setDetailDrawerVisible(true);
  };

  // Calculate waiting time
  const getWaitingTime = (record: LYRequirementResponse): string => {
    const lastRecord = record.approval_records?.[record.approval_records.length - 1];
    if (!lastRecord) return '-';
    const diffMs = Date.now() - new Date(lastRecord.operated_at).getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  const approvalStatusConfig: Record<string, { color: string; i18nKey: string }> = {
    DRAFT: { color: 'grey', i18nKey: 'requirement.approvalStatus.DRAFT' },
    BUSINESS_PENDING: { color: 'orange', i18nKey: 'requirement.approvalStatus.BUSINESS_PENDING' },
    BUSINESS_APPROVED: { color: 'blue', i18nKey: 'requirement.approvalStatus.BUSINESS_APPROVED' },
    BUSINESS_REJECTED: { color: 'red', i18nKey: 'requirement.approvalStatus.BUSINESS_REJECTED' },
    TECH_PENDING: { color: 'orange', i18nKey: 'requirement.approvalStatus.TECH_PENDING' },
    TECH_APPROVED: { color: 'green', i18nKey: 'requirement.approvalStatus.TECH_APPROVED' },
    TECH_REJECTED: { color: 'red', i18nKey: 'requirement.approvalStatus.TECH_REJECTED' },
  };

  const columns: ColumnProps<LYRequirementResponse>[] = [
    {
      title: t('requirement.list.columns.title'),
      dataIndex: 'title',
      width: 260,
      ellipsis: true,
    },
    {
      title: t('requirement.list.columns.department'),
      dataIndex: 'department_name',
      width: 120,
    },
    {
      title: t('requirement.list.columns.priority'),
      dataIndex: 'priority',
      width: 80,
      render: (priority: RequirementPriority) => <RequirementStatusTag type="priority" value={priority} />,
    },
    {
      title: t('requirement.list.columns.approvalStatus'),
      dataIndex: 'approval_status',
      width: 120,
      render: (status: ApprovalStatus) => {
        const cfg = approvalStatusConfig[status];
        return cfg ? <Tag color={cfg.color as any}>{t(cfg.i18nKey)}</Tag> : '-';
      },
    },
    {
      title: t('requirement.review.currentStage'),
      dataIndex: 'approval_status',
      width: 120,
      render: (status: ApprovalStatus) => {
        if (status === 'BUSINESS_PENDING') return <Tag color="orange">{t('requirement.approvalFlow.businessApproval')}</Tag>;
        if (status === 'TECH_PENDING') return <Tag color="orange">{t('requirement.approvalFlow.techApproval')}</Tag>;
        return '-';
      },
    },
    {
      title: t('requirement.review.waitingTime'),
      dataIndex: 'id',
      width: 100,
      render: (_: unknown, record: LYRequirementResponse) => getWaitingTime(record),
    },
    {
      title: t('common.creator'),
      dataIndex: 'creator_name',
      width: 140,
      render: (_text: string, record: LYRequirementResponse) => (
        <UserNameWithCard
          name={record.creator_name}
          userId={record.creator_id}
          department={record.creator_department}
          role={record.creator_role}
          email={record.creator_email}
        />
      ),
    },
    {
      title: t('common.updateTime'),
      dataIndex: 'updated_at',
      width: 160,
      render: (time: string) => {
        if (!time) return '-';
        return new Date(time).toLocaleString('zh-CN', {
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
        });
      },
    },
  ];

  const pendingCount = useMemo(() => {
    let count = 0;
    if (approvalPermissions.canBusinessApprove) {
      count += allData.filter(r => r.approval_status === 'BUSINESS_PENDING').length;
    }
    if (approvalPermissions.canTechApprove) {
      count += allData.filter(r => r.approval_status === 'TECH_PENDING').length;
    }
    return count;
  }, [allData, approvalPermissions]);

  return (
    <div className="requirement-review-page">
      <div className="requirement-review-page-header">
        <div className="requirement-review-page-header-title">
          <Title heading={3} className="title">{t('requirement.review.title')}</Title>
          <Text type="tertiary">{t('requirement.review.description')}</Text>
        </div>

        {/* Search Bar */}
        <Row type="flex" justify="space-between" align="middle" className="requirement-review-page-toolbar">
          <Col>
            <Input
              prefix={<IconSearchStroked />}
              placeholder={t('requirement.list.searchPlaceholder')}
              onChange={handleSearch}
              showClear
              style={{ width: 320 }}
            />
          </Col>
        </Row>
      </div>

      {/* Tabs */}
      <Tabs
        type="line"
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as ReviewTab)}
        className="requirement-review-page-tabs"
      >
        <TabPane
          tab={
            <Space spacing={4}>
              <span>{t('requirement.review.pendingMe')}</span>
              {pendingCount > 0 && <Tag color="red" size="small" shape="circle">{pendingCount}</Tag>}
            </Space>
          }
          itemKey="pending"
        />
        <TabPane tab={t('requirement.review.approvedByMe')} itemKey="approved" />
        <TabPane tab={t('requirement.review.all')} itemKey="all" />
      </Tabs>

      {/* Table */}
      <div className="requirement-review-page-table">
        <Table
          size="small"
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ y: 'calc(100vh - 380px)' }}
          empty={
            <EmptyState
              variant={keyword ? 'noResult' : 'noData'}
              description={keyword ? t('common.noResult') : t('requirement.review.noPending')}
            />
          }
          pagination={{
            total: filteredData.length,
            pageSize: 20,
            showTotal: true,
          }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
            className: selectedRequirementId === record?.id ? 'requirement-review-page-row-selected' : '',
          })}
        />
      </div>

      {/* Detail Drawer */}
      <RequirementDetailDrawer
        visible={detailDrawerVisible}
        requirement={selectedRequirement}
        requirementList={filteredData}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedRequirement(null);
        }}
        onNavigate={(item) => setSelectedRequirement(item)}
        approvalPermissions={approvalPermissions}
      />
    </div>
  );
};

export default RequirementReviewPage;
