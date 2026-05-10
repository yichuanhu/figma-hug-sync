## 资产市场 v1.8 改造计划（v2 — 对齐 AIEM 7 个 Story）

依据 Story 001~007（FEAT-106-SC-ASSET-MARKET）+ L1 v1.8.0 / P1-market v1.5.0 / P1-module v2.8.0 对齐 MVP（仅 WORKFLOW + KNOWLEDGE）。

---

### 1. 数据模型与 Mock 扩展（新增）

`Asset` 类型补齐"展示包装"和"上架者"字段（现 mock 缺失）：

- 新增字段：`publishedBy: string`（上架者 ID）、`displayName?: string`、`displayDesc?: string`、`coverImage?: string`、`categoryTags?: string[]`、`overview?: string`（HTML）、`videoUrl?: string`、`originUrl?: string`（仅 DEV_CENTER）。
- `MyShared/store.ts` mock 数据补齐这些字段；`creatorName/departmentName` 保持，新增 `currentUser`（Mock 常量，用于判断上架者本人 / 复用者）。
- `AssetVersion` WORKFLOW 类型增加 `isSnapshot?: boolean` 标识 📷 快照（Story 002 §6）。

### 2. 路由与导航对齐

- `App.tsx`：MVP 仅保留 `workflow`/`knowledge` Tab 与详情；`snippet`/`skill` 路由保留但子市场和详情页改为 P2 占位（`EmptyState` "敬请期待"）。
- 新增 `/sharing-center/market/:type/:id/edit-display` → 新建 `EditDisplay` 页面（Story 005 完整实现）。
- 修复历史路径残留：`SubMarketPage` / `AssetCard` 中的 `/sharing/market/...` → `/sharing-center/market/...`。

### 3. MarketHome（Story 001 + 004）

- Tab 由 5 改为 4：`ALL` / `WORKFLOW` / `KNOWLEDGE` / `MY_REUSED`。
- `ALL` 仅聚合 WORKFLOW + KNOWLEDGE。
- `MY_REUSED` Tab：
  - 数据源：`store.getMyReusedAssets()`（按 `reusedAt` DESC，仅 PUBLISHED）。
  - 共享市场页搜索 + 类型筛选（仅 workflow/knowledge），分页 12。
  - 卡片传 `reuseState='reused'` + `reusedAt`，按钮固定"已复用 ✓ + 时间"。
  - 空态：`EmptyState noData` + 文案"你尚未复用任何资产" + Button「浏览全部资产」→ 切回 ALL Tab。
- 工具栏移除"来源"筛选（MVP 1:1 映射）；保留搜索 + 排序。
- 接收 `location.state.tab`，让"查看我的复用"链接可直接切换到 `MY_REUSED`。
- 加载态：`AssetListGrid` 接收 `loading` prop，渲染 6 卡片 Skeleton（Story 007 AF3）。

### 4. AssetCard 完整重构（Story 007）

按 Story 007 §5.1 重写 Props 契约；目录结构 `AssetCard/index.tsx` + `index.less` + `types.ts`。

- 新 Props（保留向后兼容时收敛在内部 adapter）：`id/name/description/displayName/displayDesc/coverImage/categoryTags/type/source/status/version/tags/reuseCount/publishedByName/createdAt/reuseState/reusedAt/isPublishedBy/onView/onReuse/onEdit/onEditDisplay/onDelete`。
- 展示逻辑：`displayName || name`；`displayDesc || description`；`categoryTags` 有值时额外渲染一行（与现 `tags` 区分）。
- 复用按钮状态机：
  - `hidden`：`isPublishedBy === true` → 不渲染。
  - `default`：primary "复用"。
  - `loading`：primary + Spin + disabled，文案"复用中..."。
  - `reused`：disabled + 绿色样式 + ✓ + 下方小字 `reusedAt`。
- 上架者视角：渲染 `ActionDropdown`（lucide `MoreVertical`），含「编辑展示信息」「编辑内容」（仅 NATIVE）「删除」（NATIVE+DRAFT）；MVP 仅保留「编辑展示信息」可用，其他先 disabled + Tooltip "暂未开放"。
- 移除 `SourceBadge`（市场侧不展示，组件本身保留供 M2 使用）。
- 视觉：hover `transform: translateY(-4px)` + 200ms `box-shadow` 过渡。
- 卡片网格：3 列、gap 16px（沿用现 `.asset-list-grid`）。
- 封面图：有值时顶部展示，`onError` 回退默认占位渐变；为空时不渲染封面区。

