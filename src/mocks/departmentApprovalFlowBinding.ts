/**
 * 部门 → 审批流模板绑定（FEAT-017 STORY-016 + FEAT-025 STORY-001）
 *
 * 通过 business_type 命名空间隔离：
 *   - REQUIREMENT      需求审批
 *   - PROCESS_PUBLISH  流程发布审批
 *
 * 同一部门可同时绑定不同业务类型的模板，但同一业务类型下唯一。
 */

const STORAGE_KEY = 'apa.requirements.deptApprovalBinding.v2';

export type ApprovalBindingBusinessType = 'REQUIREMENT' | 'PROCESS_PUBLISH' | 'PROCESS_OFFLINE';

export interface DepartmentApprovalFlowBinding {
  department_id: string;
  business_type: ApprovalBindingBusinessType;
  approval_flow_template_id: string;
  updated_at: string;
  updated_by?: string;
}

const defaultBindings: DepartmentApprovalFlowBinding[] = [
  { department_id: 'dept-apa-product', business_type: 'REQUIREMENT',     approval_flow_template_id: 'flow-001',  updated_at: '2025-12-01T09:00:00Z', updated_by: '当前用户' },
  { department_id: 'dept-dw',          business_type: 'REQUIREMENT',     approval_flow_template_id: 'flow-001',  updated_at: '2025-12-01T09:00:00Z', updated_by: '当前用户' },
  { department_id: 'dept-finance',     business_type: 'REQUIREMENT',     approval_flow_template_id: 'flow-002',  updated_at: '2025-12-05T10:00:00Z', updated_by: '当前用户' },
  { department_id: 'dept-apa-product', business_type: 'PROCESS_PUBLISH', approval_flow_template_id: 'pflow-001', updated_at: '2026-04-10T09:00:00Z', updated_by: '当前用户' },
  { department_id: 'dept-dw',          business_type: 'PROCESS_PUBLISH', approval_flow_template_id: 'pflow-001', updated_at: '2026-04-10T09:00:00Z', updated_by: '当前用户' },
  { department_id: 'dept-finance',     business_type: 'PROCESS_PUBLISH', approval_flow_template_id: 'pflow-002', updated_at: '2026-04-12T10:00:00Z', updated_by: '当前用户' },
  { department_id: 'dept-apa-product', business_type: 'PROCESS_OFFLINE', approval_flow_template_id: 'oflow-001', updated_at: '2026-05-15T09:00:00Z', updated_by: '当前用户' },
  { department_id: 'dept-finance',     business_type: 'PROCESS_OFFLINE', approval_flow_template_id: 'oflow-002', updated_at: '2026-05-15T09:00:00Z', updated_by: '当前用户' },
];

const load = (): DepartmentApprovalFlowBinding[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DepartmentApprovalFlowBinding[];
      // 兼容旧版本数据（无 business_type 字段）
      return parsed.map((b) => ({ ...b, business_type: b.business_type ?? 'REQUIREMENT' }));
    }
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

export const fetchAllBindings = async (
  businessType: ApprovalBindingBusinessType = 'REQUIREMENT',
): Promise<DepartmentApprovalFlowBinding[]> => {
  await delay();
  return cache.filter((b) => b.business_type === businessType);
};

/** 取部门当前绑定的审批流模板 id；未绑定返回 null */
export const getBindingByDepartment = (
  deptId: string,
  businessType: ApprovalBindingBusinessType = 'REQUIREMENT',
): string | null => {
  return cache.find((b) => b.department_id === deptId && b.business_type === businessType)?.approval_flow_template_id ?? null;
};

/** 统计某审批流模板被多少个部门绑定 */
export const countBoundDepartments = (
  templateId: string,
  businessType: ApprovalBindingBusinessType = 'REQUIREMENT',
): number => {
  return cache.filter((b) => b.approval_flow_template_id === templateId && b.business_type === businessType).length;
};

/** 批量统计：返回 templateId -> count map */
export const getBoundDepartmentCountMap = (
  businessType: ApprovalBindingBusinessType = 'REQUIREMENT',
): Record<string, number> => {
  const map: Record<string, number> = {};
  cache.forEach((b) => {
    if (b.business_type !== businessType) return;
    map[b.approval_flow_template_id] = (map[b.approval_flow_template_id] ?? 0) + 1;
  });
  return map;
};

