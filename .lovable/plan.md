## 背景

以 Remix 工程 **"Remix of APA Commander-share cent"** 的共享中心代码为准，整体替换当前实现。SkillMarket / SnippetMarket 一并删除。

## 影响面

外部仅 2 个文件引用共享中心：`src/App.tsx`、`src/components/layout/Sidebar/index.tsx`。其它业务模块（需求、开发、调度、运营、运维、个人中心、首页、任务、流程）**不受影响**。

## 执行步骤

### 1. 删除现有共享中心
- `rm -rf src/pages/Sharing`
- `rm -rf src/pages/SharingCenter`

### 2. 从 Remix 工程整目录复制
通过 `cross_project--read_project_file` 逐文件读取并 `code--write` 写入：
- `src/pages/Sharing/Market/**`（AssetDetail / EditDisplay / KnowledgeMarket / MarketHome / SubMarketPage / WorkflowMarket / components / hooks / index.less / mockData.ts / types.ts / utils.ts）
- `src/pages/SharingCenter/**`（MyShared 含 Create/Knowledge + Create/Workflow + Detail/Edit/Publish/Versions/components/hooks，Approvals/List + Detail，Admin/ApprovalLevels + Permissions，shared/）

并按需补齐 Remix 中共享中心专用的新增资源：
- `src/assets/` 下新增的 sharing 相关图片（如有）
- `src/i18n/` 下 sharing namespace（如有）
- 共享 hooks/utils/mocks（如 import 路径解析失败再补）

### 3. 更新 `src/App.tsx`
- 删除 `SnippetMarket`、`SkillMarket` import 与对应 4 条路由（`/sharing-center/market/snippet`、`/sharing-center/market/skill` 及 `/sharing/market/snippet`、`/sharing/skills/*` 重定向）
- 新增 `import WorkflowCreatePage from "@/pages/SharingCenter/MyShared/Create/Workflow"`
- 新增路由 `/sharing-center/my-published/workflow/create` 与旧路径重定向 `/sharing-center/market/workflow/create`
- 保留 `/sharing/...` -> `/sharing-center/market` 的兜底重定向
- 其它非共享中心路由（审批模板、PublishApprovals、OfflineApprovals 等）一律不动

### 4. 更新 `src/components/layout/Sidebar/index.tsx`
- 移除"代码片段市场"、"技能市场"两个子菜单项
- 对齐"我的共享"下"流程创建"入口路径到 `/sharing-center/my-published/workflow/create`
- 其它中心导航不动

### 5. 依赖校验
- 在新代码中 grep `from "@/`，确认每条 import 都能解析；缺什么就从 Remix 同路径补什么
- 跑构建，按 TS 报错逐条修复

### 6. 巡检
- 浏览器逐一访问 `/sharing-center` 下全部子路由确认无白屏

## 风险与处理

| 风险 | 处理 |
|---|---|
| Remix 内联了与当前不同的颜色/字体 | 按当前工程 token（Semi 主题 + Source Han Sans）就地调整 |
| Remix 用到的 `@/components/...` `@/contexts/...` `@/utils/...` 当前工程不存在 | 单独从 Remix 工程复制；只复制共享中心实际依赖到的文件，不动公共组件 |
| 旧书签 URL `/sharing/market/snippet` `/sharing/skills/*` | 改为重定向到 `/sharing-center/market` 兜底，不报 404 |

## 备注

记忆 `mem://features/sharing-center/unified-specification-v7`（Grid start align、56px coverColor headers）在新版可能已不适用。替换完成后我会按新版实际表现更新该记忆。
