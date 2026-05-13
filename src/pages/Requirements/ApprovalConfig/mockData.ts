/**
 * 审批与评估配置 - 多方案管理
 *
 * - 一个租户可创建多套审批与评估方案，但仅允许一套处于 active 状态
 * - 系统预设方案（is_preset=true）：可复制不可编辑/删除/停用，初始为 active
 * - 每套方案包含完整的审批配置 + 评估配置
 * - 每套方案独立维护版本号与历史快照
 */

export type ApproverType = 'department_leader' | 'specific_users';
export type ApprovalMode = 'any_one' | 'all' | 'majority';

export interface ApprovalLevel {
  id: string;
  name: string;
  type: ApproverType;
  /** specific_users 时必填 */
  user_ids?: string[];
  mode: ApprovalMode;
  /** 串行序号（升序） */
  priority: number;
  required: boolean;
  timeout_days?: number;
}

export interface AssessorGroup {
  id: string;
  name: string;
  user_ids: string[];
  required: boolean;
}

export interface DimensionTier {
  label: string;
  condition: string;
  score: number;
}

export type DimensionSourceType = 'manual' | 'auto_calculated';

export interface AssessmentDimension {
  key: string;
  name: string;
  weight: number;
  source_type: DimensionSourceType;
  expression?: string;
  source_fields?: string[];
  tiers: DimensionTier[];
}

export type AssessmentModelType = 'value' | 'complexity';

export interface AssessmentModel {
  type: AssessmentModelType;
  label: string;
  description?: string;
  dimensions: AssessmentDimension[];
}

/** 方案配置内容（不含元数据） */
export interface SchemeContent {
  approval_enabled: boolean;
  approval_levels: ApprovalLevel[];
  assessment_enabled: boolean;
  assessor_groups: AssessorGroup[];
  value_model: AssessmentModel;
  complexity_model: AssessmentModel;
}

