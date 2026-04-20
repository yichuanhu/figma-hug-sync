/**
 * 需求中心 — 类型定义（Scheme 驱动 + 9 状态生命周期）
 *
 * 兼容说明：保留旧 RequirementStatus / RequirementPriority / RequirementItem 旧字段，
 * 同时新增 Scheme 相关类型。阶段 1 列表与审批使用新 9 态，旧弹窗/旧抽屉仍可读取旧字段。
 *
 * ============================================================================
 * 领域边界说明（Domain Boundary）
 * ----------------------------------------------------------------------------
 * 本文件中的类型在概念上分为两大类，实现/UI 时应清晰区分：
 *
 * 1) 需求内容（Requirement Content）—— 描述「需求是什么」
 *    包含：基本信息（title/description/...）、归属（owning_department / owner）、
 *    优先级与状态、动态表单数据（form_data / baselineFormData）、
 *    评估结果（value_score / complexity_score / detailedAssessment）、
 *    成本估算（cost_estimation / costEstimate）、关联实体（linked_entities / linkedProcesses）。
 *    这些字段构成需求实体本身，是需求列表/详情概览的核心展示对象。
 *
 * 2) 活动记录（Activity / Audit Trail）—— 描述「谁在何时对需求做了什么」
 *    包含：approvals / approvalHistory / assessments / versions / historyVersions /
 *    ActivityRecord。这些不属于需求本体，而是围绕需求产生的操作日志/审计留痕，
 *    仅用于追溯与时间线展示（例如详情抽屉的「动态/历史」侧栏）。
 *
 * 设计约束：UI 层应将「活动记录」与「需求内容」在视觉与信息架构上分离，避免
 * 把审计数据（如审批/版本/评估历史）当作需求字段渲染到主表单或概览主区域。
 * ============================================================================
 */

// ============= 9 状态生命周期 =============

export type RequirementStatus =
  | 'DRAFT'              // 草稿
  | 'PENDING_APPROVAL'   // 待审批
  | 'PENDING_ASSESSMENT' // 待评估
  | 'PENDING_PROJECT'    // 待立项
  | 'DEVELOPING'         // 开发中
  | 'LAUNCHED'           // 已上线
  | 'OFFLINE'            // 已下线
  | 'REJECTED'           // 已驳回
  | 'WITHDRAWN';         // 已撤回

/** 旧状态别名（兼容旧组件读取，不再用于新逻辑） */
export type LegacyRequirementStatus =
  | 'PENDING' | 'APPROVED' | 'ASSESSING' | 'DEVELOPED' | 'RUNNING' | 'STOPPED' | 'ARCHIVED';

export type RequirementPriority = 'LOW' | 'MEDIUM' | 'HIGH';

// ============= 旧版本兼容类型（保留供旧 detail drawer / wizard 读取，新代码勿用） =============

export type ArtifactType = 'PROCESS' | 'ADP_APP' | 'AGENT' | 'HUMAN_COLLAB';
export type AssessmentConclusion = 'PASSED' | 'CONDITIONAL' | 'FAILED';

export interface RequirementArtifact {
  id: string;
  requirementId: string;
  artifactType: ArtifactType;
  artifactId: string;
  artifactName: string;
  contribution: number;
  description?: string;
  createdAt: string;
}

export interface TechnicalAssessment {
  id: string;
  requirementId: string;
  assessorId: string;
  assessorName: string;
  generalScores: {
    businessComplexity: number;
    resourceAvailability: number;
    externalDependency: number;
    riskLevel: number;
  };
  uiAutomationScores?: {
    systemStability: number;
    elementIdentifiability: number;
    processStandardization: number;
  };
  adpScores?: {
    documentStandardization: number;
    ocrAvailability: number;
    fieldExtractionDifficulty: number;
  };
  totalScore: number;
  maxScore: number;
  conclusion: AssessmentConclusion;
  comment?: string;
  assessedAt: string;
}

// ============= Scheme 字段类型 =============

export type SchemeFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'percentage'
  | 'select'
  | 'multi_select'
  | 'radio'
  | 'checkbox'
  | 'checkbox_group'
  | 'date'
  | 'file_upload'
  | 'rich_text'
  | 'calculation';

export interface SchemeFieldOption {
  label: string;
  value: string | number;
  description?: string;
}

