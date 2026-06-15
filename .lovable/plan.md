
# 新建发布页 - 发布审批范围锁定改造方案

> 对应需求：STORY-003-PA-PUBLISH-FLOW v2026-06-15 变更。在「新建发布」第一步选择流程时，按用户选择的第一个流程的发布范围锁定后续可选项；不新增"发布审批模板"高级筛选。

---

## 1. 目标与不做的事

**目标**
- 用户在 `ProcessSelectionStep` 勾选第一个流程后，左侧其他流程按"发布范围"自动锁定可选集合，不兼容的流程置灰且 hover 给出原因。
- 全选只选当前锁定范围内的流程。
- 已选清空后解除锁定，恢复全部可选。
- 不新增任何筛选器；不改后端契约（仅扩展 mock 字段以驱动前端逻辑）。

**不做**
- 不改第二步 `ReleaseConfigStep`、不改资源汇总逻辑。
- 不实现服务端二次校验（R-16），仅在前端约束 + 提交时给出一致提示，作为 mock 占位。
- 不做 E6"提交前范围变化"的实时刷新逻辑（mock 数据稳定）。

---

## 2. 范围键（Scope Key）规则

每个可发布流程根据其"最新可发布版本命中的发布审批模板"和"归属部门"派生一个 `publish_selection_scope_key`：

| 命中情况 | scope_key | 锁定后可继续选 |
|---|---|---|
| 命中模板 A（开启审批） | `template:A` | 同样命中模板 A 的流程 |
| 命中模板 A（关闭审批） | `template:A` | 同样命中模板 A 的流程 |
| 未命中任何模板 | `department:{deptId}:no-template` | 同部门、同样未命中模板的流程 |

提示文案统一：「该流程不在当前发布审批范围内，不能与当前已选流程一起发布」。

---

## 3. 视觉与交互设计

### 3.1 流程行的新增信息（左侧列表 process-item）
在流程名右侧、状态 Tag 之前增加一个"发布范围"次级标识：

- 命中模板：用 `Tag size="small" color="violet"` 显示模板名（如「财务发布审批」）。若用户无模板查看权限（mock 中可控），降级为「需审批」灰底 Tag。
- 未命中模板：用 `Tag size="small" color="grey"` 显示「无需审批 · {部门名}」。

该标签始终展示，让用户在勾选前就能预判会被哪些流程绑成一组。

### 3.2 已锁定时的禁用态
当 `selectedProcesses.length > 0`：
- 不兼容的 `process-item`：
  - 整行 `opacity: 0.45`，`cursor: not-allowed`
  - Checkbox `disabled`
  - 点击行不再触发勾选
  - 外层包 `Tooltip`：显示统一禁用文案 + 当前锁定范围描述（如「当前批次锁定为模板：财务发布审批」）
- 兼容流程保持正常态。

### 3.3 顶部"已锁定范围"提示条
在左侧面板 toolbar 下方、全选行上方新增一条浅色提示条（仅锁定时显示）：

```
🔒 本次发布范围：{模板名 / 部门名 · 无需审批}    [清空已选解除锁定]
```

- 背景 `var(--semi-color-fill-0)`，圆角 6px，padding 8px 12px
- 右侧链接按钮调用 `onSelectionChange([])`

### 3.4 全选行为
- `handleLeftCheckAll(true)`：仅追加"未选 ∩ 兼容"的流程；不会把不兼容流程加入。
- 全选 checkbox 的 `checked / indeterminate` 基于"当前列表中兼容流程"而不是全部流程，避免视觉上永远无法变成全选态。
- 全选行右侧计数改为：`{当前列表中已选}/{当前列表中兼容数}`。

### 3.5 右侧"已选流程"面板
- 顶部新增一行小字摘要：「当前发布范围：{...}」与左侧提示条一致。
- 每个已选项无需新增标识（同范围内一致）。
- 「清空全部」按钮（如已存在则文案保持；如未存在则不新增，由提示条上的链接承担）。

