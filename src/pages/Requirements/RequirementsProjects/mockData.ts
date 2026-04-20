/**
 * 项目与工作空间 — Mock 数据与 Mock API
 */
import type { Project, Workspace, ProjectAggregatedStatus, WorkspaceMember, WorkspaceMemberRole, WorkspaceMemberView } from './types';
import { ALL_ORG_USERS } from '@/components/CollaboratorManager/mockData';
import { transitionToDeveloping } from '../RequirementsWorkbench/mockData';

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
  // 计算新增关联，用于触发跨模块状态联动
  const added = targetRequirementIds.filter((id) => !ws.linkedRequirementIds.includes(id));
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
  // 跨模块状态联动：将新增关联的需求迁移到「开发中」并写入审批历史
  if (added.length > 0) {
    const wsSnapshot = { id: ws.id, name: ws.name };
    await Promise.all(added.map((id) => transitionToDeveloping(id, wsSnapshot)));
  }
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

/**
 * 查询某工作空间下「可关联到新流程」的需求：
 * - 必须属于该工作空间的 linkedRequirementIds
 * - 尚未绑定任何流程（linkedProcesses 为空）
 * 用于开发中心创建流程时的「关联需求」下拉。
 */
export const fetchLinkableRequirementsByWorkspace = async (
  workspaceId: string,
): Promise<Array<{ id: string; title: string; req_no?: string }>> => {
  await delay(null);
  const ws = workspaces.find((w) => w.id === workspaceId);
  if (!ws || ws.linkedRequirementIds.length === 0) return [];
  // 动态引入避免循环依赖
  const { fetchRequirementList } = await import('../RequirementsWorkbench/mockData');
  const res = await fetchRequirementList({
    offset: 0,
    size: 500,
    keyword: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  return res.list
    .filter((r) => ws.linkedRequirementIds.includes(r.id))
    .filter((r) => !r.linkedProcesses || r.linkedProcesses.length === 0)
    .map((r) => ({ id: r.id, title: r.title, req_no: r.req_no }));
};

// ===================== 工作空间成员 =====================

/**
 * 部门管理员映射：dept-id -> userId[]
 * 这些用户在所属部门所在的工作空间会自动获得 MANAGER 身份（继承），
 * 列表中不展示，仅在添加成员弹窗中标记为「自动继承」并禁用勾选。
 */
const departmentManagers: Record<string, string[]> = {
  'dept-finance': ['user-fin-001'],
  'dept-hr': ['user-hr-001'],
  'dept-fe': ['user-fe-001'],
  'dept-be': ['user-be-001'],
  'dept-product': ['user-pt-001'],
  'dept-dw': ['user-dw-001'],
};

let workspaceMembers: WorkspaceMember[] = [
  { id: 'wm-001', workspaceId: 'ws-001', userId: 'user-001', userName: '张三', department: 'APA Product Division', role: 'MANAGER', addedAt: '2026-01-08T10:00:00Z' },
  { id: 'wm-002', workspaceId: 'ws-001', userId: 'user-fe-002', userName: 'Linda Chen', department: 'Frontend Development Team', role: 'MEMBER', addedAt: '2026-01-09T10:00:00Z' },
  { id: 'wm-003', workspaceId: 'ws-003', userId: 'user-001', userName: '张三', department: 'APA Product Division', role: 'MANAGER', addedAt: '2026-02-02T11:00:00Z' },
  { id: 'wm-004', workspaceId: 'ws-005', userId: 'user-001', userName: '张三', department: 'APA Product Division', role: 'MANAGER', addedAt: '2025-11-15T09:00:00Z' },
  { id: 'wm-005', workspaceId: 'ws-005', userId: 'user-be-002', userName: 'Dong Wei', department: 'Backend Development Team', role: 'MEMBER', addedAt: '2025-11-16T09:00:00Z' },
];

const buildInheritedMembers = (workspaceId: string): WorkspaceMemberView[] => {
  const ws = workspaces.find((w) => w.id === workspaceId);
  if (!ws) return [];
  const inheritedUserIds = departmentManagers[ws.departmentId] ?? [];
  return inheritedUserIds.map((uid) => {
    const u = ALL_ORG_USERS.find((x) => x.id === uid);
    return {
      id: `inherited-${workspaceId}-${uid}`,
      workspaceId,
      userId: uid,
      userName: u?.name ?? uid,
      department: u?.department ?? '-',
      role: 'MANAGER' as WorkspaceMemberRole,
      addedAt: ws.createdAt,
      inheritedAsDeptManager: true,
    };
  });
};

export const isInheritedDeptManager = (workspaceId: string, userId: string): boolean => {
  const ws = workspaces.find((w) => w.id === workspaceId);
  if (!ws) return false;
  return (departmentManagers[ws.departmentId] ?? []).includes(userId);
};

export const fetchWorkspaceMembers = async (workspaceId: string): Promise<WorkspaceMember[]> => {
  return delay(workspaceMembers.filter((m) => m.workspaceId === workspaceId));
};

export const fetchAllWorkspaceMembersIncludingInherited = async (
  workspaceId: string,
): Promise<WorkspaceMemberView[]> => {
  const explicit = workspaceMembers
    .filter((m) => m.workspaceId === workspaceId)
    .map<WorkspaceMemberView>((m) => ({ ...m }));
  const inherited = buildInheritedMembers(workspaceId).filter(
    (i) => !explicit.some((e) => e.userId === i.userId),
  );
  return delay([...inherited, ...explicit]);
};

const syncMemberCount = (workspaceId: string) => {
  const explicitCount = workspaceMembers.filter((m) => m.workspaceId === workspaceId).length;
  const inheritedExtra = buildInheritedMembers(workspaceId).filter(
    (i) => !workspaceMembers.some((e) => e.workspaceId === workspaceId && e.userId === i.userId),
  ).length;
  workspaces = workspaces.map((w) =>
    w.id === workspaceId ? { ...w, memberCount: explicitCount + inheritedExtra } : w,
  );
};

export interface AddMemberInput {
  userId: string;
  userName: string;
  department: string;
  role: WorkspaceMemberRole;
}

export const addWorkspaceMembers = async (
  workspaceId: string,
  members: AddMemberInput[],
): Promise<void> => {
  for (const m of members) {
    if (isInheritedDeptManager(workspaceId, m.userId)) continue;
    if (workspaceMembers.some((x) => x.workspaceId === workspaceId && x.userId === m.userId)) continue;
    workspaceMembers = [
      ...workspaceMembers,
      {
        id: `wm-${Date.now()}-${m.userId}`,
        workspaceId,
        userId: m.userId,
        userName: m.userName,
        department: m.department,
        role: m.role,
        addedAt: now(),
      },
    ];
  }
  syncMemberCount(workspaceId);
  await delay(null);
};

const explicitManagerCount = (workspaceId: string, excludeMemberId?: string): number =>
  workspaceMembers.filter(
    (m) => m.workspaceId === workspaceId && m.role === 'MANAGER' && m.id !== excludeMemberId,
  ).length;

export const updateWorkspaceMemberRole = async (
  memberId: string,
  role: WorkspaceMemberRole,
): Promise<void> => {
  const target = workspaceMembers.find((m) => m.id === memberId);
  if (!target) return;
  if (target.role === 'MANAGER' && role === 'MEMBER') {
    const remainingExplicit = explicitManagerCount(target.workspaceId, memberId);
    const inheritedCount = buildInheritedMembers(target.workspaceId).length;
    if (remainingExplicit + inheritedCount < 1) {
      throw new Error('MUST_KEEP_ONE_MANAGER');
    }
  }
  workspaceMembers = workspaceMembers.map((m) => (m.id === memberId ? { ...m, role } : m));
  await delay(null);
};

export const removeWorkspaceMember = async (memberId: string): Promise<void> => {
  const target = workspaceMembers.find((m) => m.id === memberId);
  if (!target) return;
  if (target.role === 'MANAGER') {
    const remainingExplicit = explicitManagerCount(target.workspaceId, memberId);
    const inheritedCount = buildInheritedMembers(target.workspaceId).length;
    if (remainingExplicit + inheritedCount < 1) {
      throw new Error('MUST_KEEP_ONE_MANAGER');
    }
  }
  workspaceMembers = workspaceMembers.filter((m) => m.id !== memberId);
  syncMemberCount(target.workspaceId);
  await delay(null);
};

workspaces.forEach((w) => syncMemberCount(w.id));