### 5. 复用按钮逻辑与 Toast 分叉（Story 003）

- `MarketHome` 与 `AssetDetail` 共用 hook `useReuseAction`：
  - 状态：`Map<assetId, 'default'|'loading'|'reused'>`。
  - 初始：若 `store.hasReused(assetId)` → `reused`；若 `isOwner(assetId)` → `hidden`（由 Card 判断）。
  - 点击：`loading` → 模拟 800ms → `addReuseRecord` → `reused` + Toast。
  - 失败兜底（mock 失败概率 0% MVP，但代码保留 catch）→ 回退 `default` + `Toast.error`。
- Toast 分叉（依据 `asset.type`）：
  - WORKFLOW：`Toast.success({ content: 'JSX', duration: 6 })` 内含「前往开发中心 →」`<a>` → `window.open('/dev-center/process-development')`。
  - KNOWLEDGE：Toast 内「查看我的复用 →」→ `navigate('/sharing-center/market', { state: { tab: 'MY_REUSED' } })`。

### 6. AssetDetail 重构（Story 002）

按公共布局 + 类型差异化拆分两个子组件 `WorkflowDetail` / `KnowledgeDetail`，共用 `DetailHeader` / `DisplayInfoSection` / `MetaCollapsible`。

公共：
- 顶部 `DetailHeader`：返回 + `displayName||name` + `StatusTag(PUBLISHED)` + 操作按钮区（按类型/角色）。
- `DisplayInfoSection`（始终可见）：封面图 / 展示名 / 展示描述 / overview 富文本 / categoryTags / videoUrl（有值时 `<video>` 或占位）。
- TabPane 仅版本历史 + 复用记录（移除现在的 content Tab，内容上移到独立区块）。
- `MetaCollapsible` 默认收起：名称/描述/版本/归属部门/上架者/发布时间 + 类型差异字段。
- 移除 `SourceBadge`。
- 资产不存在或非 PUBLISHED → `EmptyState notFound` + 返回市场。
- SNIPPET/SKILL 进入 → `EmptyState` "该资产类型在 MVP 不开放，敬请期待"。

WORKFLOW：
- Header：`复用` 按钮 + `「在开发中心编辑↗」` 始终可见；上架者可见「编辑展示信息」。
- 内容区：只读 Banner「内容来自开发中心，只读」+ Descriptions + 「在开发中心编辑↗」按钮（`originUrl` 为空时 disabled + Tooltip "源地址不可用"）。
- 版本历史：列 `version` / `聚合引用时间` / `📷 快照` 标识；不显示 changeLog。
- 元信息含 `资源依赖`（mock 给字符串数组）。

KNOWLEDGE：
- Header：`复用` + `打包下载`（任意角色，MVP `Toast.success "已生成 ZIP（mock）"`）；上架者额外「编辑」+「编辑展示信息」。
- 内容区：富文本 `dangerouslySetInnerHTML` + 附件下载列表（无附件不渲染附件区）。
- 版本历史：列 `version` / `changeLog` / `上架者` / `时间`。
- 元信息含 `标签`，`上架者本人`时显示 ✅ 可编辑提示。

### 7. EditDisplay 页面（Story 005）

- 路由 `/sharing-center/market/:type/:id/edit-display`，新文件 `src/pages/Sharing/Market/EditDisplay/{index.tsx, index.less}`。
- 顶部：返回 + 标题 `编辑展示信息 - {name}`。
- Form（Semi UI 原生 validation，trigger=blur+change）按 Story 005 §5.1 字段：
  - `coverImage`（Input + URL 校验）
  - `displayName *` Input（max 100；预填 `displayName||name`）
  - `displayDesc` TextArea（max 500）
  - `categoryTags` `TagInput`（每标签 max 20 字符，最多 10）
  - `overview` TextArea（max 10000，MVP 用 textarea 占位富文本编辑器）
  - `videoUrl` Input + URL 校验
- 底部 Banner 提示「编辑展示信息不会创建新版本，不会触发审批」 + 「取消」「保存」按钮。
- 保存：调用 `store.updateDisplayInfo(id, payload)` → 不创建版本、不改 reuseCount → `navigate(-1)` 返回详情页 → `useSyncExternalStore` 自动刷新。
- 权限守卫：非上架者本人或非 PUBLISHED → 直接 `Navigate` 回详情页 + `Toast.warning`。

### 8. Store 扩展（`SharingCenter/MyShared/store.ts`）

