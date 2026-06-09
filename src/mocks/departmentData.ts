/**
 * Shared department tree data and mock current user info
 * Used by DepartmentSelect component and create modals
 */

export interface DeptTreeNode {
  value: string;
  label: string;
  children?: DeptTreeNode[];
}

/** Department tree for TreeSelect */
export const departmentTree: DeptTreeNode[] = [
  {
    value: 'laiye',
    label: 'Laiye Technology',
    children: [
      {
        value: 'dept-ceo',
        label: 'CEO Office',
      },
      {
        value: 'dept-enterprise',
        label: 'Enterprise Business Center',
        children: [
          {
            value: 'dept-north',
            label: 'North China Regional Business Division',
            children: [
              { value: 'dept-north-solution', label: 'North China Regional Solution and Delivery Team' },
            ],
          },
          { value: 'dept-east', label: 'East China Regional Business Division' },
          { value: 'dept-south', label: 'South and Southwest China Regional Business Division' },
          { value: 'dept-expert', label: 'Expert Enablement Group' },
          { value: 'dept-prof-service', label: 'Professional Services and Customer Success Management Center' },
        ],
      },
      {
        value: 'dept-rd',
        label: 'R&D Center',
        children: [
          {
            value: 'dept-apa-product',
            label: 'APA Product Division',
            children: [
              { value: 'dept-fe', label: 'Frontend Development Team' },
              { value: 'dept-be', label: 'Backend Development Team' },
              { value: 'dept-ai', label: 'AI Platform and Large Language Model Application R&D Team' },
              { value: 'dept-qa', label: 'Quality Assurance Team' },
              { value: 'dept-product', label: 'Product Team' },
            ],
          },
          {
            value: 'dept-dw',
            label: 'Digital Worker Division',
            children: [
              { value: 'dept-rpa-product', label: 'RPA Product Team' },
              { value: 'dept-idp-product', label: 'IDP Product Team' },
            ],
          },
          { value: 'dept-platform', label: 'Platform Engineering Division' },
        ],
      },
      { value: 'dept-finance', label: 'Finance Department' },
      { value: 'dept-hr', label: 'Human Resources Department' },
      { value: 'dept-legal', label: 'Legal Department' },
      { value: 'dept-marketing', label: 'Marketing Department' },
    ],
  },
];

/** Department ID → Name mapping */
export const departmentNameMap: Record<string, string> = {
  'laiye': 'Laiye Technology',
  'dept-ceo': 'CEO Office',
  'dept-enterprise': 'Enterprise Business Center',
  'dept-north': 'North China Regional Business Division',
  'dept-north-solution': 'North China Regional Solution and Delivery Team',
  'dept-east': 'East China Regional Business Division',
  'dept-south': 'South and Southwest China Regional Business Division',
  'dept-expert': 'Expert Enablement Group',
  'dept-prof-service': 'Professional Services and Customer Success Management Center',
  'dept-rd': 'R&D Center',
  'dept-apa-product': 'APA Product Division',
  'dept-fe': 'Frontend Development Team',
  'dept-be': 'Backend Development Team',
  'dept-ai': 'AI Platform and Large Language Model Application R&D Team',
  'dept-qa': 'Quality Assurance Team',
  'dept-product': 'Product Team',
  'dept-dw': 'Digital Worker Division',
  'dept-rpa-product': 'RPA Product Team',
  'dept-idp-product': 'IDP Product Team',
  'dept-platform': 'Platform Engineering Division',
  'dept-finance': 'Finance Department',
  'dept-hr': 'Human Resources Department',
  'dept-legal': 'Legal Department',
  'dept-marketing': 'Marketing Department',
};

/** Get department name by ID */
export const getDepartmentName = (id: string | null | undefined): string => {
  if (!id) return '-';
  return departmentNameMap[id] || id;
};

/** id -> [root, ..., self] 名称链路缓存 */
const departmentPathCache = new Map<string, string[]>();
(function buildDepartmentPathCache() {
  const walk = (nodes: DeptTreeNode[], trail: string[]) => {
    for (const n of nodes) {
      const next = [...trail, n.label];
      departmentPathCache.set(n.value, next);
      if (n.children) walk(n.children, next);
    }
  };
  walk(departmentTree, []);
})();

/** 取部门从根到自身的名称链路（含自身）。 */
export const getDepartmentPath = (id: string | null | undefined): string[] => {
  if (!id) return [];
  const cached = departmentPathCache.get(id);
  if (cached) return cached;
  const fallback = departmentNameMap[id];
  return fallback ? [fallback] : [id];
};

/** 将部门链路拼接为字符串，找不到时回退到叶子名。 */
export const formatDepartmentPath = (
  id: string | null | undefined,
  opts: { separator?: string; includeRoot?: boolean } = {},
): string => {
  if (!id) return '-';
  const { separator = ' / ', includeRoot = true } = opts;
  const path = getDepartmentPath(id);
  const arr = includeRoot ? path : path.slice(1);
  return arr.length ? arr.join(separator) : getDepartmentName(id);
};

/** 取某节点 + 所有子孙节点的 id 列表（含自身）。 */
export const getDepartmentSubtreeIds = (deptId: string): string[] => {
  const result: string[] = [];
  const walk = (nodes: DeptTreeNode[], collecting: boolean): void => {
    for (const n of nodes) {
      const hit = collecting || n.value === deptId;
      if (hit) result.push(n.value);
      if (n.children) walk(n.children, hit);
    }
  };
  walk(departmentTree, false);
  return result.length ? result : [deptId];
};

/** 取某节点的所有祖先 id 列表（不含自身）。 */
export const getDepartmentAncestorIds = (deptId: string): string[] => {
  const path: string[] = [];
  const dfs = (nodes: DeptTreeNode[], trail: string[]): boolean => {
    for (const n of nodes) {
      if (n.value === deptId) { path.push(...trail); return true; }
      if (n.children && dfs(n.children, [...trail, n.value])) return true;
    }
    return false;
  };
  dfs(departmentTree, []);
  return path;
};

/** 将一组部门 id 扩展为「自身 + 所有子孙」的并集（用于"选中父部门自动包含子部门"逻辑）。 */
export const expandDepartmentIdsWithDescendants = (ids: string[]): string[] => {
  const set = new Set<string>();
  ids.forEach((id) => getDepartmentSubtreeIds(id).forEach((x) => set.add(x)));
  return Array.from(set);
};

/** Mock current user info */
export const MOCK_CURRENT_USER = {
  id: 'user-001',
  name: 'John Smith',
  department_id: 'dept-apa-product',
  department_name: 'APA Product Division',
  email: 'john.smith@example.com',
  role: 'Senior Engineer',
};

/** Mock process department mapping (for triggers/templates/tasks that inherit from process) */
export const MOCK_PROCESS_DEPARTMENT_MAP: Record<string, { owning_department_id: string; owning_department_name: string }> = {
  'proc-001': { owning_department_id: 'dept-finance', owning_department_name: 'Finance Department' },
  'proc-002': { owning_department_id: 'dept-enterprise', owning_department_name: 'Enterprise Business Center' },
  'proc-003': { owning_department_id: 'dept-hr', owning_department_name: 'Human Resources Department' },
  'proc-004': { owning_department_id: 'dept-rd', owning_department_name: 'R&D Center' },
};
