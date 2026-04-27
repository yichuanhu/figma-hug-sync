# 实施计划：待立项需求引导（方案 A — 详情抽屉内引导卡片）

## 目标
当需求 `developmentStatus = PENDING_PROJECT`（待立项）时，在需求详情抽屉的「概览」Tab 顶部展示一张高可见度引导卡片，明确告知用户后续动作，并提供两个一键入口：
1. 关联到已有项目下的工作空间（打开 `LinkRequirementsModal` 选择目标工作空间）
2. 新建项目并在创建过程中关联该需求（跳转 `/requirements/projects` 并预选当前需求）

文案（用户指定）：
> 该需求等待立项中，请将其关联到一个项目下的工作空间，以启动开发。

## 涉及文件

### 1. `src/pages/Requirements/RequirementsWorkbench/components/RequirementDetailDrawer/index.tsx`
- 在「概览」Tab 内、`CustomFieldsSection` 上方插入新的 `PendingProjectGuideCard` 组件。
- 仅当满足以下全部条件时显示：
  - `effectiveData.status === 'PENDING_PROJECT'`
  - `!isHistoryMode`
  - `findWorkspaceByRequirementId(data.id)` 返回 `null`（避免已关联仍然提示）
- 卡片 UI：
  - 使用 Semi UI `<Banner type="info" fullMode={false} closeIcon={null}>`，左侧 `Lightbulb` (Lucide) 图标。
  - 标题：`requirements.detail.pendingProject.title` → 「待立项引导」
  - 描述：`requirements.detail.pendingProject.description` → 「该需求等待立项中，请将其关联到一个项目下的工作空间，以启动开发。」
  - 两个操作按钮（`Banner` 的 `actions` 区或描述下方）：
    - 主按钮：「关联到已有工作空间」→ 打开新建的 `WorkspacePickerModal`（见下文）
    - 次按钮：「新建项目并关联」→ `navigate('/requirements/projects', { state: { openCreate: true, prefilledRequirementId: data.id } })`

### 2. 新建 `WorkspacePickerModal`（轻量包装）
- 位置：`src/pages/Requirements/RequirementsWorkbench/components/RequirementDetailDrawer/WorkspacePickerModal/index.tsx`
- 内部直接复用现有 `WorkspaceSelect` 组件（`src/components/WorkspaceSelect/index.tsx`），按需求所属部门 `departmentId` 过滤工作空间。
- 提交时调用 `linkRequirements(workspaceId, [requirement.id])`（来自 `RequirementsProjects/mockData`）。
- 成功后：
  - `Toast.success('已关联到工作空间「XXX」')`
  - 关闭 Modal
  - 调用抽屉传入的 `onRefresh?.()` 触发列表与详情刷新（`linkRequirements` 内部已通过 `transitionToDeveloping` 自动将状态推进至「开发中」）。

### 3. `src/pages/Requirements/RequirementsProjects/index.tsx`
- 读取路由 `location.state.openCreate` 与 `prefilledRequirementId`，进入页面后自动打开 `ProjectFormModal` 并把该需求 ID 作为初始 `linkedRequirementIds` 预选。
- 创建项目流程结束后，由 `ProjectFormModal` 内已有的 `linkRequirements` 完成绑定。

### 4. `src/pages/Requirements/RequirementsProjects/components/ProjectFormModal/index.tsx`
- 接收新的可选 prop `prefilledRequirementIds?: string[]`，在初始化默认工作空间时把这些 ID 作为该工作空间的 `linkedRequirementIds` 默认值并禁止取消（或仅默认勾选）。
- 不影响现有调用方（默认 undefined）。

### 5. 国际化
- `public/i18n/zh-CN.json` 与 `public/i18n/en.json` 新增：
  - `requirements.detail.pendingProject.title`
  - `requirements.detail.pendingProject.description`（中文严格采用：「该需求等待立项中，请将其关联到一个项目下的工作空间，以启动开发。」）
  - `requirements.detail.pendingProject.linkExisting` → 「关联到已有工作空间」
  - `requirements.detail.pendingProject.createProject` → 「新建项目并关联」
  - `requirements.detail.pendingProject.linkSuccess` → 「已关联到工作空间「{{name}}」」
  - `requirements.detail.pendingProject.modalTitle` → 「关联到工作空间」

## 不变更内容
- 列表页（`RequirementsWorkbench/index.tsx`）维持当前形态（用户上一轮要求列表只展示系统字段）。状态列已带「待立项」Tag，足以作为视觉信号；本方案专注抽屉内引导。
- 现有审批/评估流程、状态推进逻辑均不变。
- 其它状态下不展示该卡片。

## 验证点
1. 打开一条状态为「待立项」的需求 → 概览顶部出现引导卡片，文案与上文一致。
2. 点击「关联到已有工作空间」→ 弹出选择器，选定后 Toast 提示成功，抽屉刷新，状态推进为「开发中」，卡片消失。
3. 点击「新建项目并关联」→ 跳转项目页并自动弹出新建项目弹窗，工作空间默认关联当前需求。
4. 已关联工作空间或非待立项状态的需求不展示该卡片。
5. TypeScript 类型检查通过。
