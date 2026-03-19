import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag/interface';
import type { RequirementItem, RequirementStatus, RequirementPriority, RequirementQueryParams, RequirementListResponse, ActivityRecord } from './types';

// ============= 状态/优先级配置 =============

export const statusConfig: Record<RequirementStatus, { color: TagColor; i18nKey: string }> = {
  DRAFT: { color: 'grey', i18nKey: 'requirements.status.draft' },
  PENDING: { color: 'orange', i18nKey: 'requirements.status.pending' },
  APPROVED: { color: 'green', i18nKey: 'requirements.status.approved' },
  REJECTED: { color: 'red', i18nKey: 'requirements.status.rejected' },
  ASSESSING: { color: 'purple', i18nKey: 'requirements.status.assessing' },
  DEVELOPING: { color: 'blue', i18nKey: 'requirements.status.developing' },
  DEVELOPED: { color: 'cyan', i18nKey: 'requirements.status.developed' },
  RUNNING: { color: 'green', i18nKey: 'requirements.status.running' },
  STOPPED: { color: 'orange', i18nKey: 'requirements.status.stopped' },
  ARCHIVED: { color: 'grey', i18nKey: 'requirements.status.archived' },
};

export const priorityConfig: Record<RequirementPriority, { color: TagColor; i18nKey: string }> = {
  HIGH: { color: 'red', i18nKey: 'requirements.priority.high' },
  MEDIUM: { color: 'orange', i18nKey: 'requirements.priority.medium' },
  LOW: { color: 'blue', i18nKey: 'requirements.priority.low' },
};

// ============= Mock 人员数据 =============

const mockCreators: Record<string, { name: string; department: string; role: string; email: string }> = {
  'user-001': { name: 'John Smith', department: 'Finance', role: 'Financial Analyst', email: 'john.smith@example.com' },
  'user-002': { name: 'Emily Chen', department: 'HR', role: 'HR Manager', email: 'emily.chen@example.com' },
  'user-003': { name: 'Michael Wang', department: 'IT', role: 'Senior Engineer', email: 'michael.wang@example.com' },
  'user-004': { name: 'Sarah Li', department: 'Procurement', role: 'Procurement Lead', email: 'sarah.li@example.com' },
  'user-005': { name: 'David Zhang', department: 'Logistics', role: 'Operations Manager', email: 'david.zhang@example.com' },
  'user-006': { name: 'Jessica Liu', department: 'Sales', role: 'Sales Director', email: 'jessica.liu@example.com' },
  'user-007': { name: 'Robert Xu', department: 'Finance', role: 'Finance Director', email: 'robert.xu@example.com' },
  'user-008': { name: 'Angela Wu', department: 'IT', role: 'Tech Lead', email: 'angela.wu@example.com' },
};

export { mockCreators };

// ============= Mock 部门列表 =============

export const departmentOptions = [
  { value: 'Finance', label: 'Finance' },
  { value: 'HR', label: 'HR' },
  { value: 'IT', label: 'IT' },
  { value: 'Procurement', label: 'Procurement' },
  { value: 'Logistics', label: 'Logistics' },
  { value: 'Sales', label: 'Sales' },
];

// ============= Mock 需求数据 =============

const generateUUID = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

interface MockTemplate {
  title: string;
  description: string;
  department: string;
  departmentId: string;
  creatorId: string;
  priority: RequirementPriority;
  status: RequirementStatus;
}

