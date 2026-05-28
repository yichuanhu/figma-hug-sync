## 目标

按 STORY-003 v6（2026-05-28）与 STORY-014 v5（2026-05-28）修订，重构「新建/编辑需求」表单：

- 新表单顺序：**基本信息 → 业务补充字段 → 成本基线**
- 分类标签**归入基本信息**，不再单独成步
- 岗位/执行频率/单次时长等字段**调整为成本基线**字段
- 成本由「成本基线配置」选择并保存快照（`cost_baseline`），不作为实际执行配置
- 立项后双步编辑同样开放成本基线为业务字段（可重新选择成本项并更新快照）

## 一、Steps 调整

文件：`src/pages/Requirements/RequirementsWorkbench/components/RequirementCreatePage/index.tsx`

| 序号 | 标题 | 描述 | 内容 |
|---|---|---|---|
| 0 | 基本信息 | 标题、部门、归属人、优先级、分类标签 | 现 Step 0 字段 + 内嵌 `ClassificationTagsField` |
| 1 | 业务补充字段 | 按模版填写业务字段 | 现 Step 2 的 `SchemeFieldsRenderer` |
| 2 | 成本基线 | 选择成本项，自动带出人天成本快照 | 新「成本基线选择器」+ 执行频率 + 单次时长 |
| 3 | 发布变更（仅立项后编辑） | 变更说明 ≥10 字符 | 保留现 `PublishChangePanel` |

- `totalSteps`：新建/草稿编辑 = 3；立项后编辑 = 4
- `lastFormStep` = 2
- `STEP_FIELDS` / `locateFirstError` 同步更新（业务字段 step=1，成本基线 step=2）

## 二、基本信息内嵌分类标签

- Step 0 末尾追加 `ClassificationTagsField`（沿用现有状态 `classificationValue / Status / forceClsError / editable`）
- `validateClassification()` 错误时定位 `setCurrentStep(0)` 并滚动到 `[data-classification-anchor]`
- 删除原独立 Step 3 渲染块

## 三、成本基线步骤（替代「岗位与执行成本」）

### 3.1 数据模型

`form_data` 中：

- **新增** `cost_baseline`：`{ items: Array<{ id, cost_type, name, daily_cost, currency, snapshot_at }>, execution_frequency?, single_duration? }`（按 STORY-014 v5「`cost_baseline` 快照」口径，聚合在一个对象里，便于 ChangeLog `changed_fields` 整体 diff）
- **移除** `position_costs / position_level / position_cost`（保留旧字段读取兼容）
- 兼容：编辑态若仅有旧 `position_costs`，转换为空 `items` 并在步骤顶部显示 Banner「原岗位成本字段已废弃，请重新选择成本基线」

### 3.2 UI

- 顶部 `Banner type="info"`：「成本由「成本基线配置」自动带出并保存快照，不作为实际执行配置」+ 跳转链接「前往成本基线配置」(`navigate('/requirements/cost-baseline')`)
- **成本项选择器** `Form.Slot label="成本项"`：
  - Semi `Select`（`multiple filter`），`optionList` = `listCostBaselineItems()`
  - `renderOptionItem`：类型 Tag（复用 `COST_TYPE_TAG_COLOR`）+ 名称 + `{currency} {daily_cost.toLocaleString()} / 人天`
  - 选中变化时通过 `getCostBaselineItem(id)` 拼装快照写入本地 state `costItems`，附 `snapshot_at = new Date().toISOString()`
  - 选中列表下方紧凑表格（4 列：类型 Tag / 名称 / 人天成本 / 操作-移除按钮）
  - 空数据态：「暂无成本项，请先在「成本基线配置」中新建」+ 跳转按钮
- **执行频率** `Form.Select`：复用 `executionFrequencyOptions`，可选
- **单次时长** `Form.InputNumber`：分钟，可选
- 删除旧 state（`positionCosts / addPositionCost / removePositionCost / updatePositionCost / positionLevelOptions`）

### 3.3 submitValues / patch / 编辑还原

`buildSubmitValues`：

