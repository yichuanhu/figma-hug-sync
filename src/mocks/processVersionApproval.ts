/**
 * 流程发布版本审批 mock 数据（FEAT-025 STORY-002 / 003 / 004）
 *
 * 职责：维护流程版本（process_version）以及对应的发布审批单（process_version_approval），
 * 提供列表查询、审批通过/拒绝、提交发布申请、生命周期里程碑写入等接口。
 * 仅作前端 mock 使用，订阅式刷新。
 */

import { fetchApprovalFlows, getApprovalFlowById, type ApprovalFlowTemplate } from '@/pages/Requirements/ApprovalConfig/mockData';
import { getBindingByDepartment } from './departmentApprovalFlowBinding';
import { getDepartmentName } from './departmentData';

export type VersionStatus = 'UPLOADED' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED';
export type ApprovalAction = 'approve' | 'reject';

export interface ApprovalRecord {
  level: number;
  approver_id: string;
  approver_name: string;
  action: ApprovalAction;
  comment?: string;
  acted_at: string;
}

export interface ProcessVersion {
  id: string;
  process_id: string;
  process_name: string;
  version: string;
  developer_id: string;
  developer_name: string;
  department_id: string;
  department_name: string;
  package_size: number; // bytes
  package_checksum: string;
  uploaded_at: string;
  publish_note?: string;
  status: VersionStatus;
  /** 发布申请提交时间（与 uploaded_at 解耦） */
  submitted_at?: string;
  /** 发布上线时间 */
  deployed_at?: string;
  /** 审批快照：仅在 status=PENDING_APPROVAL/REJECTED/PUBLISHED 时存在 */
  approval_template_snapshot?: ApprovalFlowTemplate;
  current_level?: number;
  total_levels?: number;
  records?: ApprovalRecord[];
  /** 输入参数 */
  input_parameters?: Array<{ name: string; type: string; required: boolean; description?: string }>;
  /** 输出参数 */
  output_parameters?: Array<{ name: string; type: string; description?: string }>;
  /** 依赖资源 */
  resources?: Array<{ resource_type: string; resource_name: string }>;
}

const STORAGE_KEY = 'apa.processVersionApproval.v1';

const now = (offsetH = 0) => new Date(Date.now() - offsetH * 3_600_000).toISOString();

