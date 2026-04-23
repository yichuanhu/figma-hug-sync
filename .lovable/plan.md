

## 规划：丰富升级状态的 Mock 数据与可视化呈现

### 一、目标

让升级流程的所有中间态在 Demo 中"可见、可点、可感知"。当前 mock 中绝大多数 worker 处于 `NONE` 状态，看不到「等待空闲」「升级中」「升级失败」等关键场景。本次扩充覆盖全部状态机分支，并补齐对应的 UI 表现。

### 二、Mock 数据扩充（按设备分组，同 `machine_code` 共享）

在 `src/pages/Scheduling/WorkerManagement/index.tsx` 的 mock 数据中规划 6 类典型设备样本：

| # | 设备（machine_code） | 机器人构成 | upgrade_status | 演示场景 |
|---|---|---|---|---|
| 1 | DESKTOP-A1B2 | 3 台，全部 IDLE，版本 v6.7.0 | `NONE` + 有可用升级 | 标准"可立即升级"——Popover 显示升级按钮 |
| 2 | DESKTOP-C3D4 | 3 台：1 BUSY + 2 IDLE，版本 v6.7.0 | `QUEUED`，target v6.8.0 | 等待空闲——蓝色 Tag「等待空闲后升级」+ Tooltip 列出 BUSY 机器人 |
| 3 | DESKTOP-E5F6 | 4 台：3 BUSY + 1 IDLE，版本 v6.7.2 | `QUEUED`，target v6.8.0 | 多机器人阻塞——Tooltip 显示「3 台正在执行任务」 |
| 4 | DESKTOP-G7H8 | 2 台，全部 IDLE，版本 v6.7.0 | `UPGRADING`，target v6.8.0 | 升级指令已下发——蓝色 Tag「升级中」带 Spin 图标，操作不可取消 |
| 5 | DESKTOP-I9J0 | 2 台 IDLE，版本 v6.6.5 | `FAILED`，target v6.8.0，failed_reason="网络超时" | 升级失败——红色 AlertCircle 图标，hover 显示失败原因 + "重试"入口 |
| 6 | DESKTOP-K1L2 | 3 台：2 OFFLINE + 1 FAULT，版本 v6.7.0 | `QUEUED`（OFFLINE 自动排队） | 全离线设备——灰色 Tag「重新上线后自动升级」 |

另保留若干已是最新版（v6.8.0）的设备作为对照组，确保升级徽标只出现在低版本上。

### 三、UI 状态呈现规范

**客户端版本列**（每行右侧根据 `upgrade_status` 渲染对应标识）：

| 状态 | 视觉 | 交互 |
|---|---|---|
| `NONE` + 有升级 | 主色 `ArrowUpCircle` 徽标 | hover Popover：当前→目标版本、关联机器人列表、「升级客户端版本」按钮 |
| `QUEUED`（有 BUSY） | 蓝色 Tag「等待空闲后升级」+ 时钟图标 | Tooltip：「正在等待 X 完成任务」最多 3 条 + 「等 N 台」 |
| `QUEUED`（全 OFFLINE） | 灰色 Tag「重新上线后自动升级」 | Tooltip：「设备离线，恢复连接后自动执行」 |
| `UPGRADING` | 蓝色 Tag「升级中」+ 旋转 `Loader2` 图标 | Tooltip：「正在升级到 vX.Y.Z，预计 1-2 分钟」 |
| `FAILED` | 红色 `AlertCircle` 图标 + 红色文字「升级失败」 | Popover：失败原因 + 主色「重试升级」按钮 |
| 已是最新 | 不展示徽标 | — |

**详情抽屉「主机信息」分区**：版本号下追加状态描述行——
- `QUEUED`：灰色文字「已预约升级到 v6.8.0，将在该客户端关联机器人全部空闲后自动执行」+ 「取消预约」文字按钮
- `UPGRADING`：蓝色文字「正在升级到 v6.8.0…」+ Spin
- `FAILED`：红色文字「升级失败：{reason}」+ 「重试」文字按钮

**详情抽屉头部按钮**联动：
- `NONE` + 可升级 → 「升级客户端版本」（主色）
- `QUEUED` → 「取消预约」（红色文字）
- `UPGRADING` → 「升级中…」（置灰禁用）
- `FAILED` → 「重试升级」（主色）

**批量 Action Bar** 按勾选行的状态聚合：
- 包含可升级 → 显示「升级客户端版本」
- 包含 QUEUED → 追加「取消预约」
- 全为 UPGRADING → 全部按钮置灰，提示「升级进行中无法操作」

### 四、技术要点

- 在 `src/mocks/clientVersionData.ts` 旁新增/扩充 `mockUpgradeStates` 用于演示，按 `machine_code` 写入 `upgrade_status` / `upgrade_target_version` / `upgrade_failed_reason`
- 列表 mock（`WorkerManagement/index.tsx`）调整若干现有条目的 `machine_code` 与 `client_version`，与上述 6 组场景对齐
- `utils/upgrade.ts` 增补：
  - `getUpgradeBadgeMeta(worker, peers)` 返回 `{ kind, color, icon, label, tooltip }` 供列表与抽屉复用
  - `isCancelable(status)`：仅 `QUEUED` 可取消
- 新增组件 `UpgradeStatusBadge`（位于 `WorkerManagement/components/UpgradeStatusBadge/`）封装上述六态渲染，保证列表/抽屉/批量栏视觉一致
- i18n key 扩充：`worker.upgrade.status.queued` / `queuedOffline` / `upgrading` / `failed` / `retry` / `cancelTooltip` 等
- "重试升级"复用现有 `UpgradeDeviceModal`，预填该客户端

### 五、不变项

- 设备聚合规则、Admin Hub 启用版本读取、Console / NotConsole 分组、确认弹窗的「预约升级」逻辑保持不变
- 不引入新的菜单入口；操作仍集中在 Popover、批量栏、详情抽屉头部三处
- 术语继续遵循"客户端 / 关联机器人"，不再出现"设备"