- 移除 `position_costs` 相关逻辑
- 拼装：

```ts
const cost_baseline = (costItems.length || values.execution_frequency || values.single_duration)
  ? {
      items: costItems,
      execution_frequency: values.execution_frequency,
      single_duration: values.single_duration,
    }
  : undefined;
if (cost_baseline) form_data.cost_baseline = cost_baseline;
```

- `execution_frequency / single_duration` 从 `OPTIONAL_FORM_KEYS` 中移除（统一收编到 `cost_baseline`），避免顶层重复

`useEffect` 加载编辑数据：

- 优先读取 `form_data.cost_baseline.items` → `setCostItems`
- 写回 form：`execution_frequency / single_duration` 通过 `formApi.setValue` 从 `cost_baseline` 中回填
- 兼容旧数据：见 3.1

## 四、立项后双步编辑（STORY-014 v5）对齐

- **业务字段判定**：`cost_baseline.*` 视为业务字段，立项后**可编辑**；Step 2「成本基线」在 `isPostProjectEdit` 时不再被锁
- **草稿合并** (`getDraft`)：`patch.form_data.cost_baseline` 覆盖 `costItems` state；现已有的 `Object.entries(patch.form_data).forEach(setValue)` 逻辑不动，仅追加：

```ts
const cb = (patch.form_data as any).cost_baseline;
if (cb?.items) setCostItems(cb.items);
```

- **发布变更弹窗** (`PublishChangePanel`)：保持当前实现（仅变更说明 ≥10 字符；**不再区分 INFO_ONLY / DEV_IMPACT**，与 v1 修订一致），无需改动
- **changed_fields**：mock 层 `publishChange` 本来按 `patch` 浅 diff，`cost_baseline` 整体作为一个字段比对即可，无需深入

## 五、文案 i18n

`public/i18n/zh-CN.json` 与 `en.json` 新增：

- `requirements.form.steps.basicInfo` 基本信息
- `requirements.form.steps.businessFields` 业务补充字段
- `requirements.form.steps.costBaseline` 成本基线
- `requirements.form.steps.publishChange` 发布变更
- `requirements.form.costBaseline.banner` 成本由「成本基线配置」自动带出并保存快照，不作为实际执行配置
- `requirements.form.costBaseline.selectorLabel` 成本项
- `requirements.form.costBaseline.selectorPlaceholder` 选择成本项（可多选）
- `requirements.form.costBaseline.empty` 暂无成本项，请先在「成本基线配置」中新建
- `requirements.form.costBaseline.goConfig` 前往成本基线配置
- `requirements.form.costBaseline.executionFrequency` 执行频率
- `requirements.form.costBaseline.singleDuration` 单次时长（分钟）
- `requirements.form.costBaseline.legacyDeprecated` 原岗位成本字段已废弃，请重新选择成本基线

Steps `Steps.Step` 的 `title` / `description` 改为 `t(...)`。

## 六、不动项

- 不改后端 mock 的 `createRequirement / updateRequirement / saveDraft / publishChange` 接口签名
- 不改需求详情页（详情页 cost_baseline 展示按后续 Story）
- 不改 `RequirementsAssessment / RequirementsReview / ApprovalConfig / CostBaselineConfig`
- 不改 `statusConfig / fieldEditability / classificationEditable` 工具函数语义

## 七、技术细节

- `listCostBaselineItems()` 全量拉取，前端本地过滤
- 选项展示 / 已选表格颜色复用 `COST_TYPE_TAG_COLOR`
- 跳转「成本基线配置」用 `navigate('/requirements/cost-baseline')`（非新窗口）
- 表格 `Table size="small"`，无分页
- Semi 原生校验 `trigger=['blur','change']`

## 八、收益

- 表单结构对齐 STORY-003 v6 §1 第 6 条
- 成本基线快照与 STORY-014 v5 「`cost_baseline` 快照」口径一致
- 复用 STORY-020 配置数据源，避免双写
- 新建/草稿编辑由 4 步缩减为 3 步，分类标签内嵌减少跳转