

# 归属部门功能补全方案

## 缺失项汇总

以下组件在之前的实现中未添加归属部门/归属者字段：

### 创建弹窗（4个） — 调度中心继承类实体

这些实体从所选流程自动继承归属部门（只读展示）：

| 组件 | 路径 |
|------|------|
| 时间触发器 | `CreateTimeTriggerModal/index.tsx` |
| 队列触发器 | `CreateQueueTriggerModal/index.tsx` |
| 任务模板 | `CreateTemplateModal/index.tsx` |
| 任务 | `CreateTaskModal/index.tsx` |

### 详情抽屉（1个）

| 组件 | 路径 |
|------|------|
| 机器人分组 | `WorkerGroupDetailDrawer/index.tsx` |

## 改动内容

### 1. API 类型扩展（`src/api/index.ts`）

为 `LYProcessActiveVersionResponse` 添加 `owning_department_id` 和 `owning_department_name` 字段，以便触发器/模板/任务在选择流程时能获取其归属部门。

### 2. Mock 流程数据补充（4个文件）

在 `CreateTimeTriggerModal`、`CreateQueueTriggerModal`、`CreateTemplateModal`、`CreateTaskModal` 中的 `mockProcesses` 数据添加 `owning_department_id` 和 `owning_department_name` 字段。

### 3. 创建弹窗添加归属字段（4个文件）

在基本信息区域（Step 1），流程选择后方添加：
- **归属部门**：只读展示，自动从选中流程继承（`selectedProcess.owning_department_name`）
- **归属者**：只读展示当前用户（`MOCK_CURRENT_USER.name`）

当用户切换流程时，归属部门自动更新。

### 4. 机器人分组详情抽屉（1个文件）

在 `WorkerGroupDetailDrawer` 的 `basicInfoData` 中添加归属部门和归属者两行（同机器人详情抽屉一致）。

## 涉及文件（共6个）

1. `src/api/index.ts` — LYProcessActiveVersionResponse 增加归属字段
2. `src/pages/Scheduling/AutoExecutionPolicy/.../CreateTimeTriggerModal/index.tsx`
3. `src/pages/Scheduling/AutoExecutionPolicy/.../CreateQueueTriggerModal/index.tsx`
4. `src/pages/Scheduling/TemplateManagement/.../CreateTemplateModal/index.tsx`
5. `src/pages/Scheduling/TaskManagement/components/CreateTaskModal/index.tsx`
6. `src/pages/Scheduling/WorkerManagement/WorkerGroupManagement/components/WorkerGroupDetailDrawer/index.tsx`

