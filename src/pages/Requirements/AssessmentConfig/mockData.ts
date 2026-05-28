/**
 * 需求评估流配置 — Mock 数据层（FEAT-017 STORY-021）
 *
 * 评估流模板：多级串行评估阶段 + 固定 2 个评估模型（价值评估 + 复杂度评估）
 * 每个模型含可配置维度，维度支持 tier_select / numeric_input 输入；按权重自动计算综合得分
 */

export type AssessmentFlowStatus = 'active' | 'inactive';
export type AssessorType = 'department_leader' | 'specific_users';
export type AssessmentMode = 'any_one' | 'all' | 'majority';
export type DimensionInputType = 'tier_select' | 'numeric_input';
export type ModelType = 'value' | 'complexity';

export interface AssessmentLevel {
  id: string;
  priority: number;
  name: string;
  assessor_type: AssessorType;
  assessment_mode: AssessmentMode;
  /** specific_users 时为用户 ID 列表 */
  assessor_ids: string[];
}

export interface DimensionTier {
  id: string;
  label: string;
  score: number;
  /** numeric_input 时使用 */
  min_value?: number | null;
  max_value?: number | null;
}

export interface AssessmentDimension {
  id: string;
  key: string;
  name: string;
  description?: string;
  input_type: DimensionInputType;
  /** numeric_input 时必填 */
  unit?: string;
  /** 0~1，同模型所有权重之和 = 1（容差 < 0.01） */
  weight: number;
  tiers: DimensionTier[];
}

export interface AssessmentModelConfig {
  type: ModelType;
  name: string;
  description?: string;
  dimensions: AssessmentDimension[];
}