export interface SchemeFieldDependsOn {
  /** 依赖的其它字段 key */
  field: string;
  /** 比较操作符 */
  operator: 'eq' | 'ne' | 'in' | 'not_in' | 'gt' | 'lt' | 'gte' | 'lte';
  /** 比较值 */
  value: string | number | boolean | Array<string | number>;
}

export interface SchemeFieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  message?: string;
}

export interface SchemeField {
  key: string;
  label: string;
  type: SchemeFieldType;
  required?: boolean;
  placeholder?: string;
  description?: string;
  /** select / radio / checkbox_group 的选项 */
  options?: SchemeFieldOption[];
  /** 字段依赖（控制显隐） */
  depends_on?: SchemeFieldDependsOn;
  validation?: SchemeFieldValidation;
  /** calculation 字段表达式，支持 {field_key} 占位符 + 四则运算 */
  expression?: string;
  /** calculation 字段引用的源字段 */
  source_fields?: string[];
  /** 默认值 */
  default?: unknown;
  /** 单位（数值/百分比） */
  unit?: string;
}

// ============= 评估模型 =============

export interface AssessmentTier {
  /** 形如 ">=80" "60~79" "<60" 的条件表达式 */
  condition: string;
  score: number;
  label: string;
  /** 颜色（Tag color） */
  color?: string;
}

export interface AssessmentDimension {
  key: string;
  label: string;
  /** 维度权重，0-1 之间 */
  weight: number;
  /** 数据来源字段 key */
  source_field?: string;
  /** 表达式（可选，用于计算多个字段聚合） */
  expression?: string;
  description?: string;
}

export interface AssessmentModel {
  /** 评估模型代号 */
  key: string;
  /** 评估类型 */
  type: 'value' | 'complexity';
  label: string;
  description?: string;
  dimensions: AssessmentDimension[];
  /** 总分档位 */
  tiers: AssessmentTier[];
}

// ============= 审批流配置 =============

export type ApproverType = 'user' | 'role' | 'department';

export type ApprovalLevelMode = 'any_one' | 'all' | 'majority';

export interface ApprovalLevelConfig {
  order: number;
  name: string;
  approver_type: ApproverType;
  approver_ids: string[];
  /** 审批模式：任一/会签/多数；缺省按 count_sign 兼容（true→all, false→any_one） */
  mode?: ApprovalLevelMode;
  /** @deprecated 旧字段，仅用于读取兼容；新代码请使用 mode */
  count_sign?: boolean;
}

export interface ApprovalFlowConfig {
  levels: ApprovalLevelConfig[];
}

// ============= 成本配置 =============

export interface CostConfig {
  /** 平均时薪（元） */
  avg_hourly_cost: number;
  /** 每天工作小时数 */
  working_hours_per_day: number;
  /** 每月工作天数 */
  working_days_per_month: number;
  /** 岗位级别 → 人天单价（元/人天） */
  rate_table?: Record<JobLevel, number>;
  /** 自定义计算基准说明 */
  custom_basis?: string;
}

// ============= Scheme（方案）主结构 =============

export type SchemeStatus = 'active' | 'inactive';

export interface SchemeMeta {
  code: string;
  name: string;
  description?: string;
  category?: string;
  /** 适用场景 */
  scenario?: string;
}

export interface RequirementScheme {
  id: string;
  code: string;
  name: string;
  version: string;
  description?: string;
  status: SchemeStatus;
  /** 是否为内置预设（不可删除/编辑） */
  is_preset: boolean;
  meta?: SchemeMeta;
  custom_fields: SchemeField[];
  value_assessment_model?: AssessmentModel;
  complexity_assessment_model?: AssessmentModel;
  approval_flow: ApprovalFlowConfig;
  cost_config?: CostConfig;
  /** 原始 YAML 内容（用于查看） */
  raw_yaml?: string;
  created_at: string;
  created_by?: string;
  updated_at?: string;
}

// ============= 方案版本历史 =============

export interface SchemeVersion {
  version: string;
  scheme: RequirementScheme;
  change_log?: string;
  created_by: string;
  created_at: string;
}

// ============= 审批 / 评估 / 版本 / 关联 =============

export type ApprovalActionStatus = 'pending' | 'approved' | 'rejected';

/** [活动记录] 单条审批操作记录（按层级 × 审批人留痕，不属于需求本体）。 */
export interface ApprovalRecord {
  id: string;
  requirement_id: string;
  level: number;
  level_name: string;
  approver_id: string;
  approver_name: string;
  status: ApprovalActionStatus;
  comment?: string;
  acted_at?: string;
}

