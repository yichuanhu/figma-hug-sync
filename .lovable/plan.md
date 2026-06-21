## 目标

将「流程下线」申请人侧的列表和详情，参照「流程发布」（ReleaseListPage / ReleaseDetailDrawer）的结构与视觉风格统一改造，同时尊重两者的功能差异（流程下线特有依赖检查快照、单流程粒度、无资源清单、状态枚举略有不同）。

## 差异梳理（不能照抄的部分）

| 维度 | 流程发布 | 流程下线 |
|---|---|---|
| 粒度 | 多流程 + 多资源 | 单流程，无资源 |
| 特有内容 | 流程清单、资源分组（参数/凭据/队列/文件） | 依赖检查快照（触发器、任务模板、运行中任务、调度引用） |
| 状态枚举 | 含 EXECUTING / EXECUTION_SUCCESS / EXECUTION_FAILED | 同名状态 + 额外的 `EXECUTED`（兼容旧值） |
| 申请原因 | description 选填 | reason 必填，是审计关键字段 |
| 错误信息 | error_message | execution_error |

因此：发布详情的「已发布的流程和资源」Tab 在下线场景下无意义，应替换为「下线影响」Tab（承载依赖快照 + 目标流程信息 + 下线时间/错误）。

## 1. 列表页改造（`OfflineRequests/index.tsx`）

- **列结构对齐发布列表**（保持下线特有列）：
  1. 流程名称（粗体）
  2. 版本
  3. 状态 Tag（沿用 OFFLINE_STATUS_TAG 全状态）
  4. **审批进度**（width 100, align center）— 渲染逻辑对齐发布列表的新版："PENDING_APPROVAL/APPROVING 显示 `第 X / Y 级` 或 `current_approver_label`，其余终态显示 `-`"。**移除现在「审批中也会显示横线」与「状态列重复表达」的歧义。**
  5. 申请人
  6. 所属部门
  7. 申请原因（Popover 悬浮全文，保持现状）
  8. 提交时间
- 列宽、`size="small"`、行选中高亮、空态、搜索框 320px、FilterPopover 全部沿用现状（已与发布列表一致）。
- 顶部标题与「发起下线申请」按钮保持现状。

## 2. 详情抽屉改造（`ApplicantDetailDrawer/index.tsx`）

将当前的「单页 3 个 Card 堆叠」结构改为 Tabs 结构（对齐 ReleaseDetailDrawer）：

```text
基本信息 | 审批流程 | 下线影响
```

### Tab 1 — 基本信息
用 `Descriptions` 展示（对齐发布详情视觉）：
- 流程名称、版本
- 状态 Tag（OFFLINE_STATUS_TAG）
- 申请人（UserNameWithCard）
- 所属部门
- 提交时间
- 下线时间（仅有值时显示）
- 下线原因（ExpandableText，maxLines=3）
- 执行错误（仅 EXECUTION_FAILED，type="danger"）

### Tab 2 — 审批流程
- 顶部一行 `第 X / Y 级`（仅审批中显示），与发布详情一致。
- Timeline 展示 records（沿用现有 approver_name + action Tag + 评论 渲染）。
- 若部门未绑定停用审批模板（`approval_template_snapshot` 为空），显示 `Text type="tertiary"`：「该部门未配置停用审批模板，提交后直接执行下线」。

### Tab 3 — 下线影响
承载发布详情里「流程和资源」Tab 的位置，但内容换成下线特有信息：
- **目标流程卡片**：流程名 + 版本 Tag + 跳转图标（参考发布详情 process-card 样式），点击跳转 `/dev-center/automation-process?processId=...`。
- **依赖检查快照**：复用现有 `renderDependency` 的分组结构（触发器 / 任务模板 / 运行中任务 / 调度引用），无依赖时显示绿色「依赖检查通过」Tag；有阻塞时显示红色「存在阻塞依赖」Tag。

## 3. 样式调整（`ApplicantDetailDrawer/index.less`）

参考 `ReleaseDetailDrawer` 的 less：
- 新增 `.detail-drawer-tab-content` 内边距（与发布详情 padding 一致）。
- 移除当前 Card 间 16px gap 改为 Tab 内自然布局。
- 复用 `release-detail-drawer-process-card`、`release-detail-drawer-link-icon` 的视觉规则（图标、悬浮、ExternalLink），可在 less 中本地实现等价类。

## 不做的事

- 不修改 `processOfflineApproval.ts` mock 数据结构与字段。
- 不修改创建下线申请弹窗。
- 不动「停用审批」（审批人侧）页面。
- 不引入资源清单概念。
- 不动 i18n。

## 文件清单

- `src/pages/Development/OfflineRequests/index.tsx`（列名/列宽/审批进度渲染对齐）
- `src/pages/Development/OfflineRequests/components/ApplicantDetailDrawer/index.tsx`（改为 Tabs + Descriptions + 下线影响 Tab）
- `src/pages/Development/OfflineRequests/components/ApplicantDetailDrawer/index.less`（轻量样式调整）