新增导出：
- `currentUser: { id, name }` 常量（Mock）。
- `addReuseRecord(assetId)`：写入 `ReuseRecord{ reuserName: currentUser.name, reuseType: 'DIRECT', reusedAt }`，`reuseCount++`，幂等（已存在则直接返回旧记录）。
- `hasReused(assetId): boolean`。
- `isOwner(assetId): boolean`（基于 `publishedBy === currentUser.id`，mock 数据中至少 1-2 条设为本人）。
- `getMyReusedAssets(): Array<Asset & { reusedAt }>`（按 `reusedAt` DESC）。
- `updateDisplayInfo(assetId, fields)`：merge 展示包装字段，`emit()` 通知。
- 现有 `findMarketAsset`/`getMarketAssets` 保持。

### 9. i18n & 文档清理

- `public/i18n/{zh-CN,en}.json` 新增/调整：
  - `sharing.market.tabs.MY_REUSED` / `sharing.market.empty.myReused` / `sharing.market.empty.myReusedAction`
  - `sharing.market.action.reused/reusing/reusedAt`
  - `sharing.market.toast.workflowReused.{content,link}` / `sharing.market.toast.knowledgeReused.{content,link}` / `sharing.market.toast.reuseFailed`
  - 详情页：`openInDevCenter` / `openInDevCenterDisabled` / `downloadZip` / `downloadZipMockToast` / `editDisplay` / `editAsset` / `metaCollapsible` / `snapshot` / `mvpUnavailable`
  - 编辑展示信息页：`editDisplay.title/cover/displayName/displayDesc/categoryTags/overview/videoUrl/notice/save/cancel/saveSuccess/urlInvalid`
- 移除 `MarketToolbar` 已废弃的 `source.*` UI 文案使用（保留 `sharing.common.source.*` 给供给侧 SourceBadge）。

### 10. 涉及文件清单

修改：
- `src/App.tsx`（路由 + edit-display）
- `src/pages/Sharing/Market/types.ts`（TabFilter 增 `MY_REUSED`、Asset 字段扩展）
- `src/pages/Sharing/Market/MarketHome/{index.tsx, index.less}`
- `src/pages/Sharing/Market/SubMarketPage/index.tsx`（移除来源筛选 + 修路径）
- `src/pages/Sharing/Market/components/MarketToolbar/index.tsx`（删除来源 Select）
- `src/pages/Sharing/Market/components/AssetCard/{index.tsx, index.less}`（按 §4 重写）+ 新增 `types.ts`
- `src/pages/Sharing/Market/components/AssetListGrid/index.tsx`（增 `loading` Skeleton）
- `src/pages/Sharing/Market/AssetDetail/{index.tsx, index.less}`（按 §6 拆分重构）
- `src/pages/SharingCenter/MyShared/store.ts`（按 §8 扩展 + mock 数据补字段）
- `public/i18n/{zh-CN,en}.json`

新增：
- `src/pages/Sharing/Market/hooks/useReuseAction.ts`
- `src/pages/Sharing/Market/EditDisplay/{index.tsx, index.less}`
- `src/pages/Sharing/Market/AssetDetail/components/{DetailHeader, DisplayInfoSection, MetaCollapsible, WorkflowDetail, KnowledgeDetail}/index.tsx`（拆分子组件）
- `src/pages/Sharing/Market/components/AssetCardSkeleton/index.tsx`
- `src/pages/Sharing/Market/components/MvpPlaceholder/index.tsx`（snippet/skill 占位）

### 11. 不在本次范围

- 资产上架（M2 / FEAT-107）、审批管理、流程块/技能创建编辑、技能详情。
- ZIP 真实生成、`originUrl` 真实跳转目标、APA Creator 同步知识。
- 富文本编辑器（用 TextArea 占位）、封面图真实上传（用 URL 输入占位）、并发编辑乐观锁。
- 后端 API：所有"API"操作通过 `store` 同步 mock 实现。

### 12. 验收对齐（按 Story AC）

- Story 001 AC1-9：4 Tab + 搜索 + 类型筛选 + 排序 + 12 分页 + 空态。
- Story 002 AC1-12：差异化详情 + StatusTag + 折叠元信息 + 显示字段回退 + 角色按钮。
- Story 003 AC1-9：状态机 + 防重复 + Toast 分叉 + 失败回退。
- Story 004 AC1-7：MY_REUSED Tab 排序、按钮态、空态、筛选共享。
- Story 005 AC1-9：编辑展示信息按钮可见性、预填、保存、取消、校验。
- Story 006 AC：知识下载按钮可见、Toast 反馈（MVP mock）。
- Story 007 AC：AssetCard Props/状态机/hover/Skeleton。