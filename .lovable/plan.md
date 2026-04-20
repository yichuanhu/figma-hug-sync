# 新建需求弹窗 — 全面对齐设计文档（方案 D，居中 Modal）

> 依据：`requirement-center-design-4.md`（v1.0）章节 3.1 / 3.1.1 / 3.1.2 / 3.2

---

## 一、当前差距清单

对比设计文档，现有「新建需求」弹窗存在 9 处偏离：

| # | 类别 | 现状 | 文档要求 | 处理 |
|---|------|------|----------|------|
| 1 | 系统字段 | Modal 顶部硬编码「标题/描述/部门/负责人/联系方式/优先级」 | 系统字段为 **title / number / department_id / owner_id / status / linked_entities / implementation_docs**；联系方式属业务字段 | 收敛为「标题 + 部门 + 负责人 + 优先级」4 个；"描述/联系方式" 由 Scheme 接管 |
| 2 | RPA-PRO 字段集 | 13 个自创字段（business_background、pain_points、has_ocr…），与中石油案例几乎完全不同 | 文档 §3.1.2 明确给出 RPA 专业版完整字段：场景名称、一级/二级/三级目录、操作步骤、应用单位、汇总执行频率、单次人工操作时长、可自动化比例、需求联系人、联系方式、岗位级别、流程截图 | 重写 `schemeConfig.ts` 中 RPA-PRO `custom_fields`，严格按文档 12 字段配置 |
| 3 | 计算字段 | 表达式 `{monthly_volume} * {avg_handle_time} / 60`（缺"可自动化比例"） | `frequency * duration * automation_ratio / 60`，单位 `H/月`，精度 2 | 修正 `monthly_saved_hours` 表达式与 source_fields，精度按 `format.precision` 渲染 |
| 4 | 岗位级别字段 | 缺失 | `select` + `source: "cost_config.rate_table"`，options 由 cost_config 动态生成 | SchemeFieldRenderer 新增 `source` 解析；`cost_config.rate_table` 改为数组结构（含 level/label/daily_rate） |
| 5 | cost_config 联动提示 | 无 | 选岗位级别后显示「日成本 ¥XXX/天」，并在节省工时旁额外预估「节省金额 ¥/月」 | 在岗位级别字段下方追加 `extraText` 显示日单价；在月节省工时下追加「预估节省金额」只读派生数 |
| 6 | 字段宽度 | 全部 100% 宽 | `ui_config.width: small/medium/large/full` | SchemeFieldRenderer 支持 4 档宽度（small=160 / medium=320 / large=520 / full=100%）；窄字段同行排布（CSS grid） |
| 7 | 帮助文本 | 仅作为 `extraText` 灰色一行 | `description` = label 下方 helpText | 维持当前 extraText 即可 |
| 8 | 必填提示 | 区块标题旁挂"* 为必填" | 文档无强制要求 | 移除 `requiredHint`（与底部提示已删保持一致风格） |
| 9 | 文件字段 | type 为 `file_upload` | 文档命名为 `file`，但项目类型已固化 `file_upload` | 类型保留 `file_upload`（项目内部别名），label 与配置按文档 |

---

## 二、改动文件清单

### 1. `src/pages/Requirements/RequirementsWorkbench/schemeConfig.ts`

**重写 `RPA-PRO` 的 `custom_fields`**，严格按文档 §3.1.2，共 12 个业务字段 + 1 个计算字段：