const mockTemplates: MockTemplate[] = [
  { title: 'Monthly Financial Report Automation', description: 'Automate the generation and distribution of monthly financial reports across all business units, including data aggregation from ERP and CRM systems.', department: 'Finance', departmentId: 'dept-001', creatorId: 'user-001', priority: 'HIGH', status: 'RUNNING' },
  { title: 'Employee Onboarding Workflow', description: 'Streamline the new hire onboarding process including IT provisioning, badge creation, training enrollment, and benefits registration.', department: 'HR', departmentId: 'dept-002', creatorId: 'user-002', priority: 'HIGH', status: 'DEVELOPING' },
  { title: 'Invoice Processing Pipeline', description: 'Automated invoice capture, OCR extraction, three-way matching with POs, and routing for approval with exception handling.', department: 'Finance', departmentId: 'dept-001', creatorId: 'user-007', priority: 'HIGH', status: 'APPROVED' },
  { title: 'Vendor Registration Portal', description: 'Self-service vendor registration and qualification system with automated compliance checks and document verification.', department: 'Procurement', departmentId: 'dept-004', creatorId: 'user-004', priority: 'MEDIUM', status: 'PENDING' },
  { title: 'Warehouse Inventory Reconciliation', description: 'Automated daily inventory reconciliation between WMS and ERP systems with discrepancy alerting and resolution workflow.', department: 'Logistics', departmentId: 'dept-005', creatorId: 'user-005', priority: 'MEDIUM', status: 'ASSESSING' },
  { title: 'Customer Order Status Notification', description: 'Real-time order tracking and automated customer notification system via email and SMS for key status changes.', department: 'Sales', departmentId: 'dept-006', creatorId: 'user-006', priority: 'LOW', status: 'DRAFT' },
  { title: 'IT Service Desk Ticket Routing', description: 'Intelligent ticket classification and routing based on NLP analysis of ticket content, urgency detection, and SLA tracking.', department: 'IT', departmentId: 'dept-003', creatorId: 'user-003', priority: 'HIGH', status: 'DEVELOPED' },
  { title: 'Purchase Order Approval Workflow', description: 'Multi-level PO approval workflow with dynamic routing based on amount thresholds, budget validation, and vendor scoring.', department: 'Procurement', departmentId: 'dept-004', creatorId: 'user-004', priority: 'HIGH', status: 'RUNNING' },
  { title: 'Payroll Data Validation', description: 'Automated payroll data cross-validation against attendance records, leave management system, and benefit deductions.', department: 'HR', departmentId: 'dept-002', creatorId: 'user-002', priority: 'MEDIUM', status: 'REJECTED' },
  { title: 'Sales Commission Calculation', description: 'Automated monthly sales commission calculation based on tiered commission structures, deal registration rules, and quota attainment.', department: 'Sales', departmentId: 'dept-006', creatorId: 'user-006', priority: 'MEDIUM', status: 'PENDING' },
  { title: 'Contract Renewal Tracking', description: 'Proactive contract expiration monitoring with automated renewal reminders, stakeholder notifications, and renegotiation triggers.', department: 'Procurement', departmentId: 'dept-004', creatorId: 'user-004', priority: 'LOW', status: 'APPROVED' },
  { title: 'Employee Leave Management', description: 'End-to-end leave request workflow with balance calculations, manager approvals, calendar synchronization, and payroll integration.', department: 'HR', departmentId: 'dept-002', creatorId: 'user-002', priority: 'MEDIUM', status: 'DEVELOPING' },
  { title: 'Freight Cost Optimization', description: 'Automated freight carrier selection and rate comparison across multiple logistics providers with real-time cost optimization.', department: 'Logistics', departmentId: 'dept-005', creatorId: 'user-005', priority: 'HIGH', status: 'ASSESSING' },
  { title: 'Budget Variance Analysis', description: 'Automated monthly budget vs actual comparison with drill-down capabilities, trend analysis, and management exception reporting.', department: 'Finance', departmentId: 'dept-001', creatorId: 'user-001', priority: 'MEDIUM', status: 'DRAFT' },
  { title: 'Server Health Monitoring Dashboard', description: 'Automated infrastructure monitoring with alerting, capacity planning recommendations, and incident response workflow triggers.', department: 'IT', departmentId: 'dept-003', creatorId: 'user-008', priority: 'HIGH', status: 'RUNNING' },
  { title: 'Supplier Performance Scorecard', description: 'Quarterly supplier evaluation automation including delivery metrics, quality scores, pricing competitiveness, and compliance adherence.', department: 'Procurement', departmentId: 'dept-004', creatorId: 'user-004', priority: 'LOW', status: 'DEVELOPED' },
  { title: 'Customer Credit Assessment', description: 'Automated credit evaluation workflow for new customers including financial data retrieval, scoring model execution, and limit recommendations.', department: 'Sales', departmentId: 'dept-006', creatorId: 'user-006', priority: 'HIGH', status: 'PENDING' },
  { title: 'Compliance Audit Documentation', description: 'Automated compilation of compliance evidence packages, control testing documentation, and regulatory submission preparation.', department: 'Finance', departmentId: 'dept-001', creatorId: 'user-007', priority: 'HIGH', status: 'APPROVED' },
  { title: 'Shift Scheduling Optimization', description: 'AI-driven workforce scheduling considering labor regulations, employee preferences, skill requirements, and demand forecasting.', department: 'HR', departmentId: 'dept-002', creatorId: 'user-002', priority: 'MEDIUM', status: 'DRAFT' },
  { title: 'Returns Processing Automation', description: 'Automated customer return handling with RMA generation, quality inspection routing, refund processing, and inventory restocking.', department: 'Logistics', departmentId: 'dept-005', creatorId: 'user-005', priority: 'LOW', status: 'STOPPED' },
  { title: 'Software License Management', description: 'Automated tracking of software licenses, usage monitoring, renewal alerting, compliance verification, and cost optimization.', department: 'IT', departmentId: 'dept-003', creatorId: 'user-003', priority: 'MEDIUM', status: 'DEVELOPING' },
  { title: 'Accounts Receivable Aging Report', description: 'Automated AR aging analysis with customer payment pattern recognition, dunning letter generation, and collection priority scoring.', department: 'Finance', departmentId: 'dept-001', creatorId: 'user-001', priority: 'HIGH', status: 'RUNNING' },
  { title: 'Delivery Route Planning', description: 'Optimized delivery route calculation considering traffic patterns, delivery windows, vehicle capacity, and fuel cost minimization.', department: 'Logistics', departmentId: 'dept-005', creatorId: 'user-005', priority: 'HIGH', status: 'ASSESSING' },
  { title: 'CRM Data Enrichment', description: 'Automated customer data enrichment from external sources including firmographic data, social media profiles, and industry classification.', department: 'Sales', departmentId: 'dept-006', creatorId: 'user-006', priority: 'LOW', status: 'ARCHIVED' },
  { title: 'Expense Report Processing', description: 'Automated expense report validation with receipt OCR, policy compliance checking, duplicate detection, and approval routing.', department: 'Finance', departmentId: 'dept-001', creatorId: 'user-007', priority: 'MEDIUM', status: 'DEVELOPED' },
  { title: 'Security Patch Deployment', description: 'Automated security patch assessment, testing pipeline, staged deployment across environments, and rollback procedures.', department: 'IT', departmentId: 'dept-003', creatorId: 'user-008', priority: 'HIGH', status: 'PENDING' },
  { title: 'Employee Performance Review Cycle', description: 'End-to-end performance review automation including goal setting, self-assessment collection, manager review, and calibration workflows.', department: 'HR', departmentId: 'dept-002', creatorId: 'user-002', priority: 'MEDIUM', status: 'REJECTED' },
  { title: 'Procurement Demand Forecasting', description: 'ML-driven demand forecasting for procurement planning with safety stock optimization and automated purchase requisition generation.', department: 'Procurement', departmentId: 'dept-004', creatorId: 'user-004', priority: 'HIGH', status: 'DRAFT' },
  { title: 'Sales Pipeline Analytics', description: 'Automated pipeline health monitoring with win/loss analysis, deal velocity tracking, and revenue forecasting for management review.', department: 'Sales', departmentId: 'dept-006', creatorId: 'user-006', priority: 'MEDIUM', status: 'APPROVED' },
  { title: 'Data Backup Verification', description: 'Automated backup integrity verification, restore testing, retention policy enforcement, and compliance reporting across all data stores.', department: 'IT', departmentId: 'dept-003', creatorId: 'user-003', priority: 'HIGH', status: 'DEVELOPING' },
  { title: 'Cross-Border Shipping Compliance', description: 'Automated customs documentation preparation, tariff classification, restricted party screening, and export control compliance.', department: 'Logistics', departmentId: 'dept-005', creatorId: 'user-005', priority: 'HIGH', status: 'PENDING' },
  { title: 'Tax Filing Preparation', description: 'Automated tax data compilation, calculation verification, filing preparation, and submission tracking for multiple jurisdictions.', department: 'Finance', departmentId: 'dept-001', creatorId: 'user-001', priority: 'HIGH', status: 'STOPPED' },
];

