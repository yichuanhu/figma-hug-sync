

## 目标
在 `EditProcessModal` 提交时，若「归属部门」发生变更，扫描依赖该流程的下游资源（触发器 / 任务 / 模板），弹出确认框告知"N 个下游资源将同步更新归属部门"，确认后批量更新 mock 并 Toast 提示。

## 实现方案

### 1. 新建 Mock 依赖关系数据源 `src/mocks/processDependencies.ts`
- 维护内存级可变数据：
  - `mockDependentTriggers: { id, name, process_id, owning_department_id, owning_department_name }[]`
  - `mockDependentTasks: { id, name, process_id, owning_department_id, ... }[]`
  - `mockDependentTemplates: { id, name, process_id, owning_department_id, ... }[]`
- 每类至少为 `proc-001` ~ `proc-004` 各预置 1-2 条，便于演示。
- 导出工具函数：
  - `getDependents(processId)` → `{ triggers, tasks, templates, total }`
  - `cascadeUpdateDepartment(processId, deptId, deptName)` → 同步修改三类数据并返回更新计数。

### 2. 改造 `EditProcessModal`
- 在 `handleSubmit` 中：
  1. 比较 `owningDepartmentId` 与 `processData.owning_department_id`。
  2. 若有变更：调用 `getDependents(processData.id)`，若 `total > 0`，使用 `Modal.confirm` 弹出确认框，文案：
     > 该流程被 N 个下游资源使用（触发器 X、任务 Y、模板 Z）。修改归属部门后，这些资源将同步更新归属部门，是否继续？
  3. 用户确认后：调用 `cascadeUpdateDepartment(...)`，写回 `updatedProcess.owning_department_id/name`，提交并 `Toast.success("已同步更新 N 个下游资源的归属部门")`。
  4. 用户取消则中断保存。
- 把 `owning_department_id` / `owning_department_name` 也写入 `LYUpdateProcessRequest` 与回传的 `updatedProcess`。
- 通过 `getDepartmentName` 解析部门名。

### 3. 演示路径（用户验证用）
- 进入流程开发列表，编辑任一流程（建议 `proc-001` 自动订单处理），将归属部门从 Finance Department 改为其他部门 → 提交 → 出现确认弹窗（提示该流程下挂的触发器/任务/模板数量）→ 确认 → Toast 成功。

### 4. 范围说明（不做的事）
- 不真正修改 `TaskManagementPage` 等页面里 `generateMock*` 的随机数据（它们与 `proc-001` 等 ID 无强关联），仅以 `processDependencies.ts` 这一份"已知关联"mock 演示交互。
- 不调整全局"无级联"协作者权限策略，仅针对归属部门字段做交互级演示。

## 涉及文件
- 新增 `src/mocks/processDependencies.ts`
- 修改 `src/components/ProcessManagement/ProcessManagementContent/components/EditProcessModal/index.tsx`
- i18n：在 `public/i18n/zh-CN.json` 与 `en.json` 中新增确认文案与 Toast 文案 key（`development.processDevelopment.editModal.cascadeConfirm.*`、`cascadeSuccess`）。

