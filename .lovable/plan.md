## 目标

把现有 `Approvals/List`、`Approvals/Detail`、`Admin/ApprovalLevels` 三页对齐到《L1-审批管理 v1.3.0》+《P1-审批 v1.0.2》MVP 规范，移除越界功能（来源筛选、批量通过、流程块/技能审批层级），补齐缺口（BR-APR-005 自跳过、审批耗时、审批历史排序、被拒分流提示）。

---

## 一、差距清单（实现 vs 需求）

| # | 模块 | 现状 | 需求 | 处理 |
|---|------|------|------|------|
| 1 | 待审批工具栏 | RadioGroup「全部 / NATIVE / DEV_CENTER」来源筛选 | P1 §1.1 决策：MVP 类型与来源 1:1，**移除来源筛选** | 删除 |
| 2 | 待审批工具栏 | 仅搜索 + 来源 | 需求要求**资产类型筛选**（自动化流程 / 知识） | 新增 Select |
| 3 | 待审批 / 历史列表 | 含批量勾选、批量栏、批量通过 Modal | Story-001 §1.2 + L1 §3 Story1：**批量通过 Out of Scope (P1)** | 移除 rowSelection / 批量条 / Modal / `batchApprove` 调用 |
| 4 | 待审批数据源 | `getPendingApprovals` 不区分提交人 | BR-APR-005：**本人提交自动跳过**（不可审批自己上架的资产） | `getPendingApprovals` 过滤 `publishedBy !== currentUser.id`；`pendingCount` 同步；侧边栏徽标随之更新 |
| 5 | 审批历史 | 排序按 `submittedAt` 降序 | BR-APR-002：按 `approvedAt`（最后一次 APPROVED/REJECTED 事件时间）**降序** | 排序键改为最后审批事件时间 |
| 6 | 审批历史筛选 | 含「来源」Select | P1 §1.1：移除来源筛选 | 删除 |
| 7 | 审批历史筛选 | 类型 Select 含 SNIPPET / SKILL | MVP 仅 WORKFLOW + KNOWLEDGE | 仅保留 2 项 |
| 8 | 审批历史列 | 缺「审批耗时」列 | P1 §1.1 示例：`✅通过 2h ...` | 新增「耗时」列：`approvedAt - submittedAt`，格式 `Xh / Xd` |
| 9 | 审批历史只展示自己审批的 | 当前展示全部 PUBLISHED/REJECTED | BR-APR-002：`approverId = currentUserId` | 过滤为最后审批事件 `actorName === currentUser.name`（mock 阶段以名称匹配） |
| 10 | 审批层级配置 | 4 行（含 SNIPPET / SKILL） | P1 v1.0.2：仅 **WORKFLOW + KNOWLEDGE** 2 行 | `types` 缩减为 `['WORKFLOW', 'KNOWLEDGE']`；保留底层枚举不动以兼容数据 |
| 11 | 拒绝分流提示 | 拒绝后仅普通 Toast | BR-APR-004a/b：DEV_CENTER 被拒需提示「请回开发中心调整」 | 拒绝成功后按 `source` 分流 Toast 文案；详情页拒绝结果区显示对应分流说明 |
| 12 | 详情页 | 已有内容 + 时间线 | 校验：包含资产基本信息、审批历史时间线、拒绝意见展示 | 仅核对，按需补 source-aware 提示 |

> 选中元素「审批管理1」= 菜单文案 + 待审批徽标 `1`，非 Bug，跳过。

---

## 二、文件改动清单

### 1. `src/pages/SharingCenter/shared/mockData.ts`
- `getPendingApprovals()`：增加 `publishedBy !== currentUser.id` 过滤（自跳过）
- `getApprovalHistory()`：
  - 仅返回最后审批事件的 `actorName === currentUser.name` 的资产
  - 排序键改为最后 APPROVED/REJECTED 事件 `at` 降序
- `pendingCount()`：同样应用自跳过

