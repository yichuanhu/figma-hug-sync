
# 共享中心 P1 第一批落地计划（骨架对齐）

依据 `sharing-center-P1-module-v1.0.0.md`，本批只做"骨架对齐"，不重构现有市场/详情/创建/编辑页。后续批次再细化。

## 范围

1. **路由迁移**：`/sharing/*` → `/sharing-center/*`，旧路径全部用 `<Navigate replace>` 兜底，外链不破坏。
2. **侧边栏重构**：共享中心分组改为 3 项：资产市场 / 我的共享 / 审批管理（带待审批数量徽标）。原 4 个子市场入口移除（通过资产市场顶部 5 Tab 进入）。
3. **新增 3 个页面**：我的共享、审批管理（双 Tab + 详情）、审批层级配置。
4. **新增 4 个共享组件**：SourceBadge、StatusTag、SemVerDialog、RejectReasonDialog（StatusTag/SemVerDialog/RejectReasonDialog 本批仅在新页面使用）。
5. **角色**：暂不做角色切换，所有按钮按管理员视角全开（按设计文档 §6.4 管理员列）。

## 路由结构（最终）

```
/sharing-center                       → Navigate 到 /sharing-center/market
/sharing-center/market                → 现 MarketHome（默认 Tab=全部）
/sharing-center/market/:type          → 现 SubMarketPage
/sharing-center/market/:type/:id      → 现 AssetDetail
/sharing-center/my-shared             → 新增（4 Tab：已发布/草稿/待审批/已拒绝）
/sharing-center/approvals             → 新增（双 Tab：待审批 / 审批历史）
/sharing-center/approvals/:id         → 新增（审批详情）
/sharing-center/admin/approval-levels → 新增（审批层级配置）

/sharing/*                            → <Navigate to="/sharing-center/*" replace>
```

## 新页面骨架要点

### 我的共享 `MySharedPage`
- 布局复用 MarketHome：标题 + Tabs（已发布/草稿/待审批/已拒绝）+ 工具栏（搜索/类型/排序）+ AssetCardGrid + Pagination。
- 数据从 `Market/mockData` 派生，按 status 过滤；新增 `creatorId === 'me'` 标识。
- 卡片操作：编辑（NATIVE）、删除（DRAFT）、查看详情。

### 审批管理 `ApprovalPage`
- Tabs：待审批（FIFO 升序，徽标显示 count）/ 审批历史（降序）。
- 工具栏：来源筛选 + 资产类型筛选 + 时间范围 + 批量通过。
- 列表用 Semi `Table` size=small，行内操作：查看 / 通过 / 拒绝（弹 RejectReasonDialog）。
- 详情页 `ApprovalDetailPage`：复用 AssetDetail 内容区 + 审批历史时间线（ApprovalTimeline 组件）+ 底部通过/拒绝按钮。

### 审批层级配置 `ApprovalLevelConfigPage`
- 4 行 Form.Select：流程块 / 流程 / 知识 / 技能；每行选项 `0级(NONE) / 1级(SINGLE)`。默认 1 级。
- 底部 [保存] 按钮，Toast 反馈，localStorage 持久化。

### 共享组件（新增）
- `src/components/sharing/SourceBadge/` — 🏠 原生 / 🔗 开发中心，semi color token。
- `src/components/sharing/StatusTag/` — 4 状态映射颜色+图标（IconClock/IconTickCircle/IconEditStroked/IconCrossCircleStroked）。
- `src/components/sharing/SemVerDialog/` — 520px Modal，递增方式（patch/minor/major）+ changeLog（5-200）。
- `src/components/sharing/RejectReasonDialog/` — 520px Modal，理由必填 TextArea。
- `src/components/sharing/ApprovalTimeline/` — 时间线展示提交/审批节点。

## 侧边栏改动

```text
共享中心
├── 资产市场     /sharing-center/market         IconShop (Lucide Store)
├── 我的共享     /sharing-center/my-shared      Lucide Share2
└── 审批管理 🔴N /sharing-center/approvals      Lucide ClipboardCheck
```

- 移除 marketWorkflow / marketKnowledge / marketSkill / marketSnippet 4 个子项（通过 Tab 进入）。
- 审批管理徽标：从 mockData 计算 `pendingCount`，>0 时显示红点+数字。
- 同步更新 i18n key：`sidebar.assetMarket / sidebar.mySharedAssets / sidebar.approvals`。

## i18n

新增命名空间：
- `sharing.myShared.*`（4 Tab 名 + 空状态）
- `sharing.approvals.*`（双 Tab、操作、拒绝弹窗、时间线、详情）
- `sharing.admin.approvalLevels.*`（标题、4 类型、级别枚举、保存提示）
- `sharing.common.source.native / source.devCenter / status.draft|pending|published|rejected`

zh-CN 与 en 同步补齐，沿用 `scripts/check-i18n-market.mjs` 模式新增 `check-i18n-sharing.mjs`（可选，本批先不强制）。

## 文件改动清单

- 编辑 `src/App.tsx`：新增 4 条路由 + 旧路径 `<Navigate>` 重定向。
- 编辑 `src/components/layout/Sidebar/index.tsx`：重构 `sharingCenterMenu` + `getSelectedKeyByPath`。
- 新增 `src/pages/SharingCenter/MyShared/{index.tsx,index.less}`。
- 新增 `src/pages/SharingCenter/Approvals/{List,Detail}/{index.tsx,index.less}`。
- 新增 `src/pages/SharingCenter/Admin/ApprovalLevels/{index.tsx,index.less}`。
- 新增 `src/components/sharing/{SourceBadge,StatusTag,SemVerDialog,RejectReasonDialog,ApprovalTimeline}/{index.tsx,index.less}`。
- 编辑 `public/i18n/zh-CN.json` 和 `public/i18n/en.json`。
- 复用 `src/pages/Sharing/Market/mockData.ts` 与 `types.ts`，按需扩展状态/创建者字段。

## 验收

- 旧链接 `/sharing/market`、`/sharing/market/knowledge` 自动跳到 `/sharing-center/...`，不报 404。
- 侧边栏共享中心展示 3 项，审批管理徽标可见。
- 新 3 个页面可访问、有数据、空状态正常、无控制台报错。
- i18n 不再出现原始 key 字符串。

## 不在本批

- `/sharing-center/market/:type/create` 和 `/:id/edit`（创建/编辑页全量重写）
- AssetDetail 改造为 Drawer + 版本历史/复用记录 Tab
- AssetCard 全面统一 SourceBadge/StatusTag（仅在新页面使用）
- 角色感知 UI、收藏功能、审批人员配置
