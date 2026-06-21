/**
 * 流程停用审批 mock 数据（FEAT-027 STORY-001 / 002 / 003）
 *
 * 维护流程停用申请（process_offline_request）及其审批与执行状态。
 * 仅作前端 mock 使用，订阅式刷新。
 */

import { fetchApprovalFlows, getApprovalFlowById, type ApprovalFlowTemplate } from '@/pages/Requirements/ApprovalConfig/mockData';
import { getBindingByDepartment } from './departmentApprovalFlowBinding';
import { getDepartmentName } from './departmentData';

export type OfflineRequestStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTING'
  | 'EXECUTED'           // 兼容旧值，等同于 EXECUTION_SUCCESS
  | 'EXECUTION_SUCCESS'
  | 'EXECUTION_FAILED'
  | 'CANCELLED';

export type OfflineApprovalAction = 'approve' | 'reject';

export interface OfflineApprovalRecord {
  level: number;
  approver_id: string;
  approver_name: string;
  action: OfflineApprovalAction;
  comment?: string;
  acted_at: string;
}

export interface DependencyCheckSnapshot {
  blocking: boolean;
  triggers: { id: string; name: string; type: 'TIME' | 'QUEUE'; enabled: boolean }[];
  task_templates: { id: string; name: string }[];
  running_tasks: { id: string; name: string; status: 'RUNNING' | 'QUEUED' }[];
  scheduling_refs: { id: string; name: string }[];
}

export interface ProcessOfflineRequest {
  id: string;
  process_id: string;
  process_name: string;
  /** 申请下线时的流程版本号，例如 v1.2.0 */
  process_version: string;
  applicant_id: string;
  applicant_name: string;
  department_id: string;
  department_name: string;
  reason: string;
  submitted_at: string;
  dependency_snapshot: DependencyCheckSnapshot;
  status: OfflineRequestStatus;
  approval_template_snapshot?: ApprovalFlowTemplate;
  current_level?: number;
  total_levels?: number;
  /** 当前审批节点名称（如 "L2 · 张三"）— 仅审批中状态有意义 */
  current_approver_label?: string;
  records: OfflineApprovalRecord[];
  executed_at?: string;
  execution_error?: string;
}

const STORAGE_KEY = 'apa.processOfflineApproval.v3';

const now = (offsetH = 0) => new Date(Date.now() - offsetH * 3_600_000).toISOString();

// 依据 processId 哈希构造一份依赖检查快照（用于 mock 演示）
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/**
 * 开发中心三种停用场景的显式覆盖：
 * - process-2：有阻塞依赖，禁止停用
 * - process-5：无依赖，无审批（dept-legal 未绑定 PROCESS_OFFLINE）
 * - process-8：无依赖，需审批（dept-apa-product 绑定 oflow-001）
 */
const OFFLINE_SCENARIO_OVERRIDES: Record<string, (name: string) => DependencyCheckSnapshot> = {
  'process-2': (name) => ({
    blocking: true,
    triggers: [
      { id: 'tr-process-2-1', name: `${name} 月度定时触发器`, type: 'TIME', enabled: true },
    ],
    task_templates: [
      { id: 'tpl-process-2-1', name: `${name} 例行批量处理模板` },
    ],
    running_tasks: [
      { id: 'task-process-2-1', name: `${name} 运行中任务 #2048`, status: 'RUNNING' },
    ],
    scheduling_refs: [
      { id: 'ref-process-2-1', name: `${name} 月末结账调度引用` },
    ],
  }),
  'process-5': () => ({ blocking: false, triggers: [], task_templates: [], running_tasks: [], scheduling_refs: [] }),
  'process-8': () => ({ blocking: false, triggers: [], task_templates: [], running_tasks: [], scheduling_refs: [] }),
};

