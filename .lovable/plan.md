## 目标

参考需求工作台（`RequirementsWorkbench`）做法，把所有列表页的「操作」列固定到右侧：
- 操作列配置加 `fixed: 'right' as const`
- `<Table>` 加 `scroll={{ x: <总宽度> }}`，已有 `y` 的保留

## 改造范围（主列表页，不含 Drawer 内嵌子表）

需求中心（全部子列表页统一固定）
- `src/pages/Requirements/RequirementsProjects/index.tsx`
- `src/pages/Requirements/RequirementsAssessment/index.tsx`
- `src/pages/Requirements/RequirementsScheme/index.tsx`
- `src/pages/Requirements/RequirementsReview/index.tsx`
- `src/pages/Requirements/CostBaselineConfig/index.tsx`
- `src/pages/Requirements/RequirementsScheme/components/SchemeBuilder/index.tsx`
- `src/pages/Requirements/RequirementsScheme/components/SchemeBuilder/CostBuilder/index.tsx`
- 注：`RequirementsWorkbench` 已固定，无需重复

调度中心
- `src/pages/Scheduling/TaskManagement/TaskManagementPage/index.tsx`
- `src/pages/Scheduling/TemplateManagement/TemplateManagementPage/index.tsx`
- `src/pages/Scheduling/WorkerManagement/index.tsx`
- `src/pages/Scheduling/WorkerManagement/WorkerGroupManagement/index.tsx`
- `src/pages/Scheduling/AutoExecutionPolicy/AutoExecutionPolicyPage/components/TimeTriggerList/index.tsx`
- `src/pages/Scheduling/AutoExecutionPolicy/AutoExecutionPolicyPage/components/QueueTriggerList/index.tsx`

开发中心
- `src/pages/Development/ReleaseManagement/ReleaseListPage/index.tsx`
- `src/pages/Development/OfflineApprovals/index.tsx`
- `src/pages/Development/PublishApprovals/index.tsx`

业务资产复用组件
- `src/components/ProcessManagement/ProcessManagementContent/index.tsx`
- `src/components/FileManagement/FileManagementContent/index.tsx`
- `src/components/CredentialManagement/CredentialManagementContent/index.tsx`
- `src/components/ParameterManagement/ParameterManagementContent/index.tsx`
- `src/components/QueueManagement/QueueManagementContent/index.tsx`
- `src/components/QueueManagement/QueueMessagesContent/index.tsx`

个人中心
- `src/pages/PersonalCenter/PersonalCredentialManagement/index.tsx`

运营中心
- `src/pages/Operations/MetricsConfig/index.tsx`

分享中心
- `src/pages/SharingCenter/MyShared/index.tsx`
- `src/pages/SharingCenter/Approvals/List/index.tsx`

**不改**：Drawer 内嵌子表（`DocumentsTab`、`AssignedValuesTab`、`LinkedCredentialsDrawer`、`PersonalCredentialDetailDrawer`、`WorkerGroupDetailDrawer`、`ProjectDetailDrawer` 等），它们在 900px Drawer 内不需要横向滚动。

## 技术要点

每个文件统一处理：
1. 操作列对象加 `fixed: 'right' as const`。
2. `<Table>` 的 `scroll` 配置：
   - 已有 `scroll={{ y: ... }}`：补 `x: <累加列宽>`。
   - 没有 `scroll`：新增 `scroll={{ x: <累加列宽> }}`。
3. `x` 取已声明列宽之和；未声明的按 160 估算，结果略大于容器宽度才能触发固定。

## 关于"build 失败黑屏"

Vite dev server 日志无错误，浏览器控制台无报错，预览正常。判定之前的黑屏是 HMR 瞬时不一致已自动恢复，本次不回滚，只做"操作列固定"。

## 验证

- 进入上述列表页，缩窄窗口出现横向滚动条时，操作列贴右侧并显示左侧分隔阴影。
- 行点击、行内 Dropdown 操作菜单不被遮挡。
- 表头与数据行操作列对齐。
