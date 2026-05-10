## 目标

基于 STORY-001~008（FEAT-107 资产上架）需求文档，将现有「我的共享」（路由 `/sharing-center/my-shared`，表格视图）重构为「资产上架」（`/sharing-center/my-published`，卡片网格 + 5 Tab + 完整生命周期管理）。

---

## 一、术语与路由迁移

| 项目 | 现状 | 目标 |
|------|------|------|
| 菜单/页面名 | 我的共享（mySharedAssets） | 资产上架（assetSupply / myPublished） |
| 路由前缀 | `/sharing-center/my-shared` | `/sharing-center/my-published` |
| 创建/编辑/上架表单 | `/sharing-center/my-shared/...` | `/sharing-center/market/:type/create`、`/sharing-center/market/:type/:id/edit`、`/sharing-center/my-published/:type/:id/publish` |
| 视图形态 | Table | 4 列 × 3 行 卡片网格（每页 12，居右分页） |
| 文件夹 | `src/pages/SharingCenter/MyShared/` | 保持目录名，仅改 i18n 与路由（避免大面积移动） |

旧路由保留 `<Navigate>` 重定向，避免历史链接失效。

---

## 二、Tab 与卡片操作矩阵（Story 001 §6.2）

5 个 Tab，每个 Tab 显示数量徽标：
1. **已上架**（PUBLISHED ∪ ARCHIVED，已归档加"已归档"徽标）
2. **待上架**（DEV_CENTER + PENDING_PUBLISH）
3. **草稿**（NATIVE + DRAFT）
4. **待审批**（PENDING_APPROVAL）
5. **已拒绝**（REJECTED）

按钮矩阵按 source × status 渲染（Story 001 表格已明确）。

---

## 三、核心改造清单

### 1. 顶部菜单与页面壳（Story 001）
- `src/components/layout/Sidebar/index.tsx`：菜单 key/路径/i18n 改为 `assetSupply` → `/sharing-center/my-published`
- `src/App.tsx`：新增 `/sharing-center/my-published` 路由，旧路径保留 Navigate
- 路由守卫：非上架者角色重定向 `/sharing-center/market`（Story 001 R-05）

### 2. 主页（资产上架卡片网格）— `MyShared/index.tsx` 重构
- 工具栏：`[搜索320px] [类型 ▼] [+ 新建资产 ▼]`（去掉来源筛选）
- Tab 计数 + URL 同步（`?tab=&type=&search=&page=`）
- **AssetCard 网格**：复用 `src/pages/Sharing/Market/components` 已有 AssetCard，扩展供给侧 props（status 标签、操作按钮组、复用摘要行）
- 空状态文案随 Tab 切换；搜索/筛选无结果有专属文案；加载失败有重试
- 分页 12/页，居右

### 3. 卡片底部复用摘要（Story 008）
- reuseCount > 0：`复用 N 次 · 最近: 张三 · 05-09  [查看复用明细 >]`
- 点击「查看复用明细」打开 `ReuseStatsPanel`（侧边 SideSheet 900px 或 Modal）：统计行（总/本月/本周）+ 表格（姓名/部门/时间/版本）+ 时间范围筛选（全部/本月/本周）+ 分页 10/页

### 4. 创建知识页（Story 002）— 重构现有 `Create/Knowledge`
- 路由迁移到 `/sharing-center/market/knowledge/create`
- 字段：名称(2-100)、描述(10-500，必填)、分类 Select（必填，预设枚举）、标签 TagInput、富文本内容（替换现有 TextArea）、附件 Upload（PDF/DOCX/XLSX/PNG/JPG ≤10MB）
- Semi 原生 blur/change 校验，错误 < 200ms
- 「保存草稿」→ 跳 `?tab=draft`；「上架」→ PENDING_APPROVAL（首版本 1.0.0），跳 `?tab=pending_approval`
- 富文本：使用轻量第三方（`react-quill` 已经常见）或保留现有 contenteditable 简版（建议封装 `<RichTextEditor>` 共享组件）

### 5. 创建技能页（Story 003）— 重构现有 `Create/Skill`
- 路由迁移到 `/sharing-center/market/skill/create`
- 同样字段（名称/描述/分类/标签）+ 输入参数表 + 输出参数表 + 超时/重试 + 调用示例（Tabs：JSON/curl/Python）
- 复用现有参数表逻辑

### 6. 编辑 NATIVE 资产 + 发版（Story 004）— 重构现有 `Edit`
- 路由 `/sharing-center/market/:type/:id/edit`
- 知识/技能各自的编辑表单
- 「保存草稿」/「发布新版本」→ 弹 `SemverDialog`（首版固定 1.0.0；后续 PATCH 默认，可选 MINOR/MAJOR），changeLog 必填 5-200 字符
- 后续版本免审批 → PUBLISHED；首版 → PENDING_APPROVAL

### 7. DEV_CENTER 上架表单页（Story 005）— 新建 `Publish/index.tsx`
- 路由 `/sharing-center/my-published/:type/:id/publish`
- 左右两栏：
  - 左：只读元信息（名称/描述/资源依赖/版本/归属部门/来源）
  - 右：展示信息可编辑（封面 jpg/png ≤2MB、展示名称、展示描述、分类标签、概览富文本、演示视频 mp4 ≤100MB）
- 留空回退到原始 name/description
- 「提交上架」→ status=PENDING_APPROVAL，不创建 AssetVersion