export const buildDependencySnapshot = (processId: string, processName: string): DependencyCheckSnapshot => {
  const override = OFFLINE_SCENARIO_OVERRIDES[processId];
  if (override) return override(processName);
  const h = hash(processId);
  const hasTrigger = h % 5 === 0;
  const hasTaskTpl = h % 4 === 0;
  const hasRunning = h % 7 === 0;
  const hasScheduling = h % 3 === 0;
  const triggers = hasTrigger ? [
    { id: `tr-${processId}-1`, name: `${processName} 定时触发器`, type: 'TIME' as const, enabled: true },
  ] : [];
  const task_templates = hasTaskTpl ? [
    { id: `tpl-${processId}-1`, name: `${processName} 例行任务模板` },
  ] : [];
  const running_tasks = hasRunning ? [
    { id: `task-${processId}-1`, name: `${processName} 运行中任务 #${h % 1000}`, status: 'RUNNING' as const },
  ] : [];
  const scheduling_refs = hasScheduling ? [
    { id: `ref-${processId}-1`, name: `${processName} 调度引用` },
  ] : [];
  const blocking = triggers.length > 0 || task_templates.length > 0 || running_tasks.length > 0;
  return { blocking, triggers, task_templates, running_tasks, scheduling_refs };
};

const defaultRequests: ProcessOfflineRequest[] = [
  {
    id: 'por-001',
    process_id: 'process-3',
    process_name: 'Employee Onboarding Flow',
    process_version: 'v2.3.0',
    applicant_id: 'user-002',
    applicant_name: 'Jane Doe',
    department_id: 'dept-apa-product',
    department_name: getDepartmentName('dept-apa-product') || '产品研发部',
    reason: '该流程已被新一代入职引擎替代，建议下线避免误调度。',
    submitted_at: now(20),
    dependency_snapshot: { blocking: false, triggers: [], task_templates: [], running_tasks: [], scheduling_refs: [] },
    status: 'APPROVING',
    approval_template_snapshot: getApprovalFlowById('oflow-001'),
    current_level: 2,
    total_levels: 2,
    current_approver_label: 'L2 · 运维同学',
    records: [
      { level: 1, approver_id: 'user-mgr', approver_name: '林经理', action: 'approve', comment: '同意下线，确认无残余依赖。', acted_at: now(8) },
    ],
  },
  {
    id: 'por-004',
    process_id: 'process-5',
    process_name: 'Contract Approval Flow',
    process_version: 'v1.0.4',
    applicant_id: 'user-005',
    applicant_name: 'Linda Chen',
    department_id: 'dept-legal',
    department_name: getDepartmentName('dept-legal') || '法务部',
    reason: '该流程已无任何触发器、任务模板及调度引用，且部门未配置停用审批，提交后已直接执行下线。',
    submitted_at: now(6),
    dependency_snapshot: { blocking: false, triggers: [], task_templates: [], running_tasks: [], scheduling_refs: [] },
    status: 'EXECUTION_SUCCESS',
    current_level: 1,
    total_levels: 1,
    executed_at: now(6),
    records: [],
  },
  {
    id: 'por-002',
    process_id: 'process-7',
    process_name: 'Customer Info Sync',
    process_version: 'v3.1.2',
    applicant_id: 'user-003',
    applicant_name: 'Mike Wang',
    department_id: 'dept-finance',
    department_name: getDepartmentName('dept-finance') || '财务部',
    reason: '业务系统已不再使用该同步链路。',
    submitted_at: now(56),
    dependency_snapshot: { blocking: false, triggers: [], task_templates: [], running_tasks: [], scheduling_refs: [] },
    status: 'EXECUTION_SUCCESS',
    approval_template_snapshot: getApprovalFlowById('oflow-001'),
    current_level: 1,
    total_levels: 1,
    executed_at: now(40),
    records: [
      { level: 1, approver_id: 'user-mgr', approver_name: '林经理', action: 'approve', comment: '同意下线', acted_at: now(48) },
    ],
  },
  {
    id: 'por-003',
    process_id: 'process-9',
    process_name: 'Sales Data Summary',
    process_version: 'v1.5.0',
    applicant_id: 'user-004',
    applicant_name: 'David Zhao',
    department_id: 'dept-apa-product',
    department_name: getDepartmentName('dept-apa-product') || '产品研发部',
    reason: '与新版报表合并后已无独立调度需求。',
    submitted_at: now(96),
    dependency_snapshot: { blocking: false, triggers: [], task_templates: [], running_tasks: [], scheduling_refs: [] },
    status: 'REJECTED',
    current_level: 1,
    total_levels: 2,
    records: [
      { level: 1, approver_id: 'user-mgr', approver_name: '林经理', action: 'reject', comment: '该流程仍有外部业务依赖，请确认后再申请。', acted_at: now(80) },
    ],
  },
  {
    id: 'por-005',
    process_id: 'process-8',
    process_name: 'Employee Performance Summary',
    process_version: 'v2.0.0',
    applicant_id: 'user-006',
    applicant_name: 'Tom Liu',
    department_id: 'dept-apa-product',
    department_name: getDepartmentName('dept-apa-product') || '产品研发部',
    reason: '该流程已并入新版绩效平台，原流程下线以避免重复调度。',
    submitted_at: now(2),
    dependency_snapshot: { blocking: false, triggers: [], task_templates: [], running_tasks: [], scheduling_refs: [] },
    status: 'PENDING_APPROVAL',
    approval_template_snapshot: getApprovalFlowById('oflow-001'),
    current_level: 1,
    total_levels: 2,
    current_approver_label: 'L1 · 林经理',
    records: [],
  },
  {
    id: 'por-006',
    process_id: 'process-1',
    process_name: '订单自动处理流程',
    process_version: 'v4.2.1',
    applicant_id: 'user-007',
    applicant_name: 'Alice Wu',
    department_id: 'dept-finance',
    department_name: getDepartmentName('dept-finance') || '财务部',
    reason: '订单链路已迁移至新版处理流程，原流程申请下线。',
    submitted_at: now(30),
    dependency_snapshot: { blocking: false, triggers: [], task_templates: [], running_tasks: [], scheduling_refs: [] },
    status: 'APPROVED',
    approval_template_snapshot: getApprovalFlowById('oflow-001'),
    current_level: 2,
    total_levels: 2,
    records: [
      { level: 1, approver_id: 'user-mgr', approver_name: '林经理', action: 'approve', comment: '同意下线，已和上游确认切换。', acted_at: now(20) },
      { level: 2, approver_id: 'user-ops-001', approver_name: '运维同学', action: 'approve', comment: '审批通过，准备执行下线。', acted_at: now(4) },
    ],
  },
  {
    id: 'por-007',
    process_id: 'process-4',
    process_name: '采购申请',
    process_version: 'v1.8.0',
    applicant_id: 'user-008',
    applicant_name: 'Henry Zhou',
    department_id: 'dept-apa-product',
    department_name: getDepartmentName('dept-apa-product') || '产品研发部',
    reason: '采购系统升级，原审批流程下线。',
    submitted_at: now(50),
    dependency_snapshot: {
      blocking: true,
      triggers: [],
      task_templates: [],
      running_tasks: [
        { id: 'task-process-4-run', name: '采购申请 运行中任务 #3120', status: 'RUNNING' },
      ],
      scheduling_refs: [],
    },
    status: 'EXECUTION_FAILED',
    approval_template_snapshot: getApprovalFlowById('oflow-001'),
    current_level: 2,
    total_levels: 2,
    execution_error: '执行时检测到运行中任务，停用未完成。',
    records: [
      { level: 1, approver_id: 'user-mgr', approver_name: '林经理', action: 'approve', comment: '同意。', acted_at: now(36) },
      { level: 2, approver_id: 'user-ops-001', approver_name: '运维同学', action: 'approve', comment: '可执行。', acted_at: now(20) },
    ],
  },
  {
    id: 'por-008',
    process_id: 'process-6',
    process_name: 'Daily Reconciliation',
    process_version: 'v2.1.0',
    applicant_id: 'user-009',
    applicant_name: 'Sophia Liu',
    department_id: 'dept-finance',
    department_name: getDepartmentName('dept-finance') || '财务部',
    reason: '审批通过后正在批量解除调度并清理触发器，预计 5 分钟内完成。',
    submitted_at: now(3),
    dependency_snapshot: { blocking: false, triggers: [], task_templates: [], running_tasks: [], scheduling_refs: [] },
    status: 'EXECUTING',
    approval_template_snapshot: getApprovalFlowById('oflow-001'),
    current_level: 2,
    total_levels: 2,
    records: [
      { level: 1, approver_id: 'user-mgr', approver_name: '林经理', action: 'approve', comment: '同意下线。', acted_at: now(2) },
      { level: 2, approver_id: 'user-ops-001', approver_name: '运维同学', action: 'approve', comment: '可执行。', acted_at: now(1) },
    ],
  },
  {
    id: 'por-009',
    process_id: 'process-10',
    process_name: 'Marketing Email Dispatcher',
    process_version: 'v1.2.5',
    applicant_id: 'user-010',
    applicant_name: 'Daniel Xu',
    department_id: 'dept-apa-product',
    department_name: getDepartmentName('dept-apa-product') || '产品研发部',
    reason: '提交后发现仍有部分活动依赖，已主动撤销本次下线申请。',
    submitted_at: now(72),
    dependency_snapshot: { blocking: false, triggers: [], task_templates: [], running_tasks: [], scheduling_refs: [] },
    status: 'CANCELLED',
    approval_template_snapshot: getApprovalFlowById('oflow-001'),
    current_level: 1,
    total_levels: 2,
    records: [],
  },
];

