import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag/interface';
import type {
  RequirementItem,
  RequirementStatus,
  RequirementPriority,
  RequirementQueryParams,
  RequirementListResponse,
  ActivityRecord,
  TechnicalAssessment,
  RequirementArtifact,
  DetailedAssessment,
  CostEstimateData,
  VersionSnapshot,
  LinkedProcess,
  MultiLevelApprovalConfig,
  ApprovalFlowLevel,
  ApprovalFlowApprover,
} from './types';
import { statusConfigV2 } from './statusConfig';

// ============= 旧 statusConfig（兼容，已迁移至 statusConfigV2） =============

export const statusConfig: Record<RequirementStatus, { color: TagColor; i18nKey: string }> = Object.fromEntries(
  Object.entries(statusConfigV2).map(([k, v]) => [k, { color: v.color, i18nKey: v.i18nKey }])
) as Record<RequirementStatus, { color: TagColor; i18nKey: string }>;

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
  owning_department_name: string;
  owning_department_id: string;
  creatorId: string;
  priority: RequirementPriority;
  status: RequirementStatus;
}

const mockTemplates: MockTemplate[] = [
  // 9 状态全覆盖（DRAFT / PENDING_APPROVAL / PENDING_ASSESSMENT / PENDING_PROJECT / DEVELOPING / LAUNCHED / OFFLINE / REJECTED / WITHDRAWN）
  { title: 'Monthly Financial Report Automation', description: 'Automate the generation and distribution of monthly financial reports across all business units, including data aggregation from ERP and CRM systems.', owning_department_name: 'Finance', owning_department_id: 'dept-001', creatorId: 'user-001', priority: 'HIGH', status: 'LAUNCHED' },
  { title: 'Employee Onboarding Workflow', description: 'Streamline the new hire onboarding process including IT provisioning, badge creation, training enrollment, and benefits registration.', owning_department_name: 'HR', owning_department_id: 'dept-002', creatorId: 'user-002', priority: 'HIGH', status: 'DEVELOPING' },
  { title: 'Invoice Processing Pipeline', description: 'Automated invoice capture, OCR extraction, three-way matching with POs, and routing for approval with exception handling.', owning_department_name: 'Finance', owning_department_id: 'dept-001', creatorId: 'user-007', priority: 'HIGH', status: 'PENDING_PROJECT' },
  { title: 'Vendor Registration Portal', description: 'Self-service vendor registration and qualification system with automated compliance checks and document verification.', owning_department_name: 'Procurement', owning_department_id: 'dept-004', creatorId: 'user-004', priority: 'MEDIUM', status: 'PENDING_APPROVAL' },
  { title: 'Warehouse Inventory Reconciliation', description: 'Automated daily inventory reconciliation between WMS and ERP systems with discrepancy alerting and resolution workflow.', owning_department_name: 'Logistics', owning_department_id: 'dept-005', creatorId: 'user-005', priority: 'MEDIUM', status: 'PENDING_ASSESSMENT' },
  { title: 'Customer Order Status Notification', description: 'Real-time order tracking and automated customer notification system via email and SMS for key status changes.', owning_department_name: 'Sales', owning_department_id: 'dept-006', creatorId: 'user-006', priority: 'LOW', status: 'DRAFT' },
  { title: 'IT Service Desk Ticket Routing', description: 'Intelligent ticket classification and routing based on NLP analysis of ticket content, urgency detection, and SLA tracking.', owning_department_name: 'IT', owning_department_id: 'dept-003', creatorId: 'user-003', priority: 'HIGH', status: 'DEVELOPING' },
  { title: 'Purchase Order Approval Workflow', description: 'Multi-level PO approval workflow with dynamic routing based on amount thresholds, budget validation, and vendor scoring.', owning_department_name: 'Procurement', owning_department_id: 'dept-004', creatorId: 'user-004', priority: 'HIGH', status: 'LAUNCHED' },
  { title: 'Payroll Data Validation', description: 'Automated payroll data cross-validation against attendance records, leave management system, and benefit deductions.', owning_department_name: 'HR', owning_department_id: 'dept-002', creatorId: 'user-002', priority: 'MEDIUM', status: 'REJECTED' },
  { title: 'Sales Commission Calculation', description: 'Automated monthly sales commission calculation based on tiered commission structures, deal registration rules, and quota attainment.', owning_department_name: 'Sales', owning_department_id: 'dept-006', creatorId: 'user-006', priority: 'MEDIUM', status: 'PENDING_APPROVAL' },
  { title: 'Contract Renewal Tracking', description: 'Proactive contract expiration monitoring with automated renewal reminders, stakeholder notifications, and renegotiation triggers.', owning_department_name: 'Procurement', owning_department_id: 'dept-004', creatorId: 'user-004', priority: 'LOW', status: 'PENDING_PROJECT' },
  { title: 'Employee Leave Management', description: 'End-to-end leave request workflow with balance calculations, manager approvals, calendar synchronization, and payroll integration.', owning_department_name: 'HR', owning_department_id: 'dept-002', creatorId: 'user-002', priority: 'MEDIUM', status: 'DEVELOPING' },
  { title: 'Freight Cost Optimization', description: 'Automated freight carrier selection and rate comparison across multiple logistics providers with real-time cost optimization.', owning_department_name: 'Logistics', owning_department_id: 'dept-005', creatorId: 'user-005', priority: 'HIGH', status: 'PENDING_ASSESSMENT' },
  { title: 'Budget Variance Analysis', description: 'Automated monthly budget vs actual comparison with drill-down capabilities, trend analysis, and management exception reporting.', owning_department_name: 'Finance', owning_department_id: 'dept-001', creatorId: 'user-001', priority: 'MEDIUM', status: 'WITHDRAWN' },
  { title: 'Server Health Monitoring Dashboard', description: 'Automated infrastructure monitoring with alerting, capacity planning recommendations, and incident response workflow triggers.', owning_department_name: 'IT', owning_department_id: 'dept-003', creatorId: 'user-008', priority: 'HIGH', status: 'LAUNCHED' },
  { title: 'Supplier Performance Scorecard', description: 'Quarterly supplier evaluation automation including delivery metrics, quality scores, pricing competitiveness, and compliance adherence.', owning_department_name: 'Procurement', owning_department_id: 'dept-004', creatorId: 'user-004', priority: 'LOW', status: 'OFFLINE' },
  { title: 'Customer Credit Assessment', description: 'Automated credit evaluation workflow for new customers including financial data retrieval, scoring model execution, and limit recommendations.', owning_department_name: 'Sales', owning_department_id: 'dept-006', creatorId: 'user-006', priority: 'HIGH', status: 'PENDING_APPROVAL' },
  { title: 'Compliance Audit Documentation', description: 'Automated compilation of compliance evidence packages, control testing documentation, and regulatory submission preparation.', owning_department_name: 'Finance', owning_department_id: 'dept-001', creatorId: 'user-007', priority: 'HIGH', status: 'PENDING_PROJECT' },
  { title: 'Shift Scheduling Optimization', description: 'AI-driven workforce scheduling considering labor regulations, employee preferences, skill requirements, and demand forecasting.', owning_department_name: 'HR', owning_department_id: 'dept-002', creatorId: 'user-002', priority: 'MEDIUM', status: 'DRAFT' },
  { title: 'Returns Processing Automation', description: 'Automated customer return handling with RMA generation, quality inspection routing, refund processing, and inventory restocking.', owning_department_name: 'Logistics', owning_department_id: 'dept-005', creatorId: 'user-005', priority: 'LOW', status: 'OFFLINE' },
  { title: 'Software License Management', description: 'Automated tracking of software licenses, usage monitoring, renewal alerting, compliance verification, and cost optimization.', owning_department_name: 'IT', owning_department_id: 'dept-003', creatorId: 'user-003', priority: 'MEDIUM', status: 'DEVELOPING' },
  { title: 'Accounts Receivable Aging Report', description: 'Automated AR aging analysis with customer payment pattern recognition, dunning letter generation, and collection priority scoring.', owning_department_name: 'Finance', owning_department_id: 'dept-001', creatorId: 'user-001', priority: 'HIGH', status: 'LAUNCHED' },
  { title: 'Delivery Route Planning', description: 'Optimized delivery route calculation considering traffic patterns, delivery windows, vehicle capacity, and fuel cost minimization.', owning_department_name: 'Logistics', owning_department_id: 'dept-005', creatorId: 'user-005', priority: 'HIGH', status: 'PENDING_ASSESSMENT' },
  { title: 'CRM Data Enrichment', description: 'Automated customer data enrichment from external sources including firmographic data, social media profiles, and industry classification.', owning_department_name: 'Sales', owning_department_id: 'dept-006', creatorId: 'user-006', priority: 'LOW', status: 'OFFLINE' },
  { title: 'Expense Report Processing', description: 'Automated expense report validation with receipt OCR, policy compliance checking, duplicate detection, and approval routing.', owning_department_name: 'Finance', owning_department_id: 'dept-001', creatorId: 'user-007', priority: 'MEDIUM', status: 'DEVELOPING' },
  { title: 'Security Patch Deployment', description: 'Automated security patch assessment, testing pipeline, staged deployment across environments, and rollback procedures.', owning_department_name: 'IT', owning_department_id: 'dept-003', creatorId: 'user-008', priority: 'HIGH', status: 'PENDING_APPROVAL' },
  { title: 'Employee Performance Review Cycle', description: 'End-to-end performance review automation including goal setting, self-assessment collection, manager review, and calibration workflows.', owning_department_name: 'HR', owning_department_id: 'dept-002', creatorId: 'user-002', priority: 'MEDIUM', status: 'REJECTED' },
  { title: 'Procurement Demand Forecasting', description: 'ML-driven demand forecasting for procurement planning with safety stock optimization and automated purchase requisition generation.', owning_department_name: 'Procurement', owning_department_id: 'dept-004', creatorId: 'user-004', priority: 'HIGH', status: 'DRAFT' },
  { title: 'Sales Pipeline Analytics', description: 'Automated pipeline health monitoring with win/loss analysis, deal velocity tracking, and revenue forecasting for management review.', owning_department_name: 'Sales', owning_department_id: 'dept-006', creatorId: 'user-006', priority: 'MEDIUM', status: 'PENDING_PROJECT' },
  { title: 'Data Backup Verification', description: 'Automated backup integrity verification, restore testing, retention policy enforcement, and compliance reporting across all data stores.', owning_department_name: 'IT', owning_department_id: 'dept-003', creatorId: 'user-003', priority: 'HIGH', status: 'DEVELOPING' },
  { title: 'Cross-Border Shipping Compliance', description: 'Automated customs documentation preparation, tariff classification, restricted party screening, and export control compliance.', owning_department_name: 'Logistics', owning_department_id: 'dept-005', creatorId: 'user-005', priority: 'HIGH', status: 'PENDING_APPROVAL' },
  { title: 'Tax Filing Preparation', description: 'Automated tax data compilation, calculation verification, filing preparation, and submission tracking for multiple jurisdictions.', owning_department_name: 'Finance', owning_department_id: 'dept-001', creatorId: 'user-001', priority: 'HIGH', status: 'OFFLINE' },
];

