/**
 * 流程下线申请 — 当前用户可发起下线申请的 PUBLISHED 流程候选
 *
 * 仅 mock 用途：返回处于 PUBLISHED 状态且在用户权限范围内的流程列表。
 * 实际后端实现会基于流程数据权限和流程状态过滤。
 */

export interface PublishedProcessOption {
  id: string;
  name: string;
  current_version: string;
  department_id: string;
  department_name: string;
}

// 与 ProcessManagement mock 中 PUBLISHED 流程对齐
const POOL: PublishedProcessOption[] = [
  { id: 'process-2', name: 'Customer Information Sync Flow', current_version: 'v1.4.0', department_id: 'dept-finance', department_name: 'Finance Department' },
  { id: 'process-5', name: 'Contract Approval Flow', current_version: 'v2.1.0', department_id: 'dept-legal', department_name: 'Legal Department' },
  { id: 'process-8', name: 'Employee Performance Summary', current_version: 'v1.0.3', department_id: 'dept-apa-product', department_name: 'APA Product Division' },
  { id: 'process-11', name: 'Monthly Sales Report Generation', current_version: 'v1.2.1', department_id: 'dept-finance', department_name: 'Finance Department' },
  { id: 'process-14', name: 'Invoice Auto Verification', current_version: 'v1.0.0', department_id: 'dept-finance', department_name: 'Finance Department' },
  { id: 'process-17', name: 'Procurement Approval Sync', current_version: 'v1.1.0', department_id: 'dept-apa-product', department_name: 'APA Product Division' },
];

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

export const fetchPublishedProcessOptions = async (keyword?: string): Promise<PublishedProcessOption[]> => {
  await delay();
  if (!keyword?.trim()) return POOL;
  const kw = keyword.trim().toLowerCase();
  return POOL.filter((p) => p.name.toLowerCase().includes(kw));
};

export const getPublishedProcessById = (id: string): PublishedProcessOption | undefined =>
  POOL.find((p) => p.id === id);
