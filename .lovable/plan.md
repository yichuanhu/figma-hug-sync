

# 归属部门/归属者字段实现 — 差距分析与补充计划

## 当前实现状态总结

根据两份需求文档（STORY-001 开发中心、STORY-002 调度中心）对照现有代码，**大部分核心功能已实现**。以下是已完成和待补充的对比。

### 已完成

| 需求项 | 状态 |
|--------|------|
| 所有创建弹窗包含 DepartmentSelect + 归属者只读展示 | ✅ 流程、参数、凭据、队列、文件、机器人、机器人分组 |
| 所有详情页展示归属部门和归属者 | ✅ 全部 11 种实体类型 |
| 表格增加归属部门列 | ✅ |
| 归属部门筛选 | ✅ |
| 需求中心字段统一为 owning_department_name | ✅ |

---

### 待补充/优化项

#### 1. 归属者在部分详情页未使用 UserNameWithCard

**问题**: 需求文档要求展示"用户姓名"，部分详情页只用了 `owner_name || '-'` 纯文本，而开发中心的5个详情页已统一使用 `UserNameWithCard` 组件。

| 页面 | 当前实现 | 需求要求 |
|------|---------|---------|
| 机器人详情 | `workerData.owner_name \|\| '-'` (纯文本) | 应使用 UserNameWithCard |
| 机器人分组详情 | `groupData.owner_name \|\| '-'` (纯文本) | 应使用 UserNameWithCard |
| 任务详情 | `task.owner_name \|\| '-'` (纯文本) | 应使用 UserNameWithCard |
| 任务模板详情 | `template.owner_name \|\| '-'` (纯文本) | 应使用 UserNameWithCard |
| 时间触发器详情 | `trigger.owner_name \|\| '-'` (纯文本) | 应使用 UserNameWithCard |
| 队列触发器详情 | `trigger.owner_name \|\| '-'` (纯文本) | 应使用 UserNameWithCard |

**修改**: 6个文件，将归属者字段统一改为 `<UserNameWithCard name={xxx.owner_name} userId={xxx.owner_id || ''} />`。

#### 2. 需求表单归属部门 label 未统一

**问题**: RequirementFormModal 中部门字段的 label 仍使用 `requirements.fields.department`，而非全局统一的 `common.owningDepartment`。

**修改**: 1个文件，将 label 改为 `t('common.owningDepartment')`。

#### 3. 创建弹窗中归属部门缺少必填校验反馈

**问题**: 需求文档（AC-FUNC-09、AC-ERR-01等）要求：用户未选择归属部门点击"创建"时，前端显示"请选择归属部门"错误提示。目前只有开发中心的 CreateProcessModal 有 `Toast.warning` 校验，其他创建弹窗（参数、凭据、队列、文件、机器人、机器人分组）缺少此校验。

**修改**: 6个文件，在 handleSubmit 开头增加 `if (!owningDepartmentId)` 校验并 `Toast.warning`。

#### 4. 需求表单缺少归属者字段

**问题**: 需求文档要求创建资产时展示归属者（只读，当前用户），RequirementFormModal 中没有归属者展示。

**修改**: 1个文件，在 DepartmentSelect 下方增加归属者只读展示。

---

## 修改文件清单

| # | 文件 | 改动 |
|---|------|------|
| 1 | `src/pages/Scheduling/WorkerManagement/components/WorkerDetailDrawer/index.tsx` | owner 改用 UserNameWithCard |
| 2 | `src/pages/Scheduling/WorkerManagement/WorkerGroupManagement/components/WorkerGroupDetailDrawer/index.tsx` | 同上 |
| 3 | `src/pages/Scheduling/TaskManagement/components/TaskDetailDrawer/index.tsx` | 同上 |
| 4 | `src/pages/Scheduling/TemplateManagement/TemplateManagementPage/components/TemplateDetailDrawer/index.tsx` | 同上 |
| 5 | `src/pages/Scheduling/AutoExecutionPolicy/AutoExecutionPolicyPage/components/TimeTriggerDetailDrawer/index.tsx` | 同上 |
| 6 | `src/pages/Scheduling/AutoExecutionPolicy/AutoExecutionPolicyPage/components/QueueTriggerDetailDrawer/index.tsx` | 同上 |
| 7 | `src/pages/Requirements/RequirementsWorkbench/components/RequirementFormModal/index.tsx` | label 统一 + 增加归属者 |
| 8 | `src/components/ParameterManagement/ParameterManagementContent/components/CreateParameterModal/index.tsx` | 增加归属部门必填校验 |
| 9 | `src/components/CredentialManagement/CredentialManagementContent/components/CreateCredentialModal/index.tsx` | 同上 |
| 10 | `src/components/QueueManagement/QueueManagementContent/components/CreateQueueModal/index.tsx` | 同上 |
| 11 | `src/components/FileManagement/FileManagementContent/components/UploadFileModal/index.tsx` | 同上 |
| 12 | `src/pages/Scheduling/WorkerManagement/components/CreateWorkerModal/index.tsx` | 同上 |
| 13 | `src/pages/Scheduling/WorkerManagement/WorkerGroupManagement/components/CreateWorkerGroupModal/index.tsx` | 同上 |

共 13 个文件，改动量较小，每个文件 1-3 行改动。

