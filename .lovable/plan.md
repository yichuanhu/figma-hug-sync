## 目标

把项目里所有「状态」列/字段的视觉，从当前的 Semi `Tag`（带底色色块）统一改为需求中心使用的「彩色小圆点 + 纯文字」样式（参考第二张截图）。第一张截图「已上架/已下架」绿色 Tag 是要被替换掉的旧样式。

不在范围内：类型、级别、优先级、角色、标签等非「状态」字段保持原样（仍用 Tag），避免破坏现有视觉层次。

## 一、抽取通用组件

把 `src/pages/Requirements/RequirementsWorkbench/components/StatusDot` 提升为全局共享组件：

新建 `src/components/StatusDot/`（`index.tsx` + `index.less`），暴露最通用的接口：

```tsx
type SemiTagColor = 'grey' | 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'cyan' | 'amber' | 'pink' | 'teal' | 'violet' | 'light-blue' | 'lime' | 'yellow' | 'white';

interface StatusDotProps {
  color: SemiTagColor;  // 复用现状里 Tag 已用的语义色
  label: React.ReactNode;
  className?: string;
}
```

样式沿用现有 `.req-status-dot`：8px 圆点 + 6px gap + `text-0` 文字。颜色映射表与现有 `StatusDot` 保持一致并补全（grey/blue/green/orange/red/purple/cyan/amber/pink/teal/violet/light-blue/lime/yellow → 对应 `--semi-color-*` 或 Tailwind 同色 hex）。

需求中心内部原 `StatusDot` 改为对新共享组件的薄包装（保留它从 `statusConfigV2` 解析的逻辑），避免改动需求中心调用方。

`src/components/sharing/StatusTag` 内部也改为渲染共享 `StatusDot`（保留它的对外 API，避免在「资产上架/共享市场/审批」里逐处替换）。这样共享中心、市场、审批三块自动跟着切换样式。

## 二、需要替换的「状态」字段清单

按模块逐一替换。每处保留原有 `STATUS_TAG_COLOR`/类似映射表中的 color 值，只把外层 `<Tag color={...}>{label}</Tag>` 换成 `<StatusDot color={...} label={label} />`。

### 1. 调度中心
- `src/pages/Scheduling/WorkerManagement/index.tsx` — Worker 列「状态」
- `src/pages/Scheduling/WorkerManagement/components/WorkerDetailDrawer/index.tsx` — 详情「状态」
- `src/pages/Scheduling/WorkerManagement/components/UpgradeDeviceModal/index.tsx` — 升级状态
- `src/pages/Scheduling/WorkerManagement/WorkerGroupManagement/components/WorkerGroupDetailDrawer/index.tsx` — 分组状态

### 2. 开发中心
- `src/components/ProcessManagement/ProcessManagementContent/index.tsx` — 自动化流程「状态」
- `src/components/ProcessManagement/ProcessManagementContent/components/ProcessDetailDrawer/index.tsx`
- `src/components/CredentialManagement/CredentialManagementContent/index.tsx` — 凭据「状态」
- `src/components/FileManagement/FileManagementContent/index.tsx` + `components/FileDetailDrawer/index.tsx`
- `src/components/QueueManagement/QueueManagementContent/index.tsx` + `QueueDetailDrawer`
- `src/components/QueueManagement/QueueMessagesContent/index.tsx` + `MessageDetailDrawer`

### 3. 发布/审批（开发中心子模块）
- `src/pages/Development/PublishApprovals/...`、`OfflineApprovals/...` 内部状态字段（如已使用 `StatusTag` 则随共享中心一并切换；否则替换为 `StatusDot`）

### 4. 需求中心
- `src/pages/Requirements/RequirementsWorkbench/components/ChangeLogTab/index.tsx`
- `RequirementDetailDrawer` 下的 `VersionHistoryTab` / `TechnicalAssessmentSection` / `EffortTab` / `CostEstimateTab` / `AssessmentTab` / `ArtifactSection` / `ApprovalSection` 中的「状态」字段
- `src/pages/Requirements/RequirementsScheme/index.tsx` + `SchemeDetailDrawer` + `SchemeBuilder`（含 `WorkflowBuilder`）的状态列
- `src/pages/Requirements/_shared/BindingConflictContent.tsx`

### 5. 运营中心
- `src/pages/Operations/PlatformOperations/components/ResourcesTab/index.tsx`
- `src/pages/Operations/PlatformOperations/components/AnnouncementsTab/index.tsx`
- `src/pages/Operations/MetricsConfig/index.tsx` + `components/MetricRecordsDrawer/index.tsx`
- `src/pages/Operations/BusinessOutcomes/components/CustomMetricsSection/index.tsx`

### 6. 共享中心 / 市场（通过 `StatusTag` 一次性切换）
- `src/pages/SharingCenter/MyShared/...`
- `src/pages/SharingCenter/Approvals/List` & `Detail`
- `src/pages/Sharing/Market/...`

### 7. 个人中心 & 运维中心
- `src/pages/PersonalCenter/PersonalCredentialManagement/index.tsx` + `PersonalCredentialDetailDrawer`
- `src/pages/Maintenance/ConfigManagement/index.tsx`

### 8. 首页
- `src/pages/Home/components/AnnouncementSection/index.tsx` 若 Tag 是「状态」语义则替换；若只是分类标签则保留

### 9. 共享中心管理
- `src/pages/SharingCenter/Admin/Permissions/index.tsx`、`Admin/ApprovalLevels/index.tsx` 中的「状态」字段

## 三、保留不动（非「状态」语义）

以下 `Tag` 用法明显不是状态，不在替换范围内：
- 参数类型（text/bool/number）— `ParameterManagement`、`ParameterDetailDrawer`
- 凭据类型、文件类型、队列协议、Worker 标签、部门标签、分类 Tag
- 审批层级数、版本号、级别等数值型徽标
- 已上线/已撤回的「发布状态」如果属于资产状态语义，则按本次范围切换

实施时按文件逐个判断：列名为「状态」或字段语义为生命周期状态的，统一切到 `StatusDot`；其余保留。

## 四、记忆更新

完成后追加一条 Core 规则到 `mem://index.md`：
> 状态字段统一使用 `@/components/StatusDot`（圆点 + 文字），不再用 Semi `Tag` 色块。

并新建 `mem://style/status-dot-standard` 详细说明组件 API、颜色映射与适用场景。

## 五、验收

- 上述清单中所有「状态」列在列表/详情/抽屉里都呈现「彩色圆点 + 文字」，无底色色块
- 与第二张截图（需求中心）视觉一致
- 类型、级别等非状态 Tag 保持原样
- TypeScript 与 vite build 通过

## 备注

工作量较大（涉及约 30 个文件）。如果你希望先做某个子集（例如先做「调度中心 + 开发中心」验证效果，再推广其它模块），告诉我我会按子集执行；默认按上述全量计划一次性完成。