const defaultVersions: ProcessVersion[] = [
  {
    id: 'pv-001',
    process_id: 'proc-001',
    process_name: '订单自动处理流程',
    version: '1.2.0',
    developer_id: 'user-dev-001',
    developer_name: '张三',
    department_id: 'dept-apa-product',
    department_name: getDepartmentName('dept-apa-product') || '产品研发部',
    package_size: 4_523_876,
    package_checksum: 'a1b2c3d4e5f6789012345678abcdef01',
    uploaded_at: now(48),
    submitted_at: now(24),
    publish_note: '修复订单状态同步偶发延迟问题，并优化超时重试。',
    status: 'PENDING_APPROVAL',
    current_level: 1,
    total_levels: 2,
    records: [],
    input_parameters: [
      { name: 'orderId', type: 'string', required: true, description: '订单 ID' },
      { name: 'channel', type: 'string', required: false, description: '业务渠道' },
    ],
    output_parameters: [
      { name: 'success', type: 'boolean', description: '是否处理成功' },
      { name: 'errorMessage', type: 'string', description: '错误信息' },
    ],
    resources: [
      { resource_type: '凭证', resource_name: 'SAP 业务凭证' },
      { resource_type: '队列', resource_name: '订单处理队列' },
    ],
  },
  {
    id: 'pv-002',
    process_id: 'proc-002',
    process_name: '财务报销审批流程',
    version: '2.0.1',
    developer_id: 'user-dev-002',
    developer_name: '李四',
    department_id: 'dept-finance',
    department_name: getDepartmentName('dept-finance') || '财务部',
    package_size: 2_134_555,
    package_checksum: 'b2c3d4e5f67890123456789abcdef012',
    uploaded_at: now(72),
    submitted_at: now(36),
    publish_note: '补充财务月结时段的发票校验规则。',
    status: 'PENDING_APPROVAL',
    current_level: 1,
    total_levels: 1,
    records: [],
    input_parameters: [
      { name: 'expenseId', type: 'string', required: true },
    ],
  },
  {
    id: 'pv-003',
    process_id: 'proc-003',
    process_name: '人事入职流程',
    version: '1.5.0',
    developer_id: 'user-dev-003',
    developer_name: '王五',
    department_id: 'dept-dw',
    department_name: getDepartmentName('dept-dw') || '数据仓库部',
    package_size: 3_412_998,
    package_checksum: 'c3d4e5f67890123456789abcdef01234',
    uploaded_at: now(120),
    submitted_at: now(96),
    status: 'PUBLISHED',
    deployed_at: now(72),
    current_level: 2,
    total_levels: 2,
    records: [
      { level: 1, approver_id: 'user-mgr', approver_name: '林经理', action: 'approve', comment: 'OK', acted_at: now(80) },
      { level: 2, approver_id: 'user-ops-001', approver_name: '运维同学', action: 'approve', comment: '已上线', acted_at: now(72) },
    ],
  },
  {
    id: 'pv-004',
    process_id: 'proc-004',
    process_name: '客户信息同步',
    version: '0.9.3',
    developer_id: 'user-dev-001',
    developer_name: '张三',
    department_id: 'dept-apa-product',
    department_name: getDepartmentName('dept-apa-product') || '产品研发部',
    package_size: 1_223_409,
    package_checksum: 'd4e5f67890123456789abcdef0123456',
    uploaded_at: now(168),
    submitted_at: now(144),
    status: 'REJECTED',
    current_level: 1,
    total_levels: 2,
    records: [
      { level: 1, approver_id: 'user-mgr', approver_name: '林经理', action: 'reject', comment: '入参缺少必要校验，请补充后重新提交。', acted_at: now(120) },
    ],
  },
  {
    id: 'pv-005',
    process_id: 'proc-005',
    process_name: '采购订单导入',
    version: '0.1.0',
    developer_id: 'user-dev-002',
    developer_name: '李四',
    department_id: 'dept-apa-product',
    department_name: getDepartmentName('dept-apa-product') || '产品研发部',
    package_size: 920_133,
    package_checksum: 'e5f67890123456789abcdef0123456ab',
    uploaded_at: now(8),
    status: 'UPLOADED',
  },
];

const load = (): ProcessVersion[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ProcessVersion[];
  } catch { /* noop */ }
  return defaultVersions;
};
const save = (list: ProcessVersion[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* noop */ }
};

let cache: ProcessVersion[] = load();

const listeners = new Set<() => void>();
export const subscribeProcessVersionChange = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const notify = () => listeners.forEach((cb) => cb());

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const fetchProcessVersions = async (): Promise<ProcessVersion[]> => {
  await delay(120);
  return [...cache].sort((a, b) => (b.submitted_at ?? b.uploaded_at).localeCompare(a.submitted_at ?? a.uploaded_at));
};

export const fetchPublishApprovals = async (params?: {
  keyword?: string;
  status?: VersionStatus | 'ALL';
  departmentId?: string;
}): Promise<ProcessVersion[]> => {
  await delay(120);
  let list = cache.filter((v) => v.status !== 'UPLOADED');
  if (params?.keyword) {
    const kw = params.keyword.trim().toLowerCase();
    list = list.filter((v) => v.process_name.toLowerCase().includes(kw) || v.developer_name.toLowerCase().includes(kw) || v.version.toLowerCase().includes(kw));
  }
  if (params?.status && params.status !== 'ALL') {
    list = list.filter((v) => v.status === params.status);
  }
  if (params?.departmentId) {
    list = list.filter((v) => v.department_id === params.departmentId);
  }
  return list.sort((a, b) => (b.submitted_at ?? b.uploaded_at).localeCompare(a.submitted_at ?? a.uploaded_at));
};