```ts
custom_fields: [
  { key: 'scenario_name',     label: '场景名称',           type: 'text',         required: true,  validation: { maxLength: 100 }, ui_width: 'medium' },
  { key: 'category_l1',       label: '一级目录',           type: 'select',       required: true,
    options: [{label:'税务业务',value:'tax'},{label:'财务业务',value:'finance'},{label:'人力资源',value:'hr'},{label:'采购业务',value:'procurement'},{label:'其他',value:'other'}],
    ui_width: 'medium' },
  { key: 'category_l2',       label: '二级目录',           type: 'text',         required: true,  ui_width: 'medium' },
  { key: 'category_l3',       label: '三级目录',           type: 'text',         required: true,  ui_width: 'medium' },
  { key: 'operation_steps',   label: '操作步骤',           type: 'textarea',     required: true,  validation: { maxLength: 5000 }, description: '详细描述当前人工操作的步骤，建议使用编号列表' },
  { key: 'application_unit',  label: '应用单位',           type: 'text',         required: false, ui_width: 'medium' },
  { key: 'frequency',         label: '汇总执行频率',       type: 'number',       required: true,  unit: '次/月', validation: { min: 0, max: 10000 }, ui_width: 'small' },
  { key: 'duration',          label: '单次人工操作时长',   type: 'number',       required: true,  unit: '分钟/次', validation: { min: 0, max: 1440 }, ui_width: 'small' },
  { key: 'automation_ratio',  label: '可自动化比例',       type: 'percentage',   required: true,  validation: { min: 0, max: 100 }, ui_width: 'small' },
  { key: 'monthly_saved_hours', label: '月平均节约人工时长', type: 'calculation',
    expression: '{frequency} * {duration} * {automation_ratio} / 100 / 60',
    source_fields: ['frequency','duration','automation_ratio'],
    unit: 'H/月', ui_width: 'small',
    description: '系统自动计算 = 频率 × 单次时长 × 可自动化比例 ÷ 60' },
  { key: 'contact_name',      label: '需求联系人',         type: 'text',         required: true,  validation: { maxLength: 50 }, ui_width: 'medium' },
  { key: 'contact_phone',     label: '联系方式',           type: 'text',         required: true,  validation: { pattern: '^1[3-9]\\d{9}$', message: '请输入有效手机号' }, ui_width: 'medium' },
  { key: 'job_level',         label: '执行该业务的岗位级别', type: 'select',     required: true,  source: 'cost_config.rate_table', description: '选择执行该业务的人员级别，用于估算节省金额', ui_width: 'medium' },
  { key: 'process_screenshot', label: '流程截图',          type: 'file_upload',  required: false, description: '上传当前操作流程的截图或文档（PNG/JPG/PDF，最多 5 个）' },
],
cost_config: {
  working_hours_per_day: 8,
  currency: 'CNY',
  default_rate: 500,
  rate_table: [
    { level: 'junior',  label: '初级员工',           daily_rate: 300 },
    { level: 'middle',  label: '中级员工',           daily_rate: 500 },
    { level: 'senior',  label: '高级员工',           daily_rate: 700 },
    { level: 'manager', label: '管理层（经理及以上）', daily_rate: 900 },
  ],
}
```

类型补充：
- `SchemeField` 新增 `ui_width?: 'small'|'medium'|'large'|'full'`、`source?: string`、`format?: { unit?: string; precision?: number }`
- `CostConfig` `rate_table` 改为 `Array<{ level: string; label: string; daily_rate: number }>`（兼容旧 `Record` 读取处需同步更新评估打分逻辑——仅 `mockData.ts` 用到）

### 2. `src/pages/Requirements/RequirementsWorkbench/components/SchemeFieldRenderer/index.tsx`

- **宽度系统**：根据 `field.ui_width` 输出包裹 className（`scheme-field-w-small / -medium / -large / -full`）；外层由 Modal 的 grid 容器收容，使 small/medium 同行布局。
- **`source: 'cost_config.rate_table'` 解析**：`select` 类型时若有 `source`，从激活 Scheme 的 `cost_config.rate_table` 动态取 options（label/value），并把选中项 `daily_rate` 通过 `Form.Slot` 在字段下方显示「日成本 ¥XXX/天 · 8 小时工作日」提示。
- **`calculation` 精度**：`Math.round(result * 10^precision) / 10^precision`，按 `field.format?.precision ?? 2` 处理；hover label 旁信息图标显示完整公式（来自 `description`）。
- **额外派生展示**（仅 RPA-PRO，不入表单）：`monthly_saved_hours` 字段下方追加灰色提示「预估月节省金额 ≈ ¥{savedHours/workingHours × dailyRate} / 月」，dailyRate 由 `job_level` 选中值与 cost_config 联动。
- **`text` 字段 pattern 验证**：将 `validation.pattern` 转为 RegExp 加入 rules（手机号校验生效）。

### 3. `src/pages/Requirements/RequirementsWorkbench/components/RequirementFormModal/index.tsx`

精简系统字段 + 引入两段式分组 + grid 布局：

