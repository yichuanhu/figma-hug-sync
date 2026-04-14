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
  'dept-east': 'East China Regional Business Division',
  'dept-south': 'South and Southwest China Regional Business Division',
  'dept-expert': 'Expert Enablement Group',
  'dept-prof-service': 'Professional Services and Customer Success Management Center',
  'dept-rd': 'R&D Center',
  'dept-apa-product': 'APA Product Division',
  'dept-dw': 'Digital Worker Division',
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
