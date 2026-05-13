/**
 * 审批与评估配置（租户级单一配置 + 历史版本）
 *
 * 数据契约对齐 STORY-016：
 * - 顶部两个独立开关：approval_enabled / assessment_enabled
 * - 审批人类型仅 department_leader / specific_users
 * - 评估人类型仅 specific_users（多组）
 * - 价值/复杂度两个模型固定，维度可增删，权重 0~1，档位 label/condition/score
 * - 保存即生成新版本快照（version 自增），历史只读、不支持回滚（仅查看）
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
  /** 评估人列表（仅 specific_users 类型） */
  user_ids: string[];
  required: boolean;
}

export interface DimensionTier {
  label: string;
  /** 形如 ">=80" "60~79" "<60" */
  condition: string;
  score: number;
}

export type DimensionSourceType = 'manual' | 'auto_calculated';

export interface AssessmentDimension {
  key: string;
  name: string;
  /** 0 ~ 1 */
  weight: number;
  source_type: DimensionSourceType;
  /** 自动计算表达式 */
  expression?: string;
  /** 自动计算引用字段 */
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

export interface ApprovalAssessmentConfig {
  approval_enabled: boolean;
  approval_levels: ApprovalLevel[];
  assessment_enabled: boolean;
  assessor_groups: AssessorGroup[];
  value_model: AssessmentModel;
  complexity_model: AssessmentModel;
  version: number;
  updated_at: string;
  updated_by: string;
}

export interface ConfigHistoryItem {
  version: number;
  snapshot: Omit<ApprovalAssessmentConfig, 'version' | 'updated_at' | 'updated_by'>;
  updated_at: string;
  updated_by: string;
  remark?: string;
}

const STORAGE_KEY = 'apa.requirements.approvalAssessmentConfig.v1';
const HISTORY_KEY = 'apa.requirements.approvalAssessmentConfigHistory.v1';

const defaultConfig: ApprovalAssessmentConfig = {
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
  version: 1,
  updated_at: '2025-01-10T09:00:00Z',
  updated_by: '系统初始化',
};

const loadConfig = (): ApprovalAssessmentConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ApprovalAssessmentConfig;
  } catch {
    /* noop */
  }
  return JSON.parse(JSON.stringify(defaultConfig));
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

let cache: ApprovalAssessmentConfig = loadConfig();
let history: ConfigHistoryItem[] = loadHistory();

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
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

export const fetchConfig = async (): Promise<ApprovalAssessmentConfig> => {
  await delay(120);
  return JSON.parse(JSON.stringify(cache));
};

export const fetchConfigHistory = async (): Promise<ConfigHistoryItem[]> => {
  await delay(120);
  return [...history].sort((a, b) => b.version - a.version);
};

export interface ValidationError {
  code: 'E1' | 'E2' | 'E3' | 'E4' | 'E5';
  message: string;
}

/**
 * 校验配置：
 * - E1: 审批开启但层级为空
 * - E2: specific_users 类型审批人未选用户
 * - E3: 评估开启但未配置任何评估人组
 * - E4: 评估人组未选用户
 * - E5: 维度权重超出 0~1 范围
 */
export const validateConfig = (cfg: ApprovalAssessmentConfig): ValidationError[] => {
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

export const saveConfig = async (
  next: ApprovalAssessmentConfig,
  updatedBy = '当前用户',
): Promise<ApprovalAssessmentConfig> => {
  await delay();
  const errs = validateConfig(next);
  if (errs.length > 0) {
    throw new Error(errs.map((e) => `[${e.code}] ${e.message}`).join('\n'));
  }
  // 旧版本入历史
  history = [
    {
      version: cache.version,
      snapshot: {
        approval_enabled: cache.approval_enabled,
        approval_levels: cache.approval_levels,
        assessment_enabled: cache.assessment_enabled,
        assessor_groups: cache.assessor_groups,
        value_model: cache.value_model,
        complexity_model: cache.complexity_model,
      },
      updated_at: cache.updated_at,
      updated_by: cache.updated_by,
    },
    ...history,
  ];
  cache = {
    ...next,
    version: cache.version + 1,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  };
  persist();
  notify();
  return JSON.parse(JSON.stringify(cache));
};
