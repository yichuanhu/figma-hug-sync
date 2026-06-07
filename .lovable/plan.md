## 目标
将"人天"单位从字段值中移除，统一以括号形式追加到字段标签后（如"预估工时（人天）"）。

## 修改范围

### 1. `EffortTab/index.tsx`
- **标签**：5 处 `renderMetric` 的标签改为带"（人天）"后缀：
  - 预估工时 → 预估工时（人天）
  - 已登记工时 → 已登记工时（人天）
  - 剩余工时 → 剩余工时（人天）
  - 预估偏差 → 预估偏差（人天）
  - 工时进度保持不变（百分比，无单位）
- **输入框**：移除右侧 `<span className="effort-tab-unit">人天</span>`，并删除 `.effort-tab-input-wrap` 包裹
- **只读值**：移除 `${...} ${t('...unit')}`，只保留数字
- **超时 Tag / Tooltip**：内部文案保留"人天"（属于完整说明语句，不动）
- **表格"变更工时"列**：移除 `{t('...unit')}`，仅显示 `+1.5`；表头改为"变更工时（人天）"

### 2. `zh-CN.json` / `en.json`
- `estimateLabel`：预估工时 → 预估工时（人天） / Estimated Effort → Estimated Effort (person-days)
- `actualLabel`、`remainingLabel`、`varianceLabel` 同样追加 `（人天）` / `(person-days)`
- `table.delta`：变更工时 → 变更工时（人天） / Change → Change (person-days)

### 3. `EffortTab/index.less`
- 删除已无用的 `.effort-tab-input-wrap` 与 `.effort-tab-unit` 样式

不改动 EffortEntryModal（登记弹窗内输入框单位另行处理，若需也统一请告知）。
