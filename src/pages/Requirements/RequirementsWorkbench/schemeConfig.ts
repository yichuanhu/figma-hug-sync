import type { RequirementScheme } from './types';
import {
  setSchemeBindingsForScheme,
  getOccupiedDepartmentMapByScheme,
  fetchAllSchemeBindings,
  getBoundDepartmentCountMapByScheme,
} from '@/mocks/departmentSchemeBinding';
import { expandDepartmentIdsWithDescendants } from '@/mocks/departmentData';

/**
 * 内置预设模版 — 阶段 1 提供 3 个预设模版
 * - RPA-PRO：RPA 专业版（完整字段 + 价值&复杂度双评估 + 3 级审批）
 * - RPA-LITE：RPA 轻量版（精简字段 + 单评估 + 1 级审批）
 * - ADP-DOC：AI 文档处理（含 OCR 维度）
 */

const NOW = new Date('2026-01-01T00:00:00Z').toISOString();

export const PRESET_SCHEMES: RequirementScheme[] = [
  // ===================== 1. RPA 专业版 =====================
  {
    id: 'scheme-rpa-pro',
    code: 'RPA-PRO',
    name: 'RPA 专业版模版',
    version: '1.0.0',
    description: '面向中大型企业的完整 RPA 需求评估模版，包含价值评估、复杂度评估及 3 级审批流。',
    status: 'inactive',
    is_preset: true,
    applicable_department_ids: [],
    meta: {
      code: 'RPA-PRO',
      name: 'RPA 专业版模版',
      category: 'RPA',
      scenario: '中大型企业 RPA 项目',
      description: '完整字段 + 价值&复杂度双评估 + 3 级审批',
    },
    custom_fields: [
      { key: 'scenario_name', label: '场景名称', type: 'text', required: true, validation: { maxLength: 100 }, ui_width: 'medium' },
      { key: 'category_l1', label: '一级目录', type: 'select', required: true, ui_width: 'medium', options: [
        { label: '税务业务', value: 'tax' },
        { label: '财务业务', value: 'finance' },
        { label: '人力资源', value: 'hr' },
        { label: '采购业务', value: 'procurement' },
        { label: '其他', value: 'other' },
      ] },
      { key: 'category_l2', label: '二级目录', type: 'text', required: true, validation: { maxLength: 50 }, ui_width: 'medium' },
      { key: 'category_l3', label: '三级目录', type: 'text', required: true, validation: { maxLength: 50 }, ui_width: 'medium' },
      { key: 'operation_steps', label: '操作步骤', type: 'textarea', required: true, validation: { maxLength: 5000 }, ui_width: 'full', description: '详细描述当前人工操作步骤，建议使用编号列表' },
      { key: 'application_unit', label: '应用单位', type: 'text', required: false, validation: { maxLength: 100 }, ui_width: 'medium' },
      { key: 'frequency', label: '汇总执行频率', type: 'number', required: true, unit: '次/月', validation: { min: 0, max: 100000 }, ui_width: 'small' },
      { key: 'duration', label: '单次人工操作时长', type: 'number', required: true, unit: '分钟/次', validation: { min: 0, max: 1440 }, ui_width: 'small' },
      { key: 'automation_ratio', label: '可自动化比例', type: 'percentage', required: true, validation: { min: 0, max: 100 }, ui_width: 'small' },
      { key: 'monthly_saved_hours', label: '月平均节约人工时长', type: 'calculation',
        expression: '{frequency} * {duration} * {automation_ratio} / 100 / 60',
        source_fields: ['frequency', 'duration', 'automation_ratio'],
        unit: 'H/月', ui_width: 'small', format: { precision: 2 },
        description: '系统自动计算 = 频率 × 单次时长 × 可自动化比例 ÷ 60' },
      { key: 'contact_name', label: '需求联系人', type: 'text', required: true, validation: { maxLength: 50 }, ui_width: 'medium' },
      { key: 'contact_phone', label: '联系方式', type: 'text', required: true, validation: { pattern: '^1[3-9]\\d{9}$', message: '请输入有效的手机号码' }, ui_width: 'medium' },
      { key: 'job_level', label: '执行该业务的岗位级别', type: 'select', required: true, source: 'cost_config.rate_table', ui_width: 'medium', description: '用于估算节省金额，费率由模版 cost_config 提供' },
      { key: 'process_screenshot', label: '流程截图', type: 'file_upload', required: false, ui_width: 'full', description: '上传当前操作流程的截图或文档（PNG/JPG/PDF，最多 5 个，单个 ≤10MB）' },
      { key: 'business_context', label: '业务背景', type: 'textarea', required: false, validation: { maxLength: 2000 }, ui_width: 'full', description: '描述业务现状与痛点' },
      { key: 'expected_launch_date', label: '期望上线日期', type: 'date', required: false, ui_width: 'medium' },
      { key: 'is_compliance_required', label: '是否涉及合规审计', type: 'radio', required: false, ui_width: 'medium', options: [
        { label: '是', value: 'yes' },
        { label: '否', value: 'no' },
      ] },
      { key: 'related_systems', label: '涉及系统', type: 'multi_select', required: false, ui_width: 'full', options: [
        { label: 'SAP', value: 'sap' },
        { label: '金蝶', value: 'kingdee' },
        { label: '用友', value: 'yonyou' },
        { label: 'Excel', value: 'excel' },
        { label: '邮件系统', value: 'email' },
      ] },
      { key: 'attachments', label: '需求附件', type: 'file_upload', required: false, ui_width: 'full', description: 'PRD / 流程文档 / 参考资料' },
    ],
    value_assessment_model: {
      key: 'rpa-pro-value',
      type: 'value',
      label: '价值评估模型',
      description: '从节省工时与执行规模评估需求价值',
      dimensions: [
        { key: 'monthly_saved_hours', label: '月平均节约人工时长', weight: 0.5, source_field: 'monthly_saved_hours' },
        { key: 'frequency', label: '汇总执行频率', weight: 0.3, source_field: 'frequency' },
        { key: 'automation_ratio', label: '可自动化比例', weight: 0.2, source_field: 'automation_ratio' },
      ],
      tiers: [
        { condition: '>=80', score: 100, label: '高价值', color: 'green' },
        { condition: '60~79', score: 75, label: '中价值', color: 'blue' },
        { condition: '<60', score: 40, label: '低价值', color: 'orange' },
      ],
    },
    complexity_assessment_model: {
      key: 'rpa-pro-complexity',
      type: 'complexity',
      label: '复杂度评估模型',
      description: '基于操作步骤、可自动化比例评估复杂度',
      dimensions: [
        { key: 'duration', label: '单次操作时长', weight: 0.4, source_field: 'duration' },
        { key: 'automation_ratio', label: '可自动化比例', weight: 0.3, source_field: 'automation_ratio' },
        { key: 'frequency', label: '执行频率', weight: 0.3, source_field: 'frequency' },
      ],
      tiers: [
        { condition: '>=80', score: 100, label: '高复杂度', color: 'red' },
        { condition: '60~79', score: 75, label: '中复杂度', color: 'orange' },
        { condition: '<60', score: 40, label: '低复杂度', color: 'green' },
      ],
    },
    approval_flow: {
      levels: [
        { order: 1, name: '直属主管审批', approver_type: 'role', approver_ids: ['role-line-manager'] },
        { order: 2, name: '部门负责人审批', approver_type: 'role', approver_ids: ['role-dept-head'] },
        { order: 3, name: '需求委员会审批', approver_type: 'department', approver_ids: ['dept-committee'] },
      ],
    },
    cost_config: {
      working_hours_per_day: 8,
      working_days_per_month: 21,
      currency: 'CNY',
      default_rate: 500,
      rate_table: {
        junior: 300,
        middle: 500,
        senior: 700,
        manager: 900,
      },
      level_labels: {
        junior: '初级员工',
        middle: '中级员工',
        senior: '高级员工',
        manager: '管理层（经理及以上）',
      },
      custom_basis: '按二线城市平均人力成本计算',
    },
    raw_yaml: '# RPA 专业版预设模版（内置不可编辑）\nmeta:\n  code: RPA-PRO\n  name: RPA 专业版模版\n# ... 完整 YAML 见原始上传文件',
    created_at: NOW,
    created_by: 'system',
  },

  // ===================== 2. RPA 轻量版 =====================
  {
    id: 'scheme-rpa-lite',
    code: 'RPA-LITE',
    name: 'RPA 轻量版模版',
    version: '1.0.0',
    description: '适合中小型团队的精简 RPA 评估模版，仅 6 个核心字段、单一评估模型与单级审批。',
    status: 'inactive',
    is_preset: true,
    applicable_department_ids: [],
    meta: {
      code: 'RPA-LITE',
      name: 'RPA 轻量版模版',
      category: 'RPA',
      scenario: '中小型团队快速立项',
    },
    custom_fields: [
      { key: 'pain_points', label: '业务痛点', type: 'textarea', required: true, validation: { maxLength: 1000 } },
      { key: 'monthly_volume', label: '月均处理量', type: 'number', required: true, unit: '笔' },
      { key: 'avg_handle_time', label: '单笔平均耗时', type: 'number', required: true, unit: '分钟' },
      { key: 'system_type', label: '系统类型', type: 'select', required: true, options: [
        { label: 'Web 应用', value: 'web' },
        { label: '桌面应用', value: 'desktop' },
        { label: 'Office 套件', value: 'office' },
      ] },
      { key: 'expected_launch', label: '期望上线日期', type: 'date', required: true },
      { key: 'attachments', label: '附件', type: 'file_upload' },
    ],
    value_assessment_model: {
      key: 'rpa-lite-value',
      type: 'value',
      label: '价值评估（简化）',
      dimensions: [
        { key: 'monthly_volume', label: '月均处理量', weight: 0.5, source_field: 'monthly_volume' },
        { key: 'avg_handle_time', label: '单笔耗时', weight: 0.5, source_field: 'avg_handle_time' },
      ],
      tiers: [
        { condition: '>=70', score: 100, label: '推荐立项', color: 'green' },
        { condition: '<70', score: 50, label: '建议复评', color: 'orange' },
      ],
    },
    approval_flow: {
      levels: [
        { order: 1, name: '部门负责人审批', approver_type: 'role', approver_ids: ['role-dept-head'] },
      ],
    },
    cost_config: {
      avg_hourly_cost: 60,
      working_hours_per_day: 8,
      working_days_per_month: 21,
    },
    raw_yaml: '# RPA 轻量版预设模版\nmeta:\n  code: RPA-LITE\n# ...',
    created_at: NOW,
    created_by: 'system',
  },

  // ===================== 4. RPA 统计表标准模版（无审批 / 无评估） =====================
  {
    id: 'scheme-rpa-stat',
    code: 'RPA-STAT',
    name: 'RPA 统计表标准模版',
    version: '1.0.0',
    description: '基于《RPA 统计表》模板设计的标准化需求采集模版，提交后跳过审批与评估，直接进入待开发状态。',
    status: 'inactive',
    is_preset: true,
    applicable_department_ids: [],
    meta: {
      code: 'RPA-STAT',
      name: 'RPA 统计表标准模版',
      category: 'RPA',
      scenario: '集团 RPA 需求统一采集',
      description: '对齐《RPA 统计表》字段；无审批、无评估，提交即进入待开发',
    },
    custom_fields: [
      { key: 'requirement_description', label: '需求描述', type: 'textarea', required: true, validation: { maxLength: 2000 }, ui_width: 'full', description: '描述需求背景、目标与范围' },
      { key: 'requirement_analyst', label: '需求分析师', type: 'user_select', required: false, ui_width: 'medium', description: '从用户列表中选择需求分析师' },
      { key: 'proposing_department', label: '需求提出单位及部门', type: 'department_select', required: false, ui_width: 'medium', description: '从部门列表中选择需求提出方' },
      { key: 'operation_type', label: '操作类型', type: 'select', required: true, ui_width: 'medium', options: [
        { label: '业务操作', value: 'business_operation' },
        { label: '数据处理', value: 'data_processing' },
        { label: '稽核检查', value: 'audit_check' },
        { label: '监控预警', value: 'monitor_alert' },
        { label: '交互应答', value: 'interactive_response' },
        { label: '凭证制证', value: 'voucher_creation' },
        { label: '凭证审核', value: 'voucher_review' },
        { label: '其他', value: 'other' },
      ] },
      { key: 'involved_systems', label: '涉及的办公系统或软件', type: 'multi_select', required: false, ui_width: 'full', options: [
        { label: 'FMIS', value: 'FMIS' },
        { label: 'SAP', value: 'SAP' },
        { label: 'SSF', value: 'SSF' },
        { label: 'Excel', value: 'Excel' },
        { label: 'Chrome', value: 'Chrome' },
        { label: 'Edge', value: 'Edge' },
      ] },
      { key: 'business_coverage_unit', label: '业务覆盖范围（单位）', type: 'text', required: false, validation: { maxLength: 100 }, ui_width: 'medium', description: '例：湖北销售' },
      { key: 'per_capita_frequency', label: '人均处理频率', type: 'number', required: false, unit: '次/月', validation: { min: 0 }, ui_width: 'small' },
      { key: 'per_capita_duration', label: '人均处理时长', type: 'number', required: false, unit: '分钟/月', validation: { min: 0 }, ui_width: 'small' },
      { key: 'application_target', label: '应用对象', type: 'select', required: false, ui_width: 'medium', options: [
        { label: '共享内部', value: 'internal_shared' },
        { label: '服务企业', value: 'service_enterprise' },
        { label: '其他', value: 'other' },
      ] },
      { key: 'business_contact', label: '业务联系人相关信息', type: 'textarea', required: false, validation: { maxLength: 200 }, ui_width: 'full', description: '姓名 + 电话' },
      { key: 'attachments', label: '附件', type: 'file_upload', required: false, ui_width: 'full', description: '上传需求文档、业务视频等（最多 5 个，单个 ≤10MB）' },
      { key: 'expected_complete_date', label: '需求完成时间', type: 'date', required: false, ui_width: 'medium', description: '期望完成日期' },
    ],
    approval_flow: {
      levels: [],
    },
    raw_yaml: '# RPA 统计表标准模版（无审批 / 无评估）\nmeta:\n  code: RPA-STAT\n  name: RPA 统计表标准模版\napproval_flow:\n  levels: []\n# value_assessment_model / complexity_assessment_model 未配置 → 跳过评估',
    created_at: NOW,
    created_by: 'system',
  },

  // ===================== 3. AI 文档处理 =====================
  {
    id: 'scheme-adp-doc',
    code: 'ADP-DOC',
    name: 'AI 文档处理模版',
    version: '1.0.0',
    description: '专门针对 OCR/文档智能处理（ADP）类需求设计的模版，包含文档识别相关维度。',
    status: 'inactive',
    is_preset: true,
    applicable_department_ids: [],
    meta: {
      code: 'ADP-DOC',
      name: 'AI 文档处理模版',
      category: 'ADP',
      scenario: '票据 / 合同 / 表单类智能处理',
    },
    custom_fields: [
      { key: 'doc_type', label: '文档类型', type: 'select', required: true, options: [
        { label: '增值税发票', value: 'vat_invoice' },
        { label: '银行回单', value: 'bank_receipt' },
        { label: '采购合同', value: 'purchase_contract' },
        { label: '业务表单', value: 'business_form' },
      ] },
      { key: 'monthly_doc_count', label: '月均文档量', type: 'number', required: true, unit: '份' },
      { key: 'doc_standardization', label: '文档标准化程度', type: 'radio', required: true, options: [
        { label: '高（同模板）', value: 'high' },
        { label: '中（少量变体）', value: 'medium' },
        { label: '低（自由格式）', value: 'low' },
      ] },
      { key: 'extract_fields_count', label: '需提取字段数', type: 'number', required: true, validation: { min: 1 } },
      { key: 'has_handwriting', label: '是否含手写内容', type: 'radio', required: true, options: [{ label: '是', value: 'yes' }, { label: '否', value: 'no' }] },
      { key: 'downstream_system', label: '下游对接系统', type: 'multi_select', options: [
        { label: 'SAP', value: 'sap' },
        { label: '金蝶', value: 'kingdee' },
        { label: '用友', value: 'yonyou' },
        { label: '自研系统', value: 'custom' },
      ] },
      { key: 'expected_launch', label: '期望上线日期', type: 'date', required: true },
    ],
    value_assessment_model: {
      key: 'adp-value',
      type: 'value',
      label: 'ADP 价值评估',
      dimensions: [
        { key: 'monthly_doc_count', label: '月均文档量', weight: 0.6, source_field: 'monthly_doc_count' },
        { key: 'extract_fields_count', label: '提取字段数', weight: 0.4, source_field: 'extract_fields_count' },
      ],
      tiers: [
        { condition: '>=75', score: 100, label: '强烈推荐', color: 'green' },
        { condition: '50~74', score: 70, label: '推荐', color: 'blue' },
        { condition: '<50', score: 30, label: '不推荐', color: 'red' },
      ],
    },
    complexity_assessment_model: {
      key: 'adp-complexity',
      type: 'complexity',
      label: 'ADP 复杂度评估',
      dimensions: [
        { key: 'doc_standardization', label: '文档标准化', weight: 0.4, source_field: 'doc_standardization' },
        { key: 'has_handwriting', label: '手写识别难度', weight: 0.3, source_field: 'has_handwriting' },
        { key: 'extract_fields_count', label: '字段提取规模', weight: 0.3, source_field: 'extract_fields_count' },
      ],
      tiers: [
        { condition: '>=70', score: 100, label: '高复杂度', color: 'red' },
        { condition: '<70', score: 50, label: '中低复杂度', color: 'green' },
      ],
    },
    approval_flow: {
      levels: [
        { order: 1, name: 'AI 团队评审', approver_type: 'role', approver_ids: ['role-ai-lead'] },
        { order: 2, name: '部门负责人审批', approver_type: 'role', approver_ids: ['role-dept-head'] },
      ],
    },
    cost_config: {
      avg_hourly_cost: 100,
      working_hours_per_day: 8,
      working_days_per_month: 21,
    },
    raw_yaml: '# AI 文档处理模版\nmeta:\n  code: ADP-DOC\n# ...',
    created_at: NOW,
    created_by: 'system',
  },
];

