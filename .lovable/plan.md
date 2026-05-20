## 背景

当前「审批流模板」和「需求方案」都允许多选适用部门，并约定「一个部门同时只能绑定一个生效模板/方案」。现在的实现是**保存时静默覆盖**——只弹一个 Toast「N 个部门已从其他模板改绑至本模板」，用户既看不到是哪些部门、原来归属哪个模板，也无法在选择时提前感知冲突。激活后另一个原本绑定该部门的模板还会继续显示「适用 N 个部门」，但运行时已经被抢走，体验割裂。

## 优化目标

让"部门抢占"这件事在**选择 → 保存 → 激活**三个时机都是显式、可见、可撤销的。

## 方案

### 1. 选择时即时提示（前置感知）

`DepartmentSelect` 在审批流 / 方案构建器里增加 `occupiedMap` 入参：

```ts
occupiedMap: Record<deptId, { ownerId: string; ownerName: string; ownerType: 'scheme' | 'flow' }>
```

- 已被其他**生效**模板占用的部门，在下拉项右侧渲染一个浅琥珀色小标签 `已绑定：xxx 模板`
- 选中后，已选区在该 Tag 右侧追加 `⚠ 将从「xxx」改绑` 的内联提示（hover Popover 显示完整说明）
- 部门未被任何模板占用时无任何额外样式，保持干净

数据来源：构建器加载时调用 `listAllBindings()` + 过滤掉当前模板自身，构造 map 传入。

### 2. 保存时显式冲突确认（替代静默覆盖）

`handleSave` 在调用 `setBindingsForTemplate / setSchemeBindingsForScheme` 前**先 dry-run**：

新增 mock 方法 `previewBindingsForTemplate(templateId, deptIds): { overridden: Array<{ deptId, deptName, prevTemplateId, prevTemplateName }> }`，不写入只计算。

- 若 `overridden.length === 0` → 直接保存，Toast 成功
- 若 `> 0` → 弹 `Modal.confirm`，标题「部门归属冲突」，内容用一个紧凑的两列表格：

  ```text
  部门              原归属               操作
  数据仓库部        数据类需求模板        将改绑到本模板
  财务部           财务审批流 v2         将改绑到本模板
  ```

  底部副文案：「确认后，原模板对这些部门的绑定将被解除」。按钮：`确认改绑` / `取消`

### 3. 激活时二次校验（防并发抢占）

`handleActivate` 在 `Modal.confirm` 的 `content` 里增加一行：

- 通过 `getActiveTemplatesBindingDepartments(deptIds, excludeId)` 检查所选部门当前在**其他已启用模板**下是否仍有归属
- 有冲突时把弹窗扩展成同样的"冲突表格 + 改绑提示"，文案改为「启用后将自动抢占以下部门的绑定」
- 没冲突时保持现在的简短确认

> 这一步处理"保存到激活之间另一个管理员把部门绑走"的边界情况，演示价值也大。

### 4. 列表页的"被抢占"状态展示

`ApprovalConfig` 和 `RequirementsScheme` 卡片底部的"适用 N 个部门"Tag，hover Popover 内：

- 每个部门名后面，如果该部门**当前实际归属已不是本模板**（即 `getBindingByDepartment(deptId) !== currentId`），追加灰色小字 `（已被「xxx」接管）` 并把该项整体置灰
- 卡片底部 Tag 文案改为 `适用 N · 生效 M`（M < N 时变琥珀色），让管理员一眼看到"我选了 5 个部门但只有 3 个真正在用我"

### 5. 文案与 i18n

新增 key：
- `requirements.binding.conflictTitle` = "部门归属冲突"
- `requirements.binding.conflictHint` = "确认后，原模板对这些部门的绑定将被解除"
- `requirements.binding.preempted` = "已被「{{name}}」接管"
- `requirements.binding.willRebind` = "将从「{{name}}」改绑"

## 技术改造点

```text
src/
├─ mocks/
│  ├─ departmentApprovalFlowBinding.ts   [+previewBindingsForTemplate, +getActiveOwnersMap]
│  └─ departmentSchemeBinding.ts          [+previewSchemeBindings, +getActiveOwnersMap]
├─ components/DepartmentSelect/index.tsx  [+occupiedMap prop, renderSelectedItem/renderOptionItem]
└─ pages/Requirements/
   ├─ ApprovalConfig/
   │  ├─ index.tsx                        [卡片 Tag: 适用 N · 生效 M + Popover 灰显被抢占项]
   │  └─ components/ApprovalFlowBuilder/  [接占用 map + dry-run + 冲突 Modal + 激活二次校验]
   └─ RequirementsScheme/
      ├─ index.tsx                        [同上卡片改造]
      └─ components/SchemeBuilder/        [同上构建器改造]
```

## 待确认

1. 冲突 Modal 的默认按钮是 `取消` 还是 `确认改绑`？倾向**默认取消**，避免误操作。
2. 列表卡片是否要把"被抢占"的部门数单独显示一个红色徽标（更醒目），还是只在 Popover 内灰显（更克制）？倾向后者。
3. 是否需要在「需求模板」和「审批流模板」之间也做冲突提示？目前两类绑定互相独立、互不冲突，**不做**。
