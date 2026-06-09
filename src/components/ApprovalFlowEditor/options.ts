/**
 * 通用审批流编辑器 — 审批人候选项
 *
 * 用户/角色/部门候选项与需求中心保持一致，便于跨模块复用同一审批人池。
 */
export const USER_OPTIONS = [
  { value: 'user-001', label: 'John Smith' },
  { value: 'user-002', label: 'Emily Chen' },
  { value: 'user-003', label: 'Michael Wang' },
  { value: 'user-004', label: 'Sarah Li' },
  { value: 'user-005', label: 'David Zhang' },
  { value: 'user-006', label: 'Jessica Liu' },
  { value: 'user-007', label: 'Robert Xu' },
  { value: 'user-008', label: 'Angela Wu' },
];

export const ROLE_OPTIONS = [
  { value: 'role-line-manager', labelKey: 'requirements.scheme.role.lineManager' },
  { value: 'role-dept-head', labelKey: 'requirements.scheme.role.deptHead' },
  { value: 'role-ai-lead', labelKey: 'requirements.scheme.role.aiLead' },
  { value: 'role-finance-head', labelKey: 'requirements.scheme.role.financeHead' },
  { value: 'role-it-head', labelKey: 'requirements.scheme.role.itHead' },
];

export const DEPT_OPTIONS = [
  { value: 'dept-committee', labelKey: 'requirements.scheme.dept.committee' },
  { value: 'dept-it', labelKey: 'requirements.scheme.dept.it' },
  { value: 'dept-001', labelKey: 'requirements.scheme.dept.finance' },
  { value: 'dept-002', labelKey: 'requirements.scheme.dept.hr' },
  { value: 'dept-003', labelKey: 'requirements.scheme.dept.itDept' },
  { value: 'dept-004', labelKey: 'requirements.scheme.dept.procurement' },
  { value: 'dept-005', labelKey: 'requirements.scheme.dept.logistics' },
  { value: 'dept-006', labelKey: 'requirements.scheme.dept.sales' },
];
