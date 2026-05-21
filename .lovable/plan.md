## 目标

对照 `story-010-OC-CUSTOM-METRICS-3.md` 调整自定义业务指标模块，覆盖三个变更点。

---

## 1. 类型与 Mock 数据层（src/mocks/operationsMetrics）

### types.ts
- `CustomMetric` 新增：
  - `stepValue?: number`（仅 COUNTER 使用，默认 1，整数）
  - `valueType?: 'DECIMAL' | 'STRING'`（仅 LATEST 使用，COUNTER/ACCUMULATOR 固定 DECIMAL）
- `MetricRecord`：
  - 删除 `executionId`
  - 新增 `flowId: string`、`flowName: string`、`taskId: string`
- `MetricOperator`：按文档统一为 `'UPDATE'`（保留旧值以兼容渲染）

### mockData.ts
- SEED_METRICS：为 COUNTER 增加 `stepValue`（默认 1，给 `ORDER_COUNT` 设置示例 1，`REFUND_COUNT` 设置 1）；为 LATEST 增加 `valueType`（`CURR_STATUS` = STRING，`LAST_BATCH` = STRING；新增一个 Decimal 示例如"最新批次耗时"= DECIMAL 便于演示）。
- `buildRecordsAndSnapshot` 生成记录时：
  - 移除 `executionId`
  - 写入 `flowId`（如 `flow-001`…）、`flowName`（如 `订单处理流程` 等中文名，构造一个流程名池循环取）、`taskId`（如 `task-0001`…）
  - COUNTER 的 `delta` 改用 metric.stepValue（默认 1）
  - `operator` 统一写 `'UPDATE'`

### service.ts
- `CreateMetricInput` / `UpdateMetricInput` 新增 `stepValue?`、`valueType?` 字段，按类型校验：
  - COUNTER：`stepValue` 必填正整数，默认 1；`valueType` 忽略
  - LATEST：`valueType` 必填（DECIMAL/STRING），默认 DECIMAL；`stepValue` 忽略
  - ACCUMULATOR：两个字段均忽略
- `createMetric` 透传新字段；初始 snapshot 当 LATEST + STRING 时 `currentValue=''`，DECIMAL 时 `0`。
- `updateMetric` 透传 `stepValue`/`valueType`（同样在 hasRecords=true 时锁定 `valueType`，与 type/unit 同级锁）。

---

## 2. 新建/编辑表单（MetricFormModal）

- `metricType` 切换时联动显示：
  - COUNTER：显示「步进值」`Form.InputNumber`，`min=1`、`precision=0`、默认 `1`，必填
  - LATEST：显示「值类型」`Form.Select`（Decimal / String），默认 Decimal，必填
  - ACCUMULATOR：两个字段都不显示
- 字段顺序按线框：代码 → 展示名称 → 指标类型 → 步进值/值类型 → 单位 → 描述 → 可见
- 编辑且 hasRecords 时，`stepValue` 与 `valueType` 一并禁用（与 type/unit 锁定一致）
- i18n key 新增：`metricsConfig.field.stepValue`、`stepValuePlaceholder`、`stepValueRequired`、`field.valueType`、`valueType.DECIMAL`、`valueType.STRING`、`field.valueTypeRequired`（中/英两份）

---

## 3. 历史明细抽屉（MetricRecordsDrawer）

- 表格列调整为：时间 / 操作 / 增量 / 更新后值 / **流程名称**（render `flowName`，hover tooltip 显示 flowId）/ **任务 ID**（render `taskId`）
- 删除「执行 ID」列；移除 i18n `records.executionId`
- 新增 i18n：`records.flowName`、`records.taskId`
- 增量列 COUNTER 显示 `+stepValue`（直接用 record.delta，已是步进值）
- 更新后值列：LATEST + STRING 直接渲染字符串、DECIMAL 用 `toLocaleString()`

---

## 4. 业务成果看板引用确认

- 仅 `BusinessOutcomes` 列表/卡片可能读取 metric 的 `currentValue`，不涉及 record 字段变更，无需改动；但会快速 grep 确认没有引用 `executionId`。

---

## 文件改动清单

- `src/mocks/operationsMetrics/types.ts`
- `src/mocks/operationsMetrics/mockData.ts`
- `src/mocks/operationsMetrics/service.ts`
- `src/pages/Operations/MetricsConfig/components/MetricFormModal/index.tsx`
- `src/pages/Operations/MetricsConfig/components/MetricRecordsDrawer/index.tsx`
- `public/i18n/zh-CN.json`、`public/i18n/en.json`

确认后进入实现。
