

# 资产归属部门管理 - 全量实现方案

## 概述

为系统中全部 11 种实体类型添加归属部门（owning_department_id）和归属者（owner_id）字段，包括：
- **开发中心 5 种**：流程、参数、凭据、队列、文件
- **调度中心 6 种**：机器人、机器人分组、时间触发器、队列触发器、任务模板、任务

跳过 STORY-004（数据可见性过滤）和 STORY-005（用户删除时资产转移），这两个为纯后端逻辑。

---

## 一、基础设施（共用组件和数据）

### 1.1 类型定义扩展（`src/api/index.ts`）

为所有相关的 Response 接口添加字段：
- `owning_department_id: string` — 归属部门 ID
- `owning_department_name?: string` — 归属部门名称（展示用）
- `owner_id: string` — 归属者 ID
- `owner_name?: string` — 归属者名称（展示用）

涉及接口：`LYProcessResponse`、`LYCreateProcessRequest`、参数/凭据/队列/文件的 Response 类型、`LYWorkerResponse`、WorkerGroup/TimeTrigger/QueueTrigger/TaskTemplate/Task 的 Response 类型。

### 1.2 部门选择器组件（新建 `src/components/DepartmentSelect/`）

创建可复用的部门下拉选择器组件（基于 Semi UI `TreeSelect`），数据来源复用协作者模块已有的 `mockOrgTree` 部门树结构。

- **Props**: `value`, `onChange`, `placeholder`, `required`, `disabled`
- **特性**: 支持搜索、树形展开、显示部门全路径

### 1.3 Mock 数据工具（新建 `src/mocks/departmentData.ts`）

提取并共享部门树数据，供创建表单和详情页使用。包含：
- 部门树数据（复用 `CollaboratorAddModal` 中的 `mockLaiyeOrg`）
- 部门 ID→名称映射
- Mock 当前用户信息（ID、姓名、所属部门）

### 1.4 i18n 国际化

在 `public/i18n/zh-CN.json` 和 `en.json` 的 `common` 节点添加：
```json
"owningDepartment": "归属部门",
"owner": "归属者",
"owningDepartmentPlaceholder": "请选择归属部门",
"owningDepartmentRequired": "请选择归属部门"
```

---

## 二、开发中心资产（STORY-001）

### 2.1 流程（Process）

| 改动位置 | 内容 |
|----------|------|
| `CreateProcessModal/index.tsx` | 添加归属部门 TreeSelect（必填），owner_id 自动设为当前用户（只读展示） |
| `ProcessDetailDrawer/index.tsx` | descriptionData 中增加归属部门和归属者两行（只读） |
| Mock 数据 | `generateMockLYProcessResponse` 增加 owning_department_id/name、owner_id/name 字段 |

### 2.2 参数（Parameter）

| 改动位置 | 内容 |
|----------|------|
| `CreateParameterModal/index.tsx` | 添加归属部门 TreeSelect（必填） |
| 参数详情抽屉 | 基本信息区域增加归属部门和归属者 |
| Mock 数据 | 补充归属字段 |

### 2.3 凭据（Credential）

| 改动位置 | 内容 |
|----------|------|
| `CreateCredentialModal/index.tsx` | 添加归属部门 TreeSelect（必填） |
| 凭据详情抽屉 | 基本信息区域增加归属部门和归属者 |
| Mock 数据 | 补充归属字段 |

### 2.4 队列（Queue）

| 改动位置 | 内容 |
|----------|------|
| `CreateQueueModal/index.tsx` | 添加归属部门 TreeSelect（必填） |
| 队列详情抽屉 | 基本信息区域增加归属部门和归属者 |
| Mock 数据 | 补充归属字段 |

### 2.5 文件（File）

| 改动位置 | 内容 |
|----------|------|
| `UploadFileModal/index.tsx` | 添加归属部门 TreeSelect（必填） |
| 文件详情抽屉 | 基本信息区域增加归属部门和归属者 |
| Mock 数据 | 补充归属字段 |

