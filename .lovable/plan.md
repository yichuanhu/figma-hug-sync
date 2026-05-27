## 目标

将「流程详情抽屉 - 基本信息 Tab」的多个行内编辑入口收敛为**复用现有 Header 铅笔编辑按钮**，扩展 `EditProcessModal` 字段以覆盖详情中的全部可编辑项，与项目其他详情页编辑范式保持一致。

## 一、详情 Tab 改为纯只读

文件：`src/components/ProcessManagement/ProcessManagementContent/components/ProcessDetailDrawer/index.tsx`

- 移除所有行内编辑代码：
  - `editingField` / `editingValue` state 与相关 handler
  - `renderPeopleRow` / `renderLifecycleRow` 中的编辑分支（`OwnerSearchSelect`、`DatePicker`、Save/Cancel）
  - 「归属部门」铅笔按钮 + `Toast.info('即将开放')`
  - 所有字段右侧的 `Pencil` 图标按钮
- `Descriptions` 恢复纯展示形态。
- 保留：分组结构（基础信息 / 交付信息）、字段名后的 `HelpCircle` tooltip（含 Story §3.3 文案）、`UserNameWithCard` 人员展示、`formatDateTime` 时间格式化。
- 清理 import：`DatePicker`、`TextArea`、`Modal`、`OwnerSearchSelect`、`Check`、`X`、不再使用的 `Pencil`、相关 mock service 中仅供编辑使用的方法。

## 二、Header 编辑按钮

**不新增**，沿用现有 `ProcessDetailDrawer` 已有的 `onEdit` prop → 父组件 `ProcessManagementContent` 的 `handleEdit()` → 打开 `EditProcessModal`。

## 三、扩展 `EditProcessModal` 字段

文件：`src/components/ProcessManagement/ProcessManagementContent/components/EditProcessModal/index.tsx`

在现有「基础信息」字段（名称 / 部门 / 归属者 / 描述）之后，新增「交付信息」分组：

1. 开发工程师（`OwnerSearchSelect` multiple）
2. 代码审核员（`OwnerSearchSelect` multiple）
3. 开发完成时间（Semi `DatePicker` type="dateTime"）
4. 部署上线时间（Semi `DatePicker` type="dateTime"）
5. 流程下线时间（Semi `DatePicker` type="dateTime"）

- 弹窗宽度保持现状（520px）。
- 字段间距 16px，符合 mem `Modal Design Specification`。
- 分组结构遵循 mem `Form Layout Preference`（字段 >6 用分组小标题）。
- Semi 原生 validation（`trigger=['blur','change']`）。
- 打开时从 `getProcessBasicInfo` + `getProcessLifecycleLedger` 取初始值填充。

提交时：
- 流程名称 / 描述 / 部门 / 归属者 → 沿用现有 `onSuccess` 流程
- 开发工程师 / 代码审核员 → 调 `updateProcessBasicInfo`
- 三个生命周期时间 → 与原值不同的字段分别调 `adjustLifecycleMilestone`，`reason` 传固定占位 `'统一编辑'`、`backfill: true`（**不在弹窗收集修正原因**）
- 提交成功后通过 subscribe 自动刷新抽屉数据

## 四、清理

- 删除 `ProcessDetailDrawer` 对 `BasicInfoEditModal`、`LifecycleAdjustModal`（如还有 import）与相关 state、render 块的引用。
- 不删除两个 Modal 文件本身（其他地方未引用即可，由后续清理处理）。

## 五、不改动

- 抽屉 Header 结构与按钮顺序（铅笔按钮已存在）
- 其他 Tab、mock service 行为、权限 hook、i18n key
- 项目其他详情页

## 收益

- 编辑入口：详情 Tab 的 N 个行内铅笔 → 1 个 Header 铅笔（已存在）
- 与项目其他详情页编辑范式完全一致
- 改动局限：`ProcessDetailDrawer` 瘦身 + `EditProcessModal` 字段扩展