### 8. 生命周期管理（Story 006）
- 4 个确认弹窗组件（归档/下架/撤回/删除），统一封装 `LifecycleConfirmDialog`
- store 已有 archiveAsset / unlistAsset / deleteAsset；新增 `withdrawAsset`（PENDING_APPROVAL → DRAFT or PENDING_PUBLISH）、`recoverAsset`（已有，对应"重新上架"）
- 已拒绝 Tab：
  - NATIVE：展开拒绝原因 + 「修改后重新提交」→ 跳编辑页
  - DEV_CENTER：展开拒绝原因 + 提示文案"请回开发中心调整"

### 9. 推送通知（Story 007）— 新建 `PushNotificationDialog`
- 双入口：已上架 Tab 卡片「推送通知」按钮 + 详情页头部按钮
- 字段：目标组织树多选（TreeSelect 父子级联）、推送标题(10-100)、推送正文(10-500)、☑ 标记为版本升级通知（自动附 changeLog）
- 底部统计「已选 N 个部门，预计覆盖 M 人」
- 24h 去重：store 维护 `pushHistory: { [assetId+versionId]: timestamp }`，重复时 Toast
- 提交后 Toast `推送已发送至 N 个部门`

### 10. 上架管理详情页（Story 008）
- 路由 `/sharing-center/my-published/:type/:id`（独立路由，不复用 `/sharing-center/market/:type/:id`）
- 复用 `Sharing/Market/AssetDetail` 作为"消费者骨架"，通过 prop `mode="supply"` 叠加供给侧扩展：
  - 头部按钮组：编辑 / 编辑展示信息 / 归档 / 下架 / 推送通知 / 在开发中心编辑↗
  - 展示信息区右上角「编辑展示信息」入口
  - 复用记录 Tab 显示完整非脱敏（姓名+部门+时间+版本）
  - 不显示「复用」按钮（BR-MARKET-008）

### 11. Store 扩展（`store.ts`）
- 新增 `withdrawAsset(id)`、`pushNotification(assetId, payload)`（含 24h 去重）、`canPushNotification(assetId, versionId): {ok, retryAfterHours}`
- `getMine` 改为按 Tab 维度查询的 `queryMyPublished({ tab, type, search, page, pageSize })`，返回 `{ list, total, tabCounts }`
- 列表范围：`publishedBy === currentUserId OR (source === DEV_CENTER && 部门权限覆盖)`

### 12. i18n
- 替换所有 `sharing.myShared.*` 为 `sharing.assetSupply.*`（保留旧 key 作为 alias 或同步翻译）
- 新增 Story 涉及文案（确认弹窗、推送通知、复用统计、上架表单字段、错误提示）
- `sidebar.mySharedAssets` → `sidebar.assetSupply`，文案"资产上架"
- 同步 `scripts/check-i18n-market.mjs`

---

## 四、技术细节

```text
src/pages/SharingCenter/MyShared/
├── index.tsx                  // 卡片网格 + 5 Tab + URL 同步
├── store.ts                   // 扩展 withdraw/push/queryMyPublished
├── Create/
│   ├── Knowledge/             // 富文本 + 附件
│   └── Skill/                 // 参数表 + 调用示例
├── Edit/                      // SemverDialog 集成
├── Publish/                   // 新增：DEV_CENTER 上架表单
├── Detail/                    // 新增：上架管理详情页（mode=supply 包装 AssetDetail）
├── Versions/                  // 保留
└── components/
    ├── AssetCard/             // 新增：供给侧扩展卡片（含复用摘要 + 操作按钮组）
    ├── AssetActionsMenu/      // 已有，按矩阵刷新
    ├── LifecycleConfirmDialog // 新增：归档/下架/撤回/删除
    ├── PushNotificationDialog // 新增：Story 007
    ├── ReuseStatsPanel        // 新增：Story 008
    ├── RichTextEditor         // 新增：富文本编辑器（共享）
    ├── PublishWorkflowModal/  // 保留（开发中心导入入口）
    ├── NewAssetDropdown/      // 已有
    └── BatchActionBar/        // 暂不删除（Story 006 注明 Out of Scope，先隐藏入口）
```

新增 `useMyPublishedQuery` hook：封装 URL 同步 + 防抖 + 列表/计数查询。

---

## 五、分阶段交付建议

执行顺序（每步可独立 PR）：

1. **基础迁移**：菜单/路由改名 + 旧路径重定向 + i18n 重命名（Story 001 框架）
2. **网格视图**：Table → AssetCard 网格 + 5 Tab + URL 同步 + 卡片操作矩阵（Story 001/006）
3. **复用摘要 + ReuseStatsPanel**（Story 008）
4. **创建/编辑富文本化**（Story 002/003/004）
5. **DEV_CENTER 上架表单页**（Story 005）
6. **推送通知**（Story 007）
7. **上架管理详情页**（Story 008 详情页部分）

---

## 六、待确认问题

1. **富文本编辑器选型**：引入 `react-quill`（轻量、约 130KB）/ `tiptap`（更现代，体积大） / 自封装 contenteditable 简版？
2. **上架管理详情页**是复用 `/sharing-center/market/:type/:id` 通过 query mode 切换，还是独立路由 `/sharing-center/my-published/:type/:id` 内部包装 `<AssetDetail mode="supply">`？后者更清晰，建议采用。
3. **批量操作**：Story 006 明确 Out of Scope，是否直接移除现有 `BatchActionBar` 与 rowSelection？建议移除以保持需求一致。
4. **组织架构树数据**：当前项目是否有现成的组织树 mock？没有则在 push dialog 里临时构造（财务部/IT 部/HR 部）。
5. **菜单命名**：「资产上架」用 i18n key `sidebar.assetSupply` 还是 `sidebar.myPublished`？建议 `assetSupply` 与文档一致。
