/**
 * 审批流模板（独立于需求模版的全局审批配置）
 */
import type { ApprovalLevelConfig } from '@/pages/Requirements/RequirementsWorkbench/types';

export type ApprovalFlowStatus = 'active' | 'inactive';

export interface ApprovalFlowTemplate {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: ApprovalFlowStatus;
  is_preset?: boolean;
  levels: ApprovalLevelConfig[];
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'apa.requirements.approvalFlows.v1';

const defaultFlows: ApprovalFlowTemplate[] = [
  {
    id: 'flow-001',
    name: '标准三级审批',
    code: 'STD-3LV',
    description: '部门主管 → AI 委员会 → 财务负责人',
    status: 'active',
    is_preset: true,
    levels: [
      { order: 1, name: '部门主管审批', approver_type: 'role', approver_ids: ['role-line-manager'], mode: 'any_one' },
      { order: 2, name: 'AI 委员会评审', approver_type: 'department', approver_ids: ['dept-committee'], mode: 'majority' },
      { order: 3, name: '财务负责人审批', approver_type: 'role', approver_ids: ['role-finance-head'], mode: 'any_one' },
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
    levels: [
      { order: 1, name: '直属主管审批', approver_type: 'role', approver_ids: ['role-line-manager'], mode: 'any_one' },
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

export const createApprovalFlow = async (
  payload: Pick<ApprovalFlowTemplate, 'name' | 'code' | 'description' | 'levels'>,
): Promise<ApprovalFlowTemplate> => {
  await delay();
  const now = new Date().toISOString();
  const item: ApprovalFlowTemplate = {
    id: `flow-${Date.now()}`,
    status: 'inactive',
    ...payload,
    created_at: now,
    updated_at: now,
  };
  cache = [item, ...cache];
  save(cache);
  return item;
};

export const updateApprovalFlow = async (
  id: string,
  patch: Partial<Omit<ApprovalFlowTemplate, 'id' | 'created_at'>>,
): Promise<ApprovalFlowTemplate> => {
  await delay();
  cache = cache.map((f) => (f.id === id ? { ...f, ...patch, updated_at: new Date().toISOString() } : f));
  save(cache);
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
};

export const activateApprovalFlow = async (id: string): Promise<void> => {
  await delay();
  cache = cache.map((f) => ({ ...f, status: f.id === id ? 'active' : f.status, updated_at: f.id === id ? new Date().toISOString() : f.updated_at }));
  save(cache);
};

export const deactivateApprovalFlow = async (id: string): Promise<void> => {
  await delay();
  cache = cache.map((f) => (f.id === id ? { ...f, status: 'inactive' as const, updated_at: new Date().toISOString() } : f));
  save(cache);
};
