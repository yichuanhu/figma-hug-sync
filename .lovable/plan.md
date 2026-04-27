# 详情抽屉按方案能力动态展示评估/审批

## 背景
当前激活方案为 `RPA-STAT`（无审批 / 无评估）。`useSchemeFlags()` 已暴露 `hasApproval`、`hasAssessment`，但 `RequirementDetailDrawer` 中的「评估」「成本预估」Tab 以及右侧属性面板的审批操作仍硬编码展示，需根据方案能力开关条件渲染。

## 改动文件
仅一个文件：`src/pages/Requirements/RequirementsWorkbench/components/RequirementDetailDrawer/index.tsx`

## 具体改动

### 1. 主组件：activeTab 自动回退
在已有的 `useEffect`（重置 tab）后，新增一个 effect：当 `hasAssessment === false` 且当前 `activeTab` 为 `assessment` 或 `cost` 时，自动切回 `overview`，避免方案切换或首次加载时停留在已隐藏 tab 上。

### 2. Tab 条件渲染（line 517-533）
将 `<TabPane itemKey="assessment">` 与 `<TabPane itemKey="cost">` 用 `{hasAssessment && (...)}` 包裹，无评估方案时这两个 tab 不渲染。

### 3. 概览 Tab：审批进度条件渲染（line 509-511）
将 `<ApprovalFlowProgress>` 的渲染条件从 `effectiveData.approvalFlowConfig && !isHistoryMode` 改为 `hasApproval && effectiveData.approvalFlowConfig && !isHistoryMode`。无审批方案下不展示审批进度。

### 4. 右侧属性面板：审批区块条件渲染（line 168）
将 `<ApprovalSection ... />` 用 `{hasApproval && (...)}` 包裹。无审批方案下，撤回/重新提交/审批操作整体隐藏。提交按钮文案/确认弹窗已通过 `hasApproval` 分支自适应，无需改动。

## 不在范围
- 列表 / 看板视图：之前已完成。
- `ApprovalSection` 内部逻辑：外层不渲染即可，无需改其内部。
- `useSchemeFlags` 与方案配置：已就绪，直接消费。