const generateMockRequirements = (): RequirementItem[] => {
  return mockTemplates.map((tpl, index) => {
    const creator = mockCreators[tpl.creatorId];
    const createDate = new Date(2026, 0, 5 + index, 9 + (index % 8), (index * 13) % 60);
    const updateDate = new Date(createDate.getTime() + (1 + (index % 15)) * 24 * 60 * 60 * 1000);
    const launchDate = new Date(createDate.getTime() + (30 + (index % 60)) * 24 * 60 * 60 * 1000);

    return {
      id: generateUUID(),
      title: tpl.title,
      description: tpl.description,
      department: tpl.department,
      departmentId: tpl.departmentId,
      creatorId: tpl.creatorId,
      creatorName: creator.name,
      creatorDepartment: creator.department,
      creatorRole: creator.role,
      creatorEmail: creator.email,
      priority: tpl.priority,
      status: tpl.status,
      expectedLaunchDate: launchDate.toISOString(),
      createdAt: createDate.toISOString(),
      updatedAt: updateDate.toISOString(),
    };
  });
};

let mockRequirementData = generateMockRequirements();

// ============= 模拟 API 函数 =============

export const fetchRequirementList = async (params: RequirementQueryParams): Promise<RequirementListResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  let filtered = [...mockRequirementData];

  // 关键词搜索
  if (params.keyword?.trim()) {
    const kw = params.keyword.toLowerCase().trim();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(kw) ||
        item.description.toLowerCase().includes(kw),
    );
  }

  // 状态筛选
  if (params.statusFilter && params.statusFilter.length > 0) {
    filtered = filtered.filter((item) => params.statusFilter!.includes(item.status));
  }

  // 部门筛选
  if (params.departmentFilter && params.departmentFilter.length > 0) {
    filtered = filtered.filter((item) => params.departmentFilter!.includes(item.department));
  }

  // 优先级筛选
  if (params.priorityFilter && params.priorityFilter.length > 0) {
    filtered = filtered.filter((item) => params.priorityFilter!.includes(item.priority));
  }

  // 排序
  filtered.sort((a, b) => {
    let vA: string;
    let vB: string;
    switch (params.sort_by) {
      case 'title':
        vA = a.title;
        vB = b.title;
        break;
      case 'updated_at':
        vA = a.updatedAt;
        vB = b.updatedAt;
        break;
      case 'created_at':
      default:
        vA = a.createdAt;
        vB = b.createdAt;
        break;
    }
    const cmp = vA.localeCompare(vB);
    return params.sort_order === 'asc' ? cmp : -cmp;
  });

  // 分页
  const total = filtered.length;
  const offset = params.offset || 0;
  const size = params.size || 20;
  const paginatedData = filtered.slice(offset, offset + size);

  return {
    range: { offset, size, total },
    list: paginatedData,
  };
};