// 视为"开发中之后"的状态
const POST_DEV: RequirementStatus[] = ['DEVELOPING', 'LAUNCHED', 'OFFLINE'];

const generateMockAssessment = (reqId: string, status: RequirementStatus): TechnicalAssessment | undefined => {
  if (!POST_DEV.includes(status)) return undefined;
  return {
    id: `assess-${reqId}`,
    requirementId: reqId,
    assessorId: 'user-008',
    assessorName: 'Angela Wu',
    generalScores: {
      businessComplexity: 3,
      resourceAvailability: 4,
      externalDependency: 5,
      riskLevel: 4,
    },
    uiAutomationScores: status === 'LAUNCHED' ? {
      systemStability: 3,
      elementIdentifiability: 3,
      processStandardization: 5,
    } : undefined,
    adpScores: undefined,
    totalScore: status === 'LAUNCHED' ? 27 : 16,
    maxScore: status === 'LAUNCHED' ? 35 : 20,
    conclusion: 'PASSED',
    comment: 'The requirement has clear business logic and stable target systems. Recommended for implementation.',
    assessedAt: new Date(2026, 1, 15, 14, 0).toISOString(),
  };
};

const generateMockArtifacts = (reqId: string, status: RequirementStatus): RequirementArtifact[] => {
  if (!POST_DEV.includes(status)) return [];
  return [
    {
      id: `artifact-${reqId}-1`,
      requirementId: reqId,
      artifactType: 'PROCESS',
      artifactId: 'proc-001',
      artifactName: 'Procurement Approval Process',
      contribution: 0.4,
      description: 'Handles procurement request approval workflow',
      createdAt: new Date(2026, 1, 20).toISOString(),
    },
    {
      id: `artifact-${reqId}-2`,
      requirementId: reqId,
      artifactType: 'ADP_APP',
      artifactId: 'adp-001',
      artifactName: 'Invoice Recognition App',
      contribution: 0.3,
      description: 'Extracts invoice data using OCR',
      createdAt: new Date(2026, 1, 21).toISOString(),
    },
  ];
};

