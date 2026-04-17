

## 问题回顾

### 1. 审批流卡片的展开/收起
当前 `ApprovalFlowProgress`（详情抽屉「概览」Tab 顶部）始终展开显示：顶部 Steps 进度条 + 下方各级详情列表。用户希望默认只显示顶部进度条（紧凑预览），点击后才展开下方各级详情列表。

### 2. 添加评论功能与需求不符
当前在概览 Tab 底部有「添加评论」输入框，提交后写入活动流（`type: 'comment'`）。回顾需求中心定位：

- 需求中心是**结构化的需求生命周期管理**（草稿 → 审批 → 评估 → 开发 → 上线 → 复盘），关键交互是**审批意见**和**技术评估意见**，已分别承载在 ApprovalSection 的审批意见框和 AssessmentTab 中。
- 自由评论会与活动流（系统留痕）混在一起，污染审计轨迹，且没有 @人、回复、解决等社交能力，价值薄弱。

**结论：评论功能与需求不符，移除**。活动流仅保留系统行为（创建、状态变更、审批留痕、评估提交）。

### 3. 「关联流程」与「关联流程/应用」重复

现状：
- **`LinkedProcessesSection`（关联流程）**：展示已关联的流程及上线状态，支持 owner 管理（添加 / 解除 / 跳转流程详情）。**强调"实施载体的上线状态"**。
- **`ArtifactSection`（关联流程/应用）**：维护流程 / ADP 应用 / Agent / 人机协同，每条带"贡献度（百分比）"和"说明"，用于 **ROI 分摊计算**。

两者数据模型和定位不同，但 UI 上确实并列出现造成"重复"观感。回顾需求文档：需求要支持"一个需求由多种交付物（流程 / 应用 / Agent / 协同）共同实现，按贡献度分摊 ROI"——这是 **ArtifactSection** 的核心价值。而 `LinkedProcessesSection` 实质是 ArtifactSection 中"流程类交付物"的状态视图特例。

**结论：合并为一个「交付物」区块**，由 `ArtifactSection` 升级承担：
- 列里展示**类型 / 名称 / 状态（仅流程类显示上线状态点 + Tag，其它类型隐藏或显示"-"） / 负责人 / 贡献度 / 说明**
- 名称列对流程类型保留 Link 跳转 `/dev-center/automation-process?processId=xxx`
- 顶部聚合状态徽章（如"1/2 已上线"）只统计流程类
- 移除独立的 `LinkedProcessesSection`

---

## 实施方案（一次提交）

### 改动 1：审批流卡片支持折叠（默认收起）
- `ApprovalFlowProgress/index.tsx`：
  - 新增 `expanded` state，默认 `false`
  - Header 行加 Chevron 切换图标，点击切换
  - 用 `Collapsible` 包裹下方"各级详情列表"区域；顶部 Steps 进度条始终可见
  - 当前层级 Tag「当前 L4」保留在 header 右侧

### 改动 2：移除评论功能
- `RequirementDetailDrawer/index.tsx`：
  - 删除 `commentText` state、`handleAddComment`、底部 `requirement-detail-comment-input` Input
  - 活动流类型表移除 `comment`
  - i18n 键 `requirements.detail.addComment` / `send` / `commentAdded` 保留但不再使用（可后续清理）
- `mockData.ts`：`fetchActivities` mock 中如果有 `comment` 类型记录则移除（保持活动流纯净）

### 改动 3：合并关联流程到交付物
- 删除 `LinkedProcessesSection` 在 `RequirementDetailDrawer` 的引用（组件文件保留以便回滚）
- 升级 `ArtifactSection`：
  - 新增 `linkedProcesses` 数据透传，对 `PROCESS` 类型行渲染状态点 + Tag + Link
  - 顶部 header 增加聚合徽章「N/M 已上线」（若包含流程类型）
  - 新增/解除 `PROCESS` 类型时同步操作 `addLinkedProcesses` / `removeLinkedProcess`，复用现有 mock API
  - 列顺序：类型 / 名称 / 状态 / 贡献度 / 说明 / 操作
- i18n：`requirements.artifact.colStatus` 等少量补充

---

## 影响面

| 文件 | 改动 |
|---|---|
| `ApprovalFlowProgress/index.tsx` + `.less` | 加 Chevron 折叠交互 |
| `RequirementDetailDrawer/index.tsx` | 移除评论输入；移除 LinkedProcessesSection 引用；活动流配置精简 |
| `RequirementDetailDrawer/ArtifactSection.tsx` | 集成流程上线状态、跳转、聚合徽章；接 mock API |
| `mockData.ts` | 清理评论类活动；保持 `addLinkedProcesses` / `removeLinkedProcess` 不变 |
| `public/i18n/{zh-CN,en}.json` | 补 `colStatus` 等键 |

`ManageLinkedProcessesModal` 暂保留，由 `ArtifactSection` 在添加流程类型时复用其搜索面板（或直接合并到统一新增弹窗，下个迭代再做）。

