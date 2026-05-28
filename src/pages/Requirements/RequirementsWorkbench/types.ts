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
  | "DRAFT" // 草稿
  | "PENDING_APPROVAL" // 待审批
  | "PENDING_ASSESSMENT" // 待评估
  | "PENDING_PROJECT" // 待开发（v4 重命名；枚举值暂保留以兼容历史 mock 数据）
  | "DEVELOPING" // 开发中
  | "LAUNCHED" // 已上线
  | "OFFLINE" // 已下线
  | "REJECTED" // 已驳回
  | "WITHDRAWN"; // 已撤回

/** 旧状态别名（兼容旧组件读取，不再用于新逻辑） */
export type LegacyRequirementStatus =
  | "PENDING"
  | "APPROVED"
  | "ASSESSING"
  | "DEVELOPED"
  | "RUNNING"
  | "STOPPED"
  | "ARCHIVED";

export type RequirementPriority = "LOW" | "MEDIUM" | "HIGH";

// ============= 旧版本兼容类型（保留供旧 detail drawer / wizard 读取，新代码勿用） =============

export type ArtifactType = "PROCESS" | "ADP_APP" | "AGENT" | "HUMAN_COLLAB";
export type AssessmentConclusion = "PASSED" | "CONDITIONAL" | "FAILED";

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
  | "text"
  | "textarea"
  | "number"
  | "percentage"
  | "select"
  | "multi_select"
  | "radio"
  | "checkbox"
  | "checkbox_group"
  | "date"
  | "file_upload"
  | "rich_text"
  | "calculation"
  | "user_select"
  | "department_select";

export interface SchemeFieldOption {
  label: string;
  value: string | number;
  description?: string;
  /** 标记为「其他」选项，填写态需附加文本输入 */
  isOther?: boolean;
}

export interface SchemeFieldDependsOn {
  /** 依赖的其它字段 key */
  field: string;
  /** 比较操作符 */
  operator: "eq" | "ne" | "in" | "not_in" | "gt" | "lt" | "gte" | "lte";
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
  /** 字段宽度（用于在 Modal grid 容器中横向占比）；默认 full */
  ui_width?: "small" | "medium" | "large" | "full";
  /** 选项数据来源（如 'cost_config.rate_table'），select 类型时优先于 options */
  source?: string;
  /** 显示格式：精度等 */
  format?: { precision?: number };
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
  /** 维度类型：自动计算 / 手动打分（builder 增量字段） */
  dimension_type?: "auto_calculated" | "manual_score";
  /** 自动计算时引用的源字段映射（builder 增量字段） */
  source_fields?: Record<string, string>;
  /** 该维度的得分档位（builder 增量字段，可选） */
  tiers?: AssessmentTier[];
}

export interface AssessmentModel {
  /** 评估模型代号 */
  key: string;
  /** 评估类型 */
  type: "value" | "complexity";
  label: string;
  description?: string;
  dimensions: AssessmentDimension[];
  /** 总分档位 */
  tiers: AssessmentTier[];
}

// ============= 审批流配置 =============

export type ApproverType = "user" | "role" | "department";

export type ApprovalLevelMode = "any_one" | "all" | "majority";

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

/** Builder 用费率表条目（数组形式，保持顺序与显示标签）。 */
export interface CostRateEntry {
  level: string;
  label: string;
  daily_rate: number;
}

export interface CostConfig {
  /** 平均时薪（元）— 兼容旧字段，不再强制使用 */
  avg_hourly_cost?: number;
  /** 每天工作小时数 */
  working_hours_per_day: number;
  /** 每月工作天数（旧字段，可选） */
  working_days_per_month?: number;
  /** 默认日单价（元/人天） */
  default_rate?: number;
  /** 货币（如 'CNY'） */
  currency?: string;
  /** 岗位级别 → 人天单价（元/人天）。key 为级别 code，例如 'junior'/'middle'/'P5' */
  rate_table?: Record<string, number>;
  /** 岗位级别 code → 显示文案（中文标签）。与 rate_table key 对齐 */
  level_labels?: Record<string, string>;
  /** Builder 用费率表数组（带顺序，权威源）。保存时同步映射回 rate_table / level_labels */
  rate_table_v2?: CostRateEntry[];
  /** 自定义计算基准说明 */
  custom_basis?: string;
}

