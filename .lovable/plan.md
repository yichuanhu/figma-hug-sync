

## 探索与理解

用户上传了 5 个 Story 文档，构成 `FEAT-009 项目与工作空间数据权限管理`：

- **STORY-001 项目管理**：在需求中心新增「项目与工作空间」菜单，提供项目 CRUD，状态自动聚合
- **STORY-002 工作空间管理**：项目下创建工作空间（关联部门 N:1），并作为 requirement↔workspace 关联的唯一写入口
- **STORY-003 工作空间成员管理**：MANAGER/MEMBER 角色，部门管理员自动继承不显示
- **STORY-005 资产创建归属**：流程/参数/凭据等创建时选择 workspace，流程必须绑定同 workspace 下的 requirement

## 现状对照

我已查看现有侧边栏、需求中心结构与 mem 标准。当前需求中心仅有「需求工作台 / 需求审批 / 需求评估 / 方案管理 / 团队成员」，缺少「项目与工作空间」入口；现有 requirement 也无 `projectId/workspaceId` 字段；流程/资产创建无 workspace 选择。

为控制单次提交体量并对齐既有交付节奏（mem: development-scope 严格按需），本次仅落地**Story-001 + Story-002 的核心管理界面 + 需求只读关联展示**，把 Story-003 成员管理、Story-005 资产创建归属拆为后续迭代。

## 实施方案（单次提交）

### 1. 侧边栏新增入口
`src/components/layout/Sidebar/index.tsx`：在「需求中心」分组下新增子项「项目与工作空间」（Lucide `FolderKanban` 图标），路由 `/requirements/projects`。

### 2. Mock 数据与类型
新增 `src/pages/Requirements/RequirementsProjects/mockData.ts`：
- `Project`：id / name / startDate / endDate / description / aggregatedStatus（EMPTY / IN_PROGRESS / DEVELOPING / COMPLETED）/ workspaceCount / requirementCount / createdAt
- `Workspace`：id / projectId / name / departmentId / departmentName / description / memberCount / linkedRequirementIds / hasPublishedProcess / createdAt
- 内置 3 个项目、5 个工作空间，覆盖各聚合状态
- 暴露 `addProject / updateProject / deleteProject / addWorkspace / updateWorkspace / deleteWorkspace / linkRequirements / unlinkRequirement` 等 mock API

### 3. 项目列表页 `RequirementsProjects/index.tsx`
- 标准页头（`Typography.Title heading={3}` + 「创建项目」按钮）
- 320px 搜索框 + 状态筛选（FilterPopover）
- Table（size="small"）列：项目名 / 起止时间 / 聚合状态（彩色 Tag）/ 工作空间数 / 需求数 / 创建时间 / 操作（详情 / 编辑 / 删除）
- 删除前校验：有工作空间则禁止并 Toast 提示
- 创建/编辑用 520px FormModal（名称、起止日期、描述 ≤2000）

### 4. 项目详情抽屉 `ProjectDetailDrawer/`
- 900px DetailDrawerWrapper（mem: drawer/unified-standard-v1）
- 概览：项目元信息 + 需求统计聚合
- 工作空间 Tab：表格列出该项目下工作空间，行操作「管理需求关联 / 编辑 / 删除」，顶部「创建工作空间」
- 删除工作空间前校验是否有资产/已发布流程

### 5. 工作空间创建/编辑弹窗 `WorkspaceFormModal/`
- 520px Modal，字段：名称、关联部门（DepartmentSelect 单选必填）、描述
- 同项目下名称唯一性校验

### 6. 需求关联管理弹窗 `LinkRequirementsModal/`
- 900px Modal（左右两列，左：可选需求池，右：已关联）
- 智能筛选：默认列出归属部门 = workspace.departmentId 的需求；提供搜索框跨部门检索
- N:1 约束：已被其他 workspace 关联的需求显示为「已关联到 XX」并禁用
- 解绑校验：若 workspace 有已发布流程则禁止解除并 Toast
- 关联结果保存到 mock `workspace.linkedRequirementIds` + 写回 `requirement.workspaceId`

### 7. 需求详情只读展示
`RequirementDetailDrawer`：在概览 Tab 顶部元信息追加「所属工作空间 / 所属项目」只读字段（点击可跳转项目详情抽屉）。**不**新增写入入口（写侧唯一在项目/工作空间管理）。

### 8. 路由 & i18n
- `src/App.tsx`：新增 `/requirements/projects` 路由
- `public/i18n/{zh-CN,en}.json`：新增 `requirements.projects.*` 节点（约 30 个键），含 4 种聚合状态、操作、校验提示

### 不在本次范围
- Story-003 工作空间成员管理（MANAGER/MEMBER + 部门继承）
- Story-005 流程/资产创建时选择 workspace、流程改绑校验
- 项目状态自动聚合的真实计算（本期写死或基于 mock 关联粗算，后续接 API）

## 影响面

| 文件 | 操作 |
|---|---|
| `src/components/layout/Sidebar/index.tsx` | 新增菜单项 |
| `src/App.tsx` | 新增路由 |
| `src/pages/Requirements/RequirementsProjects/{index.tsx,index.less,mockData.ts,types.ts}` | 新建 |
| `…/RequirementsProjects/components/{ProjectDetailDrawer,WorkspaceFormModal,LinkRequirementsModal,ProjectFormModal}/` | 新建 |
| `RequirementDetailDrawer/index.tsx` | 概览追加 workspace/project 只读字段 |
| `public/i18n/{zh-CN,en}.json` | 新增文案节点 |

## 验证清单
1. 侧边栏「需求中心」展开可见「项目与工作空间」
2. 创建项目→列表出现，状态标签正确；删除有工作空间的项目被拒
3. 项目详情抽屉「工作空间」Tab 创建/编辑/删除工作空间；同名校验生效
4. 工作空间「管理需求关联」：默认显示同部门需求；勾选保存后需求详情抽屉概览处显示对应工作空间/项目
5. 已被其他工作空间关联的需求在弹窗中禁用
6. 工作空间标记 hasPublishedProcess=true 时无法解除已关联需求

