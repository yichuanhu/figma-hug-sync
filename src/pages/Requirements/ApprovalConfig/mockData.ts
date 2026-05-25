/**
 * 审批流模板 — 共用数据层（FEAT-017 STORY-016 + FEAT-025 STORY-001）
 *
 * 通过模板级 `business_type` 区分：
 *   - REQUIREMENT     需求审批模板
 *   - PROCESS_PUBLISH 流程发布审批模板
 *
 * 同一张表、同一组接口；列表/绑定/占用查询统一按 business_type 过滤，互不影响。
 */
import type { WorkflowApprover, AssessmentModel } from '@/pages/Requirements/RequirementsWorkbench/types';

export type ApprovalFlowStatus = 'active' | 'inactive';
export type ApprovalBusinessType = 'REQUIREMENT' | 'PROCESS_PUBLISH' | 'PROCESS_OFFLINE';

export interface ApprovalFlowTemplate {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: ApprovalFlowStatus;
  is_preset?: boolean;
  is_draft?: boolean;
  /** 业务类型，缺省视为 REQUIREMENT 以兼容存量 */
  business_type?: ApprovalBusinessType;
  /** 是否启用审批环节（false 时即使绑定生效也直接发布，仅 PROCESS_PUBLISH 使用） */
  approval_enabled?: boolean;
  /** v5: 适用部门（多选）。激活时同步写入 department_approval_flow_binding。 */
  applicable_department_ids?: string[];
  /** 审批人列表（priority 升序） */
  approvers: WorkflowApprover[];
  /** 技术评估人列表（priority 升序）；为空表示已关闭技术评估。仅 REQUIREMENT 业务使用 */
  assessors: WorkflowApprover[];
  /** 价值评估模型（仅 REQUIREMENT 业务使用） */
  value_model?: AssessmentModel;
  /** 复杂度评估模型（仅 REQUIREMENT 业务使用） */
  complexity_model?: AssessmentModel;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'apa.requirements.approvalFlows.v4';

const defaultFlows: ApprovalFlowTemplate[] = [
  {
    id: 'flow-001',
    name: '标准三级审批',
    code: 'STD-3LV',
    description: '部门主管 → AI 委员会 → 财务负责人',
    status: 'active',
    is_preset: true,
    business_type: 'REQUIREMENT',
    approval_enabled: true,
    approvers: [
      { id: 'a1', name: '部门主管审批', type: 'department_leader', priority: 1, required: true, approval_mode: 'any_one', timeout_days: 3 },
      { id: 'a2', name: 'AI 委员会评审', type: 'role', priority: 2, required: true, approval_mode: 'majority', timeout_days: 7, target_ids: ['role-committee'] },
      { id: 'a3', name: '财务负责人审批', type: 'role', priority: 3, required: true, approval_mode: 'any_one', timeout_days: 3, target_ids: ['role-dept-head'] },
    ],
    assessors: [
      { id: 'as1', name: '技术架构评估', type: 'role', priority: 1, required: true, approval_mode: 'majority', timeout_days: 5, target_ids: ['role-committee'] },
    ],
    applicable_department_ids: ['dept-apa-product', 'dept-dw'],
    created_at: '2025-01-10T09:00:00Z',
    updated_at: '2025-02-20T14:30:00Z',
  },
  {
    id: 'flow-002',
    name: '轻量单级审批',
    code: 'LITE-1LV',
    description: '仅需直属主管审批，适用于小型需求',
    status: 'inactive',
    is_preset: true,
    business_type: 'REQUIREMENT',
    approval_enabled: true,
    approvers: [
      { id: 'a1', name: '直属主管审批', type: 'department_leader', priority: 1, required: true, approval_mode: 'any_one', timeout_days: 3 },
    ],
    assessors: [],
    applicable_department_ids: ['dept-finance'],
    created_at: '2025-01-12T10:00:00Z',
    updated_at: '2025-01-12T10:00:00Z',
  },
  // 流程发布审批模板（PROCESS_PUBLISH）
  {
    id: 'pflow-001',
    name: '发布审批-标准',
    code: 'PUB-STD',
    description: '部门负责人 → 平台运维负责人，适用于一般业务流程',
    status: 'active',
    is_preset: false,
    business_type: 'PROCESS_PUBLISH',
    approval_enabled: true,
    approvers: [
      { id: 'pa1', name: '部门负责人审批', type: 'department_leader', priority: 1, required: true, approval_mode: 'any_one', timeout_days: 2 },
      { id: 'pa2', name: '平台运维审批', type: 'specific_users', priority: 2, required: true, approval_mode: 'any_one', timeout_days: 2, target_ids: ['user-ops-001'] },
    ],
    assessors: [],
    applicable_department_ids: ['dept-apa-product', 'dept-dw'],
    created_at: '2026-04-10T09:00:00Z',
    updated_at: '2026-05-20T14:30:00Z',
  },
  {
    id: 'pflow-002',
    name: '发布审批-简化',
    code: 'PUB-LITE',
    description: '仅需部门负责人审批，适用于内部工具流程',
    status: 'active',
    is_preset: false,
    business_type: 'PROCESS_PUBLISH',
    approval_enabled: true,
    approvers: [
      { id: 'pa1', name: '部门负责人审批', type: 'department_leader', priority: 1, required: true, approval_mode: 'any_one', timeout_days: 2 },
    ],
    assessors: [],
    applicable_department_ids: ['dept-finance'],
    created_at: '2026-04-12T10:00:00Z',
    updated_at: '2026-04-12T10:00:00Z',
  },
  {
    id: 'pflow-003',
    name: '发布审批-高级',
    code: 'PUB-ADV',
    description: '三级串行审批，适用于核心业务流程',
    status: 'inactive',
    is_preset: false,
    business_type: 'PROCESS_PUBLISH',
    approval_enabled: true,
    approvers: [
      { id: 'pa1', name: '部门负责人审批', type: 'department_leader', priority: 1, required: true, approval_mode: 'any_one', timeout_days: 2 },
      { id: 'pa2', name: '架构评审', type: 'specific_users', priority: 2, required: true, approval_mode: 'majority', timeout_days: 3, target_ids: ['user-arch-001'] },
      { id: 'pa3', name: '运维总监终审', type: 'specific_users', priority: 3, required: true, approval_mode: 'any_one', timeout_days: 2, target_ids: ['user-ops-director'] },
    ],
    assessors: [],
    applicable_department_ids: [],
    created_at: '2026-04-20T11:00:00Z',
    updated_at: '2026-04-20T11:00:00Z',
  },
];

const load = (): ApprovalFlowTemplate[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ApprovalFlowTemplate[];
      return parsed.map((f) => ({
        ...f,
        approvers: f.approvers ?? [],
        assessors: f.assessors ?? [],
        business_type: f.business_type ?? 'REQUIREMENT',
        approval_enabled: f.approval_enabled ?? true,
      }));
    }
  } catch {
    /* noop */
  }
  return defaultFlows;
};

