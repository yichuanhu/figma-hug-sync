/**
 * 需求中心 — 类型定义（Scheme 驱动 + 9 状态生命周期）
 *
 * 兼容说明：保留旧 RequirementStatus / RequirementPriority / RequirementItem 旧字段，
 * 同时新增 Scheme 相关类型。阶段 1 列表与审批使用新 9 态，旧弹窗/旧抽屉仍可读取旧字段。
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

export interface ApprovalLevelConfig {
  order: number;
  name: string;
  approver_type: ApproverType;
  approver_ids: string[];
  /** 是否会签（全部通过才算通过） */
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

  /** 价值/复杂度综合得分 */
  value_score?: number;
  complexity_score?: number;

  /** 审批 / 评估 / 关联 / 版本 */
  approvals?: ApprovalRecord[];
  assessments?: AssessmentRecord[];
  linked_entities?: LinkedEntity[];
  versions?: RequirementVersion[];
  cost_estimation?: CostEstimation;

  /** 当前版本号（编辑即 +1） */
  version?: number;

  // ===== 旧字段（兼容旧弹窗与抽屉，新代码请勿使用） =====
  involvedTech?: ('UI_AUTOMATION' | 'ADP')[];
  assessment?: unknown;
  artifacts?: unknown[];

  createdAt: string;
  updatedAt: string;
}

// ============= 活动记录（兼容旧组件） =============

export type ActivityType = 'status_change' | 'approval' | 'assessment' | 'comment' | 'created';

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
