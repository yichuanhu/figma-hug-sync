# 流程级工时 v4/v5 全量改造方案

依据 `story-001-DEFT-PROCESS-EFFORT.md` 对现有"开发工时"模块做行为级改造。

## 一、当前实现 vs Story v4/v5 差异

| 维度 | 当前 | v4/v5 目标 |
| --- | --- | --- |
| 数据字段 | estimate / actual（派生） | + **remaining**（可编辑、可派生扣减） |
| entry 写入 | POST / **PUT / DELETE** 三件套 | **append-only**：仅 POST；纠错走负值 entry |
| delta 范围 | `> 0`，1 位小数，≤999 | `[-9999.99, 9999.99] \ {0}`，2 位小数 |
| work_date | 不可未来 | `[today-90d, today]` |
| estimate | `>0`，1 位小数，≤999 | `(0, 9999.99]`，2 位小数 |
| 进度 | `actual / estimate` | `actual / (actual + remaining)` |
| 偏差 | 未单独展示 | `actual - estimate`，独立指标 |
| 权限 | `creatorId === CURRENT_USER_ID` | 流程编辑权限（mock 仍复用 creator 判定，但概念改名 `canEdit`） |
| 累计非负 | 不校验 | 写入后 SUM ≥ 0，否则 409 回滚 |
| remaining 上限保护 | 无 | 负值纠错后 remaining 不得 > 9999.99 |
| 发布耦合 | 无校验（已符合） | 保持，确认无新增挂钩 |
| 表格操作列 | 编辑 / 删除 | **删除整列** |

## 二、改造文件清单

### 1. `src/components/ProcessManagement/ProcessManagementContent/mocks/effortStore.ts`
- `EffortRecord` 增加 `remaining: number | null`
- `EffortSnapshot` 增加 `remaining`、`progress_rate`（actual/(actual+remaining)）、`variance_days`（actual-estimate）、`is_overrun`
- `putEstimate` 改名/合并为 `putEffort(processId, userId, { estimate?, remaining? })`：
  - 任一字段缺失 = 不更新（AC-FUNC-02）
  - estimate 仅当 remaining 为空时初始化 `remaining = estimate`（AC-FUNC-01）
  - 校验 `0 < est ≤ 9999.99`、`0 ≤ rem ≤ 9999.99`、2 位小数；非法抛 `invalid_value`
- `postEntry`：
  - 校验 `delta ≠ 0 && |delta| ≤ 9999.99 && 2 位小数`，非法抛 `invalid_delta`
  - 校验 `work_date ∈ [today-90d, today]`，非法抛 `invalid_date`
  - 计算 newSum；若 `< 0` 抛 `negative_total`
  - 计算 newRemaining：`max(0, current - delta)`；若 `newRemaining > 9999.99` 抛 `remaining_over_limit`，不写入 entry
  - 全部通过后：push entry + 更新 `record.remaining = newRemaining`
- **删除** `putEntry` / `deleteEntry`（append-only）
- 错误码集合调整：`forbidden | invalid_value | invalid_delta | invalid_date | negative_total | remaining_over_limit | invalid_note`
- `seedEffort` / 现有预置：补充 `remaining` 初始值

### 2. `src/api/index.ts`
- `LYProcess` 增加：`effort_remaining_days?`、`effort_progress_rate?`、`effort_variance_days?`、`is_overrun?`
- 保留 `LYProcessEffortEntry`（字段对齐 Story 5.1）

### 3. `EffortTab/index.tsx`
- 顶部摘要区从 2 列改为 **5 列**：预估工时（可编辑） / 已登记工时（只读、超预估高亮） / 剩余工时（可编辑） / 工时进度 / 预估偏差
  - 进度计算改为 `actual / (actual + remaining)`，分母为 0 显示 `--`
  - 偏差显示 `+1.0` / `-0.5`；estimate 为空显示 `--`
- 估时/剩余工时输入：`precision={2} step={0.5} max={9999.99}`，blur 提交 `putEffort`
- 表格操作列整列移除（append-only）
- "登记一笔"按钮始终可见（有编辑权限），无 entry 时空态保留
- 弹窗复用 `EffortEntryModal`，仅做创建模式（去 edit 分支）

### 4. `EffortTab/EffortEntryModal.tsx`
- 仅保留"新建"模式，移除 `editingEntry` 入参与 `putEntry` 调用
- `delta_days` 校验改为：必填、`≠ 0`、`-9999.99 ~ 9999.99`、最多 2 位小数；`precision={2}`，移除 `min`，允许负数
- `work_date` 用 `disabledDate` 限制 `[today-90d, today]`；默认今天；保留回车提交
- `note` 上限 200 字符（已符合）
- 失败时根据 `EffortError.code` Toast 对应文案（含新错误码）

### 5. `EffortTab/index.less`
- 摘要区新增 `effort-tab-field` 横向 5 列布局：`display: flex; gap: 32px; flex-wrap: wrap`
- `is-over` 红色保留；新增 `.is-positive` / `.is-negative` 偏差色

### 6. 国际化（`public/i18n/zh-CN.json` 与 `en.json`）
- 在 `development.processDevelopment.detail.effort` 命名空间增加：
  - `remainingLabel` / `remainingPlaceholder` / `remainingSaved`
  - `progressLabel` / `varianceLabel`
  - `errors.invalid_value`、`errors.negative_total`、`errors.remaining_over_limit`、`errors.invalid_date`（含 90 天提示文案）
  - `modal.dateHint`：「最多补登 90 天前，多天工时可合并登记并归属所选日期」
- 移除已废弃的 `deleteConfirmTitle` / `deleteConfirmContent` / `deleteSuccess` / `editTitle` / `updateSuccess`

### 7. 发布解耦确认
- 扫描 `ProcessDetailDrawer/index.tsx` 与发布相关文件，确认**不存在**任何"发布前置工时校验"。如有则删除（按 v4 R-03/R-08）。

## 三、不在本次范围

- 后端 / 数据库 Migration（仅 mock store）
- 需求级聚合（STORY-002）/ 运营仪表盘（STORY-003），即 `RequirementsWorkbench/EffortTab` 仅在字段访问层做兼容（读取 `effort_remaining_days` 时不报错），不改交互
- 真实权限模型接入（mock 仍以 `creatorId === CURRENT_USER_ID` 代表"有编辑权限"，变量改名 `canEdit`）

## 四、验收映射（关键 AC）

- AC-FUNC-01/02/03 → `putEffort` 合并接口
- AC-FUNC-07/08 → `postEntry` 正/负 delta + remaining 联动
- AC-FUNC-15 → 进度 `actual/(actual+remaining)`
- AC-ERR-05/06 → 弹窗 delta 校验
- AC-ERR-07/08 → 弹窗日期 `disabledDate`
- AC-ERR-09 → `negative_total` 回滚
- AC-ERR-10 → `remaining_over_limit` 回滚
