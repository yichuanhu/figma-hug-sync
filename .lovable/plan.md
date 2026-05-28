## 目标

把任务列表顶部筛选区从当前 3 行压到 **一行**，且"创建时间区间"保持常驻（不收纳进筛选弹层）。

## 现状

一行需容纳：搜索 + 流程 + 任务状态 + 归属部门 + 创建时间区间 + 筛选按钮（左侧组），右侧：刷新 + 新建任务。当前用 `Space wrap` 在 847px 视口下换成 3 行，所以"不好看"。

## 调整方案

仅改 `src/pages/Scheduling/TaskManagement/TaskManagementPage/index.tsx` 与 `index.less`。

### 1. 布局结构改造
- 抛弃 `Row + Col + Space wrap` 双栏结构，改用一个单行 flex 容器 `.task-management-page-toolbar`，`display: flex; gap: 8px; align-items: center; flex-wrap: nowrap;`。
- 左侧筛选组 `.toolbar-filters`：`display: flex; gap: 8px; flex: 1; min-width: 0;`（允许整体伸缩，内部允许子项收缩）。
- 右侧操作组 `.toolbar-actions`：`flex-shrink: 0;`，放刷新 + 新建任务。

### 2. 各控件宽度调整（紧凑化以容纳一行）
- 搜索任务 ID：`flex: 1 1 200px; min-width: 160px; max-width: 280px`（自适应剩余空间）。
- 流程：`width: 132px`。
- 任务状态：`width: 120px`。
- 归属部门：`width: 140px`（保留 `useNameAsValue`、`maxTagCount={1}`）。
- 创建时间区间 `DatePicker dateTimeRange`：
  - 占位从两段中文简化为 `['开始时间', '结束时间']`。
  - 宽度 `width: 260px`，开启 `density="compact"`，确保两段时间能展示。
- 筛选按钮：保持原样（带 badge）。
- 刷新：保留图标+文字。
- 新建任务：保留主按钮。

### 3. 文本与图标层面
- 所有 Select 的 `maxTagCount={1}`，多选时只显示 1 个 + 数字 chip，避免撑宽。
- 创建时间 DatePicker 旁不再额外加 Label，依靠 placeholder 表意。
- 不引入新的下拉项目，不动 FilterPopover 内容。

### 4. 极窄视口兜底
- 当容器宽度低于阈值（约 980px）时通过 less 媒体查询：
  - 搜索框 `min-width: 120px`，让其继续收缩；
  - 时间区间 `width: 220px`；
  - 其它下拉 `width: 108px`。
- 仍优先保证一行不换行；只有在极端窄宽（<760px）时才允许 wrap 兜底。

### 5. 不改动
- FilterPopover 内的项目（执行目标 / 优先级 / 触发来源 / 触发器 / 执行状态 / 录屏 / 截图）不动。
- 活动筛选 chips 行、批量取消栏、表格、Mock 数据全部不动。
- 不新增 i18n。

## 验证

在 847px 视口下检查：搜索、流程、任务状态、归属部门、创建时间、筛选按钮、刷新、新建任务全部在同一行展示且不换行；点击日期选择能选出区间；筛选/清除全部行为与现状一致。
