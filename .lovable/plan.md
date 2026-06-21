
# 申请人入口与审批进度调整 — 设计计划

按 2026-06-18 变更将"申请人查看申请状态/过程/结果/原因"从流程详情审批进度 Tab 中收敛到「流程发布」「流程下线」的申请列表/详情，并新增「流程下线」申请人入口。

## 1. 菜单与路由调整

侧边栏「流程上下线管理」分组顺序统一为：
- 流程发布（已有：`/dev-center/release-management`，作为申请人入口）
- **流程下线（新增：`/dev-center/offline-requests`）**
- 发布审批（已有，审批人工作台）
- 停用审批（已有，审批人工作台）
- 审批模板（已有）

`src/App.tsx` 路由新增：
- `/dev-center/offline-requests` → 下线申请列表
- `/dev-center/offline-requests/:id` → 下线申请详情（沿用抽屉模式，路由参数仅用于深链打开抽屉）
- `/dev-center/release-management/:id` 已有发布详情抽屉，校验申请人也可只读访问。

`src/components/layout/Sidebar/index.tsx` 增加 `offlineRequests` 菜单项；i18n key `sidebar.offlineRequests = "流程下线"`。

## 2. 流程下线申请人页面（新建）

新建 `src/pages/Development/OfflineRequests/`：
- `index.tsx` — 申请人列表
  - 顶部操作：「发起下线申请」按钮（主按钮）+ 搜索（流程名/申请人）+ 状态筛选（待审批/审批中/已通过/已拒绝/执行中/执行成功/执行失败/已撤销）+ 时间筛选
  - 表格列：流程名 / 版本 / 状态 Tag / 当前审批节点 / 申请人 / 申请原因（弹出 popover）/ 申请时间 / 操作（查看详情）
  - 表格符合 `mem://style/table/visual-specification-v2`：size="small"、外置分页 `.list-pagination`
  - 行点击 / "查看详情" → 打开右侧详情抽屉
- `components/OfflineRequestDrawer/` — 申请详情抽屉（900px，maskless，复用 `DetailDrawerWrapper`）
  - Tab：基本信息 / 审批流程 / 依赖快照 / 执行结果
  - 基本信息：流程、版本、申请人、申请原因（ExpandableText）、申请时间、当前状态
  - 审批流程：Timeline 展示各审批节点（审批人 / 动作 / 时间 / 评论），与现有 `PublishApprovals/DetailDrawer` 同套视觉
  - 依赖快照：提交时刻的阻塞依赖列表（按类型分组）
  - 执行结果：执行状态、失败原因（如有）、执行时间
- `components/CreateOfflineRequestModal/` — 发起下线申请弹窗（520px，复用 FormModal 思路）
  - 字段：
    1. **目标流程**（必填，单选）— Select 仅展示 `Process.status=PUBLISHED` 且在用户权限范围内的流程；明确禁止多选/全选
    2. **当前版本**（只读，自动带出生效版本）
    3. **下线原因**（必填）— TextArea，10–1000 字符，实时计数与校验
  - 选择流程后立即触发：
    - **当前申请检查**：若已有 active 申请（PENDING_APPROVAL/APPROVED/EXECUTING）→ 显示蓝色提示条「该流程已有进行中的下线申请」+「查看现有申请」按钮（跳转到对应详情抽屉），且禁用「提交」
    - **依赖检查**：Spin 加载 → 成功 / 阻塞 / 错误三态
      - 阻塞：红色 banner + 按类型分组列出（被引用流程 / 关联任务 / 关联调度策略），每项含跳转入口，「提交」按钮禁用
      - 通过：绿色提示「依赖检查通过」
  - 提交：仅当依赖通过、无重复活跃申请、原因校验通过时启用；提交成功后 Toast + 关闭弹窗 + 自动定位到列表中该申请并打开详情抽屉

