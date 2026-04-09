

# 添加协作者后自动关闭弹窗

## 变更

**文件**: `CollaboratorPanel/index.tsx` (L161-179)

在 `handleBatchAdd` 回调末尾添加 `onVisibleChange(false)` 关闭弹窗，并将 `onVisibleChange` 加入依赖数组：

```tsx
const handleBatchAdd = useCallback(() => {
  if (selectedUsers.length === 0) return;
  addCollaborators(/* ... 保持不变 ... */);
  setCollaborators(getCollaborators(assetType, assetId));
  setSelectedUsers([]);
  setSearchValue('');
  setBatchRole(ASSET_AVAILABLE_ROLES[assetType]?.[ASSET_AVAILABLE_ROLES[assetType].length - 1] || 'OBSERVER');
  Toast.success(t('collaborator.quickAddSuccess'));
  onVisibleChange(false); // 关闭弹窗（包括快捷视图和管理视图）
}, [assetType, assetId, selectedUsers, batchRole, t, onVisibleChange]);
```

这会同时关闭快捷添加弹窗和管理视图弹窗，因为两者共用同一个 `visible` / `onVisibleChange` 控制。

| 文件 | 改动 |
|------|------|
| `CollaboratorPanel/index.tsx` | `handleBatchAdd` 末尾新增 `onVisibleChange(false)`，依赖数组补充 `onVisibleChange` |

