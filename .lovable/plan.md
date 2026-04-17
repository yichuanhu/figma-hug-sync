

## 第 2 批：Scheme 驱动的动态需求表单 + 成本预估联动

### 一、目标

让"激活方案 (Active Scheme)"成为需求表单与成本预估的唯一事实来源：
1. 需求新建/编辑表单的字段从激活 Scheme 的 `custom_fields` 动态渲染（不再硬编码）。
2. 成本预估的人天费率与每日工时从激活 Scheme 的 `cost_config` 读取（替代当前硬编码的 `DEFAULT_SCHEME_COST_CONFIG`）。
3. 用户编辑表单中的频率/时长/可自动化比例/岗位级别后，保存即自动重算 `costEstimate` 并写回。

### 二、数据契约

#### 1. Scheme 扩展（`types.ts`）
- `RequirementScheme.cost_config` 已存在但字段不对，新增/复用：
  ```ts
  CostConfig {
    avg_hourly_cost: number;
    working_hours_per_day: number;
    working_days_per_month: number;
    rate_table?: Record<JobLevel, number>;  // 新增：岗位级别 → 人天单价
  }
  ```
- 保留现有 `SchemeCostConfig`（CostEstimateTab 内部用），从 active scheme 派生。

#### 2. Mock 激活方案（`mockData.ts`）
新增导出：
```ts
const ACTIVE_SCHEME: RequirementScheme = {
  id: 'scheme-rpa-pro',
  name: 'RPA Pro 标准方案',
  custom_fields: [
    { key: 'frequency', label: '执行频率', type: 'number', unit: '次/月', required: true, validation: { min: 1, max: 1000 } },
    { key: 'durationMinutes', label: '单次耗时', type: 'number', unit: '分钟', required: true, validation: { min: 1, max: 600 } },
    { key: 'automationRatio', label: '可自动化比例', type: 'percentage', required: true, validation: { min: 0, max: 100 } },
    { key: 'jobLevel', label: '岗位级别', type: 'select', required: true, options: [
      { label: 'P4（初级）', value: 'P4' },
      { label: 'P5（中级）', value: 'P5' },
      { label: 'P6（高级）', value: 'P6' },
      { label: 'P7（资深）', value: 'P7' },
    ]},
  ],
  cost_config: {
    avg_hourly_cost: 200,
    working_hours_per_day: 8,
    working_days_per_month: 22,
    rate_table: { P4: 800, P5: 1200, P6: 1800, P7: 2600 },
  },
  // ... 其他字段填默认值
};
export const getActiveScheme = (): RequirementScheme => ACTIVE_SCHEME;
export const getActiveSchemeCostConfig = (): SchemeCostConfig => ({
  workingHoursPerDay: ACTIVE_SCHEME.cost_config!.working_hours_per_day,
  rateTable: ACTIVE_SCHEME.cost_config!.rate_table!,
  schemeName: ACTIVE_SCHEME.name,
});
```

`computeCostEstimate` 调用方默认改读 `getActiveSchemeCostConfig()`。

### 三、UI 改造

#### 1. `RequirementFormModal` 改为 Scheme 驱动
- 当前形态：硬编码 Title / Department / Owner / Description / Priority / 联系人 / 期望上线 等字段。
- 新形态：保留**基础信息区**（Title / Department / Owner / Priority / 期望上线 / Description —— 这些是系统级字段，不进 custom_fields），下方新增**「业务基线（自动化收益评估）」**分组，按 `activeScheme.custom_fields` 动态渲染：
  - `number` → `InputNumber`（带 unit suffix）
  - `percentage` → `InputNumber` min=0 max=100 suffix="%"
  - `select` → `Select`（用 `options`）
  - `text/textarea` → `Input/TextArea`
  - 校验：`required` + `validation.min/max` 全部走 Semi 原生 `rules`，`trigger=['blur','change']`。
- 提交时：把 custom 字段值合并写入 `form_data`，并解析出 `baselineFormData`（4 个核心字段），自动 `computeCostEstimate` 写回 `costEstimate`。
- 编辑模式：从 `editData.form_data` 回填初始值。

#### 2. 抽出动态字段渲染组件
- 新增 `components/SchemeFieldRenderer/index.tsx`：根据 `SchemeField` 类型渲染对应 Form 控件 + 校验 rules。复用于 FormModal 的"业务基线"区。
- 100 行以内，无独立 less。

#### 3. `mockData.createRequirement` / `updateRequirement` 自动重算
- 接收 `form_data: Record<string, unknown>`。
- 提取 `frequency / durationMinutes / automationRatio / jobLevel` → `baselineFormData`。
- 若四个字段齐全：调用 `computeCostEstimate(baseline, getActiveSchemeCostConfig())` → 写入 `costEstimate` + `baselineFormData`。
- 若不齐：清空 `costEstimate`（避免脏数据）。

#### 4. `CostEstimateTab` 切换数据源
- 当前：`computeCostEstimate(data.baselineFormData, DEFAULT_SCHEME_COST_CONFIG)`。
- 改为：`computeCostEstimate(data.baselineFormData, getActiveSchemeCostConfig())`。
- 副标题中的 `schemeName / dailyRate / hours` 自然反映激活方案变化。
- 移除导出 `DEFAULT_SCHEME_COST_CONFIG`（仅作内部 fallback）。

### 四、Mock 数据补齐
所有 mock 需求生成时，把 `baselineFormData` 同步写入 `form_data`：
```ts
form_data: { ...baseline },
baselineFormData: baseline,
costEstimate: computeCostEstimate(baseline, getActiveSchemeCostConfig()),
```

### 五、文件改动清单

1. `src/pages/Requirements/RequirementsWorkbench/types.ts` — `CostConfig` 增加 `rate_table`
2. `src/pages/Requirements/RequirementsWorkbench/mockData.ts` — 新增 `ACTIVE_SCHEME` / `getActiveScheme` / `getActiveSchemeCostConfig`；`computeCostEstimate` 默认读激活方案；create/update 自动重算；mock 生成时写入 `form_data`
3. `src/pages/Requirements/RequirementsWorkbench/components/SchemeFieldRenderer/index.tsx` — 新建动态字段渲染器
4. `src/pages/Requirements/RequirementsWorkbench/components/RequirementFormModal/index.tsx` — 在表单底部插入"业务基线"分组（Title 上方"分组小标题 + 动态字段"），编辑模式回填 `form_data`
5. `src/pages/Requirements/RequirementsWorkbench/components/RequirementFormModal/index.less` — 新增 `.requirement-form-section-divider` / `.requirement-form-section-title` 样式
6. `src/pages/Requirements/RequirementsWorkbench/components/RequirementDetailDrawer/CostEstimateTab/index.tsx` — 改读 `getActiveSchemeCostConfig()`
7. `public/i18n/zh-CN.json` + `public/i18n/en.json` — 新增 `requirements.form.baselineSection` / 动态字段 label 兜底 i18n key

### 六、设计规范遵循

- 表单分组样式参考 modal/form-layout-preference：本表单字段 > 6，使用 section divider + 小标题。
- 字段顺序：基础信息（Title → Dept → Owner → Priority → 期望上线 → Description）→ 分隔线 → 业务基线（4 个动态字段）→ 联系信息。
- 校验：Semi 原生 rules + `trigger=['blur','change']`，红色错误提示，无 Toast。
- i18n：业务基线分组中文优先，custom_fields 的 label 直接来自 Scheme（已是中文）。
- Lucide 图标 stroke=2，size=14（行内）。

