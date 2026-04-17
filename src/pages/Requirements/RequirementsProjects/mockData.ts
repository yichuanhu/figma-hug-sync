/**
 * 项目与工作空间 — Mock 数据与 Mock API
 */
import type { Project, Workspace, ProjectAggregatedStatus, WorkspaceMember, WorkspaceMemberRole, WorkspaceMemberView } from './types';
import { ALL_ORG_USERS } from '@/components/CollaboratorManager/mockData';

const now = () => new Date().toISOString();

let projects: Project[] = [
  {
    id: 'proj-001',
    name: 'Finance Automation 2026',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    description: 'Cross-business unit financial process automation initiative covering report generation, AR aging, and budget variance analysis.',
    aggregatedStatus: 'DEVELOPING',
    workspaceCount: 0,
    requirementCount: 0,
    createdAt: '2026-01-05T09:00:00Z',
    createdBy: 'user-007',
  },
  {
    id: 'proj-002',
    name: 'HR Digital Transformation',
    startDate: '2026-02-01',
    endDate: '2026-08-31',
    description: 'Employee lifecycle automation: onboarding, leave management, payroll validation, and shift scheduling optimization.',
    aggregatedStatus: 'IN_PROGRESS',
    workspaceCount: 0,
    requirementCount: 0,
    createdAt: '2026-01-15T10:30:00Z',
    createdBy: 'user-002',
  },
  {
    id: 'proj-003',
    name: 'Procurement Excellence',
    startDate: '2026-03-01',
    endDate: '2026-09-30',
    description: 'End-to-end procurement workflow optimization including vendor registration, PO approval, and supplier scorecard.',
    aggregatedStatus: 'EMPTY',
    workspaceCount: 0,
    requirementCount: 0,
    createdAt: '2026-02-01T14:00:00Z',
    createdBy: 'user-004',
  },
  {
    id: 'proj-004',
    name: 'IT Infrastructure Ops',
    description: 'Server health monitoring, security patch deployment, and data backup verification automation.',
    aggregatedStatus: 'COMPLETED',
    workspaceCount: 0,
    requirementCount: 0,
    createdAt: '2025-11-10T08:00:00Z',
    createdBy: 'user-008',
  },
];

let workspaces: Workspace[] = [
  {
    id: 'ws-001',
    projectId: 'proj-001',
    name: 'Finance Reporting Workspace',
    departmentId: 'dept-001',
    departmentName: 'Finance',
    description: 'Workspace for monthly reporting and AR aging automation.',
    memberCount: 5,
    linkedRequirementIds: [],
    hasPublishedProcess: true,
    createdAt: '2026-01-08T09:00:00Z',
  },
  {
    id: 'ws-002',
    projectId: 'proj-001',
    name: 'Budget Variance Workspace',
    departmentId: 'dept-001',
    departmentName: 'Finance',
    description: 'Workspace for budget variance and tax filing.',
    memberCount: 3,
    linkedRequirementIds: [],
    hasPublishedProcess: false,
    createdAt: '2026-01-20T09:00:00Z',
  },
  {
    id: 'ws-003',
    projectId: 'proj-002',
    name: 'HR Onboarding Workspace',
    departmentId: 'dept-002',
    departmentName: 'HR',
    description: 'Workspace for onboarding and leave management.',
    memberCount: 4,
    linkedRequirementIds: [],
    hasPublishedProcess: false,
    createdAt: '2026-02-02T10:00:00Z',
  },
  {
    id: 'ws-004',
    projectId: 'proj-002',
    name: 'Workforce Optimization Workspace',
    departmentId: 'dept-002',
    departmentName: 'HR',
    description: 'Workspace for shift scheduling and performance review.',
    memberCount: 2,
    linkedRequirementIds: [],
    hasPublishedProcess: false,
    createdAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 'ws-005',
    projectId: 'proj-004',
    name: 'IT Ops Workspace',
    departmentId: 'dept-003',
    departmentName: 'IT',
    description: 'Server health, patch deployment and backups.',
    memberCount: 6,
    linkedRequirementIds: [],
    hasPublishedProcess: true,
    createdAt: '2025-11-15T08:00:00Z',
  },
];

// ---- Aggregation ----

const recomputeProjectAggregates = () => {
  projects = projects.map((p) => {
    const wsList = workspaces.filter((w) => w.projectId === p.id);
    const reqIds = new Set<string>();
    wsList.forEach((w) => w.linkedRequirementIds.forEach((id) => reqIds.add(id)));
    let status: ProjectAggregatedStatus;
    if (wsList.length === 0) status = 'EMPTY';
    else if (reqIds.size === 0) status = 'IN_PROGRESS';
    else status = p.aggregatedStatus === 'COMPLETED' ? 'COMPLETED' : 'DEVELOPING';
    return {
      ...p,
      workspaceCount: wsList.length,
      requirementCount: reqIds.size,
      aggregatedStatus: status,
    };
  });
};
recomputeProjectAggregates();

