
# 流程停用审批管理（FEAT-027）实施计划

复用 FEAT-025（发布审批）已搭好的审批模板/部门绑定基建，新增 `PROCESS_OFFLINE` 业务类型，覆盖 STORY-001/002/003 三个故事。整体保持与"发布审批"对称的目录结构与交互，最大限度复用既有组件。

## 1. 数据层（mock）改造

### 1.1 业务类型扩展
- `src/mocks/departmentApprovalFlowBinding.ts`：`ApprovalBindingBusinessType` 增加 `'PROCESS_OFFLINE'`，默认绑定预置 2 条 `PROCESS_OFFLINE`（产研部 / 财务部）。
- `src/pages/Requirements/ApprovalConfig/mockData.ts`：`ApprovalFlowTemplate.business_type` 联合类型增加 `'PROCESS_OFFLINE'`，预置 2 条停用模板（如 `oflow-001`/`oflow-002`）。`fetchApprovalFlows`、占用计算、激活互斥都按业务类型隔离（已具备）。

### 1.2 流程实体扩展（`ProcessManagementContent` mock）
在 `LYProcessResponse` mock 数据上新增字段：
- `offline_at?: string`（停用时间）
- `published_at?: string`（用于联动里程碑展示）
保持 `status` 仅使用既有 `DEVELOPING | PUBLISHED | ARCHIVED`（按 R-06 不新增枚举）。

### 1.3 新增 `src/mocks/processOfflineApproval.ts`
对齐 `processVersionApproval.ts` 形态，导出：
```ts
export type OfflineRequestStatus =
  'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'EXECUTION_FAILED';

export interface DependencyCheckSnapshot {
  blocking: boolean;
  triggers: { id: string; name: string; type: 'TIME' | 'QUEUE'; enabled: boolean }[];
  taskTemplates: { id: string; name: string }[];
  runningTasks: { id: string; name: string; status: 'RUNNING' | 'QUEUED' }[];
  schedulingRefs: { id: string; name: string }[];
}

export interface ProcessOfflineRequest {
  id: string;
  process_id: string; process_name: string;
  applicant_id: string; applicant_name: string;
  department_id: string; department_name: string;
  reason: string;
  submitted_at: string;
  dependency_snapshot: DependencyCheckSnapshot;
  status: OfflineRequestStatus;
  approval_template_snapshot?: ApprovalFlowTemplate;
  current_level?: number; total_levels?: number;
  records: ApprovalRecord[];
  executed_at?: string;
  execution_error?: string;
}

// 接口
checkOfflineDependency(processId)        // 模拟依赖扫描
getCurrentOfflineRequest(processId)      // R-02 互斥
submitOfflineRequest({processId, reason})// 含二次绑定查询、模板快照
fetchOfflineApprovals({keyword,status,departmentId})
approveOfflineRequest(id, comment)       // 非末级推进；末级触发 executeOffline
rejectOfflineRequest(id, reason)
executeOffline(id)                       // 二次依赖检查 → 写 ARCHIVED + offline_at；失败置 EXECUTION_FAILED
subscribeOfflineRequestChange()
```
依赖检查 mock 按 `processId` 哈希生成 0–N 条阻塞项以便演示阻断/通过两种情况。

## 2. 配置端：停用审批模板（STORY-001）

复用现有 `ApprovalConfigPage` / `ApprovalFlowBuilderPage` 已暴露的 `businessType` + `basePath` props：
- `App.tsx` 新增三个路由：
  - `/dev-center/offline-approval-templates` → `ApprovalConfigPage businessType="PROCESS_OFFLINE" basePath=...`
  - `/dev-center/offline-approval-templates/builder/:id` → `ApprovalFlowBuilderPage businessType="PROCESS_OFFLINE"`
  - 通配 `…/*` 重定向。
- `ApprovalFlowBuilder` 内根据 `businessType==='PROCESS_OFFLINE'` 同样隐藏「技术评估人配置」「价值/复杂度模型」（与 PUBLISH 走同一分支）。
- 部门占用提示文案：`PROCESS_OFFLINE` 时显示"该部门已绑定停用审批模板【X】"。
- 列表/Builder 的 i18n 标题分键 `offlineApprovalTemplates.*`。

## 3. 调度中心流程列表：申请停用入口（STORY-002）

