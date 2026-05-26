## 目标

让「审批模板」页面与系统其他列表页保持一致的布局，并把页签从顶部移到搜索框下方。

## 期望布局

```
┌─────────────────────────────────────────────────────────┐
│  审批模板                                                │
│  统一管理流程发布 / 停用审批模板…                          │
│                                                          │
│  [🔍 搜索名称 / 编码 / 描述]              [+ 新建发布审批] │
│                                                          │
│  ── 发布审批 │ 停用审批 ───────────────────────────────  │
│                                                          │
│  ┌── 模板卡片网格 ─────────────────────────────────┐    │
│  │  卡片  卡片  卡片  …                              │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

- 标题统一为「审批模板」，描述统一为「统一管理流程发布与停用审批模板，通过模板中的『适用部门』决定哪些部门的对应操作需要走审批。」
- 搜索框与新建按钮保持系统标准（搜索 320px、右上角主按钮）。新建按钮文案随 Tab 切换为「新建发布审批 / 新建停用审批」。
- Tabs 改为放在搜索行**下方**，紧贴卡片列表上方，采用 Semi `Tabs` line 样式。
- Tab 切换时仍走 URL（`/dev-center/approval-templates/publish | offline`），保证刷新与深链有效。

## 实施步骤

### 1. `src/pages/Requirements/ApprovalConfig/index.tsx`

- 新增可选 prop `tabsSlot?: React.ReactNode`。
- 在 JSX 中 `approval-config-page-header` 之后、`approval-config-page-content` 之前渲染：
  ```tsx
  {tabsSlot && <div className="approval-config-page-tabs">{tabsSlot}</div>}
  ```
- 不修改其他逻辑、不动其他业务方（需求中心）的调用方。

### 2. `src/pages/Requirements/ApprovalConfig/index.less`

- 新增 `.approval-config-page-tabs` 样式：上边距 8px、下边距 0；让 `.semi-tabs-bar` 底部边框延伸到全宽并贴近内容区。

### 3. `src/pages/Development/ApprovalTemplates/index.tsx`

- 移除顶部 Tabs 容器，直接渲染单个 `ApprovalConfigPage`：
  - `pageTitle="审批模板"`
  - `pageDescription="统一管理流程发布与停用审批模板…"`
  - `businessType` / `basePath` / `createButtonText` 仍按 activeKey 切换
  - `tabsSlot` 传入 Semi `Tabs`（line 样式，TabPane: 发布审批 / 停用审批），onChange 仍 `navigate`
- 用 `key={activeKey}` 保证切换时内部状态重置。

### 4. `src/pages/Development/ApprovalTemplates/index.less`

- 简化：仅作为透传容器，`height: 100%`，移除原先的 tabs/body 嵌套样式。

## 不改动

- 路由、侧边栏菜单、i18n 不变。
- ApprovalConfigPage 在「需求中心/审批配置」中的渲染不受影响（未传 `tabsSlot` 即原样）。
- 模板卡片、Dropdown、Modal/Toast 行为均不修改。