// ---- Mock APIs ----

const delay = <T>(v: T, ms = 200) => new Promise<T>((r) => setTimeout(() => r(v), ms));

export const fetchProjects = async (): Promise<Project[]> => {
  recomputeProjectAggregates();
  return delay([...projects]);
};

export const addProject = async (
  payload: Omit<Project, 'id' | 'createdAt' | 'createdBy' | 'aggregatedStatus' | 'workspaceCount' | 'requirementCount'>,
): Promise<Project> => {
  const p: Project = {
    ...payload,
    id: `proj-${Date.now()}`,
    aggregatedStatus: 'EMPTY',
    workspaceCount: 0,
    requirementCount: 0,
    createdAt: now(),
    createdBy: 'user-001',
  };
  projects = [p, ...projects];
  return delay(p);
};

export const updateProject = async (id: string, patch: Partial<Project>): Promise<void> => {
  projects = projects.map((p) => (p.id === id ? { ...p, ...patch } : p));
  await delay(null);
};

export const deleteProject = async (id: string): Promise<void> => {
  const wsList = workspaces.filter((w) => w.projectId === id);
  if (wsList.length > 0) {
    throw new Error('PROJECT_HAS_WORKSPACES');
  }
  projects = projects.filter((p) => p.id !== id);
  await delay(null);
};

export const fetchWorkspacesByProject = async (projectId: string): Promise<Workspace[]> => {
  return delay(workspaces.filter((w) => w.projectId === projectId));
};

export const fetchAllWorkspaces = async (): Promise<Workspace[]> => delay([...workspaces]);

export const addWorkspace = async (
  payload: Omit<Workspace, 'id' | 'createdAt' | 'memberCount' | 'linkedRequirementIds' | 'hasPublishedProcess'>,
): Promise<Workspace> => {
  const exists = workspaces.some(
    (w) => w.projectId === payload.projectId && w.name.toLowerCase() === payload.name.toLowerCase(),
  );
  if (exists) throw new Error('DUPLICATE_NAME');
  const w: Workspace = {
    ...payload,
    id: `ws-${Date.now()}`,
    memberCount: 1,
    linkedRequirementIds: [],
    hasPublishedProcess: false,
    createdAt: now(),
  };
  workspaces = [w, ...workspaces];
  recomputeProjectAggregates();
  return delay(w);
};

export const updateWorkspace = async (id: string, patch: Partial<Workspace>): Promise<void> => {
  if (patch.name) {
    const target = workspaces.find((w) => w.id === id);
    if (target) {
      const dup = workspaces.some(
        (w) => w.id !== id && w.projectId === target.projectId && w.name.toLowerCase() === patch.name!.toLowerCase(),
      );
      if (dup) throw new Error('DUPLICATE_NAME');
    }
  }
  workspaces = workspaces.map((w) => (w.id === id ? { ...w, ...patch } : w));
  recomputeProjectAggregates();
  await delay(null);
};

export const deleteWorkspace = async (id: string): Promise<void> => {
  const w = workspaces.find((x) => x.id === id);
  if (!w) return;
  if (w.hasPublishedProcess || w.linkedRequirementIds.length > 0) {
    throw new Error('WORKSPACE_IN_USE');
  }
  workspaces = workspaces.filter((x) => x.id !== id);
  recomputeProjectAggregates();
  await delay(null);
};

/**
 * 同步关联需求（写入工作空间侧 + 写回 requirement.workspaceId）
 * @param workspaceId 当前工作空间 ID
 * @param targetRequirementIds 期望关联到该工作空间的需求 ID 列表
 */
export const linkRequirements = async (
  workspaceId: string,
  targetRequirementIds: string[],
): Promise<void> => {
  const ws = workspaces.find((w) => w.id === workspaceId);
  if (!ws) return;
  // 校验：被解除的需求中，若 ws 有发布流程，则禁止
  const removed = ws.linkedRequirementIds.filter((id) => !targetRequirementIds.includes(id));
  if (removed.length > 0 && ws.hasPublishedProcess) {
    throw new Error('CANNOT_UNLINK_PUBLISHED');
  }
  // 从其他 workspace 中移除被这次接管的需求（N:1）
  workspaces = workspaces.map((w) => {
    if (w.id === workspaceId) {
      return { ...w, linkedRequirementIds: [...targetRequirementIds] };
    }
    return {
      ...w,
      linkedRequirementIds: w.linkedRequirementIds.filter((id) => !targetRequirementIds.includes(id)),
    };
  });
  recomputeProjectAggregates();
  await delay(null);
};

/** 查询某需求当前归属的 workspace（只读，供详情抽屉用） */
export const findWorkspaceByRequirementId = (requirementId: string): { workspace: Workspace; project: Project } | null => {
  const w = workspaces.find((ws) => ws.linkedRequirementIds.includes(requirementId));
  if (!w) return null;
  const p = projects.find((pr) => pr.id === w.projectId);
  if (!p) return null;
  return { workspace: w, project: p };
};
