/**
 * Mock dependent resources of a process (triggers / tasks / templates).
 * Used to demo cascading "owning department" updates from EditProcessModal.
 *
 * NOTE: This is a memory-level mutable mock. The data here is intentionally
 * decoupled from other generateMock* sources, only to demonstrate the
 * interaction in a deterministic way.
 */

export interface DependentResource {
  id: string;
  name: string;
  process_id: string;
  owning_department_id: string;
  owning_department_name: string;
}

export const mockDependentTriggers: DependentResource[] = [
  { id: 'trg-001', name: '订单数据每日同步触发器', process_id: 'proc-001', owning_department_id: 'dept-finance', owning_department_name: 'Finance Department' },
  { id: 'trg-002', name: '订单异常队列触发器', process_id: 'proc-001', owning_department_id: 'dept-finance', owning_department_name: 'Finance Department' },
  { id: 'trg-003', name: '客户报销月度触发器', process_id: 'proc-002', owning_department_id: 'dept-enterprise', owning_department_name: 'Enterprise Business Center' },
  { id: 'trg-004', name: '入职提醒触发器', process_id: 'proc-003', owning_department_id: 'dept-hr', owning_department_name: 'Human Resources Department' },
  { id: 'trg-005', name: '研发周报触发器', process_id: 'proc-004', owning_department_id: 'dept-rd', owning_department_name: 'R&D Center' },
];

export const mockDependentTasks: DependentResource[] = [
  { id: 'task-001', name: '订单自动处理 - 日常任务', process_id: 'proc-001', owning_department_id: 'dept-finance', owning_department_name: 'Finance Department' },
  { id: 'task-002', name: '财务报销批量审批任务', process_id: 'proc-002', owning_department_id: 'dept-enterprise', owning_department_name: 'Enterprise Business Center' },
  { id: 'task-003', name: '新员工入职流程任务', process_id: 'proc-003', owning_department_id: 'dept-hr', owning_department_name: 'Human Resources Department' },
  { id: 'task-004', name: '研发资源分配任务', process_id: 'proc-004', owning_department_id: 'dept-rd', owning_department_name: 'R&D Center' },
];

export const mockDependentTemplates: DependentResource[] = [
  { id: 'tpl-001', name: '订单处理执行模板', process_id: 'proc-001', owning_department_id: 'dept-finance', owning_department_name: 'Finance Department' },
  { id: 'tpl-002', name: '报销审批执行模板', process_id: 'proc-002', owning_department_id: 'dept-enterprise', owning_department_name: 'Enterprise Business Center' },
  { id: 'tpl-003', name: '入职流程执行模板', process_id: 'proc-003', owning_department_id: 'dept-hr', owning_department_name: 'Human Resources Department' },
];

export interface DependentsSummary {
  triggers: DependentResource[];
  tasks: DependentResource[];
  templates: DependentResource[];
  total: number;
}

export const getDependents = (processId: string | undefined | null): DependentsSummary => {
  if (!processId) return { triggers: [], tasks: [], templates: [], total: 0 };
  const triggers = mockDependentTriggers.filter((r) => r.process_id === processId);
  const tasks = mockDependentTasks.filter((r) => r.process_id === processId);
  const templates = mockDependentTemplates.filter((r) => r.process_id === processId);
  return { triggers, tasks, templates, total: triggers.length + tasks.length + templates.length };
};

/**
 * Cascade-update the owning department of all resources depending on a process.
 * Mutates the in-memory mock arrays and returns updated counts.
 */
export const cascadeUpdateDepartment = (
  processId: string,
  owning_department_id: string,
  owning_department_name: string,
): { triggers: number; tasks: number; templates: number; total: number } => {
  let triggers = 0;
  let tasks = 0;
  let templates = 0;

  mockDependentTriggers.forEach((r) => {
    if (r.process_id === processId) {
      r.owning_department_id = owning_department_id;
      r.owning_department_name = owning_department_name;
      triggers += 1;
    }
  });
  mockDependentTasks.forEach((r) => {
    if (r.process_id === processId) {
      r.owning_department_id = owning_department_id;
      r.owning_department_name = owning_department_name;
      tasks += 1;
    }
  });
  mockDependentTemplates.forEach((r) => {
    if (r.process_id === processId) {
      r.owning_department_id = owning_department_id;
      r.owning_department_name = owning_department_name;
      templates += 1;
    }
  });

  return { triggers, tasks, templates, total: triggers + tasks + templates };
};