const load = (): ProcessOfflineRequest[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ProcessOfflineRequest[];
  } catch { /* noop */ }
  return defaultRequests;
};
const save = (list: ProcessOfflineRequest[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* noop */ }
};

let cache: ProcessOfflineRequest[] = load();

const listeners = new Set<() => void>();
export const subscribeOfflineRequestChange = (cb: () => void) => {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
};
const notify = () => listeners.forEach((cb) => cb());

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const checkOfflineDependency = async (processId: string, processName: string): Promise<DependencyCheckSnapshot> => {
  await delay(150);
  return buildDependencySnapshot(processId, processName);
};

export const getCurrentOfflineRequest = (processId: string): ProcessOfflineRequest | undefined =>
  cache.find((r) => r.process_id === processId && (r.status === 'PENDING_APPROVAL' || r.status === 'APPROVED' || r.status === 'EXECUTION_FAILED'));

export const fetchOfflineApprovals = async (params?: {
  keyword?: string;
  status?: OfflineRequestStatus | 'ALL' | 'APPROVED_OR_EXECUTED';
  departmentId?: string;
}): Promise<ProcessOfflineRequest[]> => {
  await delay(120);
  let list = [...cache];
  if (params?.keyword) {
    const kw = params.keyword.trim().toLowerCase();
    list = list.filter((r) => r.process_name.toLowerCase().includes(kw) || r.applicant_name.toLowerCase().includes(kw));
  }
  if (params?.status && params.status !== 'ALL') {
    if (params.status === 'APPROVED_OR_EXECUTED') {
      list = list.filter((r) => r.status === 'APPROVED' || r.status === 'EXECUTED');
    } else {
      list = list.filter((r) => r.status === params.status);
    }
  }
  if (params?.departmentId) {
    list = list.filter((r) => r.department_id === params.departmentId);
  }
  return list.sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
};

