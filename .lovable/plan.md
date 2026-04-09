

# 修复：切换到管理视图时清除搜索状态

## 问题原因

管理视图的协作者列表使用了 `filteredData`，该变量会根据 `searchValue` 过滤协作者。当在快捷添加视图搜索无结果后，点击切换到管理视图时，`searchValue` 未被清除，导致过滤后列表为空，显示"暂无协作者"。

## 改动

**文件**: `CollaboratorPanel/index.tsx`

在点击切换到管理视图时（L440），同时清除 `searchValue`：

```tsx
onClick={() => {
  setPanelView('manage');
  setSearchValue('');
  setSelectedUsers([]);
}}
```

同时，管理视图的列表应直接使用 `collaborators` 而非 `filteredData`，因为管理视图没有搜索功能，不需要过滤：

- L550: `filteredData.map(...)` → `collaborators.map(...)`
- L551: `filteredData.length === 0` → `collaborators.length === 0`

| 文件 | 改动 |
|------|------|
| `CollaboratorPanel/index.tsx` | 切换管理视图时清除搜索状态；管理视图列表改用 `collaborators` |