### 2. `src/pages/SharingCenter/Approvals/List/index.tsx`
- 删除 `pSource / hSource / SourceFilter / batchApprove / batchVisible / selectedKeys / rejectTarget 之外的 batch 状态`
- 工具栏（待审批）：`[搜索 320] [资产类型 ▼ WORKFLOW/KNOWLEDGE]`
- 工具栏（历史）：`[结果 ▼] [资产类型 ▼ WORKFLOW/KNOWLEDGE] [时间范围] [清空]`
- Table：去掉 `rowSelection`；去掉批量栏与确认 Modal
- 历史列：新增「耗时」列（计算 `submittedAt → 最后事件 at`，<24h 显示 `Xh`，否则 `Xd`）
- 历史列：「审批时间」取自最后事件 `at`
- 拒绝成功 Toast 按 `source` 分流：
  - NATIVE → `sharing.approvals.toast.rejectedNative`（提示上架者将在「已拒绝」Tab 修改）
  - DEV_CENTER → `sharing.approvals.toast.rejectedDevCenter`（提示请回开发中心调整）

### 3. `src/pages/SharingCenter/Approvals/Detail/index.tsx`
- 拒绝结果区：根据 `asset.source` 显示分流说明 Banner
- 移除（如有）批量入口

### 4. `src/pages/SharingCenter/Admin/ApprovalLevels/index.tsx`
- `types: AssetTypeKey[] = ['WORKFLOW', 'KNOWLEDGE']`（删除 SNIPPET / SKILL 行）
- `Banner` 文案保留 DEV_CENTER 豁免说明
- 校验保存后 `getApprovalLevel(WORKFLOW|KNOWLEDGE)` 在 `publishNewVersion` 中正确生效（已实现 BR-APR-006）

### 5. `src/pages/SharingCenter/MyShared/store.ts`
- 保留 `batchApprove` 函数（不删，避免 Detail 页未来扩展），仅停止从 List 调用
- 无其他改动

### 6. i18n（`public/i18n/zh-CN.json` + `en.json`）
- 删除：`sharing.approvals.filter.source*`、`sharing.approvals.batch.*`
- 新增：
  - `sharing.approvals.filter.assetType`（资产类型）
  - `sharing.approvals.col.duration`（审批耗时）
  - `sharing.approvals.duration.hours` / `duration.days`
  - `sharing.approvals.toast.rejectedNative` / `rejectedDevCenter`
  - `sharing.approvals.detail.rejectFlowNative` / `rejectFlowDevCenter`

---

## 三、技术细节

```text
耗时计算：
  const start = dayjs(asset.submittedAt);
  const end   = dayjs(lastEvent.at);
  const hours = end.diff(start, 'hour');
  display = hours < 24 ? `${hours}h` : `${Math.round(hours/24)}d`;
```

```text
自跳过：
  getPendingApprovals = getAll()
    .filter(a => a.shareStatus === 'PENDING_APPROVAL'
              && (a.publishedBy ?? a.ownerId) !== currentUser.id)
    .sort(by submittedAt asc);
```

```text
审批历史归属：
  最后一条 type ∈ {APPROVED, REJECTED} 的事件 actorName === currentUser.name
  （Mock 阶段以名称识别；真实接入后改为 approverId 对比）
```

---

## 四、验证

1. 侧边栏「审批管理」徽标数 = 非本人提交的 PENDING_APPROVAL 总数
2. 切换「待审批」/「审批历史」Tab 工具栏正确切换；URL `?tab=` 同步
3. 通过 / 拒绝后：列表项消失、徽标 -1、相应 Toast 出现、分流文案正确
4. 审批历史按最后审批时间降序、含耗时列
5. 审批层级配置只剩 2 行；保存后新提交的 KNOWLEDGE 若设为 NONE，发布后直达 PUBLISHED（已通过 store 验证 `publishNewVersion`）
6. 运行 `node scripts/check-i18n-asset-supply.mjs`（不会涉及）+ 自查 `sharing.approvals.*` zh/en 同步
