## 两个问题修复

### 1. 列表缺少分页

`OfflineRequests/index.tsx` 中 `pagination={false}` 但未提供外部分页条，全部数据一次性平铺。按项目分页标准（外置 `.list-pagination` 容器 + Semi `Pagination`）补齐：

- 新增 state：`currentPage`（默认 1）、`pageSize`（默认 20）。
- `filteredData` 之后按页切片为 `pagedData` 喂给 Table。
- Table 仍保持 `pagination={false}`，下方新增独立容器 `.offline-requests-pagination`（沿用全局 `.list-pagination` 样式约定），渲染 Semi `Pagination`：`total`、`pageSize`、`currentPage`、`showSizeChanger`、`showTotal`、`pageSizeOpts={[10, 20, 50, 100]}`、`onChange`/`onPageSizeChange`。
- `filteredData` 变化（搜索 / 筛选）时把 `currentPage` 重置为 1。
- 抽屉 prev/next 仍传 `filteredData`（全量过滤结果）而非 `pagedData`，避免翻页边界处导航卡住。

### 2. 详情抽屉宽度不够

参考其他承载 Tab + Timeline + 依赖列表的详情抽屉（如 `RequirementDetailDrawer` 使用 `defaultWidth={1000}`）：

- `ApplicantDetailDrawer` 的 `defaultWidth` 由 `900` 提升到 `1000`。
- `storageKey` 由 `offlineRequestApplicantDrawerWidth` 改为 `offlineRequestApplicantDrawerWidth.v2`，使历史持久化的窄宽度失效，新打开时按 1000 渲染。
- 抽屉内 Tab 容器左右补齐 padding，让 Descriptions / 依赖卡片不贴边。

## 文件清单

- `src/pages/Development/OfflineRequests/index.tsx`（分页 state、`pagedData`、底部分页条 JSX）
- `src/pages/Development/OfflineRequests/index.less`（`.offline-requests-pagination` 外置分页容器样式，对齐 `.list-pagination` 规范）
- `src/pages/Development/OfflineRequests/components/ApplicantDetailDrawer/index.tsx`（`defaultWidth=1000`、新 `storageKey`）
- `src/pages/Development/OfflineRequests/components/ApplicantDetailDrawer/index.less`（Tab 内边距微调）

## 不做的事

- 不改抽屉 Tab 结构与字段。
- 不改列表列定义与筛选逻辑。
- 不改 mock 数据。