### 3.6 第二步的兜底
进入第二步前在 `handleNext` 中复算一遍 `scope_key` 一致性，不一致弹 Toast 拦截（对应 E5 文案）。提交时再做一次相同校验（mock R-16）。

---

## 4. 技术实现

### 4.1 类型与 mock 扩展
在 `ProcessSelectionStep/index.tsx` 内部 `ProcessWithVersions` 上扩展（不污染 `@/api`，仅 mock 层使用）：

```ts
interface ProcessWithVersions extends LYPublishableProcessResponse {
  versions: ProcessVersion[];
  owner_department_id: string;
  owner_department_name: string;
  publish_approval_template_id?: string;
  publish_approval_template_name?: string;
  publish_approval_required: boolean;
  publish_selection_scope_key: string;
}
```

`generateMockProcess` 中按 index 派生：
- 4 个部门循环（`dept-1..4` / 「财务部」「人事部」「研发部」「运营部」）
- 3 个模板：`tpl-finance`（财务部命中，开启审批）、`tpl-cross`（跨部门命中，开启审批）、`tpl-disabled`（命中但关闭审批）
- 一部分流程不命中模板
- 据此生成 `publish_selection_scope_key`

### 4.2 选择逻辑工具函数
新增 `getScopeKey(process)` 和 `getScopeLabel(process)` 纯函数，集中渲染与判断使用。

新增派生值：
```ts
const lockedScopeKey = selectedProcesses[0]
  ? getScopeKey(selectedProcesses[0].process as ProcessWithVersions)
  : null;
const isCompatible = (p) => !lockedScopeKey || getScopeKey(p) === lockedScopeKey;
```

### 4.3 修改点清单
- `ProcessSelectionStep/index.tsx`
  - mock 数据扩展（4.1）
  - 渲染流程行：插入范围 Tag、按 `isCompatible` 切换禁用态、Tooltip 文案
  - `handleLeftCheck`：不兼容时直接 return
  - `handleLeftCheckAll`：过滤 `isCompatible`
  - `currentListSelectedCount / isLeftAllChecked / isLeftIndeterminate` 基于兼容子集重算
  - 新增"已锁定范围"提示条
  - 右侧面板顶部范围摘要
- `ProcessSelectionStep/index.less`
  - `.process-item.is-disabled` 样式
  - `.scope-lock-banner` 样式
- `CreateReleasePage/index.tsx`
  - `handleNext` 增加 scope_key 一致性校验
  - `handleSubmit` 提交前再校验一次（mock R-16）
- `public/i18n/zh-CN.json` 与 `en` 对应 key
  - `release.create.scope.lockedBanner`
  - `release.create.scope.incompatibleTooltip`
  - `release.create.scope.templateTag`
  - `release.create.scope.noTemplateTag`
  - `release.create.scope.clearLock`
  - `release.create.validation.crossScopeNotAllowed`

### 4.4 i18n
按项目规范，所有新文案中英双语；中文为主。

---

## 5. 验收要点

1. 进入新建发布，左侧每个流程都展示「范围 Tag」。
2. 勾选第一个命中"财务发布审批"的流程后：
   - 顶部出现锁定提示条，文案正确。
   - 其它命中财务发布审批的流程仍可勾选；命中其它模板/无模板流程置灰；hover 显示统一文案。
   - 全选只勾选兼容流程，计数显示 `n/m`（m 为兼容数）。
3. 点击锁定条「解除锁定」清空已选，所有流程恢复可选。
4. 选「未命中模板 · A 部门」的流程后，仅同部门且未命中模板的流程可继续选；命中模板（即使关闭审批）的流程置灰。
5. 第二步「下一步」与「确认发布」均做一次 scope 校验，异常 Toast 提示对应文案。
6. 已实现的右侧已选面板顶部展示当前范围摘要。