// ============= 模版存储（mock） =============

const SCHEME_STORAGE_KEY = 'apa.requirements.schemes.v1';

/** v15: 租户默认方案的来源预设 key */
export const DEFAULT_PRESET_KEY = 'RPA-PRO';
/** v15: 演示用——预设当前最新版本，若租户方案的 source_preset_version 落后于此值则显示「预设已更新」 */
const PRESET_LATEST_VERSIONS: Record<string, string> = {
  'RPA-PRO': '1.1.0', // 故意比预设里的 1.0.0 高，演示升级通知
  'RPA-LITE': '1.0.0',
  'RPA-STAT': '1.0.0',
  'ADP-DOC': '1.0.0',
};

// ============= v15 错误码 =============
export type SchemeErrorCode =
  | 'SCHEME_NO_DEPARTMENT'
  | 'SCHEME_DEPARTMENT_CONFLICT'
  | 'SCHEME_BOUND_CANNOT_SET_DEFAULT'
  | 'SCHEME_DEFAULT_CANNOT_ACTIVATE'
  | 'SCHEME_DEFAULT_CANNOT_DELETE'
  | 'SCHEME_DEFAULT_UNAVAILABLE'
  | 'SCHEME_PRESET_READONLY'
  | 'SCHEME_HAS_BINDING_CANNOT_DELETE'
  | 'SCHEME_ACTIVE_CANNOT_DELETE'
  | 'SCHEME_VALIDATION_FAILED'
  | 'SCHEME_NOT_FOUND';