/** [活动记录] 一次评估打分的留痕（含维度分、档位、总分），不属于需求本体。 */
export interface AssessmentRecord {
  id: string;
  requirement_id: string;
  type: 'value' | 'complexity';
  assessor_id: string;
  assessor_name: string;
  /** 各维度打分原值 */
  scores: Record<string, number>;
  /** 各维度命中档位 */
  tier_results: Record<string, { score: number; label: string }>;
  total_score: number;
  comment?: string;
  acted_at: string;
}

/** [活动记录] 需求版本变更引用（指向 snapshot），不属于需求本体。 */
export interface RequirementVersion {
  version: number;
  snapshot_id: string;
  /** 简要变更日志 */
  change_log?: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

export interface LinkedEntity {
  id: string;
  type: 'workspace' | 'process' | 'project';
  name: string;
  /** 关联流程的运行状态 */
  status?: 'developing' | 'launched' | 'offline';
  link?: string;
}

export interface CostEstimation {
  /** 月均节省工时 */
  monthly_saved_hours: number;
  /** 月均节省人天 */
  monthly_saved_days: number;
  /** 月均节省金额 */
  monthly_saved_amount: number;
  /** 计算公式说明 */
  formula?: string;
}

// ============= 需求项 =============

export interface RequirementItem {
  id: string;
  /** 需求编号 REQ-YYYY-NNNN */
  req_no?: string;
  /** 关联方案 */
  scheme_id?: string;
  scheme_version?: string;

  title: string;
  description: string;
  businessBackground?: string;

  owning_department_name: string;
  owning_department_id: string;
  /** 归属人（owner） */
  owner_id?: string;
  owner_name?: string;

  creatorId: string;
  creatorName: string;
  creatorDepartment?: string;
  creatorRole?: string;
  creatorEmail?: string;
  contactInfo?: string;

  priority: RequirementPriority;
  status: RequirementStatus;
  expectedLaunchDate?: string;
  attachments?: { name: string; size: number; uid: string }[];

  /** 动态字段数据（Scheme 驱动） */
  form_data?: Record<string, unknown>;
  /** 自动成本计算所需的基线数据（来自表单中的频率/时长/可自动化比例/岗位级别） */
  baselineFormData?: RequirementBaselineFormData;

  /** 价值/复杂度综合得分 */
  value_score?: number;
  complexity_score?: number;

  /** [活动记录] 审批留痕集合（按层级 × 审批人，不属于需求本体）。 */
  approvals?: ApprovalRecord[];
  /** [活动记录] 评估打分留痕集合（不属于需求本体）。 */
  assessments?: AssessmentRecord[];
  linked_entities?: LinkedEntity[];
  /** [活动记录] 版本变更引用集合（不属于需求本体）。 */
  versions?: RequirementVersion[];
  cost_estimation?: CostEstimation;

  /** 当前版本号（编辑即 +1） */
  version?: number;

  // ===== 旧字段（兼容旧弹窗与抽屉，新代码请勿使用） =====
  involvedTech?: ('UI_AUTOMATION' | 'ADP')[];
  assessment?: TechnicalAssessment;
  artifacts?: RequirementArtifact[];

  // ===== Story-007 / 010 / 012 / 006 / 009 新字段 =====
  /** 详细评估（业务价值 + 技术复杂度） */
  detailedAssessment?: DetailedAssessment;
  /** 成本估算 */
  costEstimate?: CostEstimateData;
  /** [活动记录] 历史版本快照集合（不属于需求本体，仅用于历史回看）。 */
  historyVersions?: VersionSnapshot[];
  /** 多级审批流配置 */
  approvalFlowConfig?: MultiLevelApprovalConfig;
  /** 关联流程（用于状态聚合） */
  linkedProcesses?: LinkedProcess[];
  /** [活动记录] 审批动作流水（approve/reject/withdraw/resubmit），不属于需求本体。 */
  approvalHistory?: ApprovalHistoryEntry[];

