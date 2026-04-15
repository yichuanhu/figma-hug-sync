

## 问题诊断

**根本原因**：`src/pages/Scheduling/ProcessManagement/ProcessManagementPage/index.tsx` 中传递的 context 值错误，当前为 `"development"` 而非 `"scheduling"`。

这导致调度中心的自动化流程页面表现得与开发中心完全一致——显示了新建按钮、打开流程等操作。

## 改动计划

### 修复文件（仅 1 处改动）

**文件**: `src/pages/Scheduling/ProcessManagement/ProcessManagementPage/index.tsx`

将 `context="development"` 改为 `context="scheduling"`。

共享组件 `ProcessManagementContent` 已经内置了所有调度中心的差异化逻辑：
- 隐藏新建流程按钮
- 隐藏打开流程、编辑、删除操作
- 默认筛选只显示已发布流程
- 隐藏状态列和状态筛选器

只需修正这一个 prop 即可全部生效。