// ============= 工作流配置（Builder 用） =============

/** 第一期允许的审批人/评估人类型 */
export type WorkflowApproverType = "department_leader" | "specific_users" | "role";
export type WorkflowApprovalMode = "any_one" | "all" | "majority";

export interface WorkflowApprover {
  id: string;
  /** 显示名称（如「部门领导审批」） */
  name: string;
  type: WorkflowApproverType;
  priority: number;
  required: boolean;
  /** 审批模式 */
  approval_mode?: WorkflowApprovalMode;
  /** specific_users / role 时的目标 ID 列表 */
  target_ids?: string[];
  /** 超时天数 */
  timeout_days?: number;
}

export interface WorkflowTransition {
  id: string;
  to: string;
  action: string;
  label: string;
  auto_assign?: boolean;
}

export interface WorkflowState {
  id: string;
  name: string;
  initial?: boolean;
  /** 是否绑定审批人/评估人配置 */
  role?: "approval" | "assessment" | "normal";
  transitions: WorkflowTransition[];
}

export interface WorkflowConfig {
  template?: string;
  states: WorkflowState[];
  /** 审批人多级（priority 升序） */
  approvers: WorkflowApprover[];
  /** 评估人多级（priority 升序） */
  assessors: WorkflowApprover[];
}

// ============= Scheme（模版）主结构 =============

export type SchemeStatus = "active" | "inactive";

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
  /** 是否为内置预设（不可删除/编辑/激活/绑定部门） */
  is_preset: boolean;
  /** 是否为草稿（builder 增量字段） */
  is_draft?: boolean;
  /** v15: 是否为租户默认方案；每租户唯一且 status=active；不写入部门绑定表 */
  is_tenant_default?: boolean;
  /** 基于预设复制时写入；仅标记初始来源，不参与升级追踪 */
  source_preset_key?: string;
  /** 父模版 ID（AF2 复制激活模版时记录） */
  parent_id?: string;
  meta?: SchemeMeta;
  custom_fields: SchemeField[];
  value_assessment_model?: AssessmentModel;
  complexity_assessment_model?: AssessmentModel;
  approval_flow: ApprovalFlowConfig;
  cost_config?: CostConfig;
  /** 工作流配置（builder 增量字段） */
  workflow_config?: WorkflowConfig;
  /** 原始 YAML 内容（用于查看） */
  raw_yaml?: string;
  /** 适用部门草稿选择。保存草稿时仅写入本字段；激活或保存已激活方案时才展开子部门并同步 department_scheme_binding。 */
  applicable_department_ids?: string[];
  created_at: string;
  created_by?: string;
  updated_at?: string;
}

// ============= 模版版本历史 =============

export interface SchemeVersion {
  version: string;
  scheme: RequirementScheme;
  change_log?: string;
  created_by: string;
  created_at: string;
}

// ============= 审批 / 评估 / 版本 / 关联 =============

export type ApprovalActionStatus = "pending" | "approved" | "rejected";

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
  /** STORY-006：所属审批轮次（resubmit 后 +1，原历史按 round 折叠展示） */
  round?: number;
}

/** [活动记录] 一次评估打分的留痕（含维度分、档位、总分），不属于需求本体。 */
export interface AssessmentRecord {
  id: string;
  requirement_id: string;
  type: "value" | "complexity";
  assessor_id: string;
  assessor_name: string;
  /** 各维度打分原值 */
  scores: Record<string, number>;
  /** 各维度命中档位 */
  tier_results: Record<string, { score: number; label: string }>;
  total_score: number;
  comment?: string;
  acted_at: string;
  /** STORY-006：所属评估轮次（与 ApprovalRecord.round 同步） */
  round?: number;
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
  type: "workspace" | "process" | "project";
  name: string;
  /** 关联流程的运行状态 */
  status?: "developing" | "launched" | "offline";
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
  /** 关联模版 */
  scheme_id?: string;
  scheme_version?: string;
  /** v15: 方案配置快照（创建/编辑需求时按当时方案 config 写入；后续方案变更不影响该需求） */
  scheme_config_snapshot?: Pick<RequirementScheme, "id" | "code" | "name" | "version" | "custom_fields">;

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
  /** STORY-006：当前审批/评估轮次；首次提交为 1，每次 resubmit 后 +1 */
  round?: number;

