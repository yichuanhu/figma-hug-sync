

# 需求审批流优化方案

## 现状问题

当前实现将审批简化为单一状态（DRAFT → PENDING → APPROVED/REJECTED），缺乏真实的两级审批流程。"需求评审"页面只是带了 `defaultApprovalFilter="PENDING"` 的同一个列表页，没有独立的审批工作台体验。

## 设计目标

建立完整的两级审批流：**业务审批** → **技术审批**，两个阶段各自有独立的审批人、审批意见和时间线，在详情抽屉中清晰展示流程进度。

## 核心改动

### 1. 扩展审批状态模型

将 `ApprovalStatus` 从 4 个状态扩展为 7 个，覆盖两级审批：

```text
DRAFT → BUSINESS_PENDING → BUSINESS_APPROVED → TECH_PENDING → TECH_APPROVED
                ↓                                     ↓
         BUSINESS_REJECTED                      TECH_REJECTED
```

在 `src/api/index.ts` 中：
- 新增 `ApprovalStatus` 值：`BUSINESS_PENDING`、`BUSINESS_APPROVED`、`BUSINESS_REJECTED`、`TECH_PENDING`、`TECH_APPROVED`、`TECH_REJECTED`
- 新增 `LYApprovalRecord` 接口（审批记录：阶段、审批人、操作、意见、时间）
- 在 `LYRequirementResponse` 中新增 `approval_records` 字段

### 2. 创建审批流时间线组件

新建 `src/pages/Requirements/components/ApprovalTimeline/index.tsx`：
- 使用 Semi UI `Timeline` 组件展示审批流节点
- 5 个节点：提交需求 → 业务审批 → 业务通过 → 技术审批 → 技术通过
- 已完成节点显示审批人、意见、时间；当前节点高亮；未到达节点灰显
- 驳回状态用红色标记并显示驳回原因

### 3. 重构 ApprovalActions 组件

根据当前审批阶段显示不同操作按钮：

| 状态 | 需求提交者看到 | 业务管理员看到 | 开发管理员看到 |
|------|--------------|--------------|--------------|
| DRAFT | 提交审批 | - | - |
| BUSINESS_PENDING | 等待审批中 | 通过 / 驳回 | - |
| BUSINESS_APPROVED | 等待技术审批 | - | - |
| TECH_PENDING | 等待技术审批 | - | 通过 / 驳回（含技术评估） |
| BUSINESS_REJECTED | 重新提交 | - | - |
| TECH_REJECTED | 重新提交 | - | - |
| TECH_APPROVED | 已通过 | - | - |

技术审批时，弹窗中集成技术评估表单（评分 + 结论 + 意见），审批通过时必须填写评估。

### 4. 创建独立的需求评审页面

新建 `src/pages/Requirements/RequirementReviewPage/index.tsx`：
- 独立页面而非复用 RequirementListPage
- 页面标题："需求评审"，描述提示当前用户角色
- 顶部 Tab 切换：**待我审批** / **我已审批** / **全部**
- "待我审批" Tab 只显示当前用户对应阶段的待审批需求（业务管理员看 BUSINESS_PENDING，开发管理员看 TECH_PENDING）
- 表格增加"当前阶段"列和"等待时长"列
- 行点击打开详情抽屉，抽屉中直接显示审批操作区域

### 5. 详情抽屉中集成审批流

在 `RequirementDetailDrawer` 的基本信息 Tab 中：
- 将原来简单的状态 Tag 替换为审批流进度条（Steps 或 Timeline 组件）
- 在 Descriptions 下方新增"审批记录"区块，展示 ApprovalTimeline
- ApprovalActions 根据当前用户角色和审批阶段动态显示

### 6. Mock 数据与 i18n

- Mock 数据中为每条需求生成对应阶段的审批记录（审批人用英文名）
- 用 mock 的 `currentUserRole` 变量模拟角色切换（页面顶部加一个角色切换器供演示）
- 新增 i18n keys：所有新状态标签、审批阶段名称、时间线文案、评审页面文案

## 文件清单

| 操作 | 文件 |
|------|------|
| 修改 | `src/api/index.ts` — 扩展 ApprovalStatus、新增 LYApprovalRecord |
| 新建 | `src/pages/Requirements/components/ApprovalTimeline/` — 审批流时间线 |
| 修改 | `src/pages/Requirements/components/ApprovalActions/` — 两级审批逻辑 |
| 新建 | `src/pages/Requirements/RequirementReviewPage/` — 独立评审页面 |
| 修改 | `src/pages/Requirements/components/RequirementDetailDrawer/` — 集成时间线 |
| 修改 | `src/pages/Requirements/RequirementListPage/` — 更新状态映射 |
| 修改 | `src/pages/Requirements/components/RequirementStatusTag/` — 新增状态颜色 |
| 修改 | `src/App.tsx` — 路由指向新评审页面 |
| 修改 | `public/i18n/zh-CN.json` & `en.json` — 新增审批流相关文案 |

