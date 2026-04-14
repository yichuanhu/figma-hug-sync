

## 方案：OwnerSelect 仅展开第一级部门

**文件**：`src/components/OwnerSelect/index.tsx`

- 移除 `defaultExpandAll`，改用 `defaultExpandedKeys`，值为第一级部门节点的 key（即 `[treeData[0]?.key]`）
- 无需区分有值/无值，统一只展开第一级

改动约 3 行，仅 **1 个文件**。