// 删除 mock 需求
export const deleteRequirement = async (id: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  mockRequirementData = mockRequirementData.filter((item) => item.id !== id);
};

// 创建 mock 需求
export const createRequirement = async (values: Record<string, unknown>): Promise<RequirementItem> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const now = new Date().toISOString();
  const creator = mockCreators['user-001'];
  const newItem: RequirementItem = {
    id: generateUUID(),
    title: values.title as string,
    description: (values.description as string) || '',
    department: values.department as string,
    departmentId: 'dept-new',
    creatorId: 'user-001',
    creatorName: creator.name,
    creatorDepartment: creator.department,
    creatorRole: creator.role,
    creatorEmail: creator.email,
    contactInfo: (values.contactInfo as string) || '',
    priority: (values.priority as RequirementPriority) || 'MEDIUM',
    status: 'DRAFT',
    expectedLaunchDate: values.expectedLaunchDate
      ? (values.expectedLaunchDate as Date).toISOString()
      : undefined,
    createdAt: now,
    updatedAt: now,
  };
  mockRequirementData.unshift(newItem);
  return newItem;
};

// 更新 mock 需求
export const updateRequirement = async (id: string, values: Record<string, unknown>): Promise<RequirementItem | null> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const index = mockRequirementData.findIndex((item) => item.id === id);
  if (index === -1) return null;
  mockRequirementData[index] = {
    ...mockRequirementData[index],
    title: values.title as string,
    description: (values.description as string) || mockRequirementData[index].description,
    department: (values.department as string) || mockRequirementData[index].department,
    priority: (values.priority as RequirementPriority) || mockRequirementData[index].priority,
    contactInfo: (values.contactInfo as string) || '',
    expectedLaunchDate: values.expectedLaunchDate
      ? (values.expectedLaunchDate as Date).toISOString()
      : mockRequirementData[index].expectedLaunchDate,
    updatedAt: new Date().toISOString(),
  };
  return mockRequirementData[index];
};

