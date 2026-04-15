

## 问题分析

### 问题1：部门筛选未纳入空状态判断
以下页面在判断空状态时未将 `departmentFilter` 纳入条件，导致选中部门筛选后无数据时仍显示"暂无数据"而非"搜索无结果"：

| 页面 | 当前条件 | 缺失 |
|------|---------|------|
| **队列管理** (`QueueManagementContent`) | `keyword \|\| filterCount`（仅含 publishedFilter） | `departmentFilter` |
| **参数管理** (`ParameterManagementContent`) | `keyword \|\| filterCount`（含 typeFilter + publishedFilter） | `departmentFilter` |
| **文件管理** (`FileManagementContent`) | `keyword \|\| sourceFilter` | `departmentFilter` |
| **流程机器人** (`WorkerManagement`) | `keyword` | `departmentFilter`、`filters`（状态/分组等） |
| **机器人分组** (`WorkerGroupManagement`) | `keyword` | `departmentFilter` |

### 问题2：空数据时缺少表格框架（表头）
文件管理、任务列表、自动执行策略（TimeTriggerList、QueueTriggerList）在数据为空时，直接渲染 `EmptyState` 替代了整个 `Table`，导致表头消失。

**正确做法**：始终渲染 `Table` 组件，将 `EmptyState` 作为 `empty` prop 传入，这样表头始终可见。

需要修改的文件：
- `src/components/FileManagement/FileManagementContent/index.tsx`
- `src/pages/Scheduling/TaskManagement/TaskManagementPage/index.tsx`
- `src/pages/Scheduling/AutoExecutionPolicy/.../TimeTriggerList/index.tsx`
- `src/pages/Scheduling/AutoExecutionPolicy/.../QueueTriggerList/index.tsx`

### 问题3：分页组件位置优化
当前大多数页面使用 Table 内置的 `pagination` prop 或固定的 `scroll.y`，无法实现"内容少时跟随表格、内容多时固定底部"的效果。

**方案**：
1. 将 Table 的 `pagination` 设为 `false`，移除固定的 `scroll.y`
2. 使用独立的 `Pagination` 组件放在表格下方
3. 表格容器使用 `flex: 1; overflow: auto`，当内容不足一屏时分页紧跟表格；当内容溢出时表格区域滚动，分页固定在容器底部
4. 具体 CSS 结构：外层 flex 列布局，表格区域 `flex: 1; min-height: 0; overflow: auto`，分页区域 `flex-shrink: 0`

## 改动计划

### 步骤1：修复空状态判断条件（5个文件）
在以下文件的 EmptyState variant 判断中加入 `departmentFilter.length > 0`：
- `QueueManagementContent/index.tsx`
- `ParameterManagementContent/index.tsx`
- `FileManagementContent/index.tsx`
- `WorkerManagement/index.tsx`（加入 departmentFilter 和 filters 条件）
- `WorkerGroupManagement/index.tsx`

### 步骤2：修复空数据时保留表格框架（4个文件）
将条件渲染模式从"EmptyState 替代 Table"改为"始终渲染 Table，EmptyState 作为 empty prop"：
- `FileManagementContent/index.tsx`
- `TaskManagementPage/index.tsx`
- `TimeTriggerList/index.tsx`
- `QueueTriggerList/index.tsx`

### 步骤3：分页组件跟随/固定优化（全部列表页）
统一所有列表页的分页行为：
- Table 设置 `pagination={false}`
- 表格容器使用 `flex: 1; overflow: auto; min-height: 0`
- 独立 Pagination 组件紧跟表格容器之后，设置 `flex-shrink: 0; padding-top: 8px`
- 当数据量少（total ≤ pageSize × 2）时隐藏分页组件

涉及文件：ProcessManagement、QueueManagement、FileManagement、ParameterManagement、CredentialManagement、WorkerManagement、WorkerGroupManagement、TaskManagement、TimeTriggerList、QueueTriggerList 等所有列表页及其对应的 `.less` 文件。