  // ===== 旧字段（兼容旧弹窗与抽屉，新代码请勿使用） =====
  involvedTech?: ("UI_AUTOMATION" | "ADP")[];
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
  /** 关联项目（由项目管理侧建立，需求中心只读展示） */
  linkedProject?: { id: string; name: string };
  /** 关联工作空间（由工作空间侧建立，需求中心只读展示） */
  linkedWorkspace?: { id: string; name: string };
  /** 未归属流程数量（异常提示用，不计入聚合） */
  unboundProcessCount?: number;
  /** [活动记录] 审批动作流水（approve/reject/withdraw/resubmit），不属于需求本体。 */
  approvalHistory?: ApprovalHistoryEntry[];

  createdAt: string;
  updatedAt: string;
}

// ============= Story-007 详细评估（配置驱动，多级串行） =============

/** 可行性判断（替代旧的 conclusion） */
export type FeasibilityLevel = "feasible" | "not_recommended" | "not_feasible";

/** 单维度作答 */
export interface DimensionAnswer {
  /** 关联评估流配置中的维度 key */
  dim_key: string;
  /** 维度名称快照（用于配置变更后仍可显示） */
  dim_name: string;
  /** tier_select 时使用，命中的档位 id */
  tier_id?: string;
  /** numeric_input 时使用，评估人填写的数值 */
  numeric_value?: number;
  /** numeric_input 时根据区间命中的档位 id（用于回显） */
  matched_tier_id?: string;
  /** 命中档位分值（0-100） */
  score: number;
  /** 维度权重快照（0-1） */
  weight: number;
}

/** 单级评估记录 */
export interface LevelAssessmentRecord {
  level_id: string;
  level_name: string;
  level_priority: number;
  /** pending: 还没轮到 / in_progress: 正在评估 / completed: 已提交 */
  status: "pending" | "in_progress" | "completed";
  assessor_id?: string;
  assessor_name?: string;
  assessed_at?: string;
  value_answers: DimensionAnswer[];
  complexity_answers: DimensionAnswer[];
  /** 加权后的价值得分（0-100） */
  value_score: number;
  /** 加权后的复杂度得分（0-100） */
  complexity_score: number;
  /** 可行性判断（评估人下拉选择） */
  feasibility?: FeasibilityLevel;
  comment?: string;
}

/** 兼容旧字段所需的最小评分类型（保留以避免编译报错；新代码使用 DimensionAnswer） */
export type AssessmentScore = 1 | 2 | 3 | 4 | 5;
export interface AssessmentDimensionScore {
  key: string;
  score: AssessmentScore;
  note?: string;
}

export interface DetailedAssessment {
  /** 评估流模板 id */
  flow_id: string;
  /** 评估流模板名称快照 */
  flow_name: string;
  /** 各级评估记录（按 priority 升序） */
  records: LevelAssessmentRecord[];
  /** 当前进行到的级别 priority；全部完成后为 levels.length */
  current_level_priority: number;
  /** 最近一次已提交的可行性判断，用于列表展示 */
  feasibility?: FeasibilityLevel;
  /** 最近一次已提交记录的净得分 = value - complexity，用于列表/历史展示 */
  netScore?: number;
  /** 最近一次提交人，用于列表展示 */
  assessorId?: string;
  assessorName?: string;
  assessedAt?: string;
}


// ============= Story-010 成本估算（自动计算，只读） =============
/** 岗位级别 code（开放字符串，由激活模版的 cost_config.rate_table 决定） */
export type JobLevel = string;

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
  rateTable: Record<string, number>;
  levelLabels?: Record<string, string>;
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
export type ApprovalFlowMode = "any_one" | "all" | "majority";
export interface ApprovalFlowApprover {
  id: string;
  name: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
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
export type ApprovalHistoryAction = "approve" | "reject" | "withdraw" | "resubmit";
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
  /** STORY-006：所属审批轮次（与 ApprovalRecord.round 同步） */
  round?: number;
}
export type LinkedProcessStatus = "DEVELOPING" | "TESTING" | "PENDING" | "ONLINE" | "FAILED";
export interface LinkedProcess {
  id: string;
  name: string;
  status: LinkedProcessStatus;
  ownerName?: string;
  /** 流程预估工时（人天）。null/undefined 表示未填写 */
  effort_estimate_days?: number | null;
  /** 流程实际工时（人天）。null/undefined 表示未填写 */
  effort_actual_days?: number | null;
  /** 是否存在已发布版本 */
  has_published_version?: boolean;
}