export class SchemeError extends Error {
  code: SchemeErrorCode;
  details?: unknown;
  constructor(code: SchemeErrorCode, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

const cloneSchemes = (list: RequirementScheme[]): RequirementScheme[] =>
  list.map((item) => ({ ...item }));

/** v15: 从预设克隆出租户默认方案 */
const buildTenantDefaultFromPreset = (presetKey: string): RequirementScheme | null => {
  const preset = PRESET_SCHEMES.find((p) => p.code === presetKey);
  if (!preset) return null;
  return {
    ...preset,
    id: `scheme-tenant-default-${Date.now().toString(36)}`,
    code: `TENANT-DEFAULT-${preset.code}`,
    name: `${preset.name}（租户默认）`,
    is_preset: false,
    is_tenant_default: true,
    status: 'active',
    source_preset_key: preset.code,
    source_preset_version: preset.version,
    applicable_department_ids: [],
    created_at: new Date().toISOString(),
    created_by: 'system',
  };
};

const ensureTenantDefault = (list: RequirementScheme[]): RequirementScheme[] => {
  const hasDefault = list.some((s) => s.is_tenant_default && s.status === 'active');
  if (hasDefault) return list;
  const def = buildTenantDefaultFromPreset(DEFAULT_PRESET_KEY);
  if (!def) return list;
  return [def, ...list];
};

const loadSchemes = (): RequirementScheme[] => {
  try {
    const raw = localStorage.getItem(SCHEME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RequirementScheme[];
      const presetIds = new Set(PRESET_SCHEMES.map((s) => s.id));
      const storedNonPresets = parsed.filter((s) => !presetIds.has(s.id));
      // v15: 预设方案以代码内定义为准（不再允许通过 storage 修改 status / applicable_department_ids）
      const merged = [...storedNonPresets, ...cloneSchemes(PRESET_SCHEMES)];
      return ensureTenantDefault(merged);
    }
  } catch {
    /* noop */
  }
  return ensureTenantDefault(cloneSchemes(PRESET_SCHEMES));
};

const saveSchemes = (list: RequirementScheme[]): void => {
  try {
    localStorage.setItem(SCHEME_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
};

let schemeStore: RequirementScheme[] = loadSchemes();

// ----- 订阅机制：模版变更时通知所有订阅者（用于 React 重渲染） -----
const schemeSubscribers = new Set<() => void>();

export const subscribeSchemeChange = (cb: () => void): (() => void) => {
  schemeSubscribers.add(cb);
  return () => schemeSubscribers.delete(cb);
};

const notifySchemeChange = (): void => {
  schemeSubscribers.forEach((cb) => {
    try { cb(); } catch { /* ignore subscriber errors */ }
  });
};

/** 当前模版存储版本号（每次变更自增），用于 useSyncExternalStore 快照对比 */
let schemeVersion = 0;
export const getSchemeVersion = (): number => schemeVersion;
const bumpSchemeVersion = (): void => {
  schemeVersion += 1;
  saveSchemes(schemeStore);
  notifySchemeChange();
};

/** v15: 为方案附加运行时计算字段（preset_update_available） */
const decorateRuntime = (s: RequirementScheme): RequirementScheme => {
  if (s.is_preset || !s.source_preset_key) return s;
  const latest = PRESET_LATEST_VERSIONS[s.source_preset_key];
  if (latest && s.source_preset_version && latest > s.source_preset_version) {
    return { ...s, preset_update_available: true };
  }
  return s;
};

export const fetchSchemes = async (keyword?: string): Promise<RequirementScheme[]> => {
  await new Promise((r) => setTimeout(r, 200));
  let list = schemeStore.map(decorateRuntime);
  if (keyword?.trim()) {
    const kw = keyword.toLowerCase().trim();
    list = list.filter((s) => s.name.toLowerCase().includes(kw) || s.code.toLowerCase().includes(kw));
  }
  // 排序：租户默认 → 已激活非预设 → 其它非预设 → 预设
  list.sort((a, b) => {
    const rank = (x: RequirementScheme) => {
      if (x.is_tenant_default) return 0;
      if (!x.is_preset && x.status === 'active') return 1;
      if (!x.is_preset) return 2;
      return 3;
    };
    return rank(a) - rank(b);
  });
  return list;
};

/** 单激活兼容：返回第一个激活方案（旧逻辑）。优先使用 getActiveSchemes 获取全部激活方案。 */
export const getActiveScheme = (): RequirementScheme | undefined =>
  schemeStore.find((s) => s.status === 'active');

/** STORY-013 v4：支持多方案同时激活；返回所有 is_active 方案。 */
export const getActiveSchemes = (): RequirementScheme[] =>
  schemeStore.filter((s) => s.status === 'active');

/** v15: 取当前租户默认方案 */
export const getTenantDefaultScheme = (): RequirementScheme | undefined =>
  schemeStore.find((s) => s.is_tenant_default && s.status === 'active');

/** v15: 默认方案健康状态 */
export type DefaultSchemeHealth = 'ok' | 'missing' | 'inactive' | 'multiple';
export const getDefaultSchemeHealth = (): DefaultSchemeHealth => {
  const defaults = schemeStore.filter((s) => s.is_tenant_default);
  if (defaults.length === 0) return 'missing';
  if (defaults.length > 1) return 'multiple';
  return defaults[0].status === 'active' ? 'ok' : 'inactive';
};

/**
 * v15: 激活某方案（非默认普通方案）。事务：
 * - 校验非预设 / 非默认
 * - 校验有适用部门
 * - 展开子部门，校验部门未被其他激活方案占用
 * - 写入 department_scheme_binding
 * - status=active
 */
export const activateScheme = async (id: string): Promise<void> => {
  await new Promise((r) => setTimeout(r, 200));
  const target = schemeStore.find((s) => s.id === id);
  if (!target) throw new SchemeError('SCHEME_NOT_FOUND', '模版不存在');
  if (target.is_preset) throw new SchemeError('SCHEME_PRESET_READONLY', '预设方案不可激活，请先复制为租户方案');
  if (target.is_tenant_default) throw new SchemeError('SCHEME_DEFAULT_CANNOT_ACTIVATE', '默认方案不可手动激活');
  const selected = target.applicable_department_ids ?? [];
  if (selected.length === 0) throw new SchemeError('SCHEME_NO_DEPARTMENT', '请至少选择一个适用部门后再激活');
  const expanded = expandDepartmentIdsWithDescendants(selected);
  const activeIds = schemeStore.filter((s) => s.status === 'active' && s.id !== id && !s.is_tenant_default).map((s) => s.id);
  const occupied = getOccupiedDepartmentMapByScheme(id, activeIds);
  const conflicts = expanded.filter((d) => occupied[d]);
  if (conflicts.length > 0) {
    const ownerName = schemeStore.find((s) => s.id === occupied[conflicts[0]])?.name ?? '其他方案';
    throw new SchemeError(
      'SCHEME_DEPARTMENT_CONFLICT',
      `部门已被方案「${ownerName}」占用，请调整适用部门`,
      { conflicts },
    );
  }
  setSchemeBindingsForScheme(id, expanded);
  schemeStore = schemeStore.map((s) =>
    s.id === id ? { ...s, status: 'active', is_draft: false, updated_at: new Date().toISOString() } : s,
  );
  bumpSchemeVersion();
};

/** v15: 停用方案。预设/默认方案不可停用；其它方案停用时清空绑定。 */
export const deactivateScheme = async (id: string): Promise<void> => {
  await new Promise((r) => setTimeout(r, 200));
  const target = schemeStore.find((s) => s.id === id);
  if (!target) throw new SchemeError('SCHEME_NOT_FOUND', '模版不存在');
  if (target.is_preset) throw new SchemeError('SCHEME_PRESET_READONLY', '预设方案不参与激活/停用');
  if (target.is_tenant_default) throw new SchemeError('SCHEME_DEFAULT_CANNOT_DELETE', '默认方案不可停用');
  setSchemeBindingsForScheme(id, []);
  schemeStore = schemeStore.map((s) =>
    s.id === id ? { ...s, status: 'inactive', updated_at: new Date().toISOString() } : s,
  );
  bumpSchemeVersion();
};

export const addScheme = async (scheme: RequirementScheme): Promise<RequirementScheme> => {
  await new Promise((r) => setTimeout(r, 200));
  schemeStore = [scheme, ...schemeStore];
  bumpSchemeVersion();
  return scheme;
};

/** v15: 删除方案。仅允许非预设、非默认、非激活、无生效绑定。 */
export const deleteScheme = async (id: string): Promise<void> => {
  await new Promise((r) => setTimeout(r, 200));
  const target = schemeStore.find((s) => s.id === id);
  if (!target) throw new SchemeError('SCHEME_NOT_FOUND', '模版不存在');
  if (target.is_preset) throw new SchemeError('SCHEME_PRESET_READONLY', '预设方案不可删除');
  if (target.is_tenant_default) throw new SchemeError('SCHEME_DEFAULT_CANNOT_DELETE', '默认方案不可删除');
  if (target.status === 'active') throw new SchemeError('SCHEME_ACTIVE_CANNOT_DELETE', '已激活方案不可删除，请先停用');
  const bindingCount = getBoundDepartmentCountMapByScheme()[id] ?? 0;
  if (bindingCount > 0) throw new SchemeError('SCHEME_HAS_BINDING_CANNOT_DELETE', `该方案被 ${bindingCount} 个部门使用，请先停用方案或调整适用部门`);
  schemeStore = schemeStore.filter((s) => s.id !== id);
  bumpSchemeVersion();
};

/**
 * v15: 将一个未激活的草稿方案设为新的租户默认方案。
 * - 要求目标方案：非预设、status=inactive、配置完整、无生效部门绑定
 * - 事务：原默认 → is_tenant_default=false, status=inactive；新默认 → is_tenant_default=true, status=active
 */
export const setSchemeAsDefault = async (id: string): Promise<void> => {
  await new Promise((r) => setTimeout(r, 200));
  const target = schemeStore.find((s) => s.id === id);
  if (!target) throw new SchemeError('SCHEME_NOT_FOUND', '模版不存在');
  if (target.is_preset) throw new SchemeError('SCHEME_PRESET_READONLY', '预设方案不可设为默认');
  if (target.is_tenant_default) return; // 已是默认
  const bindingCount = getBoundDepartmentCountMapByScheme()[id] ?? 0;
  if (bindingCount > 0) {
    throw new SchemeError(
      'SCHEME_BOUND_CANNOT_SET_DEFAULT',
      '有部门绑定的方案不能直接设为默认方案，请创建或选择一个无部门绑定的方案',
    );
  }
  const v = validateScheme(id);
  if (!v.ok) throw new SchemeError('SCHEME_VALIDATION_FAILED', v.errors.join('；'));
  const now = new Date().toISOString();
  schemeStore = schemeStore.map((s) => {
    if (s.id === id) return { ...s, is_tenant_default: true, status: 'active', is_draft: false, updated_at: now };
    if (s.is_tenant_default) return { ...s, is_tenant_default: false, status: 'inactive', updated_at: now };
    return s;
  });
  bumpSchemeVersion();
};

/** v15: 取方案对应源预设的最新版本号；用于展示预设升级差异 */
export const getPresetLatestVersion = (presetKey: string | undefined): string | undefined =>
  presetKey ? PRESET_LATEST_VERSIONS[presetKey] : undefined;



/** 更新模版的审批流配置（预设模版不可更新） */
export const updateSchemeApprovalFlow = async (
  id: string,
  approval_flow: RequirementScheme['approval_flow'],
): Promise<RequirementScheme> => {
  await new Promise((r) => setTimeout(r, 200));
  const target = schemeStore.find((s) => s.id === id);
  if (!target) throw new Error('模版不存在');
  if (target.is_preset) throw new Error('预设模版不可编辑');
  schemeStore = schemeStore.map((s) =>
    s.id === id ? { ...s, approval_flow, updated_at: new Date().toISOString() } : s,
  );
  bumpSchemeVersion();
  return schemeStore.find((s) => s.id === id)!;
};

export const fetchSchemeVersions = async (code: string): Promise<RequirementScheme[]> => {
  await new Promise((r) => setTimeout(r, 200));
  // mock：相同 code 的视为同一模版的不同版本
  return schemeStore.filter((s) => s.code === code).sort((a, b) => b.version.localeCompare(a.version));
};

// ============= Builder API（Story 13） =============
import type { WorkflowConfig, CostConfig } from './types';

/** 创建空白模版草稿 */
export const createSchemeDraft = async (meta: { name: string; description?: string; version?: string }): Promise<RequirementScheme> => {
  const id = `scheme-draft-${Date.now()}`;
  const code = `CUSTOM-${Date.now().toString(36).toUpperCase()}`;
  const draft: RequirementScheme = {
    id,
    code,
    name: meta.name,
    version: meta.version ?? '1.0.0',
    description: meta.description,
    status: 'inactive',
    is_preset: false,
    is_draft: true,
    custom_fields: [],
    approval_flow: { levels: [] },
    workflow_config: { template: 'simple', states: [], approvers: [], assessors: [] },
    cost_config: { working_hours_per_day: 8, currency: 'CNY', default_rate: 500, rate_table_v2: [] },
    created_at: new Date().toISOString(),
    created_by: 'current-user',
  };
  schemeStore = [draft, ...schemeStore];
  bumpSchemeVersion();
  return draft;
};

/** 基于已有模版克隆为草稿 */
export const cloneSchemeAsDraft = async (sourceId: string, opts?: { name?: string; bumpVersion?: boolean }): Promise<RequirementScheme> => {
  const src = schemeStore.find((s) => s.id === sourceId);
  if (!src) throw new Error('源模版不存在');
  const id = `scheme-draft-${Date.now()}`;
  const nextVersion = opts?.bumpVersion
    ? bumpVersionString(src.version)
    : src.version;
  const draft: RequirementScheme = {
    ...src,
    id,
    code: opts?.bumpVersion ? src.code : `${src.code}-COPY-${Date.now().toString(36).slice(-4).toUpperCase()}`,
    name: opts?.name ?? `${src.name}（副本）`,
    version: nextVersion,
    status: 'inactive',
    is_preset: false,
    is_draft: true,
    parent_id: src.id,
    created_at: new Date().toISOString(),
    updated_at: undefined,
  };
  schemeStore = [draft, ...schemeStore];
  bumpSchemeVersion();
  return draft;
};

/** AF2: 编辑已激活模版 → 自动派生新版本 */
export const forkActiveScheme = async (sourceId: string): Promise<RequirementScheme> => {
  return cloneSchemeAsDraft(sourceId, { bumpVersion: true });
};

const bumpVersionString = (v: string): string => {
  const parts = v.split('.').map((n) => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  parts[parts.length - 1] += 1;
  return parts.join('.');
};

/** Builder 分模块更新 */
export const updateSchemeBuilder = async (
  id: string,
  patch: Partial<Pick<RequirementScheme,
    'name' | 'description' | 'version' | 'custom_fields' |
    'value_assessment_model' | 'complexity_assessment_model' |
    'workflow_config' | 'cost_config' | 'approval_flow' |
    'applicable_department_ids'
  >>,
): Promise<RequirementScheme> => {
  await new Promise((r) => setTimeout(r, 150));
  const target = schemeStore.find((s) => s.id === id);
  if (!target) throw new Error('模版不存在');
  if (target.is_preset) throw new Error('预设模版不可编辑');
  schemeStore = schemeStore.map((s) =>
    s.id === id ? { ...s, ...patch, updated_at: new Date().toISOString() } : s,
  );
  bumpSchemeVersion();
  return schemeStore.find((s) => s.id === id)!;
};

/**
 * 单独更新「适用部门」字段。
 * 与 updateSchemeBuilder 不同，此方法允许预设模版编辑（仅限此字段），
 * 满足「预设模版可调整适用部门以适配各租户组织结构」的需求。
 */
export const updateSchemeApplicableDepartments = async (
  id: string,
  applicable_department_ids: string[],
): Promise<RequirementScheme> => {
  await new Promise((r) => setTimeout(r, 150));
  const target = schemeStore.find((s) => s.id === id);
  if (!target) throw new Error('模版不存在');
  schemeStore = schemeStore.map((s) =>
    s.id === id ? { ...s, applicable_department_ids, updated_at: new Date().toISOString() } : s,
  );
  bumpSchemeVersion();
  return schemeStore.find((s) => s.id === id)!;
};



/** 通过 id 读取模版 */
export const getSchemeById = (id: string): RequirementScheme | undefined =>
  schemeStore.find((s) => s.id === id);

/** 完整性校验 */
export interface SchemeValidationResult {
  ok: boolean;
  missing: Array<'form' | 'assessment' | 'workflow' | 'cost'>;
  errors: string[];
}

export const validateScheme = (id: string): SchemeValidationResult => {
  const s = schemeStore.find((x) => x.id === id);
  const missing: SchemeValidationResult['missing'] = [];
  const errors: string[] = [];
  if (!s) return { ok: false, missing: [], errors: ['模版不存在'] };

  // Form
  if (!s.custom_fields || s.custom_fields.length === 0) {
    missing.push('form');
    errors.push('表单至少需要 1 个自定义字段');
  } else {
    const keys = s.custom_fields.map((f) => f.key);
    const dup = keys.find((k, i) => keys.indexOf(k) !== i);
    if (dup) errors.push(`字段名称重复：${dup}`);
  }

  // Assessment：评估模型可选；仅当用户已配置但维度为空时报错。
  [s.value_assessment_model, s.complexity_assessment_model].forEach((m) => {
    if (m && (!m.dimensions || m.dimensions.length === 0)) {
      errors.push(`评估模型「${m.label}」必须至少包含一个维度`);
    }
  });

  // Workflow：审批流可选；不再强制必须包含草稿/待审批状态。

  // Cost 配置已从模版中移除，不再校验

  return { ok: missing.length === 0 && errors.length === 0, missing, errors };
};

/** 同步 cost_config v2 -> 旧字段 */
export const syncCostConfigCompat = (cc: CostConfig): CostConfig => {
  const list = cc.rate_table_v2 ?? [];
  const rate_table: Record<string, number> = {};
  const level_labels: Record<string, string> = {};
  list.forEach((it) => {
    rate_table[it.level] = it.daily_rate;
    level_labels[it.level] = it.label;
  });
  return { ...cc, rate_table, level_labels };
};

/** 同步 workflow_config -> approval_flow.levels（保持执行兼容） */
export const syncApprovalFlowFromWorkflow = (wf: WorkflowConfig): ApprovalLevelConfig[] => {
  const typeMap: Record<WorkflowConfig['approvers'][number]['type'], 'user' | 'role' | 'department'> = {
    department_leader: 'department',
    specific_users: 'user',
    role: 'role',
  } as const;
  return [...wf.approvers]
    .sort((a, b) => a.priority - b.priority)
    .map((a, idx) => ({
      order: idx + 1,
      name: a.name,
      approver_type: typeMap[a.type],
      approver_ids: a.target_ids ?? [],
      mode: a.approval_mode ?? 'any_one',
    }));
};

import type { ApprovalLevelConfig } from './types';

/** 激活模版（带校验） */
export const activateSchemeBuilder = async (id: string): Promise<RequirementScheme> => {
  const v = validateScheme(id);
  if (!v.ok) {
    const err = new Error(v.errors.join('；'));
    (err as Error & { missing?: string[] }).missing = v.missing;
    throw err;
  }
  // 同步 cost & workflow → 旧字段
  const target = schemeStore.find((s) => s.id === id);
  if (!target) throw new Error('模版不存在');
  const patch: Partial<RequirementScheme> = {};
  if (target.cost_config) patch.cost_config = syncCostConfigCompat(target.cost_config);
  const wfDisabled = target.workflow_config?.template === 'none';
  if (wfDisabled) {
    // 无审批流：清空审批层级与评估模型，对齐 RPA-STAT 行为
    patch.approval_flow = { levels: [] };
    patch.value_assessment_model = undefined;
    patch.complexity_assessment_model = undefined;
  } else if (target.workflow_config) {
    patch.approval_flow = { levels: syncApprovalFlowFromWorkflow(target.workflow_config) };
  }
  schemeStore = schemeStore.map((s) =>
    s.id === id
      ? { ...s, ...patch, status: 'active', is_draft: false, updated_at: new Date().toISOString() }
      : { ...s, status: 'inactive' },
  );
  bumpSchemeVersion();
  return schemeStore.find((s) => s.id === id)!;
};

/** Workflow 模板生成器 */
export const buildWorkflowFromTemplate = (template: string): WorkflowConfig => {
  const draftState = { id: 's-draft', name: '草稿', initial: true, role: 'normal' as const, transitions: [{ id: 't1', to: 's-pending', action: 'submit', label: '提交审批', auto_assign: true }] };
  const cancelledState = { id: 's-cancelled', name: '已撤销', role: 'normal' as const, transitions: [] };
  const rejectedState = { id: 's-rejected', name: '已拒绝', role: 'normal' as const, transitions: [] };
  const approvedState = { id: 's-approved', name: '已通过', role: 'normal' as const, transitions: [] };

  if (template === 'simple') {
    return {
      template,
      states: [
        draftState,
        { id: 's-pending', name: '待审批', role: 'approval', transitions: [{ id: 't2', to: 's-approved', action: 'approve', label: '通过' }, { id: 't3', to: 's-rejected', action: 'reject', label: '拒绝' }] },
        approvedState, rejectedState, cancelledState,
      ],
      approvers: [{ id: 'a1', name: '部门领导审批', type: 'department_leader', priority: 1, required: true, approval_mode: 'any_one', timeout_days: 7 }],
      assessors: [],
    };
  }
  if (template === 'multi-approval') {
    return {
      template,
      states: [
        draftState,
        { id: 's-pending', name: '待审批', role: 'approval', transitions: [{ id: 't2', to: 's-approved', action: 'approve', label: '通过' }, { id: 't3', to: 's-rejected', action: 'reject', label: '拒绝' }] },
        approvedState, rejectedState, cancelledState,
      ],
      approvers: [
        { id: 'a1', name: '直属主管', type: 'department_leader', priority: 1, required: true, approval_mode: 'any_one', timeout_days: 3 },
        { id: 'a2', name: '部门负责人', type: 'role', priority: 2, required: true, approval_mode: 'any_one', target_ids: ['role-dept-head'], timeout_days: 5 },
      ],
      assessors: [],
    };
  }
  if (template === 'assess-first') {
    return {
      template,
      states: [
        draftState,
        { id: 's-assessing', name: '待评估', role: 'assessment', transitions: [{ id: 't2', to: 's-approved', action: 'pass', label: '评估通过' }, { id: 't3', to: 's-rejected', action: 'reject', label: '评估拒绝' }] },
        { id: 's-pending', name: '待审批', role: 'approval', transitions: [] },
        approvedState, rejectedState, cancelledState,
      ],
      approvers: [],
      assessors: [{ id: 'as1', name: '技术负责人评估', type: 'specific_users', priority: 1, required: true, target_ids: [] }],
    };
  }
  // multi-approval-assess
  return {
    template: 'multi-approval-assess',
    states: [
      draftState,
      { id: 's-pending', name: '待审批', role: 'approval', transitions: [{ id: 't2', to: 's-assessing', action: 'approve', label: '审批通过' }, { id: 't3', to: 's-rejected', action: 'reject', label: '拒绝' }] },
      { id: 's-assessing', name: '待评估', role: 'assessment', transitions: [{ id: 't4', to: 's-approved', action: 'pass', label: '评估通过' }, { id: 't5', to: 's-rejected', action: 'reject', label: '评估拒绝' }] },
      approvedState, rejectedState, cancelledState,
    ],
    approvers: [
      { id: 'a1', name: '直属主管', type: 'department_leader', priority: 1, required: true, approval_mode: 'any_one', timeout_days: 3 },
      { id: 'a2', name: '指定审批人', type: 'specific_users', priority: 2, required: false, approval_mode: 'any_one', target_ids: [], timeout_days: 5 },
    ],
    assessors: [{ id: 'as1', name: '技术负责人评估', type: 'specific_users', priority: 1, required: true, target_ids: [] }],
  };
};