export interface AssessmentFlowTemplate {
  id: string;
  name: string;
  description?: string;
  status: AssessmentFlowStatus;
  is_preset?: boolean;
  is_draft?: boolean;
  applicable_department_ids: string[];
  levels: AssessmentLevel[];
  /** 固定 2 个：value + complexity */
  models: AssessmentModelConfig[];
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'apa.requirements.assessmentFlows.v1';

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 5)}`;

export const buildDefaultModels = (): AssessmentModelConfig[] => [
  {
    type: 'value',
    name: '价值评估',
    description: '评估需求带来的业务价值',
    dimensions: [
      {
        id: uid('dim'),
        key: 'monthly_time_saved',
        name: '月均节约人工时长',
        description: '需求实施后每月可节省的人工工时',
        input_type: 'numeric_input',
        unit: 'H/月',
        weight: 0.4,
        tiers: [
          { id: uid('t'), label: '显著 (>100H/月)', min_value: 100, max_value: null, score: 100 },
          { id: uid('t'), label: '明显 (50-100H/月)', min_value: 50, max_value: 100, score: 75 },
          { id: uid('t'), label: '一般 (10-50H/月)', min_value: 10, max_value: 50, score: 50 },
          { id: uid('t'), label: '较少 (<10H/月)', min_value: 0, max_value: 10, score: 25 },
        ],
      },
      {
        id: uid('dim'),
        key: 'business_coverage',
        name: '业务覆盖范围',
        description: '需求影响的业务范围广度',
        input_type: 'tier_select',
        weight: 0.3,
        tiers: [
          { id: uid('t'), label: '全公司', score: 100 },
          { id: uid('t'), label: '多部门', score: 75 },
          { id: uid('t'), label: '单部门', score: 50 },
          { id: uid('t'), label: '单个岗位', score: 25 },
        ],
      },
      {
        id: uid('dim'),
        key: 'strategic_alignment',
        name: '战略对齐度',
        description: '与公司战略目标的契合程度',
        input_type: 'tier_select',
        weight: 0.3,
        tiers: [
          { id: uid('t'), label: '核心战略项目', score: 100 },
          { id: uid('t'), label: '重点发展方向', score: 75 },
          { id: uid('t'), label: '常规业务支撑', score: 50 },
          { id: uid('t'), label: '辅助性需求', score: 25 },
        ],
      },
    ],
  },
  {
    type: 'complexity',
    name: '复杂度评估',
    description: '评估需求的技术实现复杂度',
    dimensions: [
      {
        id: uid('dim'),
        key: 'tech_difficulty',
        name: '技术难度',
        input_type: 'tier_select',
        weight: 0.5,
        tiers: [
          { id: uid('t'), label: '极高', score: 100 },
          { id: uid('t'), label: '高', score: 75 },
          { id: uid('t'), label: '中等', score: 50 },
          { id: uid('t'), label: '低', score: 25 },
        ],
      },
      {
        id: uid('dim'),
        key: 'integration_scope',
        name: '系统集成范围',
        input_type: 'tier_select',
        weight: 0.5,
        tiers: [
          { id: uid('t'), label: '3个以上系统', score: 100 },
          { id: uid('t'), label: '2-3个系统', score: 75 },
          { id: uid('t'), label: '1个系统', score: 50 },
          { id: uid('t'), label: '无外部系统', score: 25 },
        ],
      },
    ],
  },
];

const defaultTemplates: AssessmentFlowTemplate[] = [
  {
    id: 'aflow-preset-std',
    name: '平台预设-标准评估',
    description: '单级技术负责人评估 + 标准价值/复杂度模型，适用于大多数场景',
    status: 'inactive',
    is_preset: true,
    applicable_department_ids: [],
    levels: [
      {
        id: 'lv-preset-1',
        priority: 1,
        name: '技术负责人评估',
        assessor_type: 'specific_users',
        assessment_mode: 'all',
        assessor_ids: ['user-001'],
      },
    ],
    models: buildDefaultModels(),
    created_at: '2026-05-28T09:00:00Z',
    updated_at: '2026-05-28T09:00:00Z',
  },
  {
    id: 'aflow-001',
    name: '研发部评估模板',
    description: '技术负责人 + 部门领导两级评估',
    status: 'active',
    is_preset: false,
    applicable_department_ids: ['dept-apa-product'],
    levels: [
      {
        id: 'lv-001-1',
        priority: 1,
        name: '技术负责人评估',
        assessor_type: 'specific_users',
        assessment_mode: 'all',
        assessor_ids: ['user-001', 'user-002'],
      },
      {
        id: 'lv-001-2',
        priority: 2,
        name: '部门负责人评估',
        assessor_type: 'department_leader',
        assessment_mode: 'any_one',
        assessor_ids: [],
      },
    ],
    models: buildDefaultModels(),
    created_at: '2026-05-28T10:00:00Z',
    updated_at: '2026-05-28T10:00:00Z',
  },
];

const load = (): AssessmentFlowTemplate[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AssessmentFlowTemplate[];
  } catch {
    /* noop */
  }
  return defaultTemplates;
};

const save = (list: AssessmentFlowTemplate[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
};

let cache: AssessmentFlowTemplate[] = load();
const listeners = new Set<() => void>();
export const subscribeAssessmentFlowChange = (cb: () => void): (() => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const notify = () => listeners.forEach((cb) => cb());

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

export const fetchAssessmentFlows = async (keyword?: string): Promise<AssessmentFlowTemplate[]> => {
  await delay();
  const kw = keyword?.trim().toLowerCase();
  if (!kw) return [...cache];
  return cache.filter(
    (f) => f.name.toLowerCase().includes(kw) || (f.description?.toLowerCase().includes(kw) ?? false),
  );
};

export const getAssessmentFlowById = (id: string): AssessmentFlowTemplate | undefined =>
  cache.find((f) => f.id === id);

const isNameDuplicate = (name: string, excludeId?: string) => {
  const n = name.trim().toLowerCase();
  return cache.some((f) => f.id !== excludeId && f.name.trim().toLowerCase() === n);
};

export const createAssessmentFlow = async (
  payload: Omit<AssessmentFlowTemplate, 'id' | 'created_at' | 'updated_at' | 'status' | 'is_preset' | 'is_draft'>,
): Promise<AssessmentFlowTemplate> => {
  await delay();
  if (isNameDuplicate(payload.name)) throw new Error('模板名称已存在，请使用其他名称');
  const now = new Date().toISOString();
  const item: AssessmentFlowTemplate = {
    ...payload,
    id: uid('aflow'),
    status: 'inactive',
    is_preset: false,
    is_draft: true,
    created_at: now,
    updated_at: now,
  };
  cache = [item, ...cache];
  save(cache);
  notify();
  return item;
};

export const updateAssessmentFlow = async (
  id: string,
  patch: Partial<Omit<AssessmentFlowTemplate, 'id' | 'created_at'>>,
): Promise<AssessmentFlowTemplate> => {
  await delay();
  if (typeof patch.name === 'string' && isNameDuplicate(patch.name, id)) {
    throw new Error('模板名称已存在，请使用其他名称');
  }
  cache = cache.map((f) => (f.id === id ? { ...f, ...patch, updated_at: new Date().toISOString() } : f));
  save(cache);
  notify();
  return cache.find((f) => f.id === id)!;
};

export const deleteAssessmentFlow = async (id: string): Promise<void> => {
  await delay();
  const t = cache.find((f) => f.id === id);
  if (!t) return;
  if (t.is_preset) throw new Error('平台预设模板不可删除');
  if (t.status === 'active') throw new Error('已激活模板不可删除，请先停用');
  cache = cache.filter((f) => f.id !== id);
  save(cache);
  notify();
};

export const activateAssessmentFlow = async (id: string): Promise<void> => {
  await delay();
  const t = cache.find((f) => f.id === id);
  if (!t) return;
  if (t.is_preset) throw new Error('平台预设模板不可激活，请先复制');
  if (!t.applicable_department_ids?.length) throw new Error('请至少选择一个适用部门后再激活');
  cache = cache.map((f) =>
    f.id === id ? { ...f, status: 'active' as const, is_draft: false, updated_at: new Date().toISOString() } : f,
  );
  save(cache);
  notify();
};

export const deactivateAssessmentFlow = async (id: string): Promise<void> => {
  await delay();
  cache = cache.map((f) =>
    f.id === id ? { ...f, status: 'inactive' as const, updated_at: new Date().toISOString() } : f,
  );
  save(cache);
  notify();
};

export const cloneAssessmentFlow = async (sourceId: string): Promise<AssessmentFlowTemplate> => {
  const src = cache.find((f) => f.id === sourceId);
  if (!src) throw new Error('源模板不存在');
  return createAssessmentFlow({
    name: `${src.name} 副本`,
    description: src.description,
    applicable_department_ids: [],
    levels: src.levels.map((l) => ({ ...l, id: uid('lv') })),
    models: src.models.map((m) => ({
      ...m,
      dimensions: m.dimensions.map((d) => ({
        ...d,
        id: uid('dim'),
        tiers: d.tiers.map((t) => ({ ...t, id: uid('t') })),
      })),
    })),
  });
};

export const newEmptyLevel = (priority: number): AssessmentLevel => ({
  id: uid('lv'),
  priority,
  name: `第 ${priority} 级评估`,
  assessor_type: 'department_leader',
  assessment_mode: 'any_one',
  assessor_ids: [],
});

export { uid };
