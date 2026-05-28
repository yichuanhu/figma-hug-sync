## 目标

在前一版基础上，将底层字段 key 同步翻译为与 R-31 文案语义一致的英文 key，避免「key 与含义错位」。

## 一、字段 key 重命名（form_data.cost_baseline）

| 旧 key | 新 key | 中文标签 | 单位 |
|---|---|---|---|
| `execution_frequency` | `monthly_execution_count` | 月执行次数 | 次/月 |
| `single_duration` | `single_manual_duration_minutes` | 单次人工耗时 | 分钟 |

成本项快照字段（`items[].id / cost_type / name / daily_cost / currency / snapshot_at`）不变。

## 二、改动范围

1. `src/pages/Requirements/RequirementsWorkbench/components/RequirementCreatePage/components/CostBaselineSection/index.tsx`
   - `Form.InputNumber field="monthly_execution_count"`（替换原下拉）
   - `Form.InputNumber field="single_manual_duration_minutes"`
   - tooltip 文案按 R-31
2. `src/pages/Requirements/RequirementsWorkbench/components/RequirementCreatePage/index.tsx`
   - `STEP_FIELDS[2]` 改为 `['monthly_execution_count', 'single_manual_duration_minutes']`
   - `OPTIONAL_FORM_KEYS` 同步替换（如有）
   - `buildSubmitValues` 拼装 `cost_baseline` 时使用新 key
   - 编辑态回填：从 `form_data.cost_baseline.monthly_execution_count / single_manual_duration_minutes` 取值；兼容旧数据 `execution_frequency`（字符串 daily/weekly/monthly → 22/4/1 数值映射）与 `single_duration`（直接复用）写入新 key
   - 移除 `executionFrequencyOptions` 引用
3. `public/i18n/zh-CN.json` / `public/i18n/en.json`
   - 更新 `requirements.form.costBaseline.banner / selectorLabel / executionFrequency → monthlyExecutionCount / singleDuration → singleManualDuration`
   - 新增 unit 文案：`monthlyExecutionCountUnit`（次/月）、`singleManualDurationUnit`（分钟）
   - 新增 tooltip 文案：`tooltip.section / tooltip.selector / tooltip.dailyCost / tooltip.monthlyExecutionCount / tooltip.singleManualDuration`

## 三、Tooltip 落位（与前版一致）

| 位置 | 文案 |
|---|---|
| 顶部 Banner | 用于描述当前人工处理该需求的成本基线，系统据此估算可节省工时和金额；不会影响机器人执行、流程调度或任务运行。 |
| 主要执行岗位/活动 label | 选择当前主要由哪类岗位或活动承担人工处理，系统会自动带出对应人天成本。 |
| 已选表格「人天成本」列 title | 由管理员在「成本基线配置」维护，当前需求保存时会记录快照，后续配置变更不影响本需求历史测算。 |
| 月执行次数 label | 该业务场景平均每月人工执行次数，用于计算月均节省工时。 |
| 单次人工耗时 label | 当前人工每执行一次平均耗时，单位分钟，用于计算月均节省工时。 |

统一：Lucide `HelpCircle` 14px stroke 2，`color="var(--semi-color-text-2)"`，`Tooltip position="top"`，`content` 用 `<div style={{ maxWidth: 280, lineHeight: 1.6 }}>`。

## 四、不动项

- step 顺序、提交接口、mock 层
- 成本项选择器与已选表格的列字段、渲染
- 其他步骤
