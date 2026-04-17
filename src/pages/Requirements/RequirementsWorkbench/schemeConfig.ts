import type { RequirementScheme } from './types';

/**
 * 内置预设方案 — 阶段 1 提供 3 个预设方案
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
    name: 'RPA 专业版方案',
    version: '1.0.0',
    description: '面向中大型企业的完整 RPA 需求评估方案，包含价值评估、复杂度评估及 3 级审批流。',
    status: 'active',
    is_preset: true,
    meta: {
      code: 'RPA-PRO',
      name: 'RPA 专业版方案',
      category: 'RPA',
      scenario: '中大型企业 RPA 项目',
      description: '完整字段 + 价值&复杂度双评估 + 3 级审批',
    },
    custom_fields: [
      { key: 'business_background', label: '业务背景', type: 'rich_text', required: true, placeholder: '请描述当前业务现状与痛点' },
      { key: 'pain_points', label: '业务痛点', type: 'textarea', required: true, validation: { maxLength: 2000 } },
      { key: 'expected_value', label: '期望价值', type: 'textarea', required: true },
      { key: 'monthly_volume', label: '月均处理量', type: 'number', required: true, unit: '笔', validation: { min: 0 } },
      { key: 'avg_handle_time', label: '单笔平均耗时', type: 'number', required: true, unit: '分钟', validation: { min: 0 } },
      { key: 'manual_cost_rate', label: '人工成本占比', type: 'percentage', required: false, validation: { min: 0, max: 100 } },
      { key: 'monthly_saved_hours', label: '月均节省工时（自动计算）', type: 'calculation', expression: '{monthly_volume} * {avg_handle_time} / 60', source_fields: ['monthly_volume', 'avg_handle_time'], unit: '小时' },
      { key: 'system_count', label: '涉及系统数量', type: 'number', required: true, validation: { min: 1 } },
      { key: 'system_types', label: '系统类型', type: 'checkbox_group', required: true, options: [
        { label: 'Web 应用', value: 'web' },
        { label: '桌面应用', value: 'desktop' },
        { label: 'SAP/ERP', value: 'sap' },
        { label: '邮件/办公套件', value: 'office' },
        { label: '数据库', value: 'database' },
      ] },
      { key: 'has_ocr', label: '是否涉及 OCR', type: 'radio', required: true, options: [{ label: '是', value: 'yes' }, { label: '否', value: 'no' }] },
      { key: 'ocr_doc_type', label: 'OCR 文档类型', type: 'select', depends_on: { field: 'has_ocr', operator: 'eq', value: 'yes' }, options: [
        { label: '发票', value: 'invoice' },
        { label: '合同', value: 'contract' },
        { label: '身份证', value: 'idcard' },
        { label: '其它', value: 'other' },
      ] },
      { key: 'expected_launch', label: '期望上线日期', type: 'date', required: true },
      { key: 'attachments', label: '附件', type: 'file_upload', required: false },
    ],
    value_assessment_model: {
      key: 'rpa-pro-value',
      type: 'value',
      label: '价值评估模型',
      description: '从经济价值与战略价值两个维度评估需求价值',
      dimensions: [
        { key: 'monthly_saved_hours', label: '月均节省工时', weight: 0.4, source_field: 'monthly_saved_hours' },
        { key: 'manual_cost_rate', label: '人工成本占比', weight: 0.3, source_field: 'manual_cost_rate' },
        { key: 'monthly_volume', label: '月均处理量', weight: 0.3, source_field: 'monthly_volume' },
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
      description: '从系统复杂度、流程复杂度、技术依赖等维度评估实施复杂度',
      dimensions: [
        { key: 'system_count', label: '涉及系统数量', weight: 0.35, source_field: 'system_count' },
        { key: 'has_ocr', label: 'OCR 复杂度', weight: 0.3, source_field: 'has_ocr' },
        { key: 'system_types', label: '系统类型多样性', weight: 0.35, source_field: 'system_types' },
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
      avg_hourly_cost: 80,
      working_hours_per_day: 8,
      working_days_per_month: 21,
      custom_basis: '按二线城市平均人力成本计算',
    },
    raw_yaml: '# RPA 专业版预设方案（内置不可编辑）\nmeta:\n  code: RPA-PRO\n  name: RPA 专业版方案\n# ... 完整 YAML 见原始上传文件',
    created_at: NOW,
    created_by: 'system',
  },

  // ===================== 2. RPA 轻量版 =====================
  {
    id: 'scheme-rpa-lite',
    code: 'RPA-LITE',
    name: 'RPA 轻量版方案',
    version: '1.0.0',
    description: '适合中小型团队的精简 RPA 评估方案，仅 6 个核心字段、单一评估模型与单级审批。',
    status: 'inactive',
    is_preset: true,
    meta: {
      code: 'RPA-LITE',
      name: 'RPA 轻量版方案',
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
    raw_yaml: '# RPA 轻量版预设方案\nmeta:\n  code: RPA-LITE\n# ...',
    created_at: NOW,
    created_by: 'system',
  },

  // ===================== 3. AI 文档处理 =====================
  {
    id: 'scheme-adp-doc',
    code: 'ADP-DOC',
    name: 'AI 文档处理方案',
    version: '1.0.0',
    description: '专门针对 OCR/文档智能处理（ADP）类需求设计的方案，包含文档识别相关维度。',
    status: 'inactive',
    is_preset: true,
    meta: {
      code: 'ADP-DOC',
      name: 'AI 文档处理方案',
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
    raw_yaml: '# AI 文档处理方案\nmeta:\n  code: ADP-DOC\n# ...',
    created_at: NOW,
    created_by: 'system',
  },
];

// ============= 内存方案存储（mock） =============

let schemeStore: RequirementScheme[] = [...PRESET_SCHEMES];

export const fetchSchemes = async (keyword?: string): Promise<RequirementScheme[]> => {
  await new Promise((r) => setTimeout(r, 200));
  let list = [...schemeStore];
  if (keyword?.trim()) {
    const kw = keyword.toLowerCase().trim();
    list = list.filter((s) => s.name.toLowerCase().includes(kw) || s.code.toLowerCase().includes(kw));
  }
  // 激活的排在最前
  list.sort((a, b) => {
    if (a.status === b.status) return a.is_preset === b.is_preset ? 0 : a.is_preset ? -1 : 1;
    return a.status === 'active' ? -1 : 1;
  });
  return list;
};

export const getActiveScheme = (): RequirementScheme | undefined =>
  schemeStore.find((s) => s.status === 'active');

export const activateScheme = async (id: string): Promise<void> => {
  await new Promise((r) => setTimeout(r, 200));
  schemeStore = schemeStore.map((s) => ({
    ...s,
    status: s.id === id ? 'active' : 'inactive',
  }));
};

export const addScheme = async (scheme: RequirementScheme): Promise<RequirementScheme> => {
  await new Promise((r) => setTimeout(r, 200));
  schemeStore = [scheme, ...schemeStore];
  return scheme;
};

export const deleteScheme = async (id: string): Promise<void> => {
  await new Promise((r) => setTimeout(r, 200));
  const target = schemeStore.find((s) => s.id === id);
  if (target?.is_preset) throw new Error('预设方案不可删除');
  schemeStore = schemeStore.filter((s) => s.id !== id);
};

export const fetchSchemeVersions = async (code: string): Promise<RequirementScheme[]> => {
  await new Promise((r) => setTimeout(r, 200));
  // mock：相同 code 的视为同一方案的不同版本
  return schemeStore.filter((s) => s.code === code).sort((a, b) => b.version.localeCompare(a.version));
};
