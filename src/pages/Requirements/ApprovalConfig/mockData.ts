/**
 * 审批流模板（独立于需求模版的全局审批配置）
 *
 * 数据结构与"需求模版 → 工作流 → 审批人配置"完全一致，
 * 直接复用 WorkflowApprover 类型，便于 UI/交互一比一还原。
 */
import type { WorkflowApprover, AssessmentModel } from '@/pages/Requirements/RequirementsWorkbench/types';

export type ApprovalFlowStatus = 'active' | 'inactive';

export interface ApprovalFlowTemplate {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: ApprovalFlowStatus;
  is_preset?: boolean;
  is_draft?: boolean;
  /** 审批人列表（priority 升序） */
  approvers: WorkflowApprover[];
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'apa.requirements.approvalFlows.v2';

const defaultFlows: ApprovalFlowTemplate[] = [
  {
    id: 'flow-001',
    name: '标准三级审批',
    code: 'STD-3LV',
    description: '部门主管 → AI 委员会 → 财务负责人',
    status: 'active',
    is_preset: true,
    approvers: [
      { id: 'a1', name: '部门主管审批', type: 'department_leader', priority: 1, required: true, approval_mode: 'any_one', timeout_days: 3 },
      { id: 'a2', name: 'AI 委员会评审', type: 'role', priority: 2, required: true, approval_mode: 'majority', timeout_days: 7, target_ids: ['role-committee'] },
      { id: 'a3', name: '财务负责人审批', type: 'role', priority: 3, required: true, approval_mode: 'any_one', timeout_days: 3, target_ids: ['role-dept-head'] },
    ],
    created_at: '2025-01-10T09:00:00Z',
    updated_at: '2025-02-20T14:30:00Z',
  },
  {
    id: 'flow-002',
    name: '轻量单级审批',
    code: 'LITE-1LV',
    description: '仅需直属主管审批，适用于小型需求',
    status: 'inactive',
    is_preset: true,
    approvers: [
      { id: 'a1', name: '直属主管审批', type: 'department_leader', priority: 1, required: true, approval_mode: 'any_one', timeout_days: 3 },
    ],
    created_at: '2025-01-12T10:00:00Z',
    updated_at: '2025-01-12T10:00:00Z',
  },
];

const load = (): ApprovalFlowTemplate[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ApprovalFlowTemplate[];
  } catch {
    /* noop */
  }
  return defaultFlows;
};

const save = (list: ApprovalFlowTemplate[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
};

let cache: ApprovalFlowTemplate[] = load();

const listeners = new Set<() => void>();
export const subscribeApprovalFlowChange = (cb: () => void): (() => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const notify = () => listeners.forEach((cb) => cb());

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const fetchApprovalFlows = async (keyword?: string): Promise<ApprovalFlowTemplate[]> => {
  await delay(150);
  const kw = keyword?.trim().toLowerCase();
  if (!kw) return [...cache];
  return cache.filter(
    (f) =>
      f.name.toLowerCase().includes(kw) ||
      f.code.toLowerCase().includes(kw) ||
      (f.description?.toLowerCase().includes(kw) ?? false),
  );
};

export const getApprovalFlowById = (id: string): ApprovalFlowTemplate | undefined =>
  cache.find((f) => f.id === id);

export const createApprovalFlowDraft = async (
  payload?: Partial<Pick<ApprovalFlowTemplate, 'name' | 'code' | 'description' | 'approvers'>>,
): Promise<ApprovalFlowTemplate> => {
  await delay();
  const now = new Date().toISOString();
  const item: ApprovalFlowTemplate = {
    id: `flow-${Date.now()}`,
    name: payload?.name ?? '未命名审批流',
    code: payload?.code ?? `FLOW-${Date.now().toString(36).slice(-5).toUpperCase()}`,
    description: payload?.description,
    status: 'inactive',
    is_draft: true,
    approvers: payload?.approvers ?? [],
    created_at: now,
    updated_at: now,
  };
  cache = [item, ...cache];
  save(cache);
  notify();
  return item;
};

export const updateApprovalFlow = async (
  id: string,
  patch: Partial<Omit<ApprovalFlowTemplate, 'id' | 'created_at'>>,
): Promise<ApprovalFlowTemplate> => {
  await delay();
  cache = cache.map((f) => (f.id === id ? { ...f, ...patch, updated_at: new Date().toISOString() } : f));
  save(cache);
  notify();
  return cache.find((f) => f.id === id)!;
};

export const deleteApprovalFlow = async (id: string): Promise<void> => {
  await delay();
  const target = cache.find((f) => f.id === id);
  if (target?.status === 'active') {
    throw new Error('已启用的审批流不能删除，请先停用');
  }
  cache = cache.filter((f) => f.id !== id);
  save(cache);
  notify();
};

export const activateApprovalFlow = async (id: string): Promise<void> => {
  await delay();
  cache = cache.map((f) => ({
    ...f,
    status: f.id === id ? 'active' : f.status === 'active' ? 'inactive' : f.status,
    is_draft: f.id === id ? false : f.is_draft,
    updated_at: f.id === id ? new Date().toISOString() : f.updated_at,
  }));
  save(cache);
  notify();
};

export const deactivateApprovalFlow = async (id: string): Promise<void> => {
  await delay();
  cache = cache.map((f) => (f.id === id ? { ...f, status: 'inactive' as const, updated_at: new Date().toISOString() } : f));
  save(cache);
  notify();
};

export const cloneApprovalFlowAsDraft = async (sourceId: string): Promise<ApprovalFlowTemplate> => {
  const src = cache.find((f) => f.id === sourceId);
  if (!src) throw new Error('源审批流不存在');
  return createApprovalFlowDraft({
    name: `${src.name} 副本`,
    code: `${src.code}-COPY`,
    description: src.description,
    approvers: src.approvers.map((a, i) => ({ ...a, id: `appr-${Date.now().toString(36).slice(-4)}-${i + 1}` })),
  });
};