// ============= Mock 活动记录 =============

const activityTemplates: Record<RequirementStatus, ActivityRecord[]> = {
  DRAFT: [
    { id: 'act-1', type: 'created', actorId: 'user-001', actorName: 'John Smith', content: 'Created this requirement as a draft.', timestamp: '' },
  ],
  PENDING: [
    { id: 'act-1', type: 'created', actorId: 'user-001', actorName: 'John Smith', content: 'Created this requirement as a draft.', timestamp: '' },
    { id: 'act-2', type: 'status_change', actorId: 'user-001', actorName: 'John Smith', content: 'Submitted for approval.', fromStatus: 'DRAFT', toStatus: 'PENDING', timestamp: '' },
  ],
  APPROVED: [
    { id: 'act-1', type: 'created', actorId: 'user-002', actorName: 'Emily Chen', content: 'Created this requirement as a draft.', timestamp: '' },
    { id: 'act-2', type: 'status_change', actorId: 'user-002', actorName: 'Emily Chen', content: 'Submitted for approval.', fromStatus: 'DRAFT', toStatus: 'PENDING', timestamp: '' },
    { id: 'act-3', type: 'approval', actorId: 'user-007', actorName: 'Robert Xu', content: 'Approved. The business case is solid and aligns with Q2 objectives.', timestamp: '' },
  ],
  REJECTED: [
    { id: 'act-1', type: 'created', actorId: 'user-002', actorName: 'Emily Chen', content: 'Created this requirement as a draft.', timestamp: '' },
    { id: 'act-2', type: 'status_change', actorId: 'user-002', actorName: 'Emily Chen', content: 'Submitted for approval.', fromStatus: 'DRAFT', toStatus: 'PENDING', timestamp: '' },
    { id: 'act-3', type: 'approval', actorId: 'user-007', actorName: 'Robert Xu', content: 'Rejected. Insufficient ROI justification. Please provide more detailed cost-benefit analysis.', timestamp: '' },
  ],
  ASSESSING: [
    { id: 'act-1', type: 'created', actorId: 'user-004', actorName: 'Sarah Li', content: 'Created this requirement as a draft.', timestamp: '' },
    { id: 'act-2', type: 'status_change', actorId: 'user-004', actorName: 'Sarah Li', content: 'Submitted for approval.', fromStatus: 'DRAFT', toStatus: 'PENDING', timestamp: '' },
    { id: 'act-3', type: 'approval', actorId: 'user-007', actorName: 'Robert Xu', content: 'Approved. Proceed with technical assessment.', timestamp: '' },
    { id: 'act-4', type: 'comment', actorId: 'user-003', actorName: 'Michael Wang', content: 'Starting technical feasibility assessment. Will evaluate integration complexity with existing systems.', timestamp: '' },
  ],
  DEVELOPING: [
    { id: 'act-1', type: 'created', actorId: 'user-002', actorName: 'Emily Chen', content: 'Created this requirement as a draft.', timestamp: '' },
    { id: 'act-2', type: 'status_change', actorId: 'user-002', actorName: 'Emily Chen', content: 'Submitted for approval.', fromStatus: 'DRAFT', toStatus: 'PENDING', timestamp: '' },
    { id: 'act-3', type: 'approval', actorId: 'user-007', actorName: 'Robert Xu', content: 'Approved.', timestamp: '' },
    { id: 'act-4', type: 'assessment', actorId: 'user-008', actorName: 'Angela Wu', content: 'Technical assessment completed. Score: 82/100. Recommendation: Proceed with development.', timestamp: '' },
    { id: 'act-5', type: 'status_change', actorId: 'user-003', actorName: 'Michael Wang', content: 'Development started.', fromStatus: 'ASSESSING', toStatus: 'DEVELOPING', timestamp: '' },
  ],
  DEVELOPED: [
    { id: 'act-1', type: 'created', actorId: 'user-003', actorName: 'Michael Wang', content: 'Created this requirement.', timestamp: '' },
    { id: 'act-2', type: 'approval', actorId: 'user-007', actorName: 'Robert Xu', content: 'Approved.', timestamp: '' },
    { id: 'act-3', type: 'assessment', actorId: 'user-008', actorName: 'Angela Wu', content: 'Technical assessment completed. Score: 90/100.', timestamp: '' },
    { id: 'act-4', type: 'status_change', actorId: 'user-003', actorName: 'Michael Wang', content: 'Development completed. Ready for acceptance testing.', fromStatus: 'DEVELOPING', toStatus: 'DEVELOPED', timestamp: '' },
  ],
  RUNNING: [
    { id: 'act-1', type: 'created', actorId: 'user-001', actorName: 'John Smith', content: 'Created this requirement.', timestamp: '' },
    { id: 'act-2', type: 'approval', actorId: 'user-007', actorName: 'Robert Xu', content: 'Approved.', timestamp: '' },
    { id: 'act-3', type: 'assessment', actorId: 'user-008', actorName: 'Angela Wu', content: 'Technical assessment passed. Score: 88/100.', timestamp: '' },
    { id: 'act-4', type: 'status_change', actorId: 'user-003', actorName: 'Michael Wang', content: 'Development completed.', fromStatus: 'DEVELOPING', toStatus: 'DEVELOPED', timestamp: '' },
    { id: 'act-5', type: 'comment', actorId: 'user-001', actorName: 'John Smith', content: 'Acceptance testing passed. All criteria met.', timestamp: '' },
    { id: 'act-6', type: 'status_change', actorId: 'user-001', actorName: 'John Smith', content: 'Deployed to production. Now running.', fromStatus: 'DEVELOPED', toStatus: 'RUNNING', timestamp: '' },
  ],
  STOPPED: [
    { id: 'act-1', type: 'created', actorId: 'user-005', actorName: 'David Zhang', content: 'Created this requirement.', timestamp: '' },
    { id: 'act-2', type: 'status_change', actorId: 'user-005', actorName: 'David Zhang', content: 'Requirement stopped due to business priority change.', fromStatus: 'RUNNING', toStatus: 'STOPPED', timestamp: '' },
  ],
  ARCHIVED: [
    { id: 'act-1', type: 'created', actorId: 'user-006', actorName: 'Jessica Liu', content: 'Created this requirement.', timestamp: '' },
    { id: 'act-2', type: 'status_change', actorId: 'user-006', actorName: 'Jessica Liu', content: 'Requirement archived.', fromStatus: 'RUNNING', toStatus: 'ARCHIVED', timestamp: '' },
  ],
};

export const fetchActivities = async (requirementId: string): Promise<ActivityRecord[]> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const req = mockRequirementData.find((r) => r.id === requirementId);
  if (!req) return [];
  const templates = activityTemplates[req.status] || activityTemplates.DRAFT;
  const baseDate = new Date(req.createdAt);
  return templates.map((tpl, i) => ({
    ...tpl,
    id: `${requirementId}-act-${i}`,
    timestamp: new Date(baseDate.getTime() + i * 2 * 24 * 60 * 60 * 1000).toISOString(),
  }));
};
