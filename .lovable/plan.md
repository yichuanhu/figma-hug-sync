

## 方案：补充归属部门 + 触发器第二步模板选择

### 问题分析

1. **归属部门缺失**：根据系统规范，任务/模板/触发器创建时，归属部门应作为只读字段，根据所选流程自动继承显示。当前所有新建弹窗（CreateTaskModal、CreateTemplateModal、CreateTimeTriggerModal、CreateQueueTriggerModal）均只有归属者（OwnerSelect），缺少归属部门展示。

2. **触发器第二步缺少模板选择**：时间触发器和队列触发器的第二步（任务配置）直接渲染 `<TaskForm>` 且不传 `preFormItem`，缺少模板选择入口。应与新建任务弹窗保持一致，包含模板选择 + 归属者。

### 改动计划

#### 1. TaskForm 组件增加归属部门只读展示

**文件**: `src/components/TaskForm/index.tsx`

- 在流程选择（`process_id`）下方增加一个只读的归属部门字段（`Form.Input` disabled）
- 当用户选择流程时，从流程数据中获取 `owning_department_name` 并自动填充
- Mock 数据中为流程添加 `owning_department_id` / `owning_department_name` 字段

**文件**: `src/components/TaskForm/types.ts`
- `LYProcessResponse` 增加 `owning_department_id` 和 `owning_department_name` 字段

**文件**: `src/components/TaskForm/hooks/useTaskFormData.ts`
- Mock 流程数据增加归属部门字段

#### 2. 触发器第二步与新建任务保持一致

**文件**: `CreateTimeTriggerModal/index.tsx` 和 `CreateQueueTriggerModal/index.tsx`

- 为第二步的 `<TaskForm>` 传入 `preFormItem`，包含：
  - 模板选择（Form.Select，与 CreateTaskModal 相同的 mockTemplates）
  - 归属者（OwnerSelect）
- 这样第二步的任务配置页面与新建任务弹窗完全一致

#### 3. i18n 补充

- 添加归属部门相关翻译 key（如有缺失）

### 改动文件清单

| 文件 | 改动 |
|------|------|
| `src/components/TaskForm/types.ts` | LYProcessResponse 增加部门字段 |
| `src/components/TaskForm/hooks/useTaskFormData.ts` | Mock 数据增加部门信息 |
| `src/components/TaskForm/index.tsx` | 流程选择后显示只读归属部门 |
| `CreateTimeTriggerModal/index.tsx` | 第二步传入 preFormItem（模板选择 + 归属者） |
| `CreateQueueTriggerModal/index.tsx` | 第二步传入 preFormItem（模板选择 + 归属者） |
| i18n 文件（如需） | 补充缺失 key |

