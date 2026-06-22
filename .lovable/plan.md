## 目标
让「流程下线」页面（`src/pages/Development/OfflineRequests/index.tsx`）的表格区域与「发布列表」（图二）保持一致。

## 改动点

### 1. 页面布局对齐 ReleaseListPage
- 标题行只保留标题与副标题，**移除** 右侧的「发起下线申请」按钮。
- 改用 `release-list-page-header-toolbar` 同款工具栏行：左侧 = 搜索框 + 筛选；右侧 = 主操作按钮「+ 发起下线申请」。
- `index.less` 同步：去掉 header 的 `justify-content: space-between` 等，改成与 `.release-list-page` 一致的「标题区 + toolbar 行」结构。

### 2. 表格新增「操作」列
- 末列追加 `操作`，宽度 60，渲染 `Dropdown` + `Ellipsis` 图标，菜单项「查看详情」（点击调用现有 `openDetail`）。
- `TableSkeleton` 的 `columns`/`columnWidths` 同步加一列；保持原有列宽比例。

### 3. 与发布列表一致的视觉细节
- 表格容器套一层 `.offline-requests-table`（`flex: 1; min-height: 0; overflow: hidden`），与 `.release-list-page-table` 对齐。
- 行选中类名沿用现有 `offline-requests-row-selected`，视觉效果与发布列表一致（`var(--semi-color-fill-1)`）。
- 翻页栏（`.list-pagination`）保持不变。

## 不改动
- 列数据、筛选、详情抽屉、深链行为、Mock 数据。
- 「发起下线申请」的交互逻辑（仍触发同一个 `setCreateVisible(true)`）。

## 验证
- 视觉对照：标题下方出现「搜索框 + 筛选 ←→ + 发起下线申请」工具栏；表格末列出现 `…` 操作按钮，点击展开「查看详情」；行间距、字号与发布列表一致。