/** 一套审批与评估方案 */
export interface ApprovalAssessmentScheme extends SchemeContent {
  id: string;
  name: string;
  description?: string;
  is_preset: boolean;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

export interface ConfigHistoryItem {
  scheme_id: string;
  version: number;
  snapshot: SchemeContent;
  updated_at: string;
  updated_by: string;
  remark?: string;
}

const STORAGE_KEY = 'apa.requirements.approvalSchemes.v2';
const HISTORY_KEY = 'apa.requirements.approvalSchemesHistory.v2';
const LEGACY_CONFIG_KEY = 'apa.requirements.approvalAssessmentConfig.v1';

const PRESET_ID = 'scheme-preset';

const presetContent: SchemeContent = {
  approval_enabled: true,
  approval_levels: [
    {
      id: 'lv-1',
      name: '部门主管审批',
      type: 'department_leader',
      mode: 'any_one',
      priority: 1,
      required: true,
      timeout_days: 3,
    },
    {
      id: 'lv-2',
      name: 'AI 委员会评审',
      type: 'specific_users',
      user_ids: [],
      mode: 'majority',
      priority: 2,
      required: true,
      timeout_days: 7,
    },
  ],
  assessment_enabled: true,
  assessor_groups: [
    {
      id: 'ag-1',
      name: '技术架构组',
      user_ids: [],
      required: true,
    },
  ],
  value_model: {
    type: 'value',
    label: '价值评估',
    description: '基于业务收益与战略契合度评估需求价值',
    dimensions: [
      {
        key: 'biz_benefit',
        name: '业务收益',
        weight: 0.5,
        source_type: 'manual',
        tiers: [
          { label: '高', condition: '>=80', score: 100 },
          { label: '中', condition: '60~79', score: 75 },
          { label: '低', condition: '<60', score: 40 },
        ],
      },
      {
        key: 'strategy_fit',
        name: '战略契合度',
        weight: 0.5,
        source_type: 'manual',
        tiers: [
          { label: '高', condition: '>=80', score: 100 },
          { label: '中', condition: '60~79', score: 75 },
          { label: '低', condition: '<60', score: 40 },
        ],
      },
    ],
  },
  complexity_model: {
    type: 'complexity',
    label: '复杂度评估',
    description: '基于实施周期与技术难度评估需求复杂度',
    dimensions: [
      {
        key: 'tech_difficulty',
        name: '技术难度',
        weight: 0.6,
        source_type: 'manual',
        tiers: [
          { label: '高', condition: '>=80', score: 100 },
          { label: '中', condition: '60~79', score: 75 },
          { label: '低', condition: '<60', score: 40 },
        ],
      },
      {
        key: 'impl_period',
        name: '实施周期',
        weight: 0.4,
        source_type: 'auto_calculated',
        expression: 'duration_days',
        source_fields: ['duration_days'],
        tiers: [
          { label: '长', condition: '>=30', score: 100 },
          { label: '中', condition: '15~29', score: 60 },
          { label: '短', condition: '<15', score: 30 },
        ],
      },
    ],
  },
};

const buildPresetScheme = (): ApprovalAssessmentScheme => ({
  ...JSON.parse(JSON.stringify(presetContent)),
  id: PRESET_ID,
  name: '系统默认审批与评估',
  description: '系统预设方案，可复制为新方案后修改；预设本身不可编辑或删除',
  is_preset: true,
  is_active: true,
  version: 1,
  created_at: '2025-01-10T09:00:00Z',
  updated_at: '2025-01-10T09:00:00Z',
  updated_by: '系统初始化',
});

const loadSchemes = (): ApprovalAssessmentScheme[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ApprovalAssessmentScheme[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        // 保证预设始终存在
        const hasPreset = parsed.some((s) => s.id === PRESET_ID);
        if (!hasPreset) parsed.unshift(buildPresetScheme());
        // 保证有且仅有一个 active
        if (!parsed.some((s) => s.is_active)) {
          const preset = parsed.find((s) => s.id === PRESET_ID)!;
          preset.is_active = true;
        }
        return parsed;
      }
    }
    // 兼容老 key：迁移为预设方案
    const legacy = localStorage.getItem(LEGACY_CONFIG_KEY);
    if (legacy) {
      try {
        const cfg = JSON.parse(legacy);
        const migrated: ApprovalAssessmentScheme = {
          ...buildPresetScheme(),
          approval_enabled: cfg.approval_enabled,
          approval_levels: cfg.approval_levels,
          assessment_enabled: cfg.assessment_enabled,
          assessor_groups: cfg.assessor_groups,
          value_model: cfg.value_model,
          complexity_model: cfg.complexity_model,
        };
        return [migrated];
      } catch {
        /* noop */
      }
    }
  } catch {
    /* noop */
  }
  return [buildPresetScheme()];
};

const loadHistory = (): ConfigHistoryItem[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw) as ConfigHistoryItem[];
  } catch {
    /* noop */
  }
  return [];
};

let schemes: ApprovalAssessmentScheme[] = loadSchemes();
let history: ConfigHistoryItem[] = loadHistory();

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schemes));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    /* noop */
  }
};

