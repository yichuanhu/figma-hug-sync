/**
 * 部门 → 需求审批流模板绑定（STORY-016）
 *
 * 运行时通过 requirement.department_id 解析所属审批流模板：
 *   getBindingByDepartment(deptId) -> approval_flow_template_id | null
 *
 * 一个部门同一时刻仅能绑定一个 business_type=REQUIREMENT 的模板；
 * 一个模板可被多个部门绑定。
 */

const STORAGE_KEY = 'apa.requirements.deptApprovalBinding.v1';
const BUSINESS_TYPE = 'REQUIREMENT';

export interface DepartmentApprovalFlowBinding {
  department_id: string;
  business_type: typeof BUSINESS_TYPE;
  approval_flow_template_id: string;
  updated_at: string;
  updated_by?: string;
}

const defaultBindings: DepartmentApprovalFlowBinding[] = [
  { department_id: 'dept-apa-product', business_type: BUSINESS_TYPE, approval_flow_template_id: 'flow-001', updated_at: '2025-12-01T09:00:00Z', updated_by: '当前用户' },
  { department_id: 'dept-dw',          business_type: BUSINESS_TYPE, approval_flow_template_id: 'flow-001', updated_at: '2025-12-01T09:00:00Z', updated_by: '当前用户' },
  { department_id: 'dept-finance',     business_type: BUSINESS_TYPE, approval_flow_template_id: 'flow-002', updated_at: '2025-12-05T10:00:00Z', updated_by: '当前用户' },
];

const load = (): DepartmentApprovalFlowBinding[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DepartmentApprovalFlowBinding[];
  } catch { /* noop */ }
  return defaultBindings;
};
const save = (list: DepartmentApprovalFlowBinding[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* noop */ }
};

let cache: DepartmentApprovalFlowBinding[] = load();

const listeners = new Set<() => void>();
export const subscribeBindingChange = (cb: () => void): (() => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const notify = () => listeners.forEach((cb) => cb());

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

export const fetchAllBindings = async (): Promise<DepartmentApprovalFlowBinding[]> => {
  await delay();
  return [...cache];
};

/** 取部门当前绑定的审批流模板 id；未绑定返回 null（运行时即可跳过审批/评估） */
export const getBindingByDepartment = (deptId: string): string | null => {
  return cache.find((b) => b.department_id === deptId)?.approval_flow_template_id ?? null;
};

/** 统计某审批流模板被多少个部门绑定 */
export const countBoundDepartments = (templateId: string): number => {
  return cache.filter((b) => b.approval_flow_template_id === templateId).length;
};

/** 批量统计：返回 templateId -> count map */
export const getBoundDepartmentCountMap = (): Record<string, number> => {
  const map: Record<string, number> = {};
  cache.forEach((b) => { map[b.approval_flow_template_id] = (map[b.approval_flow_template_id] ?? 0) + 1; });
  return map;
};

export const setBinding = async (deptId: string, templateId: string): Promise<void> => {
  await delay();
  const exist = cache.find((b) => b.department_id === deptId);
  const now = new Date().toISOString();
  if (exist) {
    cache = cache.map((b) => b.department_id === deptId
      ? { ...b, approval_flow_template_id: templateId, updated_at: now }
      : b);
  } else {
    cache = [...cache, { department_id: deptId, business_type: BUSINESS_TYPE, approval_flow_template_id: templateId, updated_at: now, updated_by: '当前用户' }];
  }
  save(cache);
  notify();
};

export const removeBinding = async (deptId: string): Promise<void> => {
  await delay();
  cache = cache.filter((b) => b.department_id !== deptId);
  save(cache);
  notify();
};

/** 列出绑定到指定模板的所有部门 id */
export const listDepartmentsByTemplate = (templateId: string): string[] => {
  return cache.filter((b) => b.approval_flow_template_id === templateId).map((b) => b.department_id);
};
