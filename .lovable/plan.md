

# 优化添加协作者交互：确认后不关闭弹窗

## 问题

当前在"添加协作者"弹窗中，点击"确定"批量添加用户后，弹窗会自动关闭（`onVisibleChange(false)`）。用户期望的行为是：添加成功后回到弹窗首页（quick 视图），由用户手动关闭弹窗。

## 修改方案

**文件**: `src/components/CollaboratorManager/CollaboratorPanel/index.tsx`

1. **`handleBatchAdd`（第 434 行）**: 移除 `onVisibleChange(false)`，改为 `setPanelView('quick')` 回到首页视图，同时重置搜索和选中状态（已有的重置逻辑保留）。

2. **`handleOrgSubmit`（第 605 行）**: 已经是回到 `previousView` 而非关闭弹窗，行为正确，无需修改。

总计修改 1 行代码。