// 简单的价值/复杂度模拟得分
const mockScore = (seed: number, base = 50, range = 50) => Math.round(base + ((seed * 17) % range));

const generateMockRequirements = (): RequirementItem[] => {
  return mockTemplates.map((tpl, index) => {
    const creator = mockCreators[tpl.creatorId];
    const createDate = new Date(2026, 0, 5 + index, 9 + (index % 8), (index * 13) % 60);
    const updateDate = new Date(createDate.getTime() + (1 + (index % 15)) * 24 * 60 * 60 * 1000);
    const launchDate = new Date(createDate.getTime() + (30 + (index % 60)) * 24 * 60 * 60 * 1000);
    const id = generateUUID();
    const reqNo = `REQ-2026-${String(index + 1).padStart(4, '0')}`;

    const hasScores = tpl.status !== 'DRAFT' && tpl.status !== 'WITHDRAWN';

    const { cost: costEstimate, baseline: baselineFormData } = generateMockCost(tpl.status, index);

    return {
      id,
      req_no: reqNo,
      scheme_id: 'scheme-rpa-pro',
      scheme_version: '1.0.0',
      title: tpl.title,
      description: tpl.description,
      businessBackground: index % 3 === 0 ? 'Current process is manual and time-consuming, requiring significant human effort. Automating this workflow will reduce processing time by 60% and minimize human errors.' : undefined,
      owning_department_name: tpl.owning_department_name,
      owning_department_id: tpl.owning_department_id,
      owner_id: tpl.creatorId,
      owner_name: creator.name,
      creatorId: tpl.creatorId,
      creatorName: creator.name,
      creatorDepartment: creator.department,
      creatorRole: creator.role,
      creatorEmail: creator.email,
      contactInfo: `${creator.name} - ${creator.email}`,
      priority: tpl.priority,
      status: tpl.status,
      expectedLaunchDate: launchDate.toISOString(),
      involvedTech: index % 4 === 0 ? ['UI_AUTOMATION'] : index % 4 === 1 ? ['ADP'] : index % 4 === 2 ? ['UI_AUTOMATION', 'ADP'] : undefined,
      assessment: generateMockAssessment(id, tpl.status),
      artifacts: generateMockArtifacts(id, tpl.status),
      detailedAssessment: generateMockDetailedAssessment(tpl.status, index),
      form_data: baselineFormData ? { ...baselineFormData } : undefined,
      baselineFormData,
      costEstimate,
      historyVersions: generateMockVersions(tpl.status, index, tpl.title, tpl.description, tpl.priority),
      linkedProcesses: generateMockLinkedProcesses(tpl.status, index),
      approvalFlowConfig: generateMockApprovalFlow(tpl.status),
      value_score: hasScores ? mockScore(index, 50, 50) : undefined,
      complexity_score: hasScores ? mockScore(index + 7, 30, 60) : undefined,
      version: 1,
      createdAt: createDate.toISOString(),
      updatedAt: updateDate.toISOString(),
    };
  });
};

