## 问题

当前实现把"包含子部门"在组件内部直接展开为完整数组，并通过 `onChange` 输出给页面。页面的"搜索条件" Chips 区域和数据过滤逻辑共用这一份 state，结果勾选一个父部门后，搜索条件区会爆出几十个 `部门: xxx` 的标签，非常难看。

## 修复思路

让"用户选择"和"实际过滤范围"在数据上解耦：
- 组件 `onChange` 只回传**用户原始选择**（raw），不再做子部门展开。
- 组件新增 `onIncludeChildrenChange?: (checked: boolean) => void` 回调，告知页面"包含子部门"开关状态。
- 提供独立的展开工具函数 `expandDepartmentValues(ids, includeChildren, useNameAsValue)`，供页面在数据过滤时调用。
- 页面层：搜索条件 Chips 仍渲染 raw 数组（数量等于用户实际勾选数）；数据过滤行用 `expandDepartmentValues` 计算实际过滤集合。

这样勾选一个父部门时 Chips 只显示一个 `部门: 父部门`，但表格数据按"父部门 + 所有子部门"过滤。

## 改动详情

### `src/components/DepartmentSearchSelect/index.tsx`

- 移除 `expandWithChildren` 在 `onChange` 路径上的调用：`onChange(raw)` 直接回传 raw。
- 新增 props（仅 `multiple=true` 生效）：
  - `includeChildren?: boolean`（受控）
  - `defaultIncludeChildren?: boolean`（非受控初始值，默认 `false`）
  - `onIncludeChildrenChange?: (checked: boolean) => void`
- 内部移除 `selectedRaw` 中间态：组件回到由外部 `value` 受控的常规模式。
- Checkbox 切换时仅调用 `onIncludeChildrenChange`，不再触发 `onChange`。
- 导出工具函数 `expandDepartmentValues(values: string[], includeChildren: boolean, useNameAsValue?: boolean): string[]`。

### 页面改造（仅多选筛选场景，共 ~14 个文件）

模式统一：
```tsx
const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
const [includeSubDepts, setIncludeSubDepts] = useState(false);

// Select 绑定
<DepartmentSearchSelect
  multiple
  value={departmentFilter}
  onChange={setDepartmentFilter}
  includeChildren={includeSubDepts}
  onIncludeChildrenChange={setIncludeSubDepts}
  useNameAsValue
/>

// 数据过滤：用展开后的集合
const effectiveDeptFilter = expandDepartmentValues(departmentFilter, includeSubDepts, true);
// ...filter rows by effectiveDeptFilter

// Chips：仍然遍历 departmentFilter（原始选择），保持显示一个标签
```

涉及文件（仅筛选用法的 14 个）：
- `src/pages/Scheduling/TaskManagement/TaskManagementPage/index.tsx`
- `src/components/CredentialManagement/CredentialManagementContent/index.tsx`
- `src/components/FileManagement/FileManagementContent/index.tsx`
- `src/components/ParameterManagement/ParameterManagementContent/index.tsx`
- `src/components/ProcessManagement/ProcessManagementContent/index.tsx`
- `src/components/QueueManagement/QueueManagementContent/index.tsx`
- `src/pages/Requirements/RequirementsAssessment/index.tsx`
- `src/pages/Requirements/RequirementsReview/index.tsx`
- `src/pages/Requirements/RequirementsWorkbench/index.tsx`
- `src/pages/Scheduling/AutoExecutionPolicy/AutoExecutionPolicyPage/components/QueueTriggerList/index.tsx`
- `src/pages/Scheduling/AutoExecutionPolicy/AutoExecutionPolicyPage/components/TimeTriggerList/index.tsx`
- `src/pages/Scheduling/TemplateManagement/TemplateManagementPage/index.tsx`
- `src/pages/Scheduling/WorkerManagement/WorkerGroupManagement/index.tsx`
- `src/pages/Scheduling/WorkerManagement/index.tsx`
- `src/pages/Sharing/Showcases/index.tsx`

（表单创建/编辑场景使用的是单选模式，无 Checkbox，不变。）

## 验证

- 任务列表勾选父部门 + "包含子部门"：搜索条件区只显示 1 个 `部门: 父部门` 标签；表格数据包含父部门及全部子部门记录。
- 取消勾选 Checkbox：表格回到只显示该父部门记录，Chip 不变。
- 关闭 Checkbox 再切换部门：行为退化为原有"只查当前部门"。
- 单选场景（表单的"归属部门"）：无 Checkbox，行为与类型不变。
