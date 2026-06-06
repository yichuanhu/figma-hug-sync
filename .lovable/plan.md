## 目标

在 `DepartmentSearchSelect` 公共组件中新增"包含子部门"复选框，让用户可主动将筛选范围从"当前部门"扩展为"当前部门 + 所有子部门"。默认不勾选，保持现有"只查当前部门"语义。

## 范围

- 仅在 `multiple=true`（多选筛选场景）下渲染该 Checkbox，避免破坏单选场景（表单创建/编辑）的 `string` 类型契约。
- 不修改 14 个调用方页面，它们继续以 `string[]` + `includes()` 方式过滤。

## 改动详情

### `src/components/DepartmentSearchSelect/index.tsx`

1. 新增内部 state：`includeChildren: boolean`（默认 `false`）。
2. 新增内部 state：`selectedRaw: string[]`，保存用户在下拉中的"原始选择"（用于 `Select` 的 `value` 受控绑定，使下拉里仍只显示用户勾选的部门，而非展开后的全集）。
3. 工具函数 `expandWithChildren(ids: string[]): string[]`：基于 `departmentTree` 递归收集每个所选节点及其全部后代，去重。若 `useNameAsValue=true`，输出 `label`；否则输出 `value`（与现有 `onChange` 输出口径一致）。
4. `onChange` 触发时机：
   - 用户改变下拉选择 → 更新 `selectedRaw`，按当前 `includeChildren` 计算结果并 `onChange(result)`。
   - 用户切换 Checkbox → 基于 `selectedRaw` 重新计算并 `onChange(result)`；若 `selectedRaw` 为空，则跳过（避免无意义触发）。
5. UI：在 `Select` 的 `outerBottomSlot` 渲染一个带上分隔线的 `Checkbox`，文案"包含子部门"，仅 `multiple=true` 时渲染。

### i18n

- `src/locales/zh-CN/common.json`：新增 `includeSubDepartments: "包含子部门"`
- `src/locales/en/common.json`：新增 `includeSubDepartments: "Include sub-departments"`

## 不改动

- 14 个调用方页面的过滤逻辑（继续 `departmentFilter.includes(item.department)`）。
- 单选场景（表单）的行为与类型。
- `DepartmentSearchSelect` 现有的 props 签名（新增能力为内部行为，仅在 `multiple=true` 时显现）。

## 验证

- 多选场景（如队列管理筛选）：勾选某父部门后，开启"包含子部门"，列表应显示该父部门 + 所有子部门下的数据；关闭后回到仅当前部门。
- 下拉框中已选 Tag 数量不会因勾选 Checkbox 而膨胀。
- 单选场景（任务表单的"归属部门"）：无 Checkbox，行为不变。