const POST_ASSESS: RequirementStatus[] = ['PENDING_PROJECT', 'DEVELOPING', 'LAUNCHED', 'OFFLINE'];

const generateMockDetailedAssessment = (status: RequirementStatus, idx: number): DetailedAssessment | undefined => {
  if (!POST_ASSESS.includes(status)) return undefined;
  const sv = (n: number) => (((idx + n) % 5) + 1) as 1 | 2 | 3 | 4 | 5;
  const valueDimensions = [
    { key: 'strategicAlignment', score: sv(1) },
    { key: 'benefitScale', score: sv(2) },
    { key: 'urgency', score: sv(3) },
  ];
  const complexityDimensions = [
    { key: 'implementationDifficulty', score: sv(4) },
    { key: 'dependencyComplexity', score: sv(5) },
    { key: 'risk', score: sv(0) },
  ];
  const valueTotal = valueDimensions.reduce((s, d) => s + d.score, 0);
  const complexityTotal = complexityDimensions.reduce((s, d) => s + d.score, 0);
  const netScore = valueTotal - complexityTotal;
  const conclusion = netScore >= 5 ? 'RECOMMEND' : netScore >= 0 ? 'CAUTION' : 'REJECT';
  return {
    valueDimensions,
    complexityDimensions,
    netScore,
    conclusion,
    assessorId: 'user-008',
    assessorName: 'Angela Wu',
    assessedAt: new Date(2026, 1, 15 + (idx % 10), 14, 0).toISOString(),
    comment: 'Aligned with strategic priority. Resource plan to be confirmed.',
  };
};

// ============= Story-010 成本预估自动计算 =============

import type { JobLevel, RequirementBaselineFormData, SchemeCostConfig, RequirementScheme } from './types';

/** Mock 激活方案（第 2 批：Scheme 驱动动态表单） */
const ACTIVE_SCHEME: RequirementScheme = {
  id: 'scheme-rpa-pro',
  code: 'RPA_PRO',
  name: 'RPA Pro 标准方案',
  version: '1.0.0',
  description: '标准 RPA 自动化项目评估方案',
  status: 'active',
  is_preset: true,
  custom_fields: [
    {
      key: 'frequency',
      label: '执行频率',
      type: 'number',
      unit: '次/月',
      required: true,
      placeholder: '请输入月均执行次数',
      validation: { min: 1, max: 10000, message: '频率范围 1-10000 次/月' },
    },
    {
      key: 'durationMinutes',
      label: '单次耗时',
      type: 'number',
      unit: '分钟',
      required: true,
      placeholder: '请输入单次执行耗时',
      validation: { min: 1, max: 1440, message: '耗时范围 1-1440 分钟' },
    },
    {
      key: 'automationRatio',
      label: '可自动化比例',
      type: 'percentage',
      required: true,
      placeholder: '请输入可自动化比例',
      validation: { min: 0, max: 100 },
    },
    {
      key: 'jobLevel',
      label: '岗位级别',
      type: 'select',
      required: true,
      placeholder: '请选择执行人员岗位级别',
      options: [
        { label: 'P4（初级）', value: 'P4' },
        { label: 'P5（中级）', value: 'P5' },
        { label: 'P6（高级）', value: 'P6' },
        { label: 'P7（资深）', value: 'P7' },
      ],
    },
  ],
  approval_flow: { levels: [] },
  cost_config: {
    avg_hourly_cost: 200,
    working_hours_per_day: 8,
    working_days_per_month: 22,
    rate_table: { P4: 800, P5: 1200, P6: 1800, P7: 2600 },
  },
  created_at: new Date(2026, 0, 1).toISOString(),
};

export const getActiveScheme = (): RequirementScheme => ACTIVE_SCHEME;

export const getActiveSchemeCostConfig = (): SchemeCostConfig => ({
  workingHoursPerDay: ACTIVE_SCHEME.cost_config!.working_hours_per_day,
  rateTable: ACTIVE_SCHEME.cost_config!.rate_table!,
  schemeName: ACTIVE_SCHEME.name,
});

/** 基于基线表单数据自动计算成本节省 */
export const computeCostEstimate = (
  baseline: RequirementBaselineFormData,
  config: SchemeCostConfig = getActiveSchemeCostConfig(),
): CostEstimateData => {
  const dailyRate = config.rateTable[baseline.jobLevel] ?? 0;
  const monthlySavedHours =
    (baseline.frequency * baseline.durationMinutes * baseline.automationRatio) / 60;
  const monthlySavedPersonDays =
    config.workingHoursPerDay > 0 ? monthlySavedHours / config.workingHoursPerDay : 0;
  const monthlySavedAmount = monthlySavedPersonDays * dailyRate;
  return {
    frequency: baseline.frequency,
    durationMinutes: baseline.durationMinutes,
    automationRatio: baseline.automationRatio,
    jobLevel: baseline.jobLevel,
    workingHoursPerDay: config.workingHoursPerDay,
    dailyRate,
    schemeName: config.schemeName,
    monthlySavedHours,
    monthlySavedPersonDays,
    monthlySavedAmount,
    computedAt: new Date().toISOString(),
  };
};

const JOB_LEVEL_POOL: JobLevel[] = ['P4', 'P5', 'P6', 'P7'];