export const getOfflineRequestById = (id: string): ProcessOfflineRequest | undefined =>
  cache.find((r) => r.id === id);

export interface SubmitOfflineRequestPayload {
  processId: string;
  processName: string;
  departmentId: string;
  departmentName: string;
  reason: string;
}

export const submitOfflineRequest = async (
  payload: SubmitOfflineRequestPayload,
): Promise<{ status: OfflineRequestStatus; needs_approval: boolean; request: ProcessOfflineRequest }> => {
  await delay();
  const reason = payload.reason?.trim() ?? '';
  if (reason.length < 10 || reason.length > 1000) {
    throw new Error('停用原因需 10–1000 字符');
  }
  if (getCurrentOfflineRequest(payload.processId)) {
    throw new Error('该流程已存在未结束的停用申请');
  }
  const snapshot = buildDependencySnapshot(payload.processId, payload.processName);
  if (snapshot.blocking) {
    throw new Error('存在阻塞依赖，无法提交停用申请');
  }

  const templateId = getBindingByDepartment(payload.departmentId, 'PROCESS_OFFLINE');
  const template = templateId ? getApprovalFlowById(templateId) : undefined;
  const needsApproval = !!(template && template.approval_enabled !== false && template.status === 'active' && template.approvers.length > 0);
  const submittedAt = new Date().toISOString();
  const totalLevels = template?.approvers.length ?? 0;

  const baseReq: ProcessOfflineRequest = {
    id: `por-${Date.now()}`,
    process_id: payload.processId,
    process_name: payload.processName,
    applicant_id: 'user-current',
    applicant_name: '当前用户',
    department_id: payload.departmentId,
    department_name: payload.departmentName,
    reason,
    submitted_at: submittedAt,
    dependency_snapshot: snapshot,
    status: needsApproval ? 'PENDING_APPROVAL' : 'EXECUTED',
    approval_template_snapshot: template,
    current_level: needsApproval ? 1 : undefined,
    total_levels: needsApproval ? totalLevels : undefined,
    records: [],
    executed_at: needsApproval ? undefined : submittedAt,
  };

  cache = [baseReq, ...cache];
  save(cache);
  notify();
  return { status: baseReq.status, needs_approval: needsApproval, request: baseReq };
};

