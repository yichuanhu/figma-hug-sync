## 目标

让「发布审批」「停用审批」两个列表页对齐「需求中心 / 需求审批」页面的体验：

1. 顶部统计卡片 + Tabs（待我审批 / 我审批过的 / 全部）+ 工具栏（搜索 / 状态筛选）
2. 详情改为右侧抽屉，支持上下条导航
3. 移除独立的详情路由页面

## 现状概览

- `src/pages/Requirements/RequirementsReview/index.tsx` 是参考模板：MetricsSection 风格统计卡 → 工具栏 → Tabs → Table → `RequirementDetailDrawer`（基于 `DetailDrawerWrapper`）。
- `PublishApprovalsPage` / `OfflineApprovalsPage` 当前使用 `Tabs(状态过滤) + Table`，「详情」按 `navigate` 跳到 `Detail/index.tsx`。
- `Detail/index.tsx` 内的 Card / Timeline / Modal 拒绝逻辑都可平移到抽屉内。
- Mock 中已通过 `approver_id === 'user-current'` 区分当前用户，可作为「我」的判定依据。

## 实施步骤

### 1. 新增 `PublishApprovalDetailDrawer` 与 `OfflineApprovalDetailDrawer`

路径：
- `src/pages/Development/PublishApprovals/components/DetailDrawer/index.tsx`（+ `.less`）
- `src/pages/Development/OfflineApprovals/components/DetailDrawer/index.tsx`（+ `.less`）

实现：
- 基于 `DetailDrawerWrapper`（项目标准 900px、maskless、含导航/全屏）。
- `title` 渲染流程名 + 版本/状态 Tag。
- 内容沿用 Detail 页面的 Card 结构：基本信息、审批流（Timeline）、输入参数 / 依赖检查快照。
- `extraActions` 渲染审批操作：
  - PublishDrawer：当 `status === 'PENDING_APPROVAL'` 且当前用户是当前级审批人 → 「通过 / 拒绝」按钮。
  - OfflineDrawer：同上，外加 `EXECUTION_FAILED` 时显示「重试执行」。
- 拒绝原因走 `Modal` + `Form.TextArea`，与现有逻辑一致。
- Props：`{ visible, onClose, data, dataList, onNavigate, pagination, onAfterAction }`。

### 2. 重写 `PublishApprovalsPage` (`src/pages/Development/PublishApprovals/index.tsx`)

参考 `RequirementsReview/index.tsx` 实现：

- **统计卡片**（4 项，复用 `.requirements-review-stats-*` 同款样式但用本页前缀）：
  - 待我审批：`status==='PENDING_APPROVAL'` 且当前级审批人为 `user-current`
  - 我审批过的：`records` 中存在 `approver_id==='user-current'`
  - 已通过：我参与的 `action==='approve'` 计数
  - 已拒绝：我参与的 `action==='reject'` 计数
  - 图标复用 `@/assets/review-stats/*` 现有素材。
- **工具栏**：`Input(搜索 320px) + FilterPopover(状态多选)`。停用页同样可加状态过滤。
- **Tabs**：`pending / reviewed / all`（`keepDOM={false}`）。
- **Table**：表头列保持现有字段；行点击 / 操作菜单（详情/通过/拒绝/重试）改为 Dropdown 风格（与需求审批一致），打开 `DetailDrawer` 而非路由跳转。
- 列表 `loadData` 一次性拉全量，本地按 Tab/搜索/筛选过滤。
- 状态变更后调用 `loadData` 并同步更新 `selectedRecord`，使抽屉刷新。

### 3. 重写 `OfflineApprovalsPage`

与发布版完全对称，差异点：
- 状态枚举包含 `APPROVED / EXECUTED / EXECUTION_FAILED`；统计卡同上口径。
- 表格列加「申请人」（`UserNameWithCard`）；抽屉中保留依赖快照渲染。
- Dropdown 菜单含「重试执行」（`EXECUTION_FAILED`）。

### 4. 删除独立详情页面与路由

- 删除文件：
  - `src/pages/Development/PublishApprovals/Detail/index.tsx`
  - `src/pages/Development/PublishApprovals/Detail/index.less`
  - `src/pages/Development/OfflineApprovals/Detail/index.tsx`
  - `src/pages/Development/OfflineApprovals/Detail/index.less`
- `src/App.tsx`：移除 `PublishApprovalDetailPage` / `OfflineApprovalDetailPage` 的 import 与 `/:id` 路由（已无入口）。

### 5. 样式

- 新增 `publish-approvals` / `offline-approvals` 页面 less，复制 `requirements-review` 的 stats / toolbar / row-selected 类即可（直接 import + 重命名 selector）。

## 不改动

- Sidebar 菜单、i18n key、ApprovalConfigPage、`processVersionApproval` / `processOfflineApproval` 的 mock 业务逻辑。
- 审批模板（合并后的）页面。
- 「需求审批」页面本身不动。