const generateMockBaseline = (idx: number): RequirementBaselineFormData => ({
  frequency: 10 + (idx * 7) % 90,            // 10~99 次/月
  durationMinutes: 15 + (idx * 11) % 105,    // 15~120 分钟
  automationRatio: 0.4 + ((idx * 13) % 60) / 100, // 0.4~1.0
  jobLevel: JOB_LEVEL_POOL[idx % JOB_LEVEL_POOL.length],
});

const generateMockCost = (status: RequirementStatus, idx: number): { cost?: CostEstimateData; baseline?: RequirementBaselineFormData } => {
  if (status === 'DRAFT' || status === 'WITHDRAWN') return {};
  const baseline = generateMockBaseline(idx);
  return { cost: computeCostEstimate(baseline), baseline };
};

const generateMockVersions = (
  status: RequirementStatus,
  idx: number,
  title: string,
  description: string,
  priority: RequirementPriority,
): VersionSnapshot[] | undefined => {
  if (!(['PENDING_PROJECT', 'DEVELOPING', 'LAUNCHED', 'OFFLINE'] as RequirementStatus[]).includes(status)) return undefined;
  return [
    {
      version: 1,
      createdAt: new Date(2026, 0, 10 + idx).toISOString(),
      actorId: 'user-001',
      actorName: 'John Smith',
      summary: 'Initial draft submitted for approval.',
      snapshot: { title, description: description.substring(0, 80) + '...', priority: 'MEDIUM', status: 'PENDING_APPROVAL' },
    },
    {
      version: 2,
      createdAt: new Date(2026, 1, 5 + idx).toISOString(),
      actorId: 'user-007',
      actorName: 'Robert Xu',
      summary: 'Approved by business owner; adjusted priority.',
      snapshot: { title, description, priority, status: 'PENDING_ASSESSMENT' },
    },
  ];
};

/** Mock 流程候选池（供需求关联流程选择） */
export const MOCK_PROCESS_POOL: LinkedProcess[] = [
  { id: 'proc-001', name: 'Procurement Approval Process', status: 'ONLINE',     ownerName: 'Sarah Li' },
  { id: 'proc-002', name: 'Invoice OCR Pipeline',         status: 'TESTING',    ownerName: 'Michael Wang' },
  { id: 'proc-003', name: 'Vendor Notification Workflow', status: 'DEVELOPING', ownerName: 'Emily Chen' },
  { id: 'proc-004', name: 'Customer Credit Assessment',   status: 'ONLINE',     ownerName: 'Jessica Liu' },
  { id: 'proc-005', name: 'Payroll Data Validation',      status: 'PENDING',    ownerName: 'Emily Chen' },
  { id: 'proc-006', name: 'Server Health Monitoring',     status: 'ONLINE',     ownerName: 'Angela Wu' },
  { id: 'proc-007', name: 'Expense Report Processing',    status: 'TESTING',    ownerName: 'Robert Xu' },
  { id: 'proc-008', name: 'Freight Cost Optimization',    status: 'FAILED',     ownerName: 'David Zhang' },
];

const generateMockLinkedProcesses = (status: RequirementStatus, idx: number): LinkedProcess[] | undefined => {
  if (!(['DEVELOPING', 'LAUNCHED', 'OFFLINE'] as RequirementStatus[]).includes(status)) return undefined;
  const pool: LinkedProcess[] = [
    MOCK_PROCESS_POOL[0],
    MOCK_PROCESS_POOL[1],
    { ...MOCK_PROCESS_POOL[2], status: idx % 3 === 0 ? 'FAILED' : 'DEVELOPING' },
  ];
  return pool.slice(0, (idx % 3) + 1);
};

let mockRequirementData = generateMockRequirements();

// ============= 模拟 API 函数 =============

export const fetchRequirementList = async (params: RequirementQueryParams): Promise<RequirementListResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  let filtered = [...mockRequirementData];

  if (params.keyword?.trim()) {
    const kw = params.keyword.toLowerCase().trim();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(kw) ||
        item.description.toLowerCase().includes(kw) ||
        (item.req_no || '').toLowerCase().includes(kw),
    );
  }

  if (params.statusFilter && params.statusFilter.length > 0) {
    filtered = filtered.filter((item) => params.statusFilter!.includes(item.status));
  }

  if (params.departmentFilter && params.departmentFilter.length > 0) {
    filtered = filtered.filter((item) => params.departmentFilter!.includes(item.owning_department_name));
  }

  if (params.priorityFilter && params.priorityFilter.length > 0) {
    filtered = filtered.filter((item) => params.priorityFilter!.includes(item.priority));
  }

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

  const total = filtered.length;
  const offset = params.offset || 0;
  const size = params.size || 20;
  const paginatedData = filtered.slice(offset, offset + size);

  return {
    range: { offset, size, total },
    list: paginatedData,
  };
};

export const deleteRequirement = async (id: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  mockRequirementData = mockRequirementData.filter((item) => item.id !== id);
};

