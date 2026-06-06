## 目标

修复「自动化流程」页头部搜索/筛选条的样式：当前由于筛选项较多，在 1248px 视口下「新建流程」按钮被挤到下一行，整体看起来散乱、不齐整。

## 现状问题

参考截图（`ProcessManagementContent/index.tsx` 第 787-892 行）：

- 左侧 `Space` 内有 4 个控件：搜索输入框 + 归属部门 + 关联需求 + 筛选 Popover
- 右侧 `新建流程` 按钮
- 使用 `Row justify="space-between"`，但左侧总宽度过宽，按钮折行到下方
- 搜索框、筛选下拉框宽度不统一（搜索框默认宽、关联需求 240px、部门 minWidth 150 / maxWidth 600），视觉不齐
- 「筛选」按钮孤零零摆在最右，与下拉同行但缺乏分隔，显得拥挤

## 调整方案

仅做样式/排版调整，不动业务逻辑、不增删字段。

### 1. `ProcessManagementContent/index.tsx`（约 787-892 行）

- 搜索输入框宽度固定 **320px**（对齐项目「表格筛选标准」），通过 `className="process-management-search-input"` 在 less 中统一
- 归属部门下拉：固定 `width: 200px`，去掉 `minWidth/maxWidth` 的自适应区间
- 关联需求下拉：宽度由 240px 改为 **200px**，与归属部门保持一致
- 在「筛选」按钮前用 `Divider type="vertical"` 做轻分隔（高度 16px）
- `Space` 间距由默认改为 `spacing={12}`
- 整体不再依赖 `Row + justify="space-between"` 出现折行；改为：
  - 外层 flex 容器（`process-management-header-toolbar`）：`display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;`
  - 折行时按钮自动落到右下角，但 1280px 以上分辨率保证单行展示

### 2. `ProcessManagementContent/index.less`（`&-toolbar` 节）

- `.process-management-header-toolbar` 改为 flex 布局，统一 `gap: 12px`
- `.process-management-search-input { width: 320px; }`
- 给筛选区 `Select` 统一最小高度，确保与搜索框基线对齐
- `Divider.vertical` 调整 `margin: 0 4px; height: 16px;`

## 不改动

- 字段语义、过滤逻辑、状态管理
- 「筛选」Popover 内 sections 内容
- 「新建流程」按钮触发逻辑
- 调度中心的差异化展示（仍隐藏关联需求与新建按钮）

## 效果预期

单行展示：`[搜索 320] [部门 200] [关联需求 200] | [筛选] ……………… [+ 新建流程]`，间距均匀、控件宽度齐整，1248px 视口下不再折行。