const save = (list: ApprovalFlowTemplate[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
};

let cache: ApprovalFlowTemplate[] = load();

const listeners = new Set<() => void>();
export const subscribeApprovalFlowChange = (cb: () => void): (() => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const notify = () => listeners.forEach((cb) => cb());

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

const getBT = (f: ApprovalFlowTemplate): ApprovalBusinessType => f.business_type ?? 'REQUIREMENT';

export const fetchApprovalFlows = async (
  keyword?: string,
  businessType: ApprovalBusinessType = 'REQUIREMENT',
): Promise<ApprovalFlowTemplate[]> => {
  await delay(150);
  const kw = keyword?.trim().toLowerCase();
  const scoped = cache.filter((f) => getBT(f) === businessType);
  if (!kw) return [...scoped];
  return scoped.filter(
    (f) =>
      f.name.toLowerCase().includes(kw) ||
      f.code.toLowerCase().includes(kw) ||
      (f.description?.toLowerCase().includes(kw) ?? false),
  );
};

export const getApprovalFlowById = (id: string): ApprovalFlowTemplate | undefined =>
  cache.find((f) => f.id === id);

const isNameDuplicate = (name: string, businessType: ApprovalBusinessType, excludeId?: string) => {
  const n = name.trim().toLowerCase();
  return cache.some(
    (f) => f.id !== excludeId && getBT(f) === businessType && f.name.trim().toLowerCase() === n,
  );
};

const generateUniqueName = (base: string, businessType: ApprovalBusinessType) => {
  if (!isNameDuplicate(base, businessType)) return base;
  let i = 2;
  while (isNameDuplicate(`${base} ${i}`, businessType)) i += 1;
  return `${base} ${i}`;
};

export const createApprovalFlowDraft = async (
  payload?: Partial<Pick<ApprovalFlowTemplate, 'name' | 'code' | 'description' | 'approvers' | 'assessors' | 'value_model' | 'complexity_model' | 'applicable_department_ids' | 'approval_enabled'>>,
  businessType: ApprovalBusinessType = 'REQUIREMENT',
): Promise<ApprovalFlowTemplate> => {
  await delay();
  const now = new Date().toISOString();
  const requestedName = payload?.name ?? (businessType === 'PROCESS_PUBLISH' ? '未命名发布审批模板' : '未命名审批流');
  const finalName = payload?.name && isNameDuplicate(payload.name, businessType)
    ? (() => { throw new Error(`已存在同名模板「${payload.name}」`); })()
    : generateUniqueName(requestedName, businessType);
  const codePrefix = businessType === 'PROCESS_PUBLISH' ? 'PUB' : 'FLOW';
  const item: ApprovalFlowTemplate = {
    id: `${businessType === 'PROCESS_PUBLISH' ? 'pflow' : 'flow'}-${Date.now()}`,
    name: finalName,
    code: payload?.code ?? `${codePrefix}-${Date.now().toString(36).slice(-5).toUpperCase()}`,
    description: payload?.description,
    status: 'inactive',
    is_draft: true,
    business_type: businessType,
    approval_enabled: payload?.approval_enabled ?? true,
    applicable_department_ids: payload?.applicable_department_ids ?? [],
    approvers: payload?.approvers ?? [],
    assessors: payload?.assessors ?? [],
    value_model: payload?.value_model,
    complexity_model: payload?.complexity_model,
    created_at: now,
    updated_at: now,
  };
  cache = [item, ...cache];
  save(cache);
  notify();
  return item;
};

export const updateApprovalFlow = async (
  id: string,
  patch: Partial<Omit<ApprovalFlowTemplate, 'id' | 'created_at'>>,
): Promise<ApprovalFlowTemplate> => {
  await delay();
  const target = cache.find((f) => f.id === id);
  const bt = target ? getBT(target) : 'REQUIREMENT';
  if (typeof patch.name === 'string' && isNameDuplicate(patch.name, bt, id)) {
    throw new Error(`已存在同名模板「${patch.name}」，请更换名称`);
  }
  cache = cache.map((f) => (f.id === id ? { ...f, ...patch, updated_at: new Date().toISOString() } : f));
  save(cache);
  notify();
  return cache.find((f) => f.id === id)!;
};

export const deleteApprovalFlow = async (id: string): Promise<void> => {
  await delay();
  const target = cache.find((f) => f.id === id);
  if (target?.status === 'active') {
    throw new Error('已启用的模板不能删除，请先停用');
  }
  cache = cache.filter((f) => f.id !== id);
  save(cache);
  notify();
};

export const activateApprovalFlow = async (id: string): Promise<void> => {
  await delay();
  const target = cache.find((f) => f.id === id);
  if (target?.is_preset) throw new Error('预设模板不可启用，请先复制为租户模板');
  cache = cache.map((f) => f.id === id
    ? { ...f, status: 'active' as const, is_draft: false, updated_at: new Date().toISOString() }
    : f);
  save(cache);
  notify();
};

export const deactivateApprovalFlow = async (id: string): Promise<void> => {
  await delay();
  cache = cache.map((f) => (f.id === id ? { ...f, status: 'inactive' as const, updated_at: new Date().toISOString() } : f));
  save(cache);
  notify();
};

export const cloneApprovalFlowAsDraft = async (sourceId: string): Promise<ApprovalFlowTemplate> => {
  const src = cache.find((f) => f.id === sourceId);
  if (!src) throw new Error('源模板不存在');
  return createApprovalFlowDraft({
    name: `${src.name} 副本`,
    code: `${src.code}-COPY`,
    description: src.description,
    approval_enabled: src.approval_enabled,
    approvers: src.approvers.map((a, i) => ({ ...a, id: `appr-${Date.now().toString(36).slice(-4)}-${i + 1}` })),
    assessors: src.assessors.map((a, i) => ({ ...a, id: `asse-${Date.now().toString(36).slice(-4)}-${i + 1}` })),
    value_model: src.value_model,
    complexity_model: src.complexity_model,
  }, getBT(src));
};
