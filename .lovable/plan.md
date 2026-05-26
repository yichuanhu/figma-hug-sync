## 目标

将开发中心侧边栏的「发布审批模板」「停用审批模板」两个菜单合并为一个「审批模板」菜单，进入后用 Tabs 切换两种业务类型。

## 路由结构

新增父路由 `/dev-center/approval-templates`，下分两个子路径用作 Tab：

- `/dev-center/approval-templates/publish` → 发布审批
- `/dev-center/approval-templates/offline` → 停用审批

Builder / Detail 路由同步迁移到新前缀：

- `/dev-center/approval-templates/publish/builder/:id`
- `/dev-center/approval-templates/publish/detail/:id`
- `/dev-center/approval-templates/offline/builder/:id`
- `/dev-center/approval-templates/offline/detail/:id`

旧路径 `/dev-center/publish-approval-templates/*`、`/dev-center/offline-approval-templates/*` 重定向到对应新路径，保证已发出的链接不失效。

## 实施步骤

### 1. 新增 `src/pages/Development/ApprovalTemplates/index.tsx`

- 读取 pathname，判断当前 tab（默认 `publish`）。
- 顶部用 Semi `Tabs`（line 类型）渲染「发布审批 / 停用审批」，切换时 `navigate('/dev-center/approval-templates/{tab}')`。
- 下方根据 tab 渲染既有 `ApprovalConfigPage`，传入对应 `businessType` 与 `basePath`（即 `/dev-center/approval-templates/{tab}`）。
- Less 中处理 24px 全局边距与 flex 填充，使内部页面正常滚动。

### 2. `src/App.tsx`

- 删除旧的 6 条 `publish-approval-templates` / `offline-approval-templates` 路由。
- 新增：
  - `/dev-center/approval-templates` → 重定向至 `/dev-center/approval-templates/publish`
  - `/dev-center/approval-templates/publish` 和 `/.../offline` → 新 `ApprovalTemplatesPage`
  - `/dev-center/approval-templates/publish/builder/:id`、`/.../detail/:id` → `ApprovalFlowBuilderPage`（`businessType="PROCESS_PUBLISH"`、`basePath="/dev-center/approval-templates/publish"`）
  - 对应的 offline builder/detail 路由
- 兼容：`/dev-center/publish-approval-templates/*` 重定向 `/dev-center/approval-templates/publish`；`/dev-center/offline-approval-templates/*` 重定向 `/dev-center/approval-templates/offline`。

### 3. `src/components/layout/Sidebar/index.tsx`

- 删除 `publishApprovalTemplates` 与 `offlineApprovalTemplates` 两项。
- 在「发布管理」分组靠后位置（紧随 `offlineApprovals` 之后）新增单项 `approvalTemplates`：`labelKey='sidebar.approvalTemplates'`、icon `Columns3Cog`、path `/dev-center/approval-templates/publish`。
- 调整高亮逻辑（约 388–400 行）：把两个 `startsWith` 分支合并，只要 `pathname.startsWith('/dev-center/approval-templates')` 或旧前缀 `publish-approval-templates`/`offline-approval-templates` 命中即高亮 `approvalTemplates`。

### 4. i18n

- `public/i18n/zh-CN.json`：新增 `sidebar.approvalTemplates: '审批模板'`；保留旧两 key 以免他处引用报错。
- `public/i18n/en.json`：`sidebar.approvalTemplates: 'Approval Templates'`。

### 5. 验证

- 侧边栏只剩一个「审批模板」菜单，点击进入默认显示「发布审批」Tab。
- 切换至「停用审批」Tab，列表与新建按钮文案均切换。
- 在任一 Tab 下点击模板进入 builder / detail 页，「返回」回到对应 Tab，URL 路径正确。
- 旧链接（如收藏夹）访问 `/dev-center/publish-approval-templates` 自动跳到新地址。

## 不改动

- `ApprovalConfigPage` 与 `ApprovalFlowBuilderPage` 的内部逻辑、文案、mock 数据均不变，仅通过 props 复用。
- 「发布审批」「停用审批」（审批申请列表）两个菜单与详情页不变。