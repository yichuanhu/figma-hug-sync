// 流程基本信息 Mock 数据与服务（STORY-002-PG-RESPONSIBILITY）
// 维护：开发工程师、代码审核员、最近上线审核人（只读派生）

export interface BasicInfoUserOption {
  id: string;
  name: string;
  department?: string;
  role?: string;
  email?: string;
}

export interface LastReleaseReviewer {
  user_id: string;
  user_name: string;
  version: string;
  approved_at: string; // ISO
}

export interface ProcessBasicInfo {
  process_id: string;
  developer_id: string | null;
  code_reviewer_ids: string[];
  last_release_reviewer?: LastReleaseReviewer;
}

// 可选用户池（与既有 mockCreatorInfoMap 对齐 + 扩充）
export const BASIC_INFO_USER_POOL: BasicInfoUserOption[] = [
  { id: 'user-001', name: 'John Smith', department: 'R&D Dept', role: 'Senior Engineer', email: 'john.smith@example.com' },
  { id: 'user-002', name: 'Jane Doe', department: 'Product Dept', role: 'Product Manager', email: 'jane.doe@example.com' },
  { id: 'user-003', name: 'Mike Wang', department: 'Ops Dept', role: 'Ops Engineer', email: 'mike.wang@example.com' },
  { id: 'user-004', name: 'David Zhao', department: 'QA Dept', role: 'QA Engineer', email: 'david.zhao@example.com' },
  { id: 'user-005', name: 'Chris Qian', department: 'R&D Dept', role: 'Architect', email: 'chris.qian@example.com' },
  { id: 'user-006', name: 'Emily Chen', department: 'R&D Dept', role: 'Engineer', email: 'emily.chen@example.com' },
  { id: 'user-007', name: 'Frank Liu', department: 'R&D Dept', role: 'Reviewer', email: 'frank.liu@example.com' },
  { id: 'user-008', name: 'Grace Hu', department: 'Architecture', role: 'Lead Reviewer', email: 'grace.hu@example.com' },
];

export const getUserById = (id: string): BasicInfoUserOption | undefined =>
  BASIC_INFO_USER_POOL.find((u) => u.id === id);

const store = new Map<string, ProcessBasicInfo>();
const listeners = new Map<string, Set<() => void>>();

const audit = (action: string, payload: Record<string, unknown>) => {
  // eslint-disable-next-line no-console
  console.info(`[AUDIT][process_basic_info] ${action}`, payload);
};

const notify = (processId: string) => {
  listeners.get(processId)?.forEach((fn) => fn());
};

export const subscribeBasicInfo = (processId: string, fn: () => void): (() => void) => {
  if (!listeners.has(processId)) listeners.set(processId, new Set());
  listeners.get(processId)!.add(fn);
  return () => listeners.get(processId)?.delete(fn);
};

const ensureSeeded = (processId: string): ProcessBasicInfo => {
  if (!store.has(processId)) {
    store.set(processId, {
      process_id: processId,
      developer_id: 'user-001',
      code_reviewer_ids: ['user-007'],
      last_release_reviewer: {
        user_id: 'user-008',
        user_name: 'Grace Hu',
        version: 'v1.2.0',
        approved_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    });
  }
  return store.get(processId)!;
};

export const getProcessBasicInfo = (processId: string): ProcessBasicInfo => {
  return { ...ensureSeeded(processId) };
};

export const updateProcessBasicInfo = (
  processId: string,
  patch: Partial<Pick<ProcessBasicInfo, 'developer_id' | 'code_reviewer_ids'>>,
  source: string = 'manual',
): ProcessBasicInfo => {
  const prev = ensureSeeded(processId);
  const next: ProcessBasicInfo = { ...prev, ...patch };
  store.set(processId, next);
  audit('update', { processId, from: prev, to: next, source, at: new Date().toISOString() });
  notify(processId);
  return next;
};

// R-03 / R-04：上传新版本成功后覆盖开发工程师为本次上传人
export const overrideDevelopersOnVersionUpload = (
  processId: string,
  uploaderId: string,
  version: string,
): void => {
  const prev = ensureSeeded(processId);
  const next = { ...prev, developer_id: uploaderId };
  store.set(processId, next);
  audit('override_developers_on_upload', {
    processId,
    before: prev.developer_id,
    after: next.developer_id,
    uploader: uploaderId,
    version,
    at: new Date().toISOString(),
  });
  notify(processId);
};

// R-05 / R-06：代码审核节点审批通过且当前为空时写入审核员
export const writeCodeReviewerFromApproval = (
  processId: string,
  approverId: string,
): void => {
  const prev = ensureSeeded(processId);
  if (prev.code_reviewer_ids.length > 0) return; // R-07
  const next = { ...prev, code_reviewer_ids: [approverId] };
  store.set(processId, next);
  audit('write_code_reviewer_from_approval', {
    processId,
    approver: approverId,
    at: new Date().toISOString(),
  });
  notify(processId);
};

// R-08：更新最近上线审核人（只读派生）
export const setLastReleaseReviewer = (
  processId: string,
  info: LastReleaseReviewer,
): void => {
  const prev = ensureSeeded(processId);
  store.set(processId, { ...prev, last_release_reviewer: info });
  audit('set_last_release_reviewer', { processId, info, at: new Date().toISOString() });
  notify(processId);
};
