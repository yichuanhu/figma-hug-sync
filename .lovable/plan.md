## 目标

将之前在「任务列表」上线的 `DepartmentSearchSelect`（扁平搜索 + 图标 + 完整路径下拉）作为公共筛选组件，应用到所有「列表页归属部门筛选」位置，统一筛选体验。

## 范围（共 14 个列表页筛选位）

仅替换"筛选 / Filter"用途的 `<DepartmentSelect>` 用法。新建/编辑表单内的 `DepartmentSelect` 不在本次范围。

涉及文件：
1. `src/components/FileManagement/FileManagementContent/index.tsx`
2. `src/components/CredentialManagement/CredentialManagementContent/index.tsx`
3. `src/components/ProcessManagement/ProcessManagementContent/index.tsx`
4. `src/components/ParameterManagement/ParameterManagementContent/index.tsx`
5. `src/components/QueueManagement/QueueManagementContent/index.tsx`
6. `src/pages/Scheduling/WorkerManagement/WorkerGroupManagement/index.tsx`
7. `src/pages/Scheduling/WorkerManagement/index.tsx`
8. `src/pages/Scheduling/TemplateManagement/TemplateManagementPage/index.tsx`
9. `src/pages/Scheduling/AutoExecutionPolicy/AutoExecutionPolicyPage/components/TimeTriggerList/index.tsx`
10. `src/pages/Scheduling/AutoExecutionPolicy/AutoExecutionPolicyPage/components/QueueTriggerList/index.tsx`
11. `src/pages/Sharing/Showcases/index.tsx`
12. `src/pages/Requirements/RequirementsAssessment/index.tsx`
13. `src/pages/Requirements/RequirementsReview/index.tsx`
14. `src/pages/Requirements/RequirementsWorkbench/index.tsx`

## 改动方式

每个文件统一两处编辑：
- `import DepartmentSelect from '@/components/DepartmentSelect'` → `import DepartmentSearchSelect from '@/components/DepartmentSearchSelect'`
- `<DepartmentSelect ... />` → `<DepartmentSearchSelect ... />`

其余 props（`multiple` / `value` / `onChange` / `showClear` / `maxTagCount` / `useNameAsValue` / `style`）保持原样。`DepartmentSearchSelect` 已经支持这些 props，逻辑零变更。

## 不动的范围

- `DepartmentSelect`（树形）组件本体保留，新建/编辑表单等单选树场景继续使用。
- `WorkspaceFormModal` 使用的 `DepartmentSelectField` 与本次无关。
- 筛选并集、查询参数、i18n 文案均保持不变。

## 验证

- 上述 14 个列表筛选下拉视觉与任务列表一致：图标 + 部门名 + 完整路径，支持搜索 + 多选并集。
- 选择/清空后列表正确过滤；TypeScript 编译通过。
