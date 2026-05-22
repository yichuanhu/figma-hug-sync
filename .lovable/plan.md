## P0 修复计划：草稿不写绑定 + DepartmentPicker 不自动级联

### 背景

故事 1 明确规则：
- `applicable_department_ids` 只保存管理员**显式选择**的部门；
- 子部门展开仅发生在**激活方案**或**保存已激活方案**时，由系统在写 `department_scheme_binding` 那一刻计算；
- 草稿 / 未激活方案绝对不能写入 `department_scheme_binding`。

当前实现违反了以上两点。

---

### 问题 1：保存草稿错误写入生效绑定表

**文件**：`src/pages/Requirements/RequirementsScheme/components/SchemeBuilder/index.tsx`

**修改 `handleSaveDraft`**：

| 模式 | 当前行为 | 修复后 |
|---|---|---|
| `isNewMode`（新建草稿） | 调用 `setSchemeBindingsForScheme(updated.id, expandedDeptIds)` | 删除该调用，仅 `updateSchemeBuilder` 写入 `applicable_department_ids: selectedDeptIds`（原始显式列表，不展开） |
| `custom_active`（已激活） | 已做冲突校验后调用 `setSchemeBindingsForScheme` | 保留；冲突校验所用的 `expandedDeptIds` 仍由保存逻辑临时计算，但不写回 `applicable_department_ids`（仍保存原始 `selectedDeptIds`） |
| `custom_inactive`（普通未激活） | 调用 `setSchemeBindingsForScheme` | 删除该调用 |
| `tenant_default` | 已不调用 | 不变 |

**激活路径**（`handleActivate` → `activateSchemeBuilder` / store 内的 `activateScheme`）保持现状：激活那一刻才 expand + 写绑定。无需修改本文件的激活逻辑，但需要确认 store 内激活时使用 `expandDepartmentIdsWithDescendants(scheme.applicable_department_ids)` 计算后写绑定（如已实现则不动）。

---

### 问题 2：DepartmentPicker 把"展开子部门"写进了显式选择

**文件**：`src/components/DepartmentPicker/index.tsx`

**`toggleNode`（约 line 131）**：移除 `getDepartmentSubtreeIds` 展开逻辑，只 toggle 当前节点本身。

```ts
const toggleNode = (node: DeptTreeNode) => {
  if (isDisabled(node.value)) return;
  const next = new Set(draft);
  if (isChecked(node.value)) next.delete(node.value);
  else next.add(node.value);
  setDraft(Array.from(next));
};
```

**`removeFromDraft`（约 line 147）**：只删除当前 id，不删除子孙。

```ts
const removeFromDraft = (id: string) => {
  setDraft(draft.filter((x) => x !== id));
};
```

**视觉提示**：保留原 Tooltip "下级部门将被同时授权"，文案改为：

> 激活方案时，所选部门的下级部门将自动包含在生效绑定中

放在弹窗左上方说明区（一行 `Typography.Text type="tertiary" size="small"`），不再用 Tooltip 包整行。

**不变**：
- `disabledOptions`（冲突禁用）逻辑不变，仍由 `computeDeptDisabledOptions` 把祖先/自身/子孙都禁用（这是冲突展示用的，与展开写入是两件事）。
- 触发器的 Tag 渲染、搜索、面包屑导航不变。

---

### 影响范围

- 抽屉 / 详情中"适用部门"展示的就是显式选择列表，长度会比之前小（之前误把子孙也算进去）。
- 列表"适用部门数量"列展示原始 `applicable_department_ids.length`，符合产品文案"已选 N 个部门"。
- 生效绑定数量（`getBoundDepartmentCountMapByScheme`）只在激活后才有值，符合预期。
- 跨方案冲突检测依然正确：`computeDeptDisabledOptions` 已基于 `getOccupiedDepartmentMapByScheme`（只统计已激活方案）。

---

### 不在本次范围

- store 内 `activateScheme` / `activateSchemeBuilder` 的展开+写绑定逻辑（已正确，不动）。
- 部门数据 mock、UI 视觉样式。
- i18n 文案补齐（延后到 v5）。

### 涉及文件

- `src/pages/Requirements/RequirementsScheme/components/SchemeBuilder/index.tsx`
- `src/components/DepartmentPicker/index.tsx`