const runFinalExecution = (req: ProcessOfflineRequest): ProcessOfflineRequest => {
  const recheck = buildDependencySnapshot(req.process_id, req.process_name);
  if (recheck.blocking) {
    return {
      ...req,
      status: 'EXECUTION_FAILED',
      execution_error: '执行时检测到阻塞依赖，停用未完成。',
      dependency_snapshot: recheck,
    };
  }
  return {
    ...req,
    status: 'EXECUTED',
    executed_at: new Date().toISOString(),
    execution_error: undefined,
  };
};

export const approveOfflineRequest = async (id: string, comment?: string): Promise<ProcessOfflineRequest> => {
  await delay();
  const req = cache.find((r) => r.id === id);
  if (!req) throw new Error('申请不存在');
  if (req.status !== 'PENDING_APPROVAL') throw new Error('当前状态无法审批');

  const records = [...req.records, {
    level: req.current_level ?? 1,
    approver_id: 'user-current',
    approver_name: '当前审批人',
    action: 'approve' as const,
    comment,
    acted_at: new Date().toISOString(),
  }];
  const isFinal = (req.current_level ?? 1) >= (req.total_levels ?? 1);
  let next: ProcessOfflineRequest = isFinal
    ? { ...req, status: 'APPROVED', records }
    : { ...req, current_level: (req.current_level ?? 1) + 1, records };
  if (isFinal) {
    next = runFinalExecution(next);
  }
  cache = cache.map((r) => (r.id === id ? next : r));
  save(cache);
  notify();
  return next;
};

export const rejectOfflineRequest = async (id: string, reason: string): Promise<ProcessOfflineRequest> => {
  await delay();
  const trimmed = reason?.trim() ?? '';
  if (!trimmed) throw new Error('请填写拒绝原因');
  if (trimmed.length > 500) throw new Error('拒绝原因最多 500 字');
  const req = cache.find((r) => r.id === id);
  if (!req) throw new Error('申请不存在');
  if (req.status !== 'PENDING_APPROVAL') throw new Error('当前状态无法审批');

  const records = [...req.records, {
    level: req.current_level ?? 1,
    approver_id: 'user-current',
    approver_name: '当前审批人',
    action: 'reject' as const,
    comment: trimmed,
    acted_at: new Date().toISOString(),
  }];
  const next: ProcessOfflineRequest = { ...req, status: 'REJECTED', records };
  cache = cache.map((r) => (r.id === id ? next : r));
  save(cache);
  notify();
  return next;
};

export const retryOfflineExecution = async (id: string): Promise<ProcessOfflineRequest> => {
  await delay();
  const req = cache.find((r) => r.id === id);
  if (!req) throw new Error('申请不存在');
  if (req.status !== 'EXECUTION_FAILED' && req.status !== 'APPROVED') {
    throw new Error('当前状态无法重试执行');
  }
  const next = runFinalExecution(req);
  cache = cache.map((r) => (r.id === id ? next : r));
  save(cache);
  notify();
  return next;
};

export const __resetOfflineMock = () => {
  cache = defaultRequests;
  save(cache);
  notify();
};

export { fetchApprovalFlows };
