/**
 * 需求状态枚举
 */
export type RequirementStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ASSESSING'
  | 'DEVELOPING'
  | 'DEVELOPED'
  | 'RUNNING'
  | 'STOPPED'
  | 'ARCHIVED';

/**
 * 需求优先级枚举
 */
export type RequirementPriority = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * 关联类型枚举
 */
export type ArtifactType = 'PROCESS' | 'ADP_APP' | 'AGENT' | 'HUMAN_COLLAB';

/**
 * 技术评估结论
 */
export type AssessmentConclusion = 'PASSED' | 'CONDITIONAL' | 'FAILED';

/**
 * 评分维度项
 */
export interface ScoreDimension {
  key: string;
  score: number | null;
}

/**
 * 技术评估数据
 */
export interface TechnicalAssessment {
  id: string;
  requirementId: string;
  assessorId: string;
  assessorName: string;
  /** 通用维度 */
  generalScores: {
    businessComplexity: number;
    resourceAvailability: number;
    externalDependency: number;
    riskLevel: number;
  };
  /** UI自动化维度（可选） */
  uiAutomationScores?: {
    systemStability: number;
    elementIdentifiability: number;
    processStandardization: number;
  };
  /** ADP维度（可选） */
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

/**
 * 需求关联记录
 */
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

/**
 * 需求项数据结构
 */
export interface RequirementItem {
  id: string;
  title: string;
  description: string;
  businessBackground?: string;
  owning_department_name: string;
  owning_department_id: string;
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
  /** 涉及技术类型 */
  involvedTech?: ('UI_AUTOMATION' | 'ADP')[];
  /** 技术评估数据 */
  assessment?: TechnicalAssessment;
  /** 关联的流程/应用 */
  artifacts?: RequirementArtifact[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 活动记录类型
 */
export type ActivityType = 'status_change' | 'approval' | 'assessment' | 'comment' | 'created';

/**
 * 活动记录
 */
export interface ActivityRecord {
  id: string;
  type: ActivityType;
  actorId: string;
  actorName: string;
  content: string;
  /** 旧状态（status_change 类型） */
  fromStatus?: RequirementStatus;
  /** 新状态（status_change 类型） */
  toStatus?: RequirementStatus;
  timestamp: string;
}

/**
 * 需求列表查询参数
 */
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

/**
 * 需求列表响应
 */
export interface RequirementListResponse {
  range: {
    offset: number;
    size: number;
    total: number;
  };
  list: RequirementItem[];
}
