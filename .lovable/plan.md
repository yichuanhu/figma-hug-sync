## 目标
取消独立的「审批提示」列，将审批 Tag 并入「状态」列，状态点之后紧跟一个小号 Tag（如 `● 开发中 [发布审批中]`、`● 已发布 [下线审批中]`）。点击 Tag 仍然打开流程详情抽屉「审批进度」Tab。

## 改动范围

仅 `src/components/ProcessManagement/ProcessManagementContent/index.tsx`：

1. **删除独立列**：移除 `__approvalHint` 这一列定义（约 663–671 行）。
2. **改造 `status` 列**：
   - 列宽从当前值调整到 ~180px（开发中心场景需要容纳「已发布 + 发布审批中」）；调度中心同步。
   - render 中状态点之后，若 `approvalHints.get(record.id)` 存在则渲染 `<ApprovalHintCell hint={...} onOpen={...} />`，与 `StatusDot` 水平排版（flex + gap 8px）。
3. **调度中心**：当前调度入口隐藏「状态」筛选，但仍需展示状态列。若调度入口本身已隐藏状态列，则在调度入口保留一个轻量列 "" 仅渲染 ApprovalHintCell（避免回到独立列）—— 探查后确认调度场景的列定义是否含 status；如果调度无 status 列，则将 Tag 合入「流程名称」单元格右侧（fallback 方案，仅调度中心）。
4. **i18n**：删除/不再使用 `approvalHint.column` 表头 key（保留也无影响，不动 json）。

## 不在范围
- 不动 `ApprovalHintCell` 组件内部样式（Tag size="small" prefixIcon 视觉直接复用）。
- 不动 mock 数据、Hook、抽屉。

## 验收
1. 开发中心：状态列同行内并列显示 `● 开发中` + 蓝色「发布审批中」Tag；无审批的行只显示状态点，列空间不再被「-」占用。
2. 调度中心：`● 已发布` + 橙/蓝/红「下线审批中/下线执行中/下线失败」Tag。
3. 点击 Tag 依然停止冒泡并打开详情抽屉「审批进度」Tab。
4. 表格整体可视宽度变宽，归属部门/关联需求等列得到更多空间。
