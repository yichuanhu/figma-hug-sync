

# 需求表单部门替换 + TreeSelect 数据显示修复

## 问题分析

1. **RequirementFormModal** 仍使用 `Form.Select` + `departmentOptions`，需替换为 `DepartmentSelect`
2. **DepartmentSelect 树形数据不显示** — Semi UI `TreeSelect` 默认折叠所有节点，且根节点 "Laiye Technology" 可能未自动展开，导致用户只看到搜索框无内容

## 修改方案

### 1. DepartmentSelect 组件增加 `defaultExpandAll`
**文件**: `src/components/DepartmentSelect/index.tsx`
- 给 `TreeSelect` 添加 `defaultExpandAll` 属性，确保树节点默认展开显示

### 2. RequirementFormModal 替换部门选择
**文件**: `src/pages/Requirements/RequirementsWorkbench/components/RequirementFormModal/index.tsx`
- 移除 `import { departmentOptions } from '../../mockData'`
- 导入 `DepartmentSelect`
- 将 `Form.Select` (department 字段) 替换为 `Form.Slot` + `DepartmentSelect`（单选模式，`useNameAsValue`）
- 保留 `required` 校验逻辑

共修改 2 个文件，改动量很小。