mock 文件：扩展 `src/mocks/processOfflineApproval.ts`，新增：
- `listApplicantOfflineRequests(params)` — 申请人视角列表（按申请人/可见范围过滤）
- `getOfflineRequestDetail(id)` — 申请详情（含审批 timeline、依赖快照、执行结果）
- `checkCurrentOfflineRequest(processId)` — 重复活跃申请检查
- `checkOfflineDependencies(processId)` — 依赖检查（分组 blockers）
- `submitOfflineRequest(payload)` — 单流程提交，服务端拒绝多流程

## 3. 流程发布申请人详情（补齐）

`src/pages/Development/ReleaseManagement/ReleaseListPage` 已是申请人入口，补齐：
- 详情抽屉新增 / 校验 Tab：**审批流程**（Timeline，与下线申请相同 pattern）、**执行结果**
- 列表新增「状态」「当前审批节点」列
- 路由 `/dev-center/release-management/:id` 支持深链打开发布单详情抽屉
- 现有 `ReleaseDetailDrawer` 不重构样式，仅按需补 Tab

## 4. 移除流程详情中的「审批进度」Tab

`src/components/ProcessManagement/ProcessManagementContent/components/ProcessDetailDrawer/index.tsx`：
- 删除 `<TabPane tab="审批进度" itemKey="approval">…</TabPane>` 块
- 删除 `import ApprovalProgressTab`
- 删除整个 `components/ApprovalProgressTab/` 目录（开发中心与调度中心共用同一个 Drawer，因此一次性移除两个语境）
- 流程详情仅保留：基本信息 / 版本管理 / 协作者 / 依赖 / 文档 / 工时 / 变更日志 等生命周期相关 Tab
- i18n：移除 `publishPending / titlePublish / titleOffline` 等仅供该 Tab 使用的 key

## 5. 流程列表 hint 深链

- 开发中心流程列表的「发布审批中」hint badge → 点击跳转 `/dev-center/release-management/:requestId`（打开发布单详情抽屉），不再打开流程详情的审批进度 Tab
- 调度中心流程列表的「停用审批中」hint badge → 点击跳转 `/dev-center/offline-requests/:requestId`（打开下线申请详情抽屉）
- hint 仍是从申请记录派生的快捷元数据，不写回 `Process.status` / `ProcessVersion.status`

## 6. i18n

`public/i18n/zh-CN.json` 与 `en.json` 新增：
- `sidebar.offlineRequests` — 流程下线 / Offline Requests
- `development.offlineRequests.*` — 列表、抽屉、创建弹窗、依赖检查、重复申请提示等完整文案
- `development.releaseManagement.applicantDetail.*` — 发布单申请人视角补充文案
- 删除已废弃的审批进度 Tab 相关 key

## 7. 技术细节

- 所有交互使用 Semi UI 原生组件，遵循 `mem://style/drawer/unified-standard-v1`（900px 抽屉）与 `mem://style/modal/design-specification`（520px 模态）
- 表格遵循 `mem://style/table/visual-specification-v2`
- 状态 Tag 颜色：待审批=blue / 审批中=blue / 已通过=green / 已拒绝=red / 执行中=blue / 执行成功=green / 执行失败=red / 已撤销=grey
- 单选流程的 Select 在 dataSource 层就过滤 `status!=PUBLISHED`，不依赖 UI 禁用以避免误选
- 依赖检查、当前申请检查、提交均走 mock service，遵循 `mem://tech-stack/api-interface-specification-v2`（类型化 API，分组 mock）
- 文档与注释使用中文

## 待确认

1. 「流程下线」菜单建议放在「流程发布」之后、「发布审批」之前（与文档列举顺序一致），可以吗？
2. 下线申请详情是否需要支持「撤销申请」操作（在 PENDING_APPROVAL 状态下）？文档未明确，但属于常见申请人操作，倾向于支持。
3. 是否一并把 i18n 中已废弃的 `approvalProgress`/`titlePublish`/`titleOffline` 等 key 清理掉？倾向清理以避免悬挂引用。