```text
[基本信息]                   ← 系统字段（弹窗硬编码）
- 标题 *                     full
- 所属部门 * | 需求负责人 *  medium × 2 同行
- 优先级                     medium

[需求详情]                   ← Scheme 驱动（动态字段）
   ↓ 全部由 SchemeFieldsRenderer 渲染，按 ui_width 流式同行
- 场景名称 *      | 一级目录 *
- 二级目录 *      | 三级目录 *
- 操作步骤 * (full, textarea 8 行)
- 应用单位
- 汇总执行频率 * | 单次人工操作时长 * | 可自动化比例 *  (small × 3)
- 月平均节约人工时长 (calculation, small, 只读)
   └ 派生：预估月节省金额 ≈ ¥XXX / 月
- 需求联系人 *   | 联系方式 *
- 执行该业务的岗位级别 *   ← source=rate_table
   └ 派生：日成本 ¥XXX/天 · 8 小时工作日
- 流程截图 (full, Upload)
```

要点：
- **删除**：硬编码「描述」「联系方式」「业务背景区块标题」「baseline 区块副标题中的 * 必填提示」。
- **保留**：标题/部门/负责人/优先级 4 项硬编码。
- **`SchemeFieldsRenderer`**：用 grid 容器（`display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px`），子元素根据 `ui_width=full` → `grid-column: 1 / -1`，否则按 1 列宽。
- **依赖逻辑（`depends_on`）**：保持现有。
- **提交时**：`form_data` 仍按 `activeScheme.custom_fields` 收敛；`monthly_saved_hours` 由 SchemeFieldRenderer 自动写值；新增字段 `job_level` 已纳入。

### 4. `src/pages/Requirements/RequirementsWorkbench/components/RequirementFormModal/index.less`

- 新增 grid 容器 `.requirement-form-modal-grid`。
- 移除 `.requirement-form-modal-section-title` 中"* 必填"分支样式（不再需要）。
- Modal 宽度由 600 → **720**（容纳两列 small/medium）。

### 5. `src/pages/Requirements/RequirementsWorkbench/mockData.ts`

兼容性修复（仅必要范围）：
- `getCostConfigForScheme()` 中 `rate_table` 数组化后的读取改造（按 jobLevel 字段查 `daily_rate`）。
- 现有 mock 需求项 `form_data` 中的 RPA-PRO 字段 key 由旧的 `monthly_volume / avg_handle_time / has_ocr` 等更新为新 key（`frequency / duration / automation_ratio / job_level / scenario_name / category_l1` …），让列表/详情不破坏。
- `RequirementBaselineFormData.jobLevel` 类型从 `'P4'|'P5'|'P6'|'P7'` 扩展为 `string`（兼容新 level 值 `junior/middle/senior/manager`）。

### 6. i18n（`public/i18n/zh-CN.json` / `en.json`）

新增 / 调整：
- `requirements.form.sectionDetails`: 「需求详情」 / 「Requirement Details」
- `requirements.form.jobLevelDailyHint`: 「日成本 ¥{rate}/天 · {hours} 小时工作日」
- `requirements.form.savedAmountHint`: 「预估月节省金额 ≈ ¥{amount} / 月」

删除：`requirements.form.requiredHint`、`requirements.form.baselineHint`（区块副标题不再使用）。

---

## 三、验收清单

1. **基本信息** 仅 4 项：标题、部门 + 负责人（同行）、优先级。
2. **需求详情** 字段顺序、必填、单位、宽度严格匹配上文表格。
3. 输入「频率=40、时长=12、可自动化比例=80」→「月平均节约人工时长」自动显示 **6.4 H/月**（精度 2）。
4. 选择「岗位级别 = 高级员工」→ 字段下方提示「日成本 ¥700/天 · 8 小时工作日」，并在月节省工时下方提示「预估月节省金额 ≈ ¥560/月」（6.4 / 8 × 700）。
5. 联系方式输入非手机号 → 实时报错「请输入有效手机号」。
6. 操作步骤为 8 行 textarea；流程截图为上传（最多 5 个 / 10MB / png/jpg/pdf）。
7. 弹窗宽度 720，small/medium 字段两列同行；full 字段独占整行。
8. 提交后 `form_data` 包含全部新字段，列表/详情抽屉不报错（mock 已同步更新）。
