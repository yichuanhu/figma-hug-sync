
## 目标
让需求中心的演示数据形成完整闭环，覆盖「待我审批 / 待我评估 / 被驳回 / 已撤回」四类核心场景，并明确「历史版本」与「驳回 / 撤回后处置」的产品逻辑。

## 一、问题诊断（基于现有 mock 与逻辑）

阅读 `mockData.ts` / `types.ts` / `ApprovalSection.tsx` 后梳理：

| 问题 | 现状 | 闭环缺口 |
|---|---|---|
| 待我审批数据 | 多数 mock 数据的 `approvalFlowConfig.levels[].approvers` 不含 `MOCK_CURRENT_USER_ID` | 当前用户进入「待我审批」Tab 看不到可操作数据 |
| 待我技术评估数据 | 评估状态（`assessmentStatus = ASSESSING`）的数据未把当前用户配置为评估人 | 「待我评估」Tab 空 |
| 被驳回（REJECTED） | 有 mock 数据，但当前用户非 creator 时看不到「重新提交」入口；且重新提交后状态流转未演示 | 驳回后无可视化闭环 |
| 已撤回（WITHDRAWN） | 既无 mock 数据，也没看到「撤回历史」筛选；列表里看不到此类条目 | 撤回闭环缺数据 |
| 历史版本（historyVersions） | 由"重新提交 / 编辑发布"等动作触发快照，但当前 mock 中几乎为空 | 看不到版本演进 |

## 二、产品逻辑澄清（写入文档，不改运行时）

### 1. 历史版本的来源
触发"快照入 `historyVersions`"的三类动作（已在代码中存在）：
- **重新提交（resubmit）**：被驳回后，creator 修改并再次提交，旧版本入历史。
- **审批通过后再次编辑发布**：APPROVED 状态下二次编辑形成新版本。
- **撤回后重新发起**：WITHDRAWN 状态下编辑并重新提交。

每条历史版本包含：版本号、快照内容（标题/描述/表单/评估/成本）、变更人、变更时间、变更摘要。

### 2. 被驳回数据的处置路径
```text
PENDING_APPROVAL ──reject──▶ REJECTED
                                 │
        creator 编辑 ────────────┤
                                 ├─▶ resubmit ──▶ PENDING_APPROVAL（旧版入 historyVersions）
                                 └─▶ 放弃（保持 REJECTED，可后续删除/归档）
```
- 仅 creator 可见「重新提交」按钮（已实现）。
- 重新提交时审批流重置到 L1，原审批历史保留在 `approvalHistory`。

### 3. 撤回数据的处置路径
```text
PENDING_APPROVAL ──creator withdraw──▶ WITHDRAWN
                                          │
                       creator 编辑 ──────┤
                                          ├─▶ 重新提交 ──▶ PENDING_APPROVAL
                                          └─▶ 删除
```

## 三、实现方案

### 1. 扩充 `mockData.ts` 覆盖闭环场景
在现有 mock 列表基础上**追加 6 条**（不删除已有数据，避免影响其他演示）：

| # | 标题 | 状态组合 | 用途 |
|---|---|---|---|
| M1 | 财务报表自动汇总 | PENDING_APPROVAL · 当前节点审批人含当前用户 | 「待我审批」可见 + 可操作 |
| M2 | 客户工单智能分类 | PENDING_APPROVAL · 多级流，L1 已通过，L2 当前用户 | 演示中间层级审批 |
| M3 | 发票 OCR 录入 | APPROVED + ASSESSING · `assessmentAssignees` 含当前用户 | 「待我评估」可见 |
| M4 | 合同审批流转 | REJECTED · creator = 当前用户 · 含 1 条历史版本 | 「被驳回」可重新提交 |
| M5 | 库存盘点机器人 | WITHDRAWN · creator = 当前用户 · 含 2 条历史版本 | 「已撤回」可见 + 可重新提交 |
| M6 | 月结对账自动化 | APPROVED · 含 3 条历史版本（v1 草稿 → v2 审批通过 → v3 二次发布） | 历史版本演进展示 |

为每条 mock 补齐：
- `approvalHistory`（含通过/驳回/撤回事件，带时间与评论）
- `historyVersions`（含 version / snapshot / changedBy / changedAt / summary）
- `assessmentAssignees`（M3 专用）

### 2. 在列表筛选/Tab 中暴露已撤回
检查 `RequirementsList` 的状态筛选项：
- 若已包含 `WITHDRAWN` 选项，仅需 mock 数据即可可见；
- 若缺失，补一个状态筛选枚举值与 i18n 文案（`requirements.status.withdrawn` / "已撤回"），不改其他逻辑。

### 3. 文档同步
- 更新 `.lovable/plan.md` 「领域边界」章节，新增「**状态闭环**」小节，写入：
  - 历史版本来源
  - 驳回处置路径
  - 撤回处置路径
- 不新增 memory（属于一次性演示数据补全）。

## 四、不做的事
- 不重构现有审批/评估业务逻辑。
- 不删除/重命名现有 mock 字段。
- 不调整列表与抽屉 UI 结构（仅补 i18n + 筛选枚举）。

## 涉及文件
- `src/pages/Requirements/RequirementsWorkbench/mockData.ts`（追加 6 条 mock + 历史版本 + 审批历史）
- `src/pages/Requirements/RequirementsWorkbench/index.tsx` 或对应 List 组件（补 WITHDRAWN 筛选项，若缺失）
- `public/i18n/zh-CN.json` / `public/i18n/en.json`（补可能缺失的 i18n 文案）
- `.lovable/plan.md`（追加「状态闭环」小节）
