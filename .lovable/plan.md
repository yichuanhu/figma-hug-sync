

## 核对结论：成本预估实现 vs STORY-010

对照 `story-010-RC-COST-ESTIMATION-2.md` 与现有实现 `CostEstimateTab/index.tsx`，逐项核对。

### ✅ 已符合
1. **人力成本**：按角色 × 人数 × 人天，单价表（产品 1500 / 后端 1800 / 前端 1500 / 测试 1200）已落地。
2. **非人力成本**：基础设施 / 第三方 / 其他，三项独立录入。
3. **自动汇总**：总人天、总人力、非人力、总成本实时计算并只读展示。
4. **ROI 备注**：可选输入字段已存在。
5. **持久化**：保存写回 `costEstimate`，并自动追加版本快照。

### ⚠️ 与需求文档不一致

**问题 1：可编辑状态判定写反了**
- Story-010 要求：**APPROVED 之后**（即审批通过、进入评估/开发阶段）允许编辑成本；DRAFT/PENDING 阶段不应编辑。
- 当前代码：
  ```ts
  const editableStatuses = ['PENDING_PROJECT', 'DEVELOPING'];
  const editable = editableStatuses.includes(data.status);
  ```
  其中 `data.status` 实际是 `developmentStatus`（取值 `NOT_STARTED / ASSESSING / DEVELOPING / TESTING / LAUNCHED / OFFLINE`），**根本没有 `PENDING_PROJECT` 这个值**，导致几乎所有需求点进去都是锁定状态，而我之前自己在计划 §2.3 写的也是"APPROVED 之后允许编辑；ASSESSING/DEVELOPING 只读" —— 同样与 Story 原文相反。
- 应改为：`approvalStatus === 'APPROVED'` 且 `developmentStatus ∈ {ASSESSING, DEVELOPING, TESTING}` 时可编辑；`LAUNCHED / OFFLINE` 只读归档。

**问题 2：角色单价来源**
- Story-010 要求：单价从 **激活 Scheme 的 `cost_config.dailyRateByRole`** 读取，允许不同方案配置不同单价。
- 当前代码：单价硬编码在组件常量 `ROLE_DAILY_RATE` 里。
- 影响：第 2 批（Scheme 动态配置）落地前可接受，但需标记为 TODO，第 2 批同步替换。

**问题 3：角色枚举**
- Story-010 列出的标准角色：**产品 / 后端 / 前端 / 测试**（4 项）。
- 当前代码：多了 `designer / ops`（设计师 / 运维），共 6 项。
- 这不是严重问题，但偏离了 Story 标准枚举，建议收敛回 4 项，或在 Scheme cost_config 落地后由方案自行配置。

**问题 4：锁定文案 key 与状态判断不符**
- 当前代码使用 `LAUNCHED / OFFLINE` 判断"是否归档不可编辑"，但 banner 文案 key 是 `lockedBeforeApproval`（"审批前不可编辑"），逻辑与文案错位。

### 🔧 修复建议（待你确认是否执行）

| # | 修复点 | 优先级 |
|---|------|------|
| 1 | 把可编辑判定改为 `approvalStatus==='APPROVED' && developmentStatus ∈ {ASSESSING,DEVELOPING,TESTING}` | 高（功能阻塞） |
| 2 | 角色枚举收敛回 产品/后端/前端/测试 4 项 | 中 |
| 3 | 锁定 banner 文案按场景分两种：`未审批通过，暂不可编辑` / `已上线/下线，仅查看` | 中 |
| 4 | 单价改读 Scheme `cost_config` —— **延后到第 2 批一起做** | 低（依赖动态 Scheme） |

### 📋 执行计划（若批准）

仅改一个文件：`src/pages/Requirements/RequirementsWorkbench/components/RequirementDetailDrawer/CostEstimateTab/index.tsx`
- 替换 editable 计算逻辑（接收 `approvalStatus` 与 `developmentStatus`）
- 收敛 `ROLE_DAILY_RATE` 至 4 项；同步移除 i18n 中 designer/ops 的 key
- 拆分 lockedReason 文案，新增 `lockedAfterLaunch` i18n key（zh + en）

