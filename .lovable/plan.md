
## 目标
在不改动任何运行时逻辑/UI 的前提下，仅通过**文档与类型注释**明确「需求内容」与「活动记录（审计/留痕）」的边界。

## 实现方案

### 1. 在 `types.ts` 顶部新增分层注释块
在文件头部 banner 注释下补充一段「**领域边界说明**」，明确：
- **需求内容（Requirement Content）**：描述需求"是什么"的字段——基本信息、归属、表单数据、评估、成本、关联实体。
- **活动记录（Activity / Audit Trail）**：围绕需求产生的"谁在何时做了什么"——`approvals` / `approvalHistory` / `assessments` / `versions` / `historyVersions` / `ActivityRecord`，不属于需求本体，仅用于追溯与展示。

### 2. 在相关类型上补充单行注释
对以下类型/字段追加 `/** [活动记录] ... */` 标识，便于 IDE Hover 与代码检索：
- `ApprovalRecord` / `ApprovalHistoryEntry`
- `AssessmentRecord`
- `RequirementVersion` / `VersionSnapshot`
- `ActivityRecord` / `ActivityType`
- `RequirementItem` 中对应的 5 个字段（`approvals` / `approvalHistory` / `assessments` / `versions` / `historyVersions`）

### 3. 同步更新 `.lovable/plan.md`
将本次「边界澄清」记录为一节，作为后续改动（如把活动统一收敛为独立 Tab）的依据。

## 涉及文件
- `src/pages/Requirements/RequirementsWorkbench/types.ts`（仅注释，无类型变更）
- `.lovable/plan.md`（追加一节"领域边界说明"）