export const setBinding = async (
  deptId: string,
  templateId: string,
  businessType: ApprovalBindingBusinessType = 'REQUIREMENT',
): Promise<void> => {
  await delay();
  const exist = cache.find((b) => b.department_id === deptId && b.business_type === businessType);
  const now = new Date().toISOString();
  if (exist) {
    cache = cache.map((b) => (b.department_id === deptId && b.business_type === businessType)
      ? { ...b, approval_flow_template_id: templateId, updated_at: now }
      : b);
  } else {
    cache = [...cache, { department_id: deptId, business_type: businessType, approval_flow_template_id: templateId, updated_at: now, updated_by: '当前用户' }];
  }
  save(cache);
  notify();
};

export const removeBinding = async (
  deptId: string,
  businessType: ApprovalBindingBusinessType = 'REQUIREMENT',
): Promise<void> => {
  await delay();
  cache = cache.filter((b) => !(b.department_id === deptId && b.business_type === businessType));
  save(cache);
  notify();
};

/** 列出绑定到指定模板的所有部门 id */
export const listDepartmentsByTemplate = (
  templateId: string,
  businessType: ApprovalBindingBusinessType = 'REQUIREMENT',
): string[] => {
  return cache
    .filter((b) => b.approval_flow_template_id === templateId && b.business_type === businessType)
    .map((b) => b.department_id);
};

export interface SetTemplateBindingsResult {
  added: string[];
  removed: string[];
  overridden: Record<string, string>;
}

export const setBindingsForTemplate = (
  templateId: string,
  deptIds: string[],
  businessType: ApprovalBindingBusinessType = 'REQUIREMENT',
): SetTemplateBindingsResult => {
  const now = new Date().toISOString();
  const setIds = new Set(deptIds);
  const overridden: Record<string, string> = {};
  const added: string[] = [];
  const removed: string[] = [];

  cache.forEach((b) => {
    if (b.business_type !== businessType) return;
    if (b.approval_flow_template_id === templateId && !setIds.has(b.department_id)) removed.push(b.department_id);
  });

  const touchedDepts = new Set<string>([...deptIds, ...removed]);
  const remaining = cache.filter((b) => b.business_type !== businessType || !touchedDepts.has(b.department_id));

  deptIds.forEach((deptId) => {
    const prev = cache.find((b) => b.department_id === deptId && b.business_type === businessType);
    if (!prev) added.push(deptId);
    else if (prev.approval_flow_template_id !== templateId) overridden[deptId] = prev.approval_flow_template_id;
    remaining.push({
      department_id: deptId,
      business_type: businessType,
      approval_flow_template_id: templateId,
      updated_at: now,
      updated_by: '当前用户',
    });
  });

  cache = remaining;
  save(cache);
  notify();
  return { added, removed, overridden };
};

export interface BindingConflictItem { deptId: string; prevTemplateId: string; }
export const previewBindingsForTemplate = (
  templateId: string,
  deptIds: string[],
  businessType: ApprovalBindingBusinessType = 'REQUIREMENT',
): BindingConflictItem[] => {
  const items: BindingConflictItem[] = [];
  deptIds.forEach((deptId) => {
    const prev = cache.find((b) => b.department_id === deptId && b.business_type === businessType);
    if (prev && prev.approval_flow_template_id !== templateId) {
      items.push({ deptId, prevTemplateId: prev.approval_flow_template_id });
    }
  });
  return items;
};

/**
 * 返回 deptId -> 当前归属模板 id 的占用 map（同业务类型范围内，可排除指定模板）
 */
export const getOccupiedDepartmentMap = (
  excludeTemplateId?: string,
  activeTemplateIds?: string[],
  businessType: ApprovalBindingBusinessType = 'REQUIREMENT',
): Record<string, string> => {
  const activeSet = activeTemplateIds ? new Set(activeTemplateIds) : null;
  const map: Record<string, string> = {};
  cache.forEach((b) => {
    if (b.business_type !== businessType) return;
    if (b.approval_flow_template_id === excludeTemplateId) return;
    if (activeSet && !activeSet.has(b.approval_flow_template_id)) return;
    map[b.department_id] = b.approval_flow_template_id;
  });
  return map;
};
