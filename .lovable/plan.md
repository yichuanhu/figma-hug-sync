## 目标

让 `/sharing-center/my-published`（资产上架）的页面骨架完全沿用站内「自动化流程」页（`src/components/ProcessManagement/ProcessManagementContent`）的标准布局，做到视觉一致。只动表现层与列结构，不改 store / hooks / 抽屉等业务逻辑。

## 当前差异（对照站内 ProcessManagement）

1. **页头结构**：站内是「标题 + 副标题」一组，新建按钮在第二行 toolbar 右侧；当前页是「标题 + 新建按钮」同行，缺副标题。
2. **Toolbar 形态**：站内是 `header-toolbar`（filters 区 + 右侧主按钮 + divider 分组）；当前页是独立一行 `my-shared-toolbar`，新建按钮还在顶部。
3. **筛选器**：站内用 `FilterPopover` 收纳"状态/系统/开发者"等次要筛选；当前页把"状态"做成了 insetLabel 多选。
4. **表格列**：站内有独立「描述」列；当前页把描述塞在名称下方，且"复用次数"列过窄导致表头表面看像 raw i18n key（实际上是窄列换行）。
5. **分页**：站内 `.list-pagination` 是「左侧 显示第 X-Y 条，共 N」+「右侧 总页数 + Pagination(showSizeChanger)」；当前页是右对齐居中 Pagination。
6. **状态标签**：站内是简单 `Tag`（色块 + 文案，无图标）；当前页是带图标的 `StatusTag`。

## 改动范围

仅前端表现层。store、hooks、抽屉、操作菜单、i18n 业务 key 不动。

### 1. `src/pages/SharingCenter/MyShared/index.tsx`

- 根容器 className 改为 `my-shared-page app-layout-content-card`（已是）。
- 新增页头两层结构：
  - `my-shared-header > my-shared-header-title`：`Title heading={3}` + `Text type="tertiary"` 副标题（新 i18n key `sharing.assetSupply.pageSubtitle`）。
  - `my-shared-header > my-shared-header-toolbar`：左侧 filters 区（搜索 320px + 类型 Select 200px + `FilterPopover` 收纳状态），右侧「新建资产」Dropdown 按钮。
- 移除现有独立的 `my-shared-toolbar` 行。
- 表格列重排为：**名称（不含描述）/ 描述 / 状态 / 复用次数 / 更新时间 / 操作**；列宽参考站内 ProcessManagement（描述列 ellipsis showTooltip）。
- 状态列改用原生 `Tag`（颜色映射：DRAFT 灰、PUBLISHED 绿、UNLISTED 默认），不再用 `StatusTag` 图标版（保留组件本身，仅本页改）。
- 分页区按站内 `.list-pagination` 双段式结构改写：左 `common.showingRecords` + 右 `common.totalPages` & `Pagination showSizeChanger`，复用 i18n 公共 key。

### 2. `src/pages/SharingCenter/MyShared/index.less`

- 删除 `.my-shared-toolbar` 单独行样式，新增 `.my-shared-header-title` / `.my-shared-header-toolbar` / `.my-shared-header-toolbar-filters` / `.my-shared-header-toolbar-divider`，规则照搬 `process-management-header` 系列（保持视觉一致）。
- 表格 hover/selected 行样式与站内对齐（`.my-shared-row-selected`）。

### 3. `public/i18n/zh-CN.json` & `public/i18n/en.json`

在 `sharing.assetSupply` 节点下补：

- `pageSubtitle`：「上架、维护与下架可被他人复用的资产」/ "Manage assets you've shared for reuse"
- `col.description`：「描述」/ "Description"
- `filters.moreFilter`：（如需独立标签）

公共 `common.showingRecords` / `common.totalPages` 已存在，直接复用。

## 不在范围内

- 业务字段、store、hooks、抽屉、操作菜单逻辑。
- 「审批管理」「审批层级配置」两页（之前已确认维持现状）。
- 站内 `ProcessManagementContent` 本身不动。

## 验收

- 页头视觉与 `/development/process` 一致（标题 + 副标题 + 第二行 toolbar）。
- Toolbar 右侧「新建资产」按钮在 filters 同一行。
- 表格出现独立「描述」列；状态为简洁色块；底部分页为站内双段式。