`src/components/ProcessManagement/ProcessManagementContent`（受 `context='scheduling'` 影响）：
- 行操作菜单（`Ellipsis` 下拉）增加「申请停用」项；可见条件：`status==='PUBLISHED'` && 当前用户具备入口权限（mock 默认 true）。
- 新增 `OfflineRequestModal`（520px，`FormModal` 规范）：
  - 顶部展示流程名 + 部门 + 当前依赖检查摘要（调用 `checkOfflineDependency`，loading 态 skeleton）
  - 阻塞依赖时按列表分组（触发器 / 任务模板 / 运行中任务 / 调度引用），按钮"提交"禁用并提示"存在阻塞依赖，无法停用"
  - `reason` Form.TextArea 必填，10–1000 字符
  - 提交：调用 `submitOfflineRequest`；返回 `needsApproval=false` 时直接调用 `executeOffline` 走"无审批直传"链路（按 STORY-002 R-09）；否则提示已提交进入审批
  - 互斥：若 `getCurrentOfflineRequest` 返回未结束申请，禁止再次提交，按钮替换为"查看申请"，跳转停用审批列表
- 流程详情抽屉 `ProcessDetailDrawer`：在头部 `extraActions` 增加同样按钮，并在"基本信息"区展示 `offline_at`（已下线时）与"最近一次停用申请"链接。

## 4. 停用审批列表与详情（STORY-003）

新建 `src/pages/Development/OfflineApprovals/`（与 `PublishApprovals` 对称），结构沿用：
- 顶部 Tabs：待审批 / 已通过(APPROVED+EXECUTED) / 已拒绝 / 执行失败 / 全部
- 搜索 320px：流程名 / 申请人；右侧 FilterPopover：部门
- 表格列：流程名称、申请人（`UserNameWithCard`）、所属部门、提交时间、审批进度、状态 Tag、操作
- 状态 Tag 颜色：PENDING_APPROVAL 蓝 / APPROVED 浅绿 / EXECUTED 绿 / REJECTED 红 / EXECUTION_FAILED 橙
- 详情 Modal（720px）：
  - 流程信息 + 停用原因 + `submitted_at` + 审批进度
  - 依赖检查快照（按类型分组的卡片，无阻塞时显示"依赖检查通过"）
  - 审批 `Timeline`（成功/失败图标）
  - 当前用户为当前级审批人 + `PENDING_APPROVAL` 时显示「通过」「拒绝」按钮；拒绝弹 `RejectReasonDialog`
  - `EXECUTION_FAILED` 时展示 `execution_error`，并提供"重试执行"入口
- 接收 `subscribeOfflineRequestChange` 静默刷新（10s 兜底刷新）

## 5. 流程详情里程碑（STORY-002 联动 / STORY-003 收尾）

- `executeOffline` 成功后：流程列表 `status` → `ARCHIVED`，写 `offline_at`；与 FEAT-025 `deployed_at` 一同在流程详情"生命周期"区展示：上线时间 / 下线时间 / 最近停用审批人。
- `ProcessDetailDrawer` 增加"生命周期"小节（Descriptions），仅展示已存在字段。

## 6. 路由与导航

`src/components/layout/Sidebar/index.tsx` 「发布管理」组下新增两个菜单项（紧邻发布审批）：
- `offlineApprovalTemplates` → `/dev-center/offline-approval-templates`
- `offlineApprovals` → `/dev-center/offline-approvals`

`App.tsx` 注册：
- `/dev-center/offline-approvals` → `OfflineApprovalsPage`
- 模板路由两条（见 §2）

i18n（`zh-CN.json` / `en.json`）补全：
- `sidebar.offlineApprovalTemplates` / `sidebar.offlineApprovals`
- `offlineApprovalTemplates.*`、`offlineApprovals.*`（标题、Tabs、表头、状态、按钮、Toast、依赖类型）

## 7. 防退回与一致性

- 部门绑定/模板列表/审批列表均严格按 `business_type='PROCESS_OFFLINE'` 命名空间隔离，与需求审批、发布审批互不干扰。
- 复用 `ApprovalFlowBuilder` 部门占用排他校验（已支持 businessType 维度）。
- 现有 `/requirements/approval-config`、`/dev-center/publish-approval-templates` 行为不受影响。
- 全部新页面遵循项目规范：folder=component（`index.tsx` + `index.less`）、`Table size="small"`、外置 `.list-pagination`、`DetailDrawerWrapper` / `FormModal` / Lucide 图标、Toast `theme:'light'`、Semi 原生表单校验。

## 8. 不在本期范围

- 真实 UCI 权限点接入与数据权限过滤（mock 假设全员可见）
- 强制终止运行中任务、定时自动下线
- 审计日志 UI、通知中心实际投递（仅 Toast）
- 流程状态机后端校验，仅前端 mock 状态推进

确认后即开始实施。
