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
  ApprovalHistoryEntry,
  ApprovalHistoryAction,
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

  // ===== 闭环演示数据：覆盖「待我审批 / 待我评估 / 被驳回 / 已撤回 / 历史版本」 =====
  { title: 'Financial Report Auto-Aggregation', description: 'Aggregate monthly financial reports from ERP and CRM into a unified view with auto-distribution to executives.', owning_department_name: 'Finance', owning_department_id: 'dept-001', creatorId: 'user-007', priority: 'HIGH', status: 'PENDING_APPROVAL' },
  { title: 'Customer Ticket Smart Classification', description: 'Use NLP to classify customer support tickets and route to the proper queue with SLA tracking.', owning_department_name: 'Sales', owning_department_id: 'dept-006', creatorId: 'user-006', priority: 'MEDIUM', status: 'PENDING_APPROVAL' },
  { title: 'Invoice OCR Data Capture', description: 'Capture invoice fields via OCR, validate against PO and route exceptions for human review.', owning_department_name: 'Finance', owning_department_id: 'dept-001', creatorId: 'user-007', priority: 'HIGH', status: 'PENDING_ASSESSMENT' },
  { title: 'Contract Approval Workflow', description: 'End-to-end contract approval workflow with legal review, e-signature integration and archival.', owning_department_name: 'Finance', owning_department_id: 'dept-001', creatorId: 'user-001', priority: 'MEDIUM', status: 'REJECTED' },
  { title: 'Inventory Audit Robot', description: 'Daily inventory audit robot reconciling WMS and ERP with discrepancy escalation.', owning_department_name: 'Finance', owning_department_id: 'dept-001', creatorId: 'user-001', priority: 'MEDIUM', status: 'WITHDRAWN' },
  { title: 'Month-End Reconciliation Automation', description: 'Automate month-end reconciliation across GL, AR, AP and bank statements with variance reporting.', owning_department_name: 'Finance', owning_department_id: 'dept-001', creatorId: 'user-001', priority: 'HIGH', status: 'LAUNCHED' },
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
      form_data: (() => {
        const base: Record<string, unknown> = baselineFormData ? { ...baselineFormData } : {};
        // 富表单字段（覆盖各数据类型示例）
        base.scenario_name = tpl.title;
        base.category_l1 = ['tax', 'finance', 'hr', 'procurement', 'other'][index % 5];
        base.category_l2 = '应付账款';
        base.category_l3 = '发票核对';
        base.operation_steps = '1. 登录 SAP 系统\n2. 导出当月发票明细\n3. 与银行回单逐笔核对\n4. 标记差异并生成报告\n5. 邮件发送给财务主管复核';
        base.application_unit = `${tpl.owning_department_name} 业务组`;
        base.contact_name = creator.name;
        base.contact_phone = '13800138000';
        base.business_context = '当前流程由财务专员每月手工处理，平均耗时 40 小时/月，错误率约 3%，存在月底加班严重、对账延迟等痛点。自动化后预计可释放人力 80%，并将差错率降至 0.1% 以下。';
        base.expected_launch_date = launchDate.toISOString().substring(0, 10);
        base.is_compliance_required = index % 2 === 0 ? 'yes' : 'no';
        base.related_systems = index % 3 === 0 ? ['sap', 'excel', 'email'] : ['kingdee', 'excel'];
        base.process_screenshot = [
          { uid: `${id}-shot-1`, name: '当前流程截图.png', size: 245678, url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80' },
          { uid: `${id}-shot-2`, name: '系统操作录屏.mp4', size: 8456123, url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
        ];
        base.attachments = [
          { uid: `${id}-att-1`, name: 'PRD-需求说明书.pdf', size: 1234567, url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
          { uid: `${id}-att-2`, name: '业务流程图.vsdx', size: 456789, url: 'https://file-examples.com/storage/fe5947fd2362fc197a3c2df/2017/02/file_example_XLSX_10.xlsx' },
        ];
        // RPA 统计表标准方案字段（让列表的"操作类型"等列有数据展示）
        const opTypes = ['business_operation', 'data_processing', 'audit_check', 'monitor_alert', 'interactive_response', 'voucher_creation', 'voucher_review', 'other'];
        base.operation_type = opTypes[index % opTypes.length];
        base.requirement_description = tpl.description;
        base.requirement_analyst = creator.name;
        base.involved_systems = index % 3 === 0 ? ['FMIS', 'Excel'] : index % 3 === 1 ? ['SAP', 'Chrome'] : ['SSF', 'Excel', 'Edge'];
        base.business_coverage_unit = `${tpl.owning_department_name} 业务组`;
        base.per_capita_frequency = 20 + (index * 5) % 80;
        base.per_capita_duration = 30 + (index * 7) % 120;
        base.application_target = ['internal_shared', 'service_enterprise', 'other'][index % 3];
        base.business_contact = `${creator.name} 13800138000`;
        base.expected_complete_date = launchDate.toISOString().substring(0, 10);
        return base;
      })(),
      baselineFormData,
      costEstimate,
      historyVersions: generateMockVersions(tpl.status, index, tpl.title, tpl.description, tpl.priority),
      linkedProcesses: generateMockLinkedProcesses(tpl.status, index),
      linkedProject: generateMockLinkedProject(tpl.status, index),
      linkedWorkspace: generateMockLinkedWorkspace(tpl.status, index),
      unboundProcessCount: generateMockUnboundCount(tpl.status, index),
      approvalFlowConfig: generateMockApprovalFlow(tpl.status, { creatorId: tpl.creatorId, owning_department_id: tpl.owning_department_id }),
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
import { getActiveScheme as getActiveSchemeFromStore, PRESET_SCHEMES, subscribeSchemeChange, getSchemeVersion } from './schemeConfig';
import { useSyncExternalStore } from 'react';
import { resolveApprovers } from './utils/approverResolver';

/** 默认 cost 配置回退（当激活方案缺 cost_config 时使用） */
const DEFAULT_COST_CONFIG: SchemeCostConfig = {
  workingHoursPerDay: 8,
  rateTable: { junior: 300, middle: 500, senior: 700, manager: 900 },
  levelLabels: { junior: '初级员工', middle: '中级员工', senior: '高级员工', manager: '管理层（经理及以上）' },
  schemeName: 'RPA Pro 标准方案',
};

/** 取当前激活方案；若无（如初始化阶段）则回落到首个预设方案 */
const getEffectiveScheme = (): RequirementScheme =>
  getActiveSchemeFromStore() ?? PRESET_SCHEMES[0];

/** 当前激活方案是否启用了审批流（至少 1 级） */
export const schemeHasApproval = (): boolean => {
  const s = getEffectiveScheme();
  return (s.approval_flow?.levels?.length ?? 0) > 0;
};

/** 当前激活方案是否启用了评估模型（价值 / 复杂度任一存在即视为启用） */
export const schemeHasAssessment = (): boolean => {
  const s = getEffectiveScheme();
  return !!(s.value_assessment_model || s.complexity_assessment_model);
};

/** DRAFT 提交后的目标状态：依据方案是否含审批/评估，跳过对应阶段 */
export const resolveSubmittedStatus = (): RequirementStatus => {
  if (schemeHasApproval()) return 'PENDING_APPROVAL';
  if (schemeHasAssessment()) return 'PENDING_ASSESSMENT';
  return 'PENDING_PROJECT';
};

/** 审批通过后的目标状态：无评估则跳过 PENDING_ASSESSMENT */
export const resolvePostApprovalStatus = (): RequirementStatus => {
  return schemeHasAssessment() ? 'PENDING_ASSESSMENT' : 'PENDING_PROJECT';
};

/**
 * React Hook：订阅当前激活方案的关键标志位（hasApproval/hasAssessment）。
 * 当用户在「需求方案」页切换激活方案时，所有使用此 hook 的组件会自动重渲染，
 * 按钮文案、确认弹窗内容与提交目标状态保持一致。
 */
export const useSchemeFlags = (): {
  hasApproval: boolean;
  hasAssessment: boolean;
  submittedStatus: RequirementStatus;
  postApprovalStatus: RequirementStatus;
} => {
  useSyncExternalStore(subscribeSchemeChange, getSchemeVersion, getSchemeVersion);
  return {
    hasApproval: schemeHasApproval(),
    hasAssessment: schemeHasAssessment(),
    submittedStatus: resolveSubmittedStatus(),
    postApprovalStatus: resolvePostApprovalStatus(),
  };
};

export const getActiveSchemeCostConfig = (): SchemeCostConfig => {
  const scheme = getEffectiveScheme();
  const cc = scheme.cost_config;
  if (!cc?.rate_table) {
    return { ...DEFAULT_COST_CONFIG, schemeName: scheme.name };
  }
  return {
    workingHoursPerDay: cc.working_hours_per_day,
    rateTable: cc.rate_table,
    levelLabels: cc.level_labels,
    schemeName: scheme.name,
  };
};

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

const JOB_LEVEL_POOL: JobLevel[] = ['junior', 'middle', 'senior', 'manager'];

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

/** 项目内可关联的流程候选池（mock） */
export const MOCK_PROCESS_POOL: LinkedProcess[] = [
  { id: 'proc-001', name: 'Procurement Approval Process',  status: 'ONLINE',     ownerName: 'Sarah Li' },
  { id: 'proc-002', name: 'Invoice OCR Pipeline',          status: 'TESTING',    ownerName: 'Michael Wang' },
  { id: 'proc-003', name: 'Vendor Notification Workflow',  status: 'DEVELOPING', ownerName: 'Emily Chen' },
  { id: 'proc-004', name: 'Expense Report Validation',     status: 'ONLINE',     ownerName: 'Robert Xu' },
  { id: 'proc-005', name: 'Employee Onboarding Bot',       status: 'PENDING',    ownerName: 'Emily Chen' },
  { id: 'proc-006', name: 'Inventory Reconciliation Flow', status: 'ONLINE',     ownerName: 'David Zhang' },
  { id: 'proc-007', name: 'Customer Notification Workflow',status: 'FAILED',     ownerName: 'Jessica Liu' },
  { id: 'proc-008', name: 'Tax Filing Data Compiler',      status: 'DEVELOPING', ownerName: 'John Smith' },
  { id: 'proc-009', name: 'Sales Pipeline Sync',           status: 'TESTING',    ownerName: 'Jessica Liu' },
  { id: 'proc-010', name: 'IT Patch Deployment Bot',       status: 'ONLINE',     ownerName: 'Angela Wu' },
];

const generateMockLinkedProcesses = (status: RequirementStatus, idx: number): LinkedProcess[] | undefined => {
  if (!(['DEVELOPING', 'LAUNCHED', 'OFFLINE'] as RequirementStatus[]).includes(status)) return undefined;
  // 开发中：偏多关联流程（3-4 个），且包含开发中/测试中等进行中状态，更贴近真实开发阶段
  if (status === 'DEVELOPING') {
    const developingMix: LinkedProcess[][] = [
      [
        { id: 'proc-002', name: 'Invoice OCR Pipeline',           status: 'TESTING',    ownerName: 'Michael Wang' },
        { id: 'proc-003', name: 'Vendor Notification Workflow',   status: 'DEVELOPING', ownerName: 'Emily Chen' },
        { id: 'proc-008', name: 'Tax Filing Data Compiler',       status: 'DEVELOPING', ownerName: 'John Smith' },
      ],
      [
        { id: 'proc-005', name: 'Employee Onboarding Bot',        status: 'PENDING',    ownerName: 'Emily Chen' },
        { id: 'proc-009', name: 'Sales Pipeline Sync',            status: 'TESTING',    ownerName: 'Jessica Liu' },
        { id: 'proc-003', name: 'Vendor Notification Workflow',   status: 'DEVELOPING', ownerName: 'Emily Chen' },
        { id: 'proc-010', name: 'IT Patch Deployment Bot',        status: 'DEVELOPING', ownerName: 'Angela Wu' },
      ],
      [
        { id: 'proc-008', name: 'Tax Filing Data Compiler',       status: 'DEVELOPING', ownerName: 'John Smith' },
        { id: 'proc-002', name: 'Invoice OCR Pipeline',           status: 'TESTING',    ownerName: 'Michael Wang' },
        { id: 'proc-006', name: 'Inventory Reconciliation Flow',  status: 'DEVELOPING', ownerName: 'David Zhang' },
      ],
    ];
    return developingMix[idx % developingMix.length];
  }
  // 已上线：3-4 个流程,以 ONLINE 为主，偶尔混入 1 个 TESTING（小版本迭代场景）
  if (status === 'LAUNCHED') {
    const launchedMix: LinkedProcess[][] = [
      [
        { id: 'proc-001', name: 'Procurement Approval Process',   status: 'ONLINE',     ownerName: 'Sarah Li' },
        { id: 'proc-004', name: 'Expense Report Validation',      status: 'ONLINE',     ownerName: 'Robert Xu' },
        { id: 'proc-010', name: 'IT Patch Deployment Bot',        status: 'ONLINE',     ownerName: 'Angela Wu' },
      ],
      [
        { id: 'proc-006', name: 'Inventory Reconciliation Flow',  status: 'ONLINE',     ownerName: 'David Zhang' },
        { id: 'proc-001', name: 'Procurement Approval Process',   status: 'ONLINE',     ownerName: 'Sarah Li' },
        { id: 'proc-002', name: 'Invoice OCR Pipeline',           status: 'TESTING',    ownerName: 'Michael Wang' },
        { id: 'proc-004', name: 'Expense Report Validation',      status: 'ONLINE',     ownerName: 'Robert Xu' },
      ],
      [
        { id: 'proc-010', name: 'IT Patch Deployment Bot',        status: 'ONLINE',     ownerName: 'Angela Wu' },
        { id: 'proc-006', name: 'Inventory Reconciliation Flow',  status: 'ONLINE',     ownerName: 'David Zhang' },
        { id: 'proc-001', name: 'Procurement Approval Process',   status: 'ONLINE',     ownerName: 'Sarah Li' },
      ],
    ];
    return launchedMix[idx % launchedMix.length];
  }
  return MOCK_PROCESS_POOL.slice(0, (idx % 3) + 1);
};

// 与 RequirementsProjects/mockData.ts 中的 projects 数组一一对应（id/name），用于列表筛选下拉。
export const MOCK_PROJECT_POOL = [
  { id: 'proj-001', name: 'Finance Automation 2026' },
  { id: 'proj-002', name: 'HR Digital Transformation' },
  { id: 'proj-003', name: 'IT Operations Excellence' },
  { id: 'proj-004', name: 'Procurement & Supply Chain' },
  { id: 'proj-005', name: 'Sales Enablement Platform' },
];

// 注：linkedProject / linkedWorkspace 不再在此本地随机赋值，统一由
// RequirementsProjects/mockData.ts 的 ensureDemoSeed 按部门确定性地写回。
const generateMockLinkedProject = (_status: RequirementStatus, _idx: number) => undefined as { id: string; name: string } | undefined;
const generateMockLinkedWorkspace = (_status: RequirementStatus, _idx: number) => undefined as { id: string; name: string } | undefined;

const generateMockUnboundCount = (status: RequirementStatus, idx: number): number | undefined => {
  if (!(['DEVELOPING', 'LAUNCHED'] as RequirementStatus[]).includes(status)) return undefined;
  return idx % 5 === 0 ? 1 : undefined;
};

/** 同步快照：供 RequirementsProjects 模块按部门绑定需求时使用，避免循环 fetch。 */
export const getMockRequirementsSnapshot = (): { id: string; status: string; owning_department_id: string }[] =>
  mockRequirementData.map((r) => ({ id: r.id, status: r.status, owning_department_id: r.owning_department_id }));

/** 由 RequirementsProjects/ensureDemoSeed 调用，回写 linkedProject / linkedWorkspace 到需求侧。 */
export const patchRequirementLinks = (
  links: Map<string, { project: { id: string; name: string }; workspace: { id: string; name: string } }>,
): void => {
  mockRequirementData = mockRequirementData.map((r) => {
    const link = links.get(r.id);
    if (!link) return r;
    return { ...r, linkedProject: link.project, linkedWorkspace: link.workspace };
  });
};

// 注：需求中心侧不再支持直接关联/解除流程，关联入口已收敛至工作空间与开发中心。
// 原 addLinkedProcesses / removeLinkedProcess 已移除。

let mockRequirementData = generateMockRequirements();

// ============= 闭环演示数据后处理 =============
// 为「待我审批 / 待我评估 / 被驳回 / 已撤回 / 历史版本」场景注入：
//  - 当前用户（user-001）作为当前审批节点的审批人
//  - approvalHistory（含 approve / reject / withdraw / resubmit）
//  - historyVersions（演示版本演进）
// 不修改 mockTemplates 字段，保持其它 mock 数据不受影响。
// 注意：MOCK_CURRENT_USER_ID 在文件下方声明（export const），这里先内联以避免 TDZ。
const __MOCK_CURRENT_USER_ID_FOR_CLOSURE__ = 'user-001';
applyClosureDemoData();

function applyClosureDemoData(): void {
  const meId = __MOCK_CURRENT_USER_ID_FOR_CLOSURE__;
  const me = mockCreators[meId];
  if (!me) return;

  const findByTitle = (title: string) => mockRequirementData.find((r) => r.title === title);

  // M1：待我审批 — 当前节点（L1）首位替换为当前用户
  const m1 = findByTitle('Financial Report Auto-Aggregation');
  if (m1?.approvalFlowConfig) {
    const lv = m1.approvalFlowConfig.levels[0];
    if (lv) {
      lv.approvers = [
        { id: meId, name: me.name, status: 'PENDING' },
        ...lv.approvers.slice(1),
      ];
    }
  }

  // M1.x：追加更多「待我审批」mock — 当前节点（L1）首位替换为当前用户
  const extraPendingTitles = [
    'Vendor Registration Portal',
    'Sales Commission Calculation',
    'Customer Credit Assessment',
    'Security Patch Deployment',
    'Cross-Border Shipping Compliance',
  ];
  extraPendingTitles.forEach((title) => {
    const r = findByTitle(title);
    if (r?.approvalFlowConfig) {
      const lv0 = r.approvalFlowConfig.levels[0];
      if (lv0) {
        lv0.approvers = [
          { id: meId, name: me.name, status: 'PENDING' },
          ...lv0.approvers.slice(1),
        ];
      }
    }
  });

  // M2：多级流 — L1 已通过，L2 当前用户审批中
  const m2 = findByTitle('Customer Ticket Smart Classification');
  if (m2?.approvalFlowConfig && m2.approvalFlowConfig.levels.length >= 2) {
    const flow = m2.approvalFlowConfig;
    const ts1 = new Date(2026, 1, 11, 10, 30).toISOString();
    flow.levels[0].approvers = flow.levels[0].approvers.map((a, i) =>
      i === 0
        ? { ...a, status: 'APPROVED', actedAt: ts1, comment: '业务价值清晰，同意推进。' }
        : { ...a, status: 'APPROVED', actedAt: ts1 },
    );
    flow.levels[1].approvers = [
      { id: meId, name: me.name, status: 'PENDING' },
      ...flow.levels[1].approvers.slice(1),
    ];
    flow.currentLevel = 2;
    m2.approvalHistory = [
      {
        id: 'hist-m2-1',
        level: 1,
        levelName: flow.levels[0].name,
        approverId: flow.levels[0].approvers[0].id,
        approverName: flow.levels[0].approvers[0].name,
        action: 'approve',
        comment: '业务价值清晰，同意推进。',
        timestamp: ts1,
      },
    ];
  }

  // M4：被驳回 — creator 改为当前用户，附 approvalHistory + 1 条 historyVersion
  const m4 = findByTitle('Contract Approval Workflow');
  if (m4) {
    m4.creatorId = meId;
    m4.creatorName = me.name;
    m4.creatorDepartment = me.department;
    m4.creatorRole = me.role;
    m4.creatorEmail = me.email;
    m4.owner_id = meId;
    m4.owner_name = me.name;
    const tReject = new Date(2026, 1, 8, 16, 0).toISOString();
    const rejecter = m4.approvalFlowConfig?.levels[0]?.approvers[0];
    m4.approvalHistory = [
      {
        id: 'hist-m4-1',
        level: 1,
        levelName: m4.approvalFlowConfig?.levels[0]?.name,
        approverId: rejecter?.id ?? 'user-007',
        approverName: rejecter?.name ?? 'Robert Xu',
        action: 'reject',
        comment: 'ROI 论证不充分，请补充材料后重新提交。',
        timestamp: tReject,
      },
    ];
    m4.historyVersions = [
      {
        version: 1,
        createdAt: new Date(2026, 1, 5, 10, 0).toISOString(),
        actorId: meId,
        actorName: me.name,
        summary: '初始提交审批。',
        snapshot: {
          title: m4.title,
          description: m4.description.substring(0, 60) + '...',
          priority: 'LOW',
          status: 'PENDING_APPROVAL',
        },
      },
    ];
  }

  // M5：已撤回 — creator=当前用户，附 withdraw + resubmit + withdraw 历史，2 条 historyVersions
  const m5 = findByTitle('Inventory Audit Robot');
  if (m5) {
    m5.creatorId = meId;
    m5.creatorName = me.name;
    m5.creatorDepartment = me.department;
    m5.creatorRole = me.role;
    m5.creatorEmail = me.email;
    m5.owner_id = meId;
    m5.owner_name = me.name;
    const t1 = new Date(2026, 1, 6, 9, 0).toISOString();
    const t2 = new Date(2026, 1, 7, 14, 0).toISOString();
    const t3 = new Date(2026, 1, 9, 11, 0).toISOString();
    m5.approvalHistory = [
      { id: 'hist-m5-1', level: 1, approverId: meId, approverName: me.name, action: 'withdraw', comment: '需补充自动化比例数据后再提交。', timestamp: t1 },
      { id: 'hist-m5-2', level: 1, approverId: meId, approverName: me.name, action: 'resubmit', comment: '已补充数据，重新提交审批。', timestamp: t2 },
      { id: 'hist-m5-3', level: 1, approverId: meId, approverName: me.name, action: 'withdraw', comment: '业务方案调整，再次撤回。', timestamp: t3 },
    ];
    m5.historyVersions = [
      {
        version: 1,
        createdAt: new Date(2026, 1, 5, 10, 0).toISOString(),
        actorId: meId,
        actorName: me.name,
        summary: '首次提交。',
        snapshot: { title: m5.title, description: m5.description.substring(0, 50) + '...', priority: 'LOW', status: 'PENDING_APPROVAL' },
      },
      {
        version: 2,
        createdAt: t2,
        actorId: meId,
        actorName: me.name,
        summary: '补充自动化比例与频率数据后重新提交。',
        snapshot: { title: m5.title, description: m5.description, priority: 'MEDIUM', status: 'PENDING_APPROVAL' },
      },
    ];
  }

  // M6：已上线 — 3 条 historyVersions 演示版本演进
  const m6 = findByTitle('Month-End Reconciliation Automation');
  if (m6) {
    m6.historyVersions = [
      {
        version: 1,
        createdAt: new Date(2026, 0, 15, 9, 0).toISOString(),
        actorId: meId,
        actorName: me.name,
        summary: '初始草稿创建。',
        snapshot: { title: m6.title, description: m6.description.substring(0, 60) + '...', priority: 'MEDIUM', status: 'DRAFT' },
      },
      {
        version: 2,
        createdAt: new Date(2026, 0, 22, 11, 30).toISOString(),
        actorId: 'user-007',
        actorName: 'Robert Xu',
        summary: '审批通过，进入评估。',
        snapshot: { title: m6.title, description: m6.description, priority: 'HIGH', status: 'PENDING_ASSESSMENT' },
      },
      {
        version: 3,
        createdAt: new Date(2026, 1, 18, 15, 0).toISOString(),
        actorId: meId,
        actorName: me.name,
        summary: '上线后二次编辑：补充对账维度。',
        snapshot: { title: m6.title, description: m6.description, priority: 'HIGH', status: 'LAUNCHED' },
      },
    ];
  }
}


// ============= 模拟 API 函数 =============

export const fetchRequirementList = async (params: RequirementQueryParams): Promise<RequirementListResponse> => {
  // 触发并等待项目侧种子，让 linkedProject / linkedWorkspace 已被回写
  try {
    const m = await import('../RequirementsProjects/mockData');
    await m.ensureDemoSeed();
  } catch {
    // 忽略：种子失败不应阻塞列表
  }
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

  if (params.projectFilter && params.projectFilter.length > 0) {
    filtered = filtered.filter(
      (item) => item.linkedProject?.id && params.projectFilter!.includes(item.linkedProject.id),
    );
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

/** 从 form_data 中提取基线四字段；齐全则计算节省。
 * 同时兼容新版 RPA-PRO 字段命名（frequency/duration/automation_ratio/job_level）
 * 与旧版命名（frequency/durationMinutes/automationRatio/jobLevel）。
 */
const extractBaselineAndCost = (
  formData: Record<string, unknown> | undefined,
): { baseline?: RequirementBaselineFormData; cost?: CostEstimateData; form_data?: Record<string, unknown> } => {
  if (!formData) return {};
  // 新键优先；缺失则回退到旧键
  const frequency = formData.frequency;
  const durationVal = formData.duration ?? formData.durationMinutes;
  const ratioVal = formData.automation_ratio ?? formData.automationRatio;
  const jobLevelVal = formData.job_level ?? formData.jobLevel;
  // percentage 字段为 0~100，统一归一化为 0~1
  const ratioRaw = typeof ratioVal === 'number' ? ratioVal : NaN;
  const ratioNormalized = ratioRaw > 1 ? ratioRaw / 100 : ratioRaw;
  if (
    typeof frequency === 'number' &&
    typeof durationVal === 'number' &&
    Number.isFinite(ratioNormalized) &&
    typeof jobLevelVal === 'string' && jobLevelVal.length > 0
  ) {
    const baseline: RequirementBaselineFormData = {
      frequency,
      durationMinutes: durationVal,
      automationRatio: ratioNormalized,
      jobLevel: jobLevelVal,
    };
    return { baseline, cost: computeCostEstimate(baseline), form_data: { ...formData, automation_ratio: ratioNormalized, automationRatio: ratioNormalized } };
  }
  return { form_data: formData };
};

export const createRequirement = async (values: Record<string, unknown>): Promise<RequirementItem> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const now = new Date().toISOString();
  const creator = mockCreators['user-001'];
  const { baseline, cost, form_data } = extractBaselineAndCost(values.form_data as Record<string, unknown> | undefined);
  const activeScheme = getEffectiveScheme();
  const newItem: RequirementItem = {
    id: generateUUID(),
    req_no: `REQ-2026-${String(mockRequirementData.length + 1).padStart(4, '0')}`,
    scheme_id: activeScheme.id,
    scheme_version: activeScheme.version,
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
    { id: 'act-3', type: 'assessment', actorId: 'user-003', actorName: 'Michael Wang', content: 'Starting technical feasibility assessment.', timestamp: '' },
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
  const cur = mockRequirementData[index];
  const target = newStatus as RequirementStatus;

  // 切到 PENDING_APPROVAL 时按方案生成审批流快照（无快照才生成，避免覆盖已有进度）
  let nextFlow = cur.approvalFlowConfig;
  if (target === 'PENDING_APPROVAL' && !nextFlow) {
    nextFlow = generateMockApprovalFlow('PENDING_APPROVAL', {
      creatorId: cur.creatorId,
      owning_department_id: cur.owning_department_id,
    });
  }

  mockRequirementData[index] = {
    ...cur,
    status: target,
    approvalFlowConfig: nextFlow,
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

// ============= Story-006 多级审批 mock（方案驱动） =============

/** 把 ApprovalLevelConfig.mode 兼容到运行时三态 */
function resolveLevelMode(cfgMode?: string, countSign?: boolean): ApprovalFlowLevel['mode'] {
  if (cfgMode === 'all' || cfgMode === 'any_one' || cfgMode === 'majority') return cfgMode;
  return countSign ? 'all' : 'any_one';
}

/**
 * 根据需求当前状态 + 当前激活方案的 approval_flow，生成多级审批运行时快照。
 * - DRAFT/WITHDRAWN：无审批流
 * - PENDING_APPROVAL：currentLevel=1，第一级 PENDING，其余 wait
 * - REJECTED：currentLevel=1，第一级首位 REJECTED，其余 wait
 * - 其它（已通过审批后）：全部 APPROVED
 */
export function generateMockApprovalFlow(
  status: RequirementStatus,
  requirement?: Pick<RequirementItem, 'creatorId' | 'owning_department_id'>,
): MultiLevelApprovalConfig | undefined {
  if (status === 'DRAFT' || status === 'WITHDRAWN') return undefined;

  const scheme = getEffectiveScheme();
  const levelConfigs = scheme.approval_flow?.levels ?? [];
  if (levelConfigs.length === 0) return undefined;

  // 兜底 requirement（mockTemplate 初始化阶段可能未传完整对象）
  const reqCtx = requirement ?? { creatorId: 'user-001', owning_department_id: 'dept-001' };
  const baseTime = new Date(2026, 1, 10).getTime();

  const buildLevel = (
    idx: number,
    levelStatus: 'all_approved' | 'pending_here' | 'wait' | 'rejected_here',
  ): ApprovalFlowLevel => {
    const cfg = levelConfigs[idx];
    const baseApprovers = resolveApprovers(cfg, reqCtx);
    const approvers: ApprovalFlowApprover[] = baseApprovers.map((a, i) => {
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
    return {
      level: idx + 1,
      name: cfg.name,
      mode: resolveLevelMode(cfg.mode, cfg.count_sign),
      approvers,
    };
  };

  const levels: ApprovalFlowLevel[] = levelConfigs.map((_, i) => {
    if (status === 'PENDING_APPROVAL') return buildLevel(i, i === 0 ? 'pending_here' : 'wait');
    if (status === 'REJECTED') return buildLevel(i, i === 0 ? 'rejected_here' : 'wait');
    return buildLevel(i, 'all_approved');
  });

  let currentLevel = 1;
  if (status === 'PENDING_APPROVAL' || status === 'REJECTED') currentLevel = 1;
  else currentLevel = levelConfigs.length + 1;

  return { levels, currentLevel };
}

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
      newStatus = resolvePostApprovalStatus();
      newCurrentLevel = config.currentLevel + 1;
    } else {
      newCurrentLevel = config.currentLevel + 1;
    }
  }

  const historyEntry: ApprovalHistoryEntry = {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    level: lv.level,
    levelName: lv.name,
    approverId: me.id,
    approverName: me.name,
    action,
    comment,
    timestamp: me.actedAt,
  };

  mockRequirementData[index] = {
    ...cur,
    status: newStatus,
    approvalFlowConfig: { levels, currentLevel: newCurrentLevel },
    approvalHistory: [...(cur.approvalHistory ?? []), historyEntry],
    updatedAt: new Date().toISOString(),
  };
  return mockRequirementData[index];
};

/** 撤回需求：仅 PENDING_APPROVAL + 提交人可调用，回到 DRAFT 并清空审批快照 */
export const withdrawRequirement = async (id: string): Promise<RequirementItem | null> => {
  await new Promise((r) => setTimeout(r, 200));
  const index = mockRequirementData.findIndex((r) => r.id === id);
  if (index === -1) return null;
  const cur = mockRequirementData[index];
  if (cur.status !== 'PENDING_APPROVAL' && cur.status !== 'PENDING_ASSESSMENT') {
    throw new Error('Only PENDING_APPROVAL or PENDING_ASSESSMENT requirements can be withdrawn');
  }
  if (cur.creatorId !== MOCK_CURRENT_USER_ID) {
    throw new Error('Only the creator can withdraw the requirement');
  }
  const now = new Date().toISOString();
  const submitter = mockCreators[cur.creatorId];
  const entry: ApprovalHistoryEntry = {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    level: cur.approvalFlowConfig?.currentLevel ?? 1,
    levelName: cur.approvalFlowConfig?.levels.find((l) => l.level === cur.approvalFlowConfig?.currentLevel)?.name,
    approverId: cur.creatorId,
    approverName: submitter?.name ?? cur.creatorName,
    action: 'withdraw',
    timestamp: now,
  };
  mockRequirementData[index] = {
    ...cur,
    // 撤回后保持「已撤回」语义状态，与 statusConfig/列表按钮联调一致
    status: 'WITHDRAWN',
    approvalFlowConfig: undefined,
    approvalHistory: [...(cur.approvalHistory ?? []), entry],
    updatedAt: now,
  };
  return mockRequirementData[index];
};

/** 重新提交：REJECTED/WITHDRAWN → 由当前方案决定目标状态（PENDING_APPROVAL / PENDING_ASSESSMENT / PENDING_PROJECT），保留历史 */
export const resubmitRequirement = async (id: string): Promise<RequirementItem | null> => {
  await new Promise((r) => setTimeout(r, 200));
  const index = mockRequirementData.findIndex((r) => r.id === id);
  if (index === -1) return null;
  const cur = mockRequirementData[index];
  if (cur.status !== 'REJECTED' && cur.status !== 'WITHDRAWN') {
    throw new Error('Only REJECTED or WITHDRAWN requirements can be resubmitted');
  }
  if (cur.creatorId !== MOCK_CURRENT_USER_ID) {
    throw new Error('Only the creator can resubmit the requirement');
  }
  const now = new Date().toISOString();
  const submitter = mockCreators[cur.creatorId];
  const targetStatus = resolveSubmittedStatus();
  const newFlow =
    targetStatus === 'PENDING_APPROVAL'
      ? generateMockApprovalFlow('PENDING_APPROVAL', {
          creatorId: cur.creatorId,
          owning_department_id: cur.owning_department_id,
        })
      : undefined;
  const entry: ApprovalHistoryEntry = {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    level: 1,
    levelName: newFlow?.levels[0]?.name,
    approverId: cur.creatorId,
    approverName: submitter?.name ?? cur.creatorName,
    action: 'resubmit',
    timestamp: now,
  };
  mockRequirementData[index] = {
    ...cur,
    status: targetStatus,
    approvalFlowConfig: newFlow,
    approvalHistory: [...(cur.approvalHistory ?? []), entry],
    updatedAt: now,
  };
  return mockRequirementData[index];
};

/**
 * 状态联动：当需求被关联到工作空间时，自动迁移到「开发中」并写入审批历史留痕。
 * 仅当当前状态属于审批/评估/待立项阶段时迁移；其余状态保持不变。
 */
export const transitionToDeveloping = async (
  requirementId: string,
  workspace: { id: string; name: string },
): Promise<RequirementItem | null> => {
  await new Promise((r) => setTimeout(r, 0));
  const index = mockRequirementData.findIndex((r) => r.id === requirementId);
  if (index === -1) return null;
  const cur = mockRequirementData[index];
  const migratable: RequirementStatus[] = [
    'PENDING_APPROVAL',
    'PENDING_ASSESSMENT',
    'PENDING_PROJECT',
  ];
  if (!migratable.includes(cur.status)) return cur;
  const now = new Date().toISOString();
  const entry: ApprovalHistoryEntry = {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    level: cur.approvalFlowConfig?.currentLevel ?? 1,
    approverId: 'system',
    approverName: '系统',
    action: 'approve',
    comment: `已关联至工作空间「${workspace.name}」，自动进入开发中`,
    timestamp: now,
  };
  mockRequirementData[index] = {
    ...cur,
    status: 'DEVELOPING',
    approvalHistory: [...(cur.approvalHistory ?? []), entry],
    updatedAt: now,
  };
  return mockRequirementData[index];
};

/** 重新导出激活方案查询，供其它模块使用（保持原 import 路径不变） */
export const getActiveScheme = getEffectiveScheme;

// ============================================================================
// STORY-014：立项后双步编辑 + 变更日志闭环
// ============================================================================

import type {
  RequirementChangeLog,
  RequirementDraft,
  ChangeType,
  ChangedFieldDiff,
  DevResponseAction,
} from './types';
import {
  computeFieldDiffs,
  classifyChangeType,
  isPostProjectStatus,
} from './utils/fieldEditability';

const draftStore = new Map<string, RequirementDraft>();
const draftKey = (rid: string, uid: string) => `${rid}::${uid}`;

let changeLogStore: RequirementChangeLog[] = [];

const seedChangeLogs = async () => {
  if (changeLogStore.length > 0) return;
  // 为所有「立项后」状态的需求各 mock 几条变更日志，覆盖三种类型与三种响应状态
  const targets = mockRequirementData.filter((r) =>
    ['PENDING_PROJECT', 'DEVELOPING', 'LAUNCHED', 'OFFLINE'].includes(r.status),
  );
  if (targets.length === 0) return;

  let resolveWs: ((id: string) => { workspace: { id: string; name: string } } | null) | null = null;
  try {
    const m = await import('../RequirementsProjects/mockData');
    resolveWs = (id: string) => m.findWorkspaceByRequirementId?.(id) ?? null;
  } catch {
    resolveWs = null;
  }

  const now = Date.now();
  const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString();
  const publisher = mockCreators[MOCK_CURRENT_USER_ID]?.name ?? '系统';
  const responder = mockCreators['user-002']?.name ?? '李工';

  targets.forEach((req, idx) => {
    const ws = resolveWs?.(req.id) ?? null;
    const baseId = req.id;

    // 1) CONTENT — 已发布无需响应（5 天前）
    changeLogStore.push({
      id: `chg-${baseId}-content`,
      requirementId: req.id,
      workspaceId: ws?.workspace?.id,
      workspaceName: ws?.workspace?.name,
      changeType: 'CONTENT',
      reason: '完善需求背景描述，补充上下游业务依赖说明，便于开发理解。',
      diffs: [
        { key: 'description', label: '需求描述', before: '原描述（节选）...', after: '更新后的描述（包含背景、目标、依赖）...' },
      ],
      publisherId: MOCK_CURRENT_USER_ID,
      publisherName: publisher,
      publishedAt: daysAgo(5),
      needsDevResponse: false,
      status: 'NONE',
    });

    // 2) DEV_IMPACT — 已响应（ACK / ADJUSTED / REJECTED 轮转）
    if (ws) {
      const respCycle: Array<'ACK' | 'ADJUSTED' | 'REJECTED'> = ['ACK', 'ADJUSTED', 'REJECTED'];
      const action = respCycle[idx % 3];
      changeLogStore.push({
        id: `chg-${baseId}-resolved`,
        requirementId: req.id,
        workspaceId: ws.workspace.id,
        workspaceName: ws.workspace.name,
        changeType: 'DEV_IMPACT',
        reason: '调整自动化比例由 60% 提升至 80%，预期收益翻倍，请评估技术可行性。',
        diffs: [
          { key: 'form.automation_ratio', label: '可自动化比例', before: '60%', after: '80%' },
        ],
        publisherId: MOCK_CURRENT_USER_ID,
        publisherName: publisher,
        publishedAt: daysAgo(3),
        needsDevResponse: true,
        status: 'RESOLVED',
        response: {
          id: `resp-${baseId}-1`,
          action,
          comment:
            action === 'REJECTED'
              ? '当前阶段无法支持，建议下一迭代评估，或拆分为独立子需求。'
              : action === 'ADJUSTED'
                ? '已按新比例调整排期，预计延后 2 天上线。'
                : undefined,
          responderId: 'user-002',
          responderName: responder,
          respondedAt: daysAgo(2),
        },
      });
    }

    // 3) DEV_IMPACT — 待响应且超时（>7 天，触发 ⚠️）
    if (ws) {
      changeLogStore.push({
        id: `chg-${baseId}-overdue`,
        requirementId: req.id,
        workspaceId: ws.workspace.id,
        workspaceName: ws.workspace.name,
        changeType: 'DEV_IMPACT',
        reason: '将优先级由中调整为高，请评估排期是否需要前置。',
        diffs: [{ key: 'priority', label: '优先级', before: 'MEDIUM', after: 'HIGH' }],
        publisherId: MOCK_CURRENT_USER_ID,
        publisherName: publisher,
        publishedAt: daysAgo(10),
        needsDevResponse: true,
        status: 'PENDING',
      });
    }

    // 4) SYSTEM — 系统自动变更（1 天前）
    changeLogStore.push({
      id: `chg-${baseId}-system`,
      requirementId: req.id,
      workspaceId: ws?.workspace?.id,
      workspaceName: ws?.workspace?.name,
      changeType: 'SYSTEM',
      reason: '系统根据立项流程自动同步关联工作空间。',
      diffs: [
        { key: 'linkedWorkspace', label: '关联工作空间', before: '-', after: ws?.workspace?.name ?? '-' },
      ],
      publisherId: 'system',
      publisherName: '系统',
      publishedAt: daysAgo(1),
      needsDevResponse: false,
      status: 'NONE',
    });
  });
};
let seeded = false;
let seedingPromise: Promise<void> | null = null;
const ensureSeeded = (): Promise<void> => {
  if (seeded) return Promise.resolve();
  if (!seedingPromise) {
    seedingPromise = seedChangeLogs().then(() => { seeded = true; });
  }
  return seedingPromise;
};


export const getDraft = async (
  requirementId: string,
  userId: string = MOCK_CURRENT_USER_ID,
): Promise<RequirementDraft | null> => {
  await new Promise((r) => setTimeout(r, 50));
  return draftStore.get(draftKey(requirementId, userId)) ?? null;
};

export const saveDraft = async (
  requirementId: string,
  patch: RequirementDraft['patch'],
  userId: string = MOCK_CURRENT_USER_ID,
): Promise<RequirementDraft> => {
  await new Promise((r) => setTimeout(r, 100));
  const cur = mockRequirementData.find((r) => r.id === requirementId);
  if (!cur) throw new Error('REQUIREMENT_NOT_FOUND');
  const draft: RequirementDraft = {
    requirementId,
    userId,
    patch,
    updatedAt: new Date().toISOString(),
    baseUpdatedAt: cur.updatedAt,
  };
  draftStore.set(draftKey(requirementId, userId), draft);
  return draft;
};

export const discardDraft = async (
  requirementId: string,
  userId: string = MOCK_CURRENT_USER_ID,
): Promise<void> => {
  await new Promise((r) => setTimeout(r, 50));
  draftStore.delete(draftKey(requirementId, userId));
};

export interface PublishChangeInput {
  requirementId: string;
  patch: RequirementDraft['patch'];
  reason: string;
}

export const previewChange = async (
  requirementId: string,
  patch: RequirementDraft['patch'],
): Promise<{ diffs: ChangedFieldDiff[]; type: ChangeType }> => {
  await new Promise((r) => setTimeout(r, 30));
  const cur = mockRequirementData.find((r) => r.id === requirementId);
  if (!cur) throw new Error('REQUIREMENT_NOT_FOUND');
  const diffs = computeFieldDiffs(cur, patch);
  return { diffs, type: classifyChangeType(diffs) };
};

export const publishChange = async (
  input: PublishChangeInput,
  userId: string = MOCK_CURRENT_USER_ID,
): Promise<RequirementChangeLog> => {
  ensureSeeded();
  await new Promise((r) => setTimeout(r, 200));
  const idx = mockRequirementData.findIndex((r) => r.id === input.requirementId);
  if (idx === -1) throw new Error('REQUIREMENT_NOT_FOUND');
  const cur = mockRequirementData[idx];
  if (!isPostProjectStatus(cur.status)) throw new Error('NOT_POST_PROJECT_STATUS');
  if (!input.reason || input.reason.trim().length < 10) throw new Error('CHANGE_REASON_TOO_SHORT');
  const diffs = computeFieldDiffs(cur, input.patch);
  if (diffs.length === 0) throw new Error('NO_CHANGES');
  const type = classifyChangeType(diffs);

  if (type === 'DEV_IMPACT') {
    const concurrent = changeLogStore.find(
      (c) =>
        c.requirementId === input.requirementId &&
        c.changeType === 'DEV_IMPACT' &&
        c.status === 'PENDING',
    );
    if (concurrent) throw new Error('DEV_IMPACT_CONCURRENT_PENDING');
  }

  let wsBinding: { workspace: { id: string; name: string } } | null = null;
  try {
    const m = await import('../RequirementsProjects/mockData');
    wsBinding = m.findWorkspaceByRequirementId?.(input.requirementId) ?? null;
  } catch { wsBinding = null; }
  const needsDevResponse = type === 'DEV_IMPACT' && !!wsBinding;

  const next: RequirementItem = {
    ...cur,
    ...(input.patch.title !== undefined ? { title: input.patch.title } : {}),
    ...(input.patch.description !== undefined ? { description: input.patch.description } : {}),
    ...(input.patch.priority !== undefined ? { priority: input.patch.priority } : {}),
    ...(input.patch.form_data !== undefined ? { form_data: input.patch.form_data } : {}),
    updatedAt: new Date().toISOString(),
    version: (cur.version ?? 1) + 1,
  };
  mockRequirementData[idx] = next;

  const log: RequirementChangeLog = {
    id: `chg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    requirementId: input.requirementId,
    workspaceId: wsBinding?.workspace?.id,
    workspaceName: wsBinding?.workspace?.name,
    changeType: type,
    reason: input.reason.trim(),
    diffs,
    publisherId: userId,
    publisherName: mockCreators[userId]?.name ?? '当前用户',
    publishedAt: new Date().toISOString(),
    needsDevResponse,
    status: needsDevResponse ? 'PENDING' : 'NONE',
  };
  changeLogStore.unshift(log);
  draftStore.delete(draftKey(input.requirementId, userId));
  return log;
};

export const respondChange = async (
  changeLogId: string,
  action: DevResponseAction,
  comment: string | undefined,
  userId: string = MOCK_CURRENT_USER_ID,
): Promise<RequirementChangeLog> => {
  ensureSeeded();
  await new Promise((r) => setTimeout(r, 150));
  const i = changeLogStore.findIndex((c) => c.id === changeLogId);
  if (i === -1) throw new Error('CHANGE_LOG_NOT_FOUND');
  const log = changeLogStore[i];
  if (!log.needsDevResponse) throw new Error('INVALID_DEV_RESPONSE_TARGET');
  if (log.status !== 'PENDING') throw new Error('ALREADY_RESPONDED');
  if (action === 'REJECTED' && (!comment || comment.trim().length < 10)) {
    throw new Error('REJECT_REASON_TOO_SHORT');
  }
  const updated: RequirementChangeLog = {
    ...log,
    status: 'RESOLVED',
    response: {
      id: `resp-${Date.now()}`,
      action,
      comment: comment?.trim() || undefined,
      responderId: userId,
      responderName: mockCreators[userId]?.name ?? '当前用户',
      respondedAt: new Date().toISOString(),
    },
  };
  changeLogStore[i] = updated;
  return updated;
};

export const listChangeLogs = async (
  requirementId: string,
): Promise<RequirementChangeLog[]> => {
  ensureSeeded();
  await new Promise((r) => setTimeout(r, 80));
  return changeLogStore
    .filter((c) => c.requirementId === requirementId)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
};

export const countUnackedByWorkspace = (workspaceId: string): number => {
  ensureSeeded();
  return changeLogStore.filter(
    (c) => c.workspaceId === workspaceId && c.status === 'PENDING',
  ).length;
};

export const earliestPendingAtByWorkspace = (workspaceId: string): string | null => {
  ensureSeeded();
  const list = changeLogStore.filter(
    (c) => c.workspaceId === workspaceId && c.status === 'PENDING',
  );
  if (list.length === 0) return null;
  return list.reduce((min, c) => (c.publishedAt < min ? c.publishedAt : min), list[0].publishedAt);
};

export const firstPendingChangeByWorkspace = (
  workspaceId: string,
): { requirementId: string; changeLogId: string } | null => {
  ensureSeeded();
  const log = changeLogStore
    .filter((c) => c.workspaceId === workspaceId && c.status === 'PENDING')
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())[0];
  if (!log) return null;
  return { requirementId: log.requirementId, changeLogId: log.id };
};

export const countUnackedByWorkspaces = (workspaceIds: string[]): number => {
  ensureSeeded();
  if (!workspaceIds || workspaceIds.length === 0) return 0;
  const set = new Set(workspaceIds);
  return changeLogStore.filter(
    (c) => c.workspaceId && set.has(c.workspaceId) && c.status === 'PENDING',
  ).length;
};

export const firstPendingChangeByWorkspaces = (
  workspaceIds: string[],
): { requirementId: string; changeLogId: string } | null => {
  ensureSeeded();
  if (!workspaceIds || workspaceIds.length === 0) return null;
  const set = new Set(workspaceIds);
  const log = changeLogStore
    .filter((c) => c.workspaceId && set.has(c.workspaceId) && c.status === 'PENDING')
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())[0];
  if (!log) return null;
  return { requirementId: log.requirementId, changeLogId: log.id };
};

