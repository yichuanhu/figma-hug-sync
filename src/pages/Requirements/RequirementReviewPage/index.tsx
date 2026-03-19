import React, { useState, useMemo, useCallback } from 'react';
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
  Modal,
  Form,
  Banner,
} from '@douyinfe/semi-ui';
import { IconSearchStroked, IconTickCircle, IconClose } from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
import type { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import EmptyState from '@/components/EmptyState';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import RequirementDetailDrawer from '../components/RequirementDetailDrawer';
import RequirementStatusTag from '../components/RequirementStatusTag';
import type {
  LYRequirementResponse,
  ApprovalStatus,
  ApprovalPermissions,
  RequirementPriority,
} from '@/api';

import './index.less';

const { Title, Text } = Typography;

// Mock current user permissions - in real app this would come from auth context
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
  const [allData, setAllData] = useState(() => Array.from({ length: 30 }, (_, i) => generateMockRequirement(i)));

  // Detail drawer
  const [selectedRequirement, setSelectedRequirement] = useState<LYRequirementResponse | null>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const selectedRequirementId = selectedRequirement?.id || null;

  // Inline reject modal
  const [inlineRejectTarget, setInlineRejectTarget] = useState<LYRequirementResponse | null>(null);
  // Inline tech approve modal
  const [inlineTechApproveTarget, setInlineTechApproveTarget] = useState<LYRequirementResponse | null>(null);

  // ==================== Statistics ====================
  const stats = useMemo(() => {
    let pendingCount = 0;
    let approvedThisWeek = 0;
    let totalWaitHours = 0;
    let pendingItems = 0;

    const now = Date.now();
    const weekAgo = now - 7 * 86400000;

    allData.forEach((item) => {
      // Pending count
      if (approvalPermissions.canBusinessApprove && item.approval_status === 'BUSINESS_PENDING') pendingCount++;
      if (approvalPermissions.canTechApprove && item.approval_status === 'TECH_PENDING') pendingCount++;

      // Approved this week
      const lastRecord = item.approval_records?.[item.approval_records.length - 1];
      if (lastRecord && (lastRecord.action === 'APPROVE' || lastRecord.action === 'REJECT')) {
        const opTime = new Date(lastRecord.operated_at).getTime();
        if (opTime >= weekAgo) approvedThisWeek++;
      }

      // Average wait time for pending items
      if (item.approval_status === 'BUSINESS_PENDING' || item.approval_status === 'TECH_PENDING') {
        if (lastRecord) {
          totalWaitHours += (now - new Date(lastRecord.operated_at).getTime()) / 3600000;
          pendingItems++;
        }
      }
    });

    const avgWaitHours = pendingItems > 0 ? Math.round(totalWaitHours / pendingItems) : 0;
    const avgWaitDisplay = avgWaitHours < 24 ? `${avgWaitHours}h` : `${Math.round(avgWaitHours / 24)}d`;

    return { pendingCount, approvedThisWeek, avgWaitDisplay };
  }, [allData, approvalPermissions]);

  // ==================== Inline Quick Actions ====================
  const handleInlineBusinessApprove = useCallback((record: LYRequirementResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    Modal.confirm({
      title: t('requirement.approval.businessApproveTitle'),
      icon: <IconTickCircle style={{ color: 'var(--semi-color-success)' }} />,
      content: t('requirement.approval.businessApproveContent', { title: record.title }),
      okText: t('requirement.approval.approve'),
      cancelText: t('common.cancel'),
      centered: true,
      maskClosable: false,
      onOk: async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
        Toast.success(t('requirement.approval.businessApproveSuccess'));
      },
    });
  }, [t]);

  const handleInlineTechApproveOpen = useCallback((record: LYRequirementResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    setInlineTechApproveTarget(record);
  }, []);

  const handleInlineTechApproveSubmit = useCallback(async (values: Record<string, unknown>) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    Toast.success(t('requirement.approval.techApproveSuccess'));
    setInlineTechApproveTarget(null);
  }, [t]);

  const handleInlineRejectOpen = useCallback((record: LYRequirementResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    setInlineRejectTarget(record);
  }, []);

  const handleInlineRejectSubmit = useCallback(async (values: { comment: string }) => {
    const stage = inlineRejectTarget?.approval_status === 'BUSINESS_PENDING' ? 'business' : 'tech';
    await new Promise((resolve) => setTimeout(resolve, 400));
    Toast.success(t(`requirement.approval.${stage}RejectSuccess`));
    setInlineRejectTarget(null);
  }, [t, inlineRejectTarget]);

  // ==================== Filters ====================
  const filteredData = useMemo(() => {
    let data = allData;

    if (keyword) {
      const kw = keyword.toLowerCase();
      data = data.filter(
        (item) => item.title.toLowerCase().includes(kw) || item.id.toLowerCase().includes(kw)
      );
    }

    if (activeTab === 'pending') {
      data = data.filter((item) => {
        if (approvalPermissions.canBusinessApprove && item.approval_status === 'BUSINESS_PENDING') return true;
        if (approvalPermissions.canTechApprove && item.approval_status === 'TECH_PENDING') return true;
        return false;
      });
    } else if (activeTab === 'approved') {
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

  const getWaitingTime = (record: LYRequirementResponse): string => {
    const lastRecord = record.approval_records?.[record.approval_records.length - 1];
    if (!lastRecord) return '-';
    const diffMs = Date.now() - new Date(lastRecord.operated_at).getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  const isOvertime = (record: LYRequirementResponse): boolean => {
    if (record.approval_status !== 'BUSINESS_PENDING' && record.approval_status !== 'TECH_PENDING') return false;
    const lastRecord = record.approval_records?.[record.approval_records.length - 1];
    if (!lastRecord) return false;
    return (Date.now() - new Date(lastRecord.operated_at).getTime()) > 48 * 3600000;
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

  const columns: ColumnProps<LYRequirementResponse>[] = useMemo(() => {
    const cols: ColumnProps<LYRequirementResponse>[] = [
      {
        title: t('requirement.list.columns.title'),
        dataIndex: 'title',
        width: 220,
        ellipsis: true,
      },
      {
        title: t('requirement.list.columns.department'),
        dataIndex: 'department_name',
        width: 100,
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
        render: (status: ApprovalStatus, record: LYRequirementResponse) => {
          const overtime = isOvertime(record);
          if (status === 'BUSINESS_PENDING') return (
            <Space spacing={4}>
              <Tag color="orange">{t('requirement.approvalFlow.businessApproval')}</Tag>
              {overtime && <Tag color="red" size="small">{t('requirement.review.overtime')}</Tag>}
            </Space>
          );
          if (status === 'TECH_PENDING') return (
            <Space spacing={4}>
              <Tag color="orange">{t('requirement.approvalFlow.techApproval')}</Tag>
              {overtime && <Tag color="red" size="small">{t('requirement.review.overtime')}</Tag>}
            </Space>
          );
          return '-';
        },
      },
      {
        title: t('requirement.review.waitingTime'),
        dataIndex: 'id',
        width: 80,
        render: (_: unknown, record: LYRequirementResponse) => {
          const wt = getWaitingTime(record);
          const overtime = isOvertime(record);
          return <Text type={overtime ? 'danger' : undefined}>{wt}</Text>;
        },
      },
      {
        title: t('common.creator'),
        dataIndex: 'creator_name',
        width: 130,
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
        width: 150,
        ellipsis: true,
        render: (time: string) => {
          if (!time) return '-';
          return new Date(time).toLocaleString('zh-CN', {
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
          });
        },
      },
    ];

    // Add quick actions column only for "pending" tab
    if (activeTab === 'pending') {
      cols.push({
        title: t('requirement.review.quickAction'),
        dataIndex: 'id',
        width: 160,
        fixed: 'right',
        render: (_: unknown, record: LYRequirementResponse) => {
          const isBusiness = record.approval_status === 'BUSINESS_PENDING';
          const isTech = record.approval_status === 'TECH_PENDING';

          if (isBusiness && approvalPermissions.canBusinessApprove) {
            return (
              <Space spacing={4}>
                <Button
                  size="small"
                  theme="solid"
                  type="primary"
                  onClick={(e) => handleInlineBusinessApprove(record, e)}
                >
                  {t('requirement.approval.approve')}
                </Button>
                <Button
                  size="small"
                  theme="solid"
                  type="danger"
                  onClick={(e) => handleInlineRejectOpen(record, e)}
                >
                  {t('requirement.approval.reject')}
                </Button>
              </Space>
            );
          }

          if (isTech && approvalPermissions.canTechApprove) {
            return (
              <Space spacing={4}>
                <Button
                  size="small"
                  theme="solid"
                  type="primary"
                  onClick={(e) => handleInlineTechApproveOpen(record, e)}
                >
                  {t('requirement.approval.approve')}
                </Button>
                <Button
                  size="small"
                  theme="solid"
                  type="danger"
                  onClick={(e) => handleInlineRejectOpen(record, e)}
                >
                  {t('requirement.approval.reject')}
                </Button>
              </Space>
            );
          }

          return '-';
        },
      });
    }

    return cols;
  }, [t, activeTab, approvalPermissions, handleInlineBusinessApprove, handleInlineTechApproveOpen, handleInlineRejectOpen]);

  const pendingCount = stats.pendingCount;

  const rejectStageLabel = inlineRejectTarget?.approval_status === 'BUSINESS_PENDING'
    ? t('requirement.approvalFlow.businessApproval')
    : t('requirement.approvalFlow.techApproval');

  return (
    <div className="requirement-review-page">
      <div className="requirement-review-page-header">
        <div className="requirement-review-page-header-title">
          <Title heading={3} className="title">{t('requirement.review.title')}</Title>
          <Text type="tertiary">{t('requirement.review.description')}</Text>
        </div>

        {/* Statistics Cards */}
        <div className="requirement-review-page-stats">
          <div className="requirement-review-page-stat-card stat-pending">
            <div className="stat-value">{stats.pendingCount}</div>
            <div className="stat-label">{t('requirement.review.statPending')}</div>
          </div>
          <div className="requirement-review-page-stat-card stat-approved">
            <div className="stat-value">{stats.approvedThisWeek}</div>
            <div className="stat-label">{t('requirement.review.statApprovedWeek')}</div>
          </div>
          <div className="requirement-review-page-stat-card stat-avg-time">
            <div className="stat-value">{stats.avgWaitDisplay}</div>
            <div className="stat-label">{t('requirement.review.statAvgWait')}</div>
          </div>
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
          scroll={{ y: 'calc(100vh - 440px)' }}
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

      {/* Inline Reject Modal */}
      <Modal
        title={t('requirement.approval.rejectTitle') + ' - ' + rejectStageLabel}
        visible={!!inlineRejectTarget}
        onCancel={() => setInlineRejectTarget(null)}
        footer={null}
        width={520}
        closeOnEsc
        centered
        maskClosable={false}
      >
        <Form onSubmit={handleInlineRejectSubmit} labelPosition="top">
          <Form.TextArea
            field="comment"
            label={t('requirement.approval.rejectReason')}
            placeholder={t('requirement.approval.rejectReasonPlaceholder')}
            autosize={{ minRows: 3, maxRows: 6 }}
            maxCount={2000}
            showClear
            rules={[
              { required: true, message: t('requirement.approval.rejectReasonRequired') },
            ]}
          />
          <div className="requirement-review-page-modal-footer">
            <Button theme="light" onClick={() => setInlineRejectTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button htmlType="submit" theme="solid" type="danger">
              {t('requirement.approval.confirmReject')}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Inline Tech Approve Modal */}
      <Modal
        title={t('requirement.approval.techApproveModalTitle')}
        visible={!!inlineTechApproveTarget}
        onCancel={() => setInlineTechApproveTarget(null)}
        footer={null}
        width={620}
        closeOnEsc
        centered
        maskClosable={false}
      >
        <Form onSubmit={handleInlineTechApproveSubmit} labelPosition="top">
          <Banner
            type="info"
            description={t('requirement.approval.techApproveHint')}
            style={{ marginBottom: 16 }}
          />
          <Form.Slot label={t('requirement.assessment.businessValue')}>
            <Form.Rating field="business_value" count={5} rules={[{ required: true, message: t('requirement.approval.ratingRequired') }]} noLabel />
          </Form.Slot>
          <Form.Slot label={t('requirement.assessment.technicalComplexity')}>
            <Form.Rating field="technical_complexity" count={5} rules={[{ required: true, message: t('requirement.approval.ratingRequired') }]} noLabel />
          </Form.Slot>
          <Form.Slot label={t('requirement.assessment.automationFeasibility')}>
            <Form.Rating field="automation_feasibility" count={5} rules={[{ required: true, message: t('requirement.approval.ratingRequired') }]} noLabel />
          </Form.Slot>
          <Form.Select
            field="conclusion"
            label={t('requirement.approval.techConclusion')}
            placeholder={t('requirement.approval.techConclusionPlaceholder')}
            rules={[{ required: true, message: t('requirement.approval.conclusionRequired') }]}
            style={{ width: '100%' }}
          >
            <Form.Select.Option value="RECOMMENDED">{t('requirement.assessment.conclusion.RECOMMENDED')}</Form.Select.Option>
            <Form.Select.Option value="CONDITIONAL">{t('requirement.assessment.conclusion.CONDITIONAL')}</Form.Select.Option>
            <Form.Select.Option value="NOT_RECOMMENDED">{t('requirement.assessment.conclusion.NOT_RECOMMENDED')}</Form.Select.Option>
          </Form.Select>
          <Form.TextArea
            field="comment"
            label={t('requirement.approval.techComment')}
            placeholder={t('requirement.approval.techCommentPlaceholder')}
            autosize={{ minRows: 3, maxRows: 6 }}
            maxCount={2000}
            showClear
          />
          <div className="requirement-review-page-modal-footer">
            <Button theme="light" onClick={() => setInlineTechApproveTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button htmlType="submit" theme="solid" type="primary">
              {t('requirement.approval.confirmTechApprove')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default RequirementReviewPage;