  createdAt: string;
  updatedAt: string;
}

// ============= Story-007 详细评估 =============
export type AssessmentScore = 1 | 2 | 3 | 4 | 5;
export interface AssessmentDimensionScore {
  key: string;
  score: AssessmentScore;
  note?: string;
}
export type AssessmentConclusionV2 = 'RECOMMEND' | 'CAUTION' | 'REJECT';
export interface DetailedAssessment {
  valueDimensions: AssessmentDimensionScore[];
  complexityDimensions: AssessmentDimensionScore[];
  netScore: number;
  conclusion: AssessmentConclusionV2;
  assessorId: string;
  assessorName: string;
  assessedAt: string;
  comment?: string;
}

// ============= Story-010 成本估算（自动计算，只读） =============
export type JobLevel = 'P4' | 'P5' | 'P6' | 'P7';

/** 需求表单基线数据（来自 form_data，自动化收益输入项） */
export interface RequirementBaselineFormData {
  /** 月均执行频率（次） */
  frequency: number;
  /** 单次耗时（分钟） */
  durationMinutes: number;
  /** 可自动化比例 0~1 */
  automationRatio: number;
  /** 执行人岗位级别 */
  jobLevel: JobLevel;
}

/** Scheme.cost_config 中的费率与工时配置 */
export interface SchemeCostConfig {
  workingHoursPerDay: number;
  rateTable: Record<JobLevel, number>;
  schemeName?: string;
}

export interface CostEstimateData {
  // 基线快照
  frequency: number;
  durationMinutes: number;
  automationRatio: number;
  jobLevel: JobLevel;
  // 计算参数快照
  workingHoursPerDay: number;
  dailyRate: number;
  schemeName?: string;
  // 计算结果
  monthlySavedHours: number;
  monthlySavedPersonDays: number;
  monthlySavedAmount: number;
  computedAt: string;
}

/** @deprecated 旧手填模型保留供版本快照兼容读取 */
export interface CostRoleItem {
  role: string;
  people: number;
  days: number;
}

// ============= Story-012 版本快照 =============
/** [活动记录] 版本快照（保存编辑前的关键字段，用于历史回看），不属于需求本体。 */
export interface VersionSnapshot {
  version: number;
  createdAt: string;
  actorId: string;
  actorName: string;
  summary: string;
  snapshot: {
    title?: string;
    description?: string;
    priority?: RequirementPriority;
    status?: RequirementStatus;
    detailedAssessment?: DetailedAssessment;
    costEstimate?: CostEstimateData;
  };
}

// ============= Story-006 多级审批 =============
export type ApprovalFlowMode = 'any_one' | 'all' | 'majority';
export interface ApprovalFlowApprover {
  id: string;
  name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  actedAt?: string;
}
export interface ApprovalFlowLevel {
  level: number;
  name: string;
  mode: ApprovalFlowMode;
  approvers: ApprovalFlowApprover[];
}
export interface MultiLevelApprovalConfig {
  levels: ApprovalFlowLevel[];
  currentLevel: number;
}

// ============= 审批历史留痕 =============
export type ApprovalHistoryAction = 'approve' | 'reject' | 'withdraw' | 'resubmit';
/** [活动记录] 审批动作流水（approve/reject/withdraw/resubmit），不属于需求本体。 */
export interface ApprovalHistoryEntry {
  id: string;
  /** 审批级（withdraw/resubmit 取当前级；approve/reject 取动作级） */
  level: number;
  levelName?: string;
  approverId: string;
  approverName: string;
  action: ApprovalHistoryAction;
  comment?: string;
  timestamp: string;
}
export type LinkedProcessStatus = 'DEVELOPING' | 'TESTING' | 'PENDING' | 'ONLINE' | 'FAILED';
export interface LinkedProcess {
  id: string;
  name: string;
  status: LinkedProcessStatus;
  ownerName?: string;
}

// ============= 活动记录（兼容旧组件） =============

/** [活动记录] 活动事件类型枚举（用于动态时间线聚合视图）。 */
export type ActivityType = 'status_change' | 'approval' | 'assessment' | 'comment' | 'created';

/** [活动记录] 聚合的活动事件（把审批/评估/状态变更/评论统一成一条时间线项），不属于需求本体。 */
export interface ActivityRecord {
  id: string;
  type: ActivityType;
  actorId: string;
  actorName: string;
  content: string;
  fromStatus?: RequirementStatus;
  toStatus?: RequirementStatus;
  timestamp: string;
}

// ============= 列表查询 =============

export interface RequirementQueryParams {
  offset: number;
  size: number;
  keyword: string;
  sort_by: string;
  sort_order: 'asc' | 'desc';
  statusFilter?: string[];
  departmentFilter?: string[];
  priorityFilter?: string[];
}

export interface RequirementListResponse {
  range: {
    offset: number;
    size: number;
    total: number;
  };
  list: RequirementItem[];
}
