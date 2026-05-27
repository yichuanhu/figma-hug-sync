## 目标

按 `STORY-003-PG-LIFECYCLE-LEDGER` 在流程详情抽屉「详情」Tab 基本信息中新增「生命周期台账」区域，展示开发完成、部署上线、流程下线三个里程碑的当前生效值、原始事件值、来源，并支持有权限用户修正及查看修正历史。

## 范围

- 仅改动 `ProcessDetailDrawer`「详情」Tab 基本信息区域及配套 mock 服务、权限 hook、修正弹窗与历史抽屉/弹窗。
- 不实现自动事件写入逻辑（由 FEAT-025 / FEAT-027 承接）；本 Story 仅在 mock 层预置自动事件作为展示数据。
- 不改流程访问权限、协作者、组织架构。

## 详情

### 1. 基本信息区追加生命周期台账

在 `descriptionData` 末尾追加分组小标题「生命周期台账」并新增三行：

- **开发完成时间** `development_completed_at`
- **部署上线时间** `deployed_at`（未上线时显示 `-`）
- **流程下线时间** `offline_at`（未下线时显示 `-`）

每行渲染：

```text
2026-05-20 10:23  ⓘ  ✎
```

- 主体：当前生效值（`YYYY-MM-DD HH:mm`）。
- `ⓘ` Tooltip：展示「来源：自动记录(发布申请提交) / 手工修正(由 张三 于 ... 修正，原因：...)」+ 原始事件值。来源为 `manual_adjust` 时主体右侧追加小 Tag「已修正」。
- `✎` 铅笔按钮（Lucide `Pencil` size=14）：仅 `canAdjust` 时显示，点击打开修正弹窗。
- 区域底部一行链接「查看修正历史」，点击打开历史弹窗。

权限：整体区域按 `useProcessLifecyclePermission(processId).canView` 控制可见；修正入口按 `canAdjust` 控制（mock 全开，预留 UCI `process_lifecycle.view` / `process_lifecycle.adjust`）。

### 2. 修正弹窗 `LifecycleAdjustModal`

路径：`.../ProcessDetailDrawer/components/LifecycleAdjustModal/`

- 基于 `FormModal`，宽 520px，标题随字段动态：`修正开发完成时间` 等。
- 只读展示：原始事件值、当前生效值。
- 表单字段：
  - 新时间（`DatePicker type="dateTime"`，必填）
  - 修正原因（`TextArea` 1~500 字符，必填，AC-ERR-01）
  - 历史补录（`Switch`，仅修正 `offline_at` 且新值早于 `deployed_at` 时强制要求开启，R-06）
- 校验：
  - 修正原因必填；
  - `offline_at` 默认不得早于 `deployed_at`，除非开启「历史补录」并填写原因。
- 提交调用 `adjustLifecycleMilestone(processId, field, payload)`，成功后 `Toast.success`，触发基本信息局部刷新。

### 3. 修正历史弹窗 `LifecycleHistoryModal`

- `Modal` 宽 720px，标题「修正历史」。
- `Table size="small"`：字段、修正前生效值、修正后生效值、原始事件值、原因、修正人（`UserNameWithCard`）、修正时间。
- 数据来自 `getLifecycleAdjustments(processId)`，按时间倒序。

### 4. Mock 数据与服务

新建 `src/mocks/processLifecycleLedger.ts`：

- 类型：

```ts
type MilestoneSource =
  | 'auto_publish_submit'
  | 'auto_publish_success'
  | 'auto_offline_success'
  | 'manual_adjust';

interface LifecycleMilestone {
  effective_at: string | null;
  original_event_at: string | null;
  source: MilestoneSource;
  manual_note?: { actor_id: string; actor_name: string; at: string; reason: string };
}

interface ProcessLifecycleLedger {
  process_id: string;
  development_completed_at: LifecycleMilestone;
  deployed_at: LifecycleMilestone;
  offline_at: LifecycleMilestone;
}

interface LifecycleAdjustment {
  id: string;
  process_id: string;
  field: 'development_completed_at' | 'deployed_at' | 'offline_at';
  previous_effective_at: string | null;
  new_effective_at: string;
  original_event_at: string | null;
  reason: string;
  backfill: boolean;
  actor_id: string;
  actor_name: string;
  at: string;
}
```

- 服务：`getProcessLifecycleLedger`、`adjustLifecycleMilestone`、`getLifecycleAdjustments`、`subscribeLifecycleLedger`。
- 内存 `Map` 预置 1~2 个流程的台账（含一条「已修正」样例和一条调整历史）。
- 写操作输出 `console.info('[AUDIT] lifecycle …')` 模拟 R-03/R-08 审计。
- 默认遵循 R-07：新自动事件追加 `original_event_at` 与审计，但不覆盖已存在的 `manual_adjust` 当前生效值（仅在 mock helper 中体现，本 Story 不接线自动事件）。

### 5. 权限 Hook

新建 `src/hooks/useProcessLifecyclePermission.ts`：

```ts
export const useProcessLifecyclePermission = (_processId?: string) => ({
  canView: true,
  canAdjust: true,
});
```

预留 UCI：`process_lifecycle.view`、`process_lifecycle.adjust`。

### 6. i18n

在 `public/i18n/zh-CN.json` 与 `en.json` 的 `development.processDevelopment.detail` 下新增：

- `lifecycle.sectionTitle`
- `lifecycle.developmentCompletedAt` / `deployedAt` / `offlineAt`
- `lifecycle.source.autoPublishSubmit` / `autoPublishSuccess` / `autoOfflineSuccess` / `manualAdjust`
- `lifecycle.tag.adjusted`
- `lifecycle.tooltip.original`、`lifecycle.tooltip.manual`
- `lifecycle.viewHistory`、`lifecycle.history.title` 及表头键
- `lifecycle.adjust.title.*`、`lifecycle.adjust.newTime`、`reason`、`backfill`、`backfillHint`、`reasonRequired`、`offlineBeforeDeployed`

## 不改动

- 现有版本/依赖/资料/工时/ROI Tab。
- 发布、停用审批 UI 与业务流。
- 路由、Sidebar、协作者机制。

## ASCII 结构

```text
ProcessDetailDrawer › 详情 Tab › 基本信息
├── ...（流程名/部门/负责人/开发工程师/代码审核员/最近上线审核人）
└── 生命周期台账
    ├── 开发完成时间   2026-05-20 10:23  ⓘ ✎
    ├── 部署上线时间   2026-05-22 09:00  ⓘ ✎  [已修正]
    ├── 流程下线时间   -                 ⓘ ✎
    └── 查看修正历史 ›

弹窗：
  LifecycleAdjustModal  ─ 新时间 + 原因(必填) + 历史补录(可选)
  LifecycleHistoryModal ─ 字段 / 修正前 / 修正后 / 原始事件 / 原因 / 修正人 / 时间
```
