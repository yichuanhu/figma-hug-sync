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
 * 需求项数据结构
 */
export interface RequirementItem {
  id: string;
  title: string;
  description: string;
  department: string;
  departmentId: string;
  creatorId: string;
  creatorName: string;
  creatorDepartment?: string;
  creatorRole?: string;
  creatorEmail?: string;
  contactInfo?: string;
  priority: RequirementPriority;
  status: RequirementStatus;
  expectedLaunchDate?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
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