---

## 三、调度中心实体（STORY-002）

### 3.1 机器人（Worker） — 手动选择归属部门

| 改动位置 | 内容 |
|----------|------|
| `CreateWorkerModal/index.tsx` | 基本信息 section 添加归属部门 TreeSelect（必填，无默认值） |
| `WorkerDetailDrawer/index.tsx` | basicInfoData 增加归属部门和归属者 |
| Mock 数据 | `mockResponse` 补充归属字段 |

### 3.2 机器人分组（WorkerGroup） — 手动选择归属部门

| 改动位置 | 内容 |
|----------|------|
| `CreateWorkerGroupModal/index.tsx` | 添加归属部门 TreeSelect（必填） |
| `WorkerGroupDetailDrawer/index.tsx` | basicInfoData 增加归属部门和归属者 |
| Mock 数据 | 补充归属字段 |

### 3.3 时间触发器（TimeTrigger） — 自动继承流程归属

| 改动位置 | 内容 |
|----------|------|
| `CreateTimeTriggerModal/index.tsx` | 选择流程后自动显示归属部门（只读），从流程继承 |
| `TimeTriggerDetailDrawer/index.tsx` | 增加归属部门和归属者 |
| Mock 数据 | 补充归属字段 |

### 3.4 队列触发器（QueueTrigger） — 自动继承流程归属

| 改动位置 | 内容 |
|----------|------|
| `CreateQueueTriggerModal/index.tsx` | 选择流程后自动显示归属部门（只读），从流程继承 |
| `QueueTriggerDetailDrawer/index.tsx` | 增加归属部门和归属者 |
| Mock 数据 | 补充归属字段 |

### 3.5 任务模板（TaskTemplate） — 自动继承流程归属

| 改动位置 | 内容 |
|----------|------|
| `CreateTemplateModal/index.tsx` | 选择流程后自动显示归属部门（只读） |
| `TemplateDetailDrawer/index.tsx` | 增加归属部门和归属者 |
| Mock 数据 | 补充归属字段 |

### 3.6 任务（Task） — 自动继承流程归属

| 改动位置 | 内容 |
|----------|------|
| `CreateTaskModal/index.tsx` | 选择流程后自动显示归属部门（只读） |
| `TaskDetailDrawer/index.tsx` | 增加归属部门和归属者 |
| Mock 数据 | 补充归属字段 |

---

## 四、UI 交互规则

1. **创建表单**：
   - 归属部门为必填项，无默认值，使用 TreeSelect 展示部门树
   - 归属者自动设为当前用户，以只读文本展示（不可修改）
   - 归属部门字段位于名称/描述之后、其他业务字段之前
   
2. **详情页**：
   - 在 Descriptions 的"基本信息"区域展示"归属部门"和"归属者"（只读）
   - 归属者使用 `UserNameWithCard` 组件展示（与创建者一致）

3. **继承规则**（仅调度中心）：
   - 触发器/任务模板/任务：选择流程后自动填入流程的归属部门（只读展示）
   - 若流程无归属部门（历史数据），使用当前用户所属部门作为兜底

---

## 五、涉及文件汇总

| 类别 | 文件数 |
|------|--------|
| 类型定义 (`api/index.ts`) | 1 |
| 新组件 (`DepartmentSelect`, `departmentData`) | 2 |
| 开发中心创建弹窗 | 5（Process, Parameter, Credential, Queue, File） |
| 开发中心详情抽屉 | 5 |
| 调度中心创建弹窗 | 6（Worker, WorkerGroup, TimeTrigger, QueueTrigger, Template, Task） |
| 调度中心详情抽屉 | 6 |
| i18n 文件 | 2（zh-CN, en） |
| Mock 数据文件 | 若干（各模块内联 mock） |
| **合计约** | **~30 个文件** |

