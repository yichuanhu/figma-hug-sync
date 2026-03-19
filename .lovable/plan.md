

# 需求中心菜单还原计划

## 目标
将需求中心从"企业专属占位页"模式还原为可展开的侧边栏导航模式，使其具备与开发中心、调度中心相同的二级菜单交互。

## 需要修改的内容

### 1. 从 noExpandRoutes 中移除 `/requirements`
**文件**: `src/components/layout/AppLayout/index.tsx`
- 将 `/requirements` 从 `noExpandRoutes` 数组中移除，使侧边栏在需求中心页面可以展开显示二级菜单。

### 2. 为需求中心菜单项添加路由路径
**文件**: `src/components/layout/Sidebar/index.tsx`
- 给 `requirementsCenterMenu` 中的菜单项添加 `path` 属性：
  - `requirementsList` → `/requirements/list`（需求列表）
  - `requirementsReview` → `/requirements/review`（需求审批）
  - `teamMembers` → `/requirements/team`（团队成员）
- 在 `getSelectedKeyByPath` 中添加对应路径的匹配逻辑
- 在 `getExpandedKeysByPath` 中添加需求中心路由的展开逻辑（如需要）

### 3. 添加需求中心子页面路由
**文件**: `src/App.tsx`
- 添加需求中心子路由：
  - `/requirements/list` → 需求列表页（暂用 RequirementsWorkbench 或新建占位组件）
  - `/requirements/review` → 需求审批页
  - `/requirements/team` → 团队成员页
- `/requirements` 主路由改为重定向到 `/requirements/list`，或保留作为默认页

### 4. 创建需求中心子页面占位组件
为尚未开发的子页面创建简单占位组件，确保路由可用。