/** 从 form_data 中提取基线四字段；齐全则计算节省 */
const extractBaselineAndCost = (
  formData: Record<string, unknown> | undefined,
): { baseline?: RequirementBaselineFormData; cost?: CostEstimateData; form_data?: Record<string, unknown> } => {
  if (!formData) return {};
  const { frequency, durationMinutes, automationRatio, jobLevel } = formData as Record<string, unknown>;
  const validLevels: JobLevel[] = ['P4', 'P5', 'P6', 'P7'];
  // 表单中 percentage 字段为 0~100，统一归一化为 0~1
  const ratioRaw = typeof automationRatio === 'number' ? automationRatio : NaN;
  const ratioNormalized = ratioRaw > 1 ? ratioRaw / 100 : ratioRaw;
  if (
    typeof frequency === 'number' &&
    typeof durationMinutes === 'number' &&
    Number.isFinite(ratioNormalized) &&
    typeof jobLevel === 'string' &&
    (validLevels as string[]).includes(jobLevel)
  ) {
    const baseline: RequirementBaselineFormData = {
      frequency,
      durationMinutes,
      automationRatio: ratioNormalized,
      jobLevel: jobLevel as JobLevel,
    };
    return { baseline, cost: computeCostEstimate(baseline), form_data: { ...formData, automationRatio: ratioNormalized } };
  }
  return { form_data: formData };
};

export const createRequirement = async (values: Record<string, unknown>): Promise<RequirementItem> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const now = new Date().toISOString();
  const creator = mockCreators['user-001'];
  const { baseline, cost, form_data } = extractBaselineAndCost(values.form_data as Record<string, unknown> | undefined);
  const newItem: RequirementItem = {
    id: generateUUID(),
    req_no: `REQ-2026-${String(mockRequirementData.length + 1).padStart(4, '0')}`,
    scheme_id: ACTIVE_SCHEME.id,
    scheme_version: ACTIVE_SCHEME.version,
    title: values.title as string,
    description: (values.description as string) || '',
    owning_department_name: values.department as string,
    owning_department_id: 'dept-new',
    owner_id: 'user-001',
    owner_name: creator.name,
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
    form_data,
    baselineFormData: baseline,
    costEstimate: cost,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
  mockRequirementData.unshift(newItem);
  return newItem;
};

export const updateRequirement = async (id: string, values: Record<string, unknown>): Promise<RequirementItem | null> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const index = mockRequirementData.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const cur = mockRequirementData[index];
  const incomingFormData = values.form_data as Record<string, unknown> | undefined;
  const { baseline, cost, form_data } = incomingFormData
    ? extractBaselineAndCost(incomingFormData)
    : { baseline: cur.baselineFormData, cost: cur.costEstimate, form_data: cur.form_data };
  mockRequirementData[index] = {
    ...cur,
    title: values.title as string,
    description: (values.description as string) || cur.description,
    owning_department_name: (values.department as string) || cur.owning_department_name,
    priority: (values.priority as RequirementPriority) || cur.priority,
    contactInfo: (values.contactInfo as string) || '',
    expectedLaunchDate: values.expectedLaunchDate
      ? (values.expectedLaunchDate as Date).toISOString()
      : cur.expectedLaunchDate,
    form_data,
    baselineFormData: baseline,
    costEstimate: cost,
    updatedAt: new Date().toISOString(),
  };
  return mockRequirementData[index];
};

// ============= Mock 活动记录 =============

const activityTemplates: Partial<Record<RequirementStatus, ActivityRecord[]>> = {
  DRAFT: [
    { id: 'act-1', type: 'created', actorId: 'user-001', actorName: 'John Smith', content: 'Created this requirement as a draft.', timestamp: '' },
  ],
  PENDING_APPROVAL: [
    { id: 'act-1', type: 'created', actorId: 'user-001', actorName: 'John Smith', content: 'Created this requirement as a draft.', timestamp: '' },
    { id: 'act-2', type: 'status_change', actorId: 'user-001', actorName: 'John Smith', content: 'Submitted for approval.', fromStatus: 'DRAFT', toStatus: 'PENDING_APPROVAL', timestamp: '' },
  ],
  PENDING_ASSESSMENT: [
    { id: 'act-1', type: 'created', actorId: 'user-004', actorName: 'Sarah Li', content: 'Created this requirement as a draft.', timestamp: '' },
    { id: 'act-2', type: 'approval', actorId: 'user-007', actorName: 'Robert Xu', content: 'Approved. Proceed with technical assessment.', timestamp: '' },
    { id: 'act-3', type: 'comment', actorId: 'user-003', actorName: 'Michael Wang', content: 'Starting technical feasibility assessment.', timestamp: '' },
  ],
  PENDING_PROJECT: [
    { id: 'act-1', type: 'created', actorId: 'user-002', actorName: 'Emily Chen', content: 'Created this requirement as a draft.', timestamp: '' },
    { id: 'act-2', type: 'approval', actorId: 'user-007', actorName: 'Robert Xu', content: 'Approved. The business case is solid.', timestamp: '' },
    { id: 'act-3', type: 'assessment', actorId: 'user-008', actorName: 'Angela Wu', content: 'Assessment passed. Ready for project initiation.', timestamp: '' },
  ],
  REJECTED: [
    { id: 'act-1', type: 'created', actorId: 'user-002', actorName: 'Emily Chen', content: 'Created this requirement as a draft.', timestamp: '' },
    { id: 'act-2', type: 'approval', actorId: 'user-007', actorName: 'Robert Xu', content: 'Rejected. Insufficient ROI justification.', timestamp: '' },
  ],
  WITHDRAWN: [
    { id: 'act-1', type: 'created', actorId: 'user-001', actorName: 'John Smith', content: 'Created this requirement as a draft.', timestamp: '' },
    { id: 'act-2', type: 'status_change', actorId: 'user-001', actorName: 'John Smith', content: 'Withdrawn the requirement.', fromStatus: 'PENDING_APPROVAL', toStatus: 'WITHDRAWN', timestamp: '' },
  ],
  DEVELOPING: [
    { id: 'act-1', type: 'created', actorId: 'user-002', actorName: 'Emily Chen', content: 'Created this requirement.', timestamp: '' },
    { id: 'act-2', type: 'approval', actorId: 'user-007', actorName: 'Robert Xu', content: 'Approved.', timestamp: '' },
    { id: 'act-3', type: 'assessment', actorId: 'user-008', actorName: 'Angela Wu', content: 'Technical assessment completed. Score: 82/100.', timestamp: '' },
    { id: 'act-4', type: 'status_change', actorId: 'user-003', actorName: 'Michael Wang', content: 'Development started.', fromStatus: 'PENDING_PROJECT', toStatus: 'DEVELOPING', timestamp: '' },
  ],
  LAUNCHED: [
    { id: 'act-1', type: 'created', actorId: 'user-001', actorName: 'John Smith', content: 'Created this requirement.', timestamp: '' },
    { id: 'act-2', type: 'approval', actorId: 'user-007', actorName: 'Robert Xu', content: 'Approved.', timestamp: '' },
    { id: 'act-3', type: 'assessment', actorId: 'user-008', actorName: 'Angela Wu', content: 'Assessment passed. Score: 88/100.', timestamp: '' },
    { id: 'act-4', type: 'status_change', actorId: 'user-001', actorName: 'John Smith', content: 'Deployed to production. Now running.', fromStatus: 'DEVELOPING', toStatus: 'LAUNCHED', timestamp: '' },
  ],
  OFFLINE: [
    { id: 'act-1', type: 'created', actorId: 'user-005', actorName: 'David Zhang', content: 'Created this requirement.', timestamp: '' },
    { id: 'act-2', type: 'status_change', actorId: 'user-005', actorName: 'David Zhang', content: 'Requirement taken offline.', fromStatus: 'LAUNCHED', toStatus: 'OFFLINE', timestamp: '' },
  ],
};

