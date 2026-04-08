

# 协作者交互重构 — Popover 双面板设计（参考飞书文档）

## 整体方案

移除所有抽屉中的「协作者」Tab，协作者的添加和管理全部在 Popover 面板内通过面板切换完成。Popover 有两个视图：

```text
视图1（默认）— 快捷添加:
┌─────────────────────────────────────┐
│  协作者           [👤👤👤] [8人] → │  ← 点击右侧区域切换到视图2
├─────────────────────────────────────┤
│  🔍 搜索成员或部门...                │
├─────────────────────────────────────┤
│  📂 从组织架构添加                   │
└─────────────────────────────────────┘

视图2 — 管理协作者（参考飞书截图）:
┌─────────────────────────────────────┐
│  ← 管理协作者                       │  ← 点击返回视图1
├─────────────────────────────────────┤
│  所有可访问此资产的用户               │
├─────────────────────────────────────┤
│  👤 张三 [归属者]          管理者     │
│     来也科技-产品团队                 │
│  👤 李四                  编辑者 ▼   │
│     来也科技-大客户中心               │
│  🔵 数据部(继承)          观察者     │
│  ...                               │
├─────────────────────────────────────┤
│  👤+ 添加协作者                      │  ← 点击打开 CollaboratorAddModal
└─────────────────────────────────────┘
```

## 入口

`DetailDrawerWrapper` 标题栏的 `extraActions` 区域增加「分享」图标按钮，点击弹出 Popover。

## 文件变更

| 文件 | 变更 |
|------|------|
| 新建 `CollaboratorManager/CollaboratorPanel/index.tsx` | 双面板 Popover 组件：视图1（标题+头像组+搜索+组织架构入口）、视图2（返回箭头+协作者完整列表+角色管理+添加入口） |
| 新建 `CollaboratorManager/CollaboratorPanel/index.less` | 面板样式，宽度 400px，最大高度 520px，面板切换动画 |
| `DetailDrawerWrapper/index.tsx` | 新增 `collaboratorProps` 可选 prop，自动在 extraActions 前渲染分享按钮 + CollaboratorPanel |
| 11 个抽屉组件 | 移除 `<TabPane itemKey="collaborators">` 和 `CollaboratorTab` 引用；传递 `collaboratorProps` 给 `DetailDrawerWrapper`；仅剩1个 Tab 的抽屉移除 Tabs 包裹 |
| i18n 翻译文件 | 新增 `collaborator.panel.*` 相关 key（管理协作者、所有可访问用户等） |

## 技术细节

### CollaboratorPanel 组件

- **状态**：`panelView: 'quick' | 'manage'`，控制两个视图切换
- **视图1**：标题「协作者」+ 右侧 `AvatarGroup`（maxCount=3, size=24px）+ `Tag`（N人），右侧区域可点击切换到视图2。下方搜索框用于快捷添加（输入匹配 → 选中 → 角色选择 → 确认）。底部「从组织架构添加」按钮打开 `CollaboratorAddModal`
- **视图2**：参考飞书截图，顶部「← 管理协作者」返回按钮。列表为紧凑卡片式（非 Table），每行：头像 + 名称（归属者 Tag）+ 部门 + 右侧角色（可点击下拉修改）。继承协作者角色禁用并保留现有 Popover 提示交互。底部「添加协作者」入口打开 `CollaboratorAddModal`
- **数据**：复用 `getCollaborators`、`addCollaborators`、`useCollaboratorCascade` 等现有逻辑
- **角色管理**：复用 `CollaboratorRoleSelect`，保留移除确认、级联操作、MIXED 警告等交互

### DetailDrawerWrapper 新增 prop

```typescript
collaboratorProps?: {
  assetType: CollaboratorAssetType;
  assetId: string;
  context: 'development' | 'scheduling';
  canManage: boolean;
}
```

传入后在 extraActions 区域前方自动渲染 `Users` 图标按钮（Lucide），点击弹出 `CollaboratorPanel`。

### 抽屉改造规则

- 移除所有 `CollaboratorTab` 引用和协作者 TabPane
- 仅有「基本信息 + 协作者」两个 Tab 的抽屉（Queue、Parameter、File、Worker、WorkerGroup、Template），移除 Tabs 组件，直接渲染内容
- 有多个业务 Tab 的抽屉（Process、Credential、Trigger），仅移除协作者 TabPane，保留其余 Tab

