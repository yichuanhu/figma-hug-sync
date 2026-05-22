/**
 * 部门 → 需求方案绑定（STORY-001/013 v5）
 *
 * 创建需求时通过 user.department_id → department_scheme_binding 查找当前部门生效方案。
 * 同一部门同一时刻仅可绑定一个方案；一个方案可被多个部门绑定。
 *
 * 数据契约与 department_approval_flow_binding 完全对齐，便于运行时统一处理。
 */

const STORAGE_KEY = "apa.requirements.deptSchemeBinding.v2";
const BUSINESS_TYPE = "REQUIREMENT";

export interface DepartmentSchemeBinding {
  department_id: string;
  business_type: typeof BUSINESS_TYPE;
  scheme_id: string;
  updated_at: string;
  updated_by?: string;
}

/**
 * 默认绑定：
 * - dept-apa-product / dept-product / dept-fe / dept-be → RPA 专业版
 * - dept-finance / dept-hr → RPA 轻量版
 * 其余部门未绑定（创建需求时会被拦截）。
 */
const defaultBindings: DepartmentSchemeBinding[] = [];

const load = (): DepartmentSchemeBinding[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DepartmentSchemeBinding[];
  } catch {
    /* noop */
  }
  return defaultBindings;
};

const save = (list: DepartmentSchemeBinding[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
};

let cache: DepartmentSchemeBinding[] = load();

const listeners = new Set<() => void>();
export const subscribeSchemeBindingChange = (cb: () => void): (() => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const notify = () => listeners.forEach((cb) => cb());

/** 取部门当前绑定的方案 id；未绑定返回 null */
export const getSchemeIdByDepartment = (deptId: string | undefined | null): string | null => {
  if (!deptId) return null;
  return cache.find((b) => b.department_id === deptId)?.scheme_id ?? null;
};

/** 列出绑定到某方案的所有部门 id */
export const listDepartmentsByScheme = (schemeId: string): string[] =>
  cache.filter((b) => b.scheme_id === schemeId).map((b) => b.department_id);

/** schemeId -> bound dept count */
export const getBoundDepartmentCountMapByScheme = (): Record<string, number> => {
  const map: Record<string, number> = {};
  cache.forEach((b) => {
    map[b.scheme_id] = (map[b.scheme_id] ?? 0) + 1;
  });
  return map;
};

/**
 * 覆盖式同步：将「该方案的绑定」整体替换为传入的部门列表。
 * - 移除：原本绑定到该方案但不在新列表里的部门
 * - 新增/抢占：新列表里的部门统一指向该方案（若之前被其他方案占用，则抢占）
 * 返回被抢占的明细（用于 UI 提示）。
 */
export interface SetSchemeBindingsResult {
  added: string[];
  removed: string[];
  /** 从其它方案抢占的明细：departmentId -> previousSchemeId */
  overridden: Record<string, string>;
}

export const setSchemeBindingsForScheme = (schemeId: string, deptIds: string[]): SetSchemeBindingsResult => {
  const now = new Date().toISOString();
  const setIds = new Set(deptIds);
  const overridden: Record<string, string> = {};
  const added: string[] = [];
  const removed: string[] = [];

  // 1) 移除：该方案旧绑定中不在新列表的部门
  cache.forEach((b) => {
    if (b.scheme_id === schemeId && !setIds.has(b.department_id)) removed.push(b.department_id);
  });

  // 2) 重建：先清掉所有与本次涉及部门或本方案相关的旧记录
  const touchedDepts = new Set<string>([...deptIds, ...removed]);
  const remaining = cache.filter((b) => !touchedDepts.has(b.department_id));

  deptIds.forEach((deptId) => {
    const prev = cache.find((b) => b.department_id === deptId);
    if (!prev) added.push(deptId);
    else if (prev.scheme_id !== schemeId) overridden[deptId] = prev.scheme_id;
    remaining.push({
      department_id: deptId,
      business_type: BUSINESS_TYPE,
      scheme_id: schemeId,
      updated_at: now,
      updated_by: "当前用户",
    });
  });

  cache = remaining;
  save(cache);
  notify();
  return { added, removed, overridden };
};

export const fetchAllSchemeBindings = (): DepartmentSchemeBinding[] => [...cache];

/**
 * 如果当前没有任何绑定，则用传入的 schemeId 给若干示例部门做种子绑定，
 * 便于在「适用部门」选择器中演示「已被其他激活方案占用」的禁用态。
 * 仅当 cache 为空时生效，幂等安全。
 */
export const seedSampleBindingsIfEmpty = (schemeId: string, sampleDeptIds: string[]): void => {
  if (cache.length > 0) return;
  if (!schemeId || sampleDeptIds.length === 0) return;
  const now = new Date().toISOString();
  cache = sampleDeptIds.map((deptId) => ({
    department_id: deptId,
    business_type: BUSINESS_TYPE,
    scheme_id: schemeId,
    updated_at: now,
    updated_by: "system",
  }));
  save(cache);
  notify();
};

/** Dry-run：仅计算会被抢占的部门，不写入。 */
export interface SchemeBindingConflictItem {
  deptId: string;
  prevSchemeId: string;
}
export const previewSchemeBindings = (schemeId: string, deptIds: string[]): SchemeBindingConflictItem[] => {
  const items: SchemeBindingConflictItem[] = [];
  deptIds.forEach((deptId) => {
    const prev = cache.find((b) => b.department_id === deptId);
    if (prev && prev.scheme_id !== schemeId) {
      items.push({ deptId, prevSchemeId: prev.scheme_id });
    }
  });
  return items;
};

/**
 * 返回 deptId -> 当前归属方案 id 的占用 map（可排除指定方案）。
 * 传入 activeSchemeIds 时仅统计这些激活方案的绑定（草稿/未激活方案不占用部门）。
 */
export const getOccupiedDepartmentMapByScheme = (
  excludeSchemeId?: string,
  activeSchemeIds?: string[],
): Record<string, string> => {
  const activeSet = activeSchemeIds ? new Set(activeSchemeIds) : null;
  const map: Record<string, string> = {};
  cache.forEach((b) => {
    if (b.scheme_id === excludeSchemeId) return;
    if (activeSet && !activeSet.has(b.scheme_id)) return;
    map[b.department_id] = b.scheme_id;
  });
  return map;
};