export const fetchActivities = async (requirementId: string): Promise<ActivityRecord[]> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const req = mockRequirementData.find((r) => r.id === requirementId);
  if (!req) return [];
  const templates = activityTemplates[req.status] || activityTemplates.DRAFT || [];
  const baseDate = new Date(req.createdAt);
  return templates.map((tpl, i) => ({
    ...tpl,
    id: `${requirementId}-act-${i}`,
    timestamp: new Date(baseDate.getTime() + i * 2 * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

export const updateRequirementStatus = async (
  id: string,
  newStatus: string,
  _comment?: string,
): Promise<RequirementItem | null> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const index = mockRequirementData.findIndex((item) => item.id === id);
  if (index === -1) return null;
  mockRequirementData[index] = {
    ...mockRequirementData[index],
    status: newStatus as RequirementStatus,
    updatedAt: new Date().toISOString(),
  };
  return mockRequirementData[index];
};

export const updateRequirementAssessment = async (
  id: string,
  assessment: DetailedAssessment,
): Promise<RequirementItem | null> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const index = mockRequirementData.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const cur = mockRequirementData[index];
  const newVersion: VersionSnapshot = {
    version: (cur.historyVersions?.length ?? 0) + 1,
    createdAt: new Date().toISOString(),
    actorId: assessment.assessorId,
    actorName: assessment.assessorName,
    summary: `Assessment completed (net ${assessment.netScore}, ${assessment.conclusion}).`,
    snapshot: {
      title: cur.title,
      description: cur.description,
      priority: cur.priority,
      status: cur.status,
      detailedAssessment: assessment,
    },
  };
  mockRequirementData[index] = {
    ...cur,
    detailedAssessment: assessment,
    historyVersions: [...(cur.historyVersions ?? []), newVersion],
    updatedAt: new Date().toISOString(),
  };
  return mockRequirementData[index];
};

// 注：成本预估完全由 baselineFormData 自动计算，无对外编辑接口（STORY-010）。
// 将来 Scheme.cost_config 变更时，可调用 computeCostEstimate 批量重算 mockRequirementData。

// ============= Story-006 多级审批 mock =============

const APPROVAL_LEVEL_TEMPLATES: Array<{ name: string; mode: ApprovalFlowLevel['mode']; approvers: Array<{ id: string; name: string }> }> = [
  { name: '部门主管审批', mode: 'any_one', approvers: [{ id: 'user-001', name: 'John Smith' }, { id: 'user-007', name: 'Robert Xu' }] },
  { name: '业务审批（会签）', mode: 'all',     approvers: [{ id: 'user-002', name: 'Emily Chen' }, { id: 'user-006', name: 'Jessica Liu' }] },
  { name: 'IT 复核',         mode: 'any_one', approvers: [{ id: 'user-008', name: 'Angela Wu' }, { id: 'user-003', name: 'Michael Wang' }] },
];

/** 根据需求当前状态推导审批流的进度（mock） */
export const generateMockApprovalFlow = (status: RequirementStatus): MultiLevelApprovalConfig | undefined => {
  if (status === 'DRAFT' || status === 'WITHDRAWN') return undefined;

  // 推导 currentLevel + 各级 approver 状态
  const baseTime = new Date(2026, 1, 10).getTime();
  const buildLevel = (idx: number, levelStatus: 'all_approved' | 'pending_here' | 'wait' | 'rejected_here'): ApprovalFlowLevel => {
    const tpl = APPROVAL_LEVEL_TEMPLATES[idx];
    const approvers: ApprovalFlowApprover[] = tpl.approvers.map((a, i) => {
      if (levelStatus === 'all_approved') {
        return { ...a, status: 'APPROVED', actedAt: new Date(baseTime + (idx * 2 + i) * 3600 * 1000).toISOString(), comment: '审核通过' };
      }
      if (levelStatus === 'rejected_here') {
        return i === 0
          ? { ...a, status: 'REJECTED', actedAt: new Date(baseTime + idx * 3600 * 1000).toISOString(), comment: 'ROI 论证不充分，请补充材料后重新提交' }
          : { ...a, status: 'PENDING' };
      }
      return { ...a, status: 'PENDING' };
    });
    return { level: idx + 1, name: tpl.name, mode: tpl.mode, approvers };
  };

  let currentLevel = 1;
  const levels: ApprovalFlowLevel[] = [];

  if (status === 'PENDING_APPROVAL') {
    currentLevel = 1;
    levels.push(buildLevel(0, 'pending_here'));
    levels.push(buildLevel(1, 'wait'));
    levels.push(buildLevel(2, 'wait'));
  } else if (status === 'REJECTED') {
    currentLevel = 1;
    levels.push(buildLevel(0, 'rejected_here'));
    levels.push(buildLevel(1, 'wait'));
    levels.push(buildLevel(2, 'wait'));
  } else {
    // PENDING_ASSESSMENT / PENDING_PROJECT / DEVELOPING / LAUNCHED / OFFLINE → 全部通过
    currentLevel = 4;
    levels.push(buildLevel(0, 'all_approved'));
    levels.push(buildLevel(1, 'all_approved'));
    levels.push(buildLevel(2, 'all_approved'));
  }

  return { levels, currentLevel };
};

/** 当前 mock 用户 */
export const MOCK_CURRENT_USER_ID = 'user-001';

const isLevelSatisfied = (level: ApprovalFlowLevel): { passed: boolean; rejected: boolean } => {
  const approved = level.approvers.filter((a) => a.status === 'APPROVED').length;
  const rejected = level.approvers.filter((a) => a.status === 'REJECTED').length;
  const total = level.approvers.length;
  if (level.mode === 'all') {
    return { passed: approved === total, rejected: rejected > 0 };
  }
  if (level.mode === 'any_one') {
    return { passed: approved >= 1, rejected: rejected === total };
  }
  // majority
  return { passed: approved * 2 > total, rejected: rejected * 2 >= total };
};

/** 推进审批流（mock）：当前级当前用户审批后，按 mode 判断是否进位 */
export const advanceApprovalFlow = async (
  id: string,
  action: 'approve' | 'reject',
  comment?: string,
): Promise<RequirementItem | null> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const index = mockRequirementData.findIndex((r) => r.id === id);
  if (index === -1) return null;
  const cur = mockRequirementData[index];
  if (!cur.approvalFlowConfig) return cur;

  const config = cur.approvalFlowConfig;
  const levels = config.levels.map((lv) => ({ ...lv, approvers: lv.approvers.map((a) => ({ ...a })) }));
  const currentIdx = config.currentLevel - 1;
  const lv = levels[currentIdx];
  if (!lv) return cur;

  const me = lv.approvers.find((a) => a.id === MOCK_CURRENT_USER_ID && a.status === 'PENDING');
  if (!me) return cur;

  me.status = action === 'approve' ? 'APPROVED' : 'REJECTED';
  me.comment = comment;
  me.actedAt = new Date().toISOString();

  const { passed, rejected } = isLevelSatisfied(lv);
  let newStatus = cur.status;
  let newCurrentLevel = config.currentLevel;

  if (rejected) {
    newStatus = 'REJECTED';
  } else if (passed) {
    if (currentIdx === levels.length - 1) {
      newStatus = 'PENDING_ASSESSMENT';
      newCurrentLevel = config.currentLevel + 1;
    } else {
      newCurrentLevel = config.currentLevel + 1;
    }
  }

  mockRequirementData[index] = {
    ...cur,
    status: newStatus,
    approvalFlowConfig: { levels, currentLevel: newCurrentLevel },
    updatedAt: new Date().toISOString(),
  };
  return mockRequirementData[index];
};

// ============= Story-009 关联流程 增删 =============

export const addLinkedProcess = async (
  requirementId: string,
  processId: string,
): Promise<RequirementItem | null> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const index = mockRequirementData.findIndex((r) => r.id === requirementId);
  if (index === -1) return null;
  const cur = mockRequirementData[index];
  const exists = (cur.linkedProcesses ?? []).some((p) => p.id === processId);
  if (exists) return cur;
  const proc = MOCK_PROCESS_POOL.find((p) => p.id === processId);
  if (!proc) return cur;
  mockRequirementData[index] = {
    ...cur,
    linkedProcesses: [...(cur.linkedProcesses ?? []), { ...proc }],
    updatedAt: new Date().toISOString(),
  };
  return mockRequirementData[index];
};

export const removeLinkedProcess = async (
  requirementId: string,
  processId: string,
): Promise<RequirementItem | null> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const index = mockRequirementData.findIndex((r) => r.id === requirementId);
  if (index === -1) return null;
  const cur = mockRequirementData[index];
  mockRequirementData[index] = {
    ...cur,
    linkedProcesses: (cur.linkedProcesses ?? []).filter((p) => p.id !== processId),
    updatedAt: new Date().toISOString(),
  };
  return mockRequirementData[index];
};