export const getProcessVersionById = (id: string): ProcessVersion | undefined =>
  cache.find((v) => v.id === id);

export const submitPublishRequest = async (
  versionId: string,
  publishNote?: string,
): Promise<{ status: VersionStatus; needs_approval: boolean; approval_template?: ApprovalFlowTemplate }> => {
  await delay();
  const v = cache.find((x) => x.id === versionId);
  if (!v) throw new Error('版本不存在');
  if (v.status !== 'UPLOADED') throw new Error('当前版本状态不允许发起发布申请');

  const templateId = getBindingByDepartment(v.department_id, 'PROCESS_PUBLISH');
  const template = templateId ? getApprovalFlowById(templateId) : undefined;
  const needsApproval = !!(template && template.approval_enabled !== false && template.status === 'active' && template.approvers.length > 0);
  const submittedAt = new Date().toISOString();

  cache = cache.map((x) => x.id !== versionId ? x : (needsApproval ? {
    ...x,
    status: 'PENDING_APPROVAL' as const,
    publish_note: publishNote,
    submitted_at: submittedAt,
    approval_template_snapshot: template,
    current_level: 1,
    total_levels: template!.approvers.length,
    records: [],
  } : {
    ...x,
    status: 'PUBLISHED' as const,
    publish_note: publishNote,
    submitted_at: submittedAt,
    deployed_at: submittedAt,
    approval_template_snapshot: template,
    current_level: undefined,
    total_levels: undefined,
    records: [],
  }));
  save(cache);
  notify();
  return { status: needsApproval ? 'PENDING_APPROVAL' : 'PUBLISHED', needs_approval: needsApproval, approval_template: template };
};

export const approvePublishRequest = async (versionId: string, comment?: string): Promise<ProcessVersion> => {
  await delay();
  const v = cache.find((x) => x.id === versionId);
  if (!v) throw new Error('版本不存在');
  if (v.status !== 'PENDING_APPROVAL') throw new Error('当前版本状态无法审批');

  const records = [...(v.records ?? []), {
    level: v.current_level ?? 1,
    approver_id: 'user-current',
    approver_name: '当前审批人',
    action: 'approve' as const,
    comment,
    acted_at: new Date().toISOString(),
  }];

  const isFinal = (v.current_level ?? 1) >= (v.total_levels ?? 1);
  const next: ProcessVersion = isFinal ? {
    ...v,
    status: 'PUBLISHED',
    deployed_at: new Date().toISOString(),
    records,
  } : {
    ...v,
    current_level: (v.current_level ?? 1) + 1,
    records,
  };

  cache = cache.map((x) => x.id === versionId ? next : x);
  save(cache);
  notify();
  return next;
};

export const rejectPublishRequest = async (versionId: string, reason: string): Promise<ProcessVersion> => {
  await delay();
  if (!reason || !reason.trim()) throw new Error('请填写拒绝原因');
  if (reason.length > 500) throw new Error('拒绝原因最多 500 字');
  const v = cache.find((x) => x.id === versionId);
  if (!v) throw new Error('版本不存在');
  if (v.status !== 'PENDING_APPROVAL') throw new Error('当前版本状态无法审批');

  const records = [...(v.records ?? []), {
    level: v.current_level ?? 1,
    approver_id: 'user-current',
    approver_name: '当前审批人',
    action: 'reject' as const,
    comment: reason,
    acted_at: new Date().toISOString(),
  }];

  const next: ProcessVersion = { ...v, status: 'REJECTED', records };
  cache = cache.map((x) => x.id === versionId ? next : x);
  save(cache);
  notify();
  return next;
};

/** 重置 mock（仅供调试） */
export const __resetProcessVersionMock = () => {
  cache = defaultVersions;
  save(cache);
  notify();
};

export { fetchApprovalFlows };
