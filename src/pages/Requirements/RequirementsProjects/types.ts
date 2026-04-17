/**
 * 项目与工作空间 — 类型定义（FEAT-009 STORY-001 / STORY-002）
 */

export type ProjectAggregatedStatus =
  | 'EMPTY'        // 空项目（无工作空间）
  | 'IN_PROGRESS'  // 进行中（有工作空间，但无关联需求或开发未启动）
  | 'DEVELOPING'   // 开发中（至少 1 个关联需求处于 DEVELOPING）
  | 'COMPLETED';   // 已完成（所有关联需求 LAUNCHED/OFFLINE）

export interface Project {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  aggregatedStatus: ProjectAggregatedStatus;
  workspaceCount: number;
  requirementCount: number;
  createdAt: string;
  createdBy: string;
}

export interface Workspace {
  id: string;
  projectId: string;
  name: string;
  departmentId: string;
  departmentName: string;
  description?: string;
  memberCount: number;
  /** 关联的需求 ID 列表（与 requirement.workspaceId 双向） */
  linkedRequirementIds: string[];
  /** 是否已有发布的流程（用于约束解绑） */
  hasPublishedProcess: boolean;
  createdAt: string;
}
