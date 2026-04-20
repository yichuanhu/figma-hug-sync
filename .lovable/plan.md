

## 目标
新建项目时增加「关联需求」选择，根据所选需求按部门自动创建对应工作空间，实现一键完成「项目 + 工作空间 + 需求关联」三步。

## 交互设计

`ProjectFormModal`（新建模式专用，编辑模式保持原样）字段顺序：

1. 项目名称（必填，原有）
2. 项目周期（非必填，原有）
3. 描述（非必填，原有）
4. **关联需求**（新增，非必填，多选）
   - 数据源：`fetchRequirementList` 中所有「未被任何工作空间关联」的需求（即可被新项目接管的候选需求）
   - 展示：`[REQ-NO] 标题 · 部门名`，支持搜索过滤
   - 提示文案："系统将按需求所属部门自动为本项目创建对应工作空间"

### 自动建空间规则
- 提交时按所选需求的 `owning_department_id` **分组**：
  - 每个唯一部门 → 创建一个工作空间
  - 工作空间命名：`{项目名} - {部门名}工作空间`（zh）/ `{Project} - {Dept} Workspace`（en）
  - 工作空间 `departmentId` / `departmentName` = 该部门
  - 该部门下所有所选需求自动 `linkRequirements` 到该工作空间
- 提交流程（顺序）：
  1. `addProject` 创建项目，拿到 `projectId`
  2. 按部门分组循环：`addWorkspace` → 拿到 `wsId` → `linkRequirements(wsId, [需求id...])`
  3. 全部成功后 Toast 成功并刷新列表
- 任何一步失败：保留已创建数据（mock 简化），Toast 错误，不回滚

### 编辑模式
- 编辑现有项目时**不展示**「关联需求」字段（项目已有工作空间，需求关联在工作空间维度独立管理）。

## Mock 层改动（`mockData.ts`）

新增导出函数：
```ts
fetchUnlinkedRequirements(): Promise<LinkableRequirementBrief[]>
// 返回所有未被任何 workspace 的 linkedRequirementIds 包含的需求
```
（与现有 `fetchAllLinkableRequirements` 互补：后者返回「已绑定工作空间但未绑流程的」，前者返回「尚未绑定任何工作空间的」）

## 涉及文件
- `src/pages/Requirements/RequirementsProjects/mockData.ts`（新增 `fetchUnlinkedRequirements`）
- `src/pages/Requirements/RequirementsProjects/components/ProjectFormModal/index.tsx`（仅新建模式新增字段 + 提交编排）
- `src/pages/Requirements/RequirementsProjects/index.tsx`（新建成功后刷新已包含工作空间联动，无需大改）
- `public/i18n/zh-CN.json` / `en.json`（新增 key：`linkedRequirementsOptional`、`autoCreateWorkspaceTip`、`autoWorkspaceNamePattern` 等，复用 `workspaceSelect.label` 等已有词）

## 验收
- 新建项目弹窗多出「关联需求」多选框（非必填），编辑弹窗不展示该字段。
- 不勾选任何需求时：仅创建空项目（行为同现状）。
- 勾选 N 个分属 M 个部门的需求时：项目下自动出现 M 个工作空间，每个工作空间已自动关联对应部门的需求。
- 已被其它工作空间关联的需求不出现在候选列表中。
- 项目列表刷新后，工作空间数与需求数正确显示。

