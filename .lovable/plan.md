## 目标

修复任务列表（`/scheduling-center/task-execution/task-list`）筛选弹窗的四个问题：执行目标下拉超宽、目标与触发器升级为多选并集、确定后在列表上方显示「搜索条件：xxx」提示。

## 调整方案

仅改动 `src/pages/Scheduling/TaskManagement/TaskManagementPage/index.tsx`，不动其它页面与公共组件。

### 1. 执行目标布局修复（图中目标下拉超出 popover 边界）

`FilterPopover` 弹窗宽度 280px，当前「目标类型 Select 120px + 选择目标 Select 180px + Space gap」总宽超出，导致下拉超出右边界。

- 把 `executionTarget` 的 custom render 由 `<Space>` 横向改为**两个 Select 竖向堆叠**（`display: flex; flex-direction: column; gap: 8px;`），每个 Select `width: 100%`。
- 保留「目标类型」选项（机器人 / 机器人组），仍带 `showClear`。

### 2. 执行目标支持多选（并集）

- 状态：`executionTargetId: string | null` → `executionTargetIds: string[]`
- 第二个 Select 加 `multiple maxTagCount={1}`，`value={v.ids}`，`onChange` 写回 `{ type, ids: string[] }`
- `handleFilterConfirm` 写回 `setExecutionTargetIds(target?.ids ?? [])`
- `loadData` 入参由 `execution_target_id` 改为 `execution_target_ids`
- 列表过滤逻辑（约 273-281 行）：
  ```ts
  if (type && ids.length > 0) {
    filter by ids.includes(type==='WORKER_GROUP' ? item.worker_group_id : item.worker_id)
  }
  ```
- chips 区域每个目标 ID 渲染一个独立可关闭 Tag

### 3. 所属触发器支持多选（并集）

- 状态：`triggerIdFilter: string | null` → `triggerIdFilter: string[]`
- `FilterPopover` 中 `triggerId` section 由 `type: 'select'` 改为 `type: 'multiSelect'`（与其它多选项一致），`placeholder: '选择触发器（可多选）'`
- `handleFilterConfirm`：`setTriggerIdFilter((values.triggerId as string[]) || [])`
- 列表过滤（约 268-271 行）：`triggerIdFilter.includes(item.trigger_id)`
- chips：每个触发器 ID 渲染一个独立可关闭 Tag
- `loadData` 入参 `trigger_id` → `trigger_ids`，对应 `fetchTaskList` mock 入参与过滤逻辑同步改为数组

### 4. 确定后显示「搜索条件」提示

当前活动筛选 chips 已存在（1132-1165 行），但缺少统一「搜索条件：」前缀。

- 在 chips 容器最前面加一段文案 `<Text type="tertiary">搜索条件：</Text>`（仅在 chips.length > 0 时显示）
- 保留原有 chip 渲染与「清除全部」按钮

### 5. 其它

- 因 `triggerIdFilter` / `executionTargetIds` 由标量改为数组，相关 `useEffect` 依赖、`handleClearAllFilters` 清空逻辑、`fetchTaskList` mock 参数类型一并同步。
- `FilterPopover` 组件本身不改，复用其 `multiSelect` 类型。

## 不改动

- 其它筛选项语义、字段、组件
- 表格列、抽屉、批量操作
- i18n 文案结构（新增的「搜索条件：」直接写中文，符合项目文档语言偏好）
- 其它页面/组件