const listeners = new Set<() => void>();
export const subscribeConfigChange = (cb: () => void): (() => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const notify = () => listeners.forEach((cb) => cb());
const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export const fetchSchemes = async (): Promise<ApprovalAssessmentScheme[]> => {
  await delay(120);
  return clone(schemes);
};

export const fetchActiveScheme = async (): Promise<ApprovalAssessmentScheme> => {
  await delay(80);
  const active = schemes.find((s) => s.is_active) ?? schemes[0];
  return clone(active);
};

export const fetchSchemeHistory = async (schemeId: string): Promise<ConfigHistoryItem[]> => {
  await delay(120);
  return history.filter((h) => h.scheme_id === schemeId).sort((a, b) => b.version - a.version);
};

export interface ValidationError {
  code: 'E1' | 'E2' | 'E3' | 'E4' | 'E5';
  message: string;
}

export const validateScheme = (cfg: SchemeContent): ValidationError[] => {
  const errs: ValidationError[] = [];
  if (cfg.approval_enabled && cfg.approval_levels.length === 0) {
    errs.push({ code: 'E1', message: '审批已启用，请至少配置一个审批层级' });
  }
  cfg.approval_levels.forEach((lv, i) => {
    if (lv.type === 'specific_users' && (!lv.user_ids || lv.user_ids.length === 0)) {
      errs.push({ code: 'E2', message: `第 ${i + 1} 级「${lv.name}」选择了指定用户，但未指定具体人员` });
    }
  });
  if (cfg.assessment_enabled) {
    if (cfg.assessor_groups.length === 0) {
      errs.push({ code: 'E3', message: '评估已启用，请至少配置一个评估人组' });
    }
    cfg.assessor_groups.forEach((g, i) => {
      if (g.user_ids.length === 0) {
        errs.push({ code: 'E4', message: `第 ${i + 1} 个评估人组「${g.name}」未指定具体人员` });
      }
    });
    [cfg.value_model, cfg.complexity_model].forEach((m) => {
      m.dimensions.forEach((d) => {
        if (d.weight < 0 || d.weight > 1) {
          errs.push({ code: 'E5', message: `${m.label} 维度「${d.name}」权重需在 0~1 之间` });
        }
      });
    });
  }
  return errs;
};

export const saveScheme = async (
  schemeId: string,
  next: SchemeContent & { name: string; description?: string },
  updatedBy = '当前用户',
): Promise<ApprovalAssessmentScheme> => {
  await delay();
  const target = schemes.find((s) => s.id === schemeId);
  if (!target) throw new Error('方案不存在');
  if (target.is_preset) throw new Error('系统预设方案不可编辑');
  const errs = validateScheme(next);
  if (errs.length > 0) throw new Error(errs.map((e) => `[${e.code}] ${e.message}`).join('\n'));

  // 入历史
  history = [
    {
      scheme_id: target.id,
      version: target.version,
      snapshot: {
        approval_enabled: target.approval_enabled,
        approval_levels: target.approval_levels,
        assessment_enabled: target.assessment_enabled,
        assessor_groups: target.assessor_groups,
        value_model: target.value_model,
        complexity_model: target.complexity_model,
      },
      updated_at: target.updated_at,
      updated_by: target.updated_by,
    },
    ...history,
  ];

  Object.assign(target, {
    name: next.name,
    description: next.description,
    approval_enabled: next.approval_enabled,
    approval_levels: next.approval_levels,
    assessment_enabled: next.assessment_enabled,
    assessor_groups: next.assessor_groups,
    value_model: next.value_model,
    complexity_model: next.complexity_model,
    version: target.version + 1,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  });
  persist();
  notify();
  return clone(target);
};

export interface CreateSchemeInput {
  name: string;
  description?: string;
  /** 复制源方案 ID */
  source_scheme_id: string;
}

export const createScheme = async (
  input: CreateSchemeInput,
  updatedBy = '当前用户',
): Promise<ApprovalAssessmentScheme> => {
  await delay();
  const src = schemes.find((s) => s.id === input.source_scheme_id);
  if (!src) throw new Error('复制源方案不存在');
  if (!input.name || !input.name.trim()) throw new Error('请输入方案名称');
  if (schemes.some((s) => s.name.trim() === input.name.trim())) {
    throw new Error('方案名称已存在');
  }
  const now = new Date().toISOString();
  const created: ApprovalAssessmentScheme = {
    ...clone(src),
    id: `scheme-${Date.now().toString(36)}`,
    name: input.name.trim(),
    description: input.description,
    is_preset: false,
    is_active: false,
    version: 1,
    created_at: now,
    updated_at: now,
    updated_by: updatedBy,
  };
  schemes = [...schemes, created];
  persist();
  notify();
  return clone(created);
};

export const deleteScheme = async (schemeId: string): Promise<void> => {
  await delay();
  const target = schemes.find((s) => s.id === schemeId);
  if (!target) return;
  if (target.is_preset) throw new Error('系统预设方案不可删除');
  if (target.is_active) throw new Error('已激活方案不可删除，请先切换激活方案');
  schemes = schemes.filter((s) => s.id !== schemeId);
  history = history.filter((h) => h.scheme_id !== schemeId);
  persist();
  notify();
};

export const activateScheme = async (schemeId: string): Promise<void> => {
  await delay();
  const target = schemes.find((s) => s.id === schemeId);
  if (!target) throw new Error('方案不存在');
  const errs = validateScheme(target);
  if (errs.length > 0) {
    throw new Error('该方案存在校验错误，无法激活：\n' + errs.map((e) => `[${e.code}] ${e.message}`).join('\n'));
  }
  schemes = schemes.map((s) => ({ ...s, is_active: s.id === schemeId }));
  persist();
  notify();
};