// ============= STORY-002 需求级开发工时聚合 =============
export interface RequirementEffortSummary {
  /** 关联流程总数 */
  total_process_count: number;
  /** 已完成（有已发布版本） */
  published_process_count: number;
  /** 进行中（未发布） */
  active_process_count: number;
  /** 未估算工时的流程数 */
  unestimated_process_count: number;
  /** 预估工时合计（人天） */
  effort_estimate_total: number;
  /** 实际工时合计（人天） */
  effort_actual_total: number;
  /** 完成率 0~1 */
  completion_rate: number;
  processes: LinkedProcess[];
}

// ============= 活动记录（兼容旧组件） =============

/** [活动记录] 活动事件类型枚举（用于动态时间线聚合视图）。 */
export type ActivityType = "status_change" | "approval" | "assessment" | "comment" | "created";

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
  sort_order: "asc" | "desc";
  statusFilter?: string[];
  departmentFilter?: string[];
  priorityFilter?: string[];
  projectFilter?: string[];
}

export interface RequirementListResponse {
  range: {
    offset: number;
    size: number;
    total: number;
  };
  list: RequirementItem[];
}

// ============= STORY-014 / STORY-015 立项后变更 =============

/** 变更日志类型枚举（'CONTENT' 为旧版默认） */
export type RequirementChangeType = "CONTENT" | "RESUBMIT" | "DEV_SCHEME_DOC_UPLOADED" | "DEV_SCHEME_DOC_DELETED";

/** 变更日志条目（仅记录变更说明，不再包含字段对比与开发响应） */
export interface RequirementChangeLog {
  id: string;
  requirementId: string;
  /** 变更说明（≥10 字） */
  reason: string;
  publisherId: string;
  publisherName: string;
  publishedAt: string;
  /** 变更类型；缺省按 'CONTENT' 兼容历史 mock */
  changeType?: RequirementChangeType;
  /** 变更字段细节（DevSchemeDoc 上传/删除时记录 {version, fileName?, note?}） */
  changedFields?: Record<string, unknown>;
}

// ============= STORY-015 开发方案文档 =============

export type DevSchemeDocFileType = "PDF" | "DOCX" | "MD";

/** 单个开发方案文档版本 */
export interface RequirementDevSchemeDoc {
  id: string;
  requirementId: string;
  /** 该需求范围内单调递增（1, 2, 3, …），(requirementId, version) 唯一 */
  version: number;
  fileName: string;
  fileSize: number;
  fileType: DevSchemeDocFileType;
  /** 对象存储路径占位（mock 用 data:/blob: URL） */
  fileUrl: string;
  uploadedBy: string;
  uploaderName: string;
  uploadedAt: string;
  note?: string;
  isDeleted: boolean;
  deletedBy?: string;
  deletedAt?: string;
}

/** 错误码（与后端 API 对齐，UI 转译为对应 i18n 文案） */
export type DevSchemeDocErrorCode =
  | "DEV_SCHEME_DOC_INVALID_STATE"
  | "DEV_SCHEME_DOC_UNSUPPORTED_TYPE"
  | "DEV_SCHEME_DOC_FILE_TOO_LARGE"
  | "DEV_SCHEME_DOC_NOT_WORKSPACE_MEMBER";

/** 草稿（按 `${requirementId}::${userId}` 隔离） */
export interface RequirementDraft {
  requirementId: string;
  userId: string;
  /** 与 RequirementItem 同结构的可编辑子集 */
  patch: Partial<Pick<RequirementItem, "title" | "description" | "priority" | "form_data">>;
  updatedAt: string;
  baseUpdatedAt: string;
}
