## 问题

截图中的「资产上架」（/sharing-center/my-published）有两类一致性问题：

1. **布局壳缺失**：根容器只是 `.my-shared-page`，自带 `padding: 24px`，但没有项目统一的 `app-layout-content-card` 卡片壳（白色圆角 + 顶部蓝色晕影）。同目录下 `Approvals/List`、`Admin/ApprovalLevels`、`Admin/Permissions` 都使用 `app-layout-content-card`。
2. **i18n key 缺失**，导致界面直接显示原始 key：
   - `sharing.assetSupply.newAsset.entry` / `newAsset.workflowShort` / `newAsset.knowledgeShort`
   - `sharing.assetSupply.filters.status` / `filters.allStatus`
   - `sharing.assetSupply.statusOptions.draft|published|unlisted`
   - `sharing.assetSupply.col.name|status|reuseCount|updatedAt|action`

## 改动范围

仅前端表现层，不改业务逻辑、不动 store / hooks。

### 1. `src/pages/SharingCenter/MyShared/index.tsx`
- 根容器 className 改为 `my-shared-page app-layout-content-card`。

### 2. `src/pages/SharingCenter/MyShared/index.less`
- 移除 `.my-shared-page` 上重复的 `padding: 24px`、`height: 100%`（由 `app-layout-content-card` 提供）。
- 保留内部布局（header / toolbar / body / 分页）样式。

### 3. `public/i18n/zh-CN.json` 与 `public/i18n/en.json`
在 `sharing.assetSupply` 节点下补齐：
- `newAsset.entry`（"新建资产" / "New asset"）
- `newAsset.workflowShort`（"流程" / "Workflow"）
- `newAsset.knowledgeShort`（"知识" / "Knowledge"）
- `filters.status`（"状态" / "Status"）
- `filters.allStatus`（"全部" / "All"）
- `statusOptions.draft|published|unlisted`
- `col.name|status|reuseCount|updatedAt|action`

## 不在范围内

- 表格列、筛选项、抽屉、操作菜单等业务逻辑保持不变。
- 不调整审批管理 / 审批层级配置（已确认维持现状）。
