

## 第 3 批：多级会签审批进度条 + 关联流程聚合状态

### 一、范围与需求来源

| 功能 | Story | 现状 |
|---|---|---|
| 多级审批进度条（Story-006） | ✅ 类型 `MultiLevelApprovalConfig` / `ApprovalFlowLevel` 已就位 | 无 mock 数据、无 UI |
| 关联流程聚合状态（Story-009） | ✅ 类型 `LinkedProcess` + mock 数据已就位 | 详情抽屉未渲染 |

均在已确认范围内，本批属于"补 mock + 加 UI 渲染 + 接审批动作"。

### 二、多级审批进度条

**1. Mock 数据（`mockData.ts`）**
- 新增 `generateMockApprovalFlow(status, idx): MultiLevelApprovalConfig | undefined`
  - `DRAFT / WITHDRAWN` → undefined
  - 其他状态 → 3 级流程：`部门主管(any_one)` → `业务审批(all 会签 2 人)` → `IT 复核(any_one)`
  - 各级 approver 状态根据需求当前 status 推进：`PENDING_APPROVAL` 停在 currentLevel；`PENDING_ASSESSMENT` 及之后全 APPROVED；`REJECTED` 在某级 REJECTED
- 写入 `requirementItem.approvalFlowConfig`

**2. 新组件 `ApprovalFlowProgress/index.tsx`（详情抽屉左栏，Overview Tab 顶部）**
- 横向 Steps 形态，每级一节点：
  - 节点状态映射 → Semi `Steps` 的 `status`：全部 APPROVED → finish；任一 REJECTED → error；含 PENDING 且为 currentLevel → process；未到 → wait
  - 节点标题：`L{level} {name}`
  - 节点描述：`mode` 中文化（任一 / 会签 / 多数）+ approver 头像组（`UserNameWithCard` 紧凑模式 / 简化为 Avatar + Tooltip 名）
- 每级下方展开区：approver 列表（姓名 / 状态 Tag / 评论 / 时间），用浅灰底卡片
- 仅当 `data.approvalFlowConfig` 存在时渲染

**3. `ApprovalSection`（右栏审批动作）增强**
- 当 `currentLevel` 的当前用户存在于 approvers 时显示「批准 / 驳回」（mock 当前用户固定 `user-001`，命中即可见）
- 操作后：mock 函数推进当前级 approver 状态；若该级 mode 满足条件 → currentLevel++；末级满足 → 整体 status → `PENDING_ASSESSMENT`；任一 REJECTED → status → `REJECTED`
- 抽屉刷新时进度条同步推进

### 三、关联流程聚合状态

**1. 新组件 `LinkedProcessesSection/index.tsx`（Overview Tab，活动流上方）**
- 标题行：`关联流程` + 聚合状态 Tag（见下）+ 数量徽标
- 列表：每个流程一行
  - 左：状态点（颜色对齐 statusConfig）+ 流程名（Typography ellipsis）
  - 中：状态 Tag（DEVELOPING / TESTING / PENDING / ONLINE / FAILED 中文化）
  - 右：负责人 `UserNameWithCard`
- 空：复用 `EmptyState noData` + 文案"暂无关联流程"

**2. 聚合状态计算工具 `aggregateLinkedStatus(processes)`**
- 优先级：任一 FAILED → `FAILED`；全部 ONLINE → `ONLINE`；任一 DEVELOPING/TESTING → `IN_PROGRESS`；其余 → `PENDING`
- 输出 `{ key, label, color }` 供顶部 Tag 渲染

**3. 列表页"关联流程"列（可选）**
- 在 BoardView 卡片底部加一个小 chip：`{ONLINE icon} 2/3` 表示已上线流程数 / 总数
- TableView 不动（避免列爆炸）

### 四、文件改动清单

1. `RequirementsWorkbench/mockData.ts` — 新增 `generateMockApprovalFlow`，写入需求；新增 `advanceApprovalFlow(id, action, comment)` 推进函数
2. `RequirementsWorkbench/components/ApprovalFlowProgress/index.tsx` + `index.less`（新建，~120 行）
3. `RequirementsWorkbench/components/LinkedProcessesSection/index.tsx` + `index.less`（新建，~80 行）
4. `RequirementsWorkbench/utils/aggregateLinkedStatus.ts`（新建，~30 行）
5. `RequirementsWorkbench/components/RequirementDetailDrawer/index.tsx` — Overview Tab 顶部插入 `ApprovalFlowProgress`、`ArtifactSection` 之前插入 `LinkedProcessesSection`
6. `RequirementsWorkbench/components/RequirementDetailDrawer/ApprovalSection.tsx` — 改为基于 `approvalFlowConfig.currentLevel` 的当前用户判断 + 调 `advanceApprovalFlow`
7. `RequirementsWorkbench/components/BoardView/index.tsx` — 卡片底部加流程进度 chip（仅当存在 linkedProcesses）
8. `public/i18n/zh-CN.json` + `en.json` — 新增 `requirements.approvalFlow.* / requirements.linkedProcesses.*` 文案

### 五、设计规范遵循

- 进度条用 Semi `Steps`（type="basic" 或 "navigation"），不自造
- 状态色对齐 `statusConfigV2` 已有色板（grey/orange/cyan/blue/green/red）
- 头像组复用 `UserNameWithCard`；Tag size="small"，type="light"
- 文案中文优先，i18n key 同步中英
- Lucide 图标 stroke=2，行内 size=14，节点标题 size=16
- 不引入新依赖

