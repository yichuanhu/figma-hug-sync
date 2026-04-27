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
    status: 'inactive',
    is_preset: true,
    meta: {
      code: 'RPA-PRO',
      name: 'RPA 专业版方案',
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
      { key: 'job_level', label: '执行该业务的岗位级别', type: 'select', required: true, source: 'cost_config.rate_table', ui_width: 'medium', description: '用于估算节省金额，费率由方案 cost_config 提供' },
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

  // ===================== 4. RPA 统计表标准方案（无审批 / 无评估） =====================
  {
    id: 'scheme-rpa-stat',
    code: 'RPA-STAT',
    name: 'RPA 统计表标准方案',
    version: '1.0.0',
    description: '基于《RPA 统计表》模板设计的标准化需求采集方案，提交后跳过审批与评估，直接进入待立项状态。',
    status: 'active',
    is_preset: true,
    meta: {
      code: 'RPA-STAT',
      name: 'RPA 统计表标准方案',
      category: 'RPA',
      scenario: '集团 RPA 需求统一采集',
      description: '对齐《RPA 统计表》字段；无审批、无评估，提交即进入待立项',
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
    raw_yaml: '# RPA 统计表标准方案（无审批 / 无评估）\nmeta:\n  code: RPA-STAT\n  name: RPA 统计表标准方案\napproval_flow:\n  levels: []\n# value_assessment_model / complexity_assessment_model 未配置 → 跳过评估',
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

// ----- 订阅机制：方案变更时通知所有订阅者（用于 React 重渲染） -----
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

/** 当前方案存储版本号（每次变更自增），用于 useSyncExternalStore 快照对比 */
let schemeVersion = 0;
export const getSchemeVersion = (): number => schemeVersion;
const bumpSchemeVersion = (): void => {
  schemeVersion += 1;
  notifySchemeChange();
};

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
  bumpSchemeVersion();
};

export const addScheme = async (scheme: RequirementScheme): Promise<RequirementScheme> => {
  await new Promise((r) => setTimeout(r, 200));
  schemeStore = [scheme, ...schemeStore];
  bumpSchemeVersion();
  return scheme;
};

export const deleteScheme = async (id: string): Promise<void> => {
  await new Promise((r) => setTimeout(r, 200));
  const target = schemeStore.find((s) => s.id === id);
  if (target?.is_preset) throw new Error('预设方案不可删除');
  schemeStore = schemeStore.filter((s) => s.id !== id);
  bumpSchemeVersion();
};

/** 更新方案的审批流配置（预设方案不可更新） */
export const updateSchemeApprovalFlow = async (
  id: string,
  approval_flow: RequirementScheme['approval_flow'],
): Promise<RequirementScheme> => {
  await new Promise((r) => setTimeout(r, 200));
  const target = schemeStore.find((s) => s.id === id);
  if (!target) throw new Error('方案不存在');
  if (target.is_preset) throw new Error('预设方案不可编辑');
  schemeStore = schemeStore.map((s) =>
    s.id === id ? { ...s, approval_flow, updated_at: new Date().toISOString() } : s,
  );
  bumpSchemeVersion();
  return schemeStore.find((s) => s.id === id)!;
};

export const fetchSchemeVersions = async (code: string): Promise<RequirementScheme[]> => {
  await new Promise((r) => setTimeout(r, 200));
  // mock：相同 code 的视为同一方案的不同版本
  return schemeStore.filter((s) => s.code === code).sort((a, b) => b.version.localeCompare(a.version));
};
