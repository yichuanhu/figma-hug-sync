## 目标

在开发中心「自动化流程」列表中，明确预置 3 个 **PUBLISHED** 流程，分别覆盖停用申请的三种典型场景，便于演示与回归。

## 三个目标流程（选用列表中已有的 PUBLISHED 流程，按 `index % 3 === 1` 命中）

| 流程 ID | 流程名 | 场景 | 归属部门 | 期望行为 |
|---|---|---|---|---|
| `process-2` | Expense Reimbursement Approval | **A. 有依赖，禁止停用** | `dept-finance`（财务部） | 打开「申请停用」弹窗后展示阻塞依赖清单（触发器 + 运行中任务 + 调度引用），提交按钮禁用 |
| `process-5` | Contract Approval Flow | **B. 无依赖，无需审批** | `dept-legal`（法务部，**未绑定** PROCESS_OFFLINE 模板） | 依赖检查通过，填写原因后提交直接 `EXECUTED`，Toast 提示「已下线」 |
| `process-8` | Inventory Check Flow | **C. 无依赖，需走审批** | `dept-apa-product`（已绑定 `oflow-001`） | 依赖检查通过，提交后进入 `PENDING_APPROVAL`，记录可在停用审批列表中看到 |

> `process-2` 当前在 `processOfflineApproval.ts` 的 `defaultRequests` 中已存在一条历史申请（`por-004`，无依赖+无审批），与新的「有依赖」场景冲突 —— 计划中会移除该条 mock，由场景 B 的 `process-5` 替代演示「无依赖直接执行」的历史记录。

## 实施步骤

### 1. `src/components/ProcessManagement/ProcessManagementContent/index.tsx`

在 `generateMockLYProcessResponse` 中，为上述三个 index（1 / 4 / 7）强制覆写 `owning_department_id` / `owning_department_name` 为对应的真实部门树 ID（`dept-finance` / `dept-legal` / `dept-apa-product`），确保停用提交时的部门 → 审批模板查找命中预期分支。其它流程保持现状。

### 2. `src/mocks/processOfflineApproval.ts`

- 新增一个显式 scenario 覆写表 `OFFLINE_SCENARIO_OVERRIDES: Record<string, DependencyCheckSnapshot>`：
  - `process-2`：`blocking: true`，包含 1 个启用中的 TIME 触发器、1 个任务模板、1 个 RUNNING 任务、1 个调度引用
  - `process-5`：完全空依赖（`blocking: false`）
  - `process-8`：完全空依赖（`blocking: false`）
- 修改 `buildDependencySnapshot(processId, processName)`：如命中覆写表则直接返回覆写值，否则保留原 hash 逻辑（不影响其它流程）。
- 调整 `defaultRequests`：
  - 删除既有的 `por-004`（process-2 历史申请，与场景 A 冲突）。
  - 新增一条已 `EXECUTED` 的历史申请用于呼应场景 B（`process-5` / `dept-legal`，无审批直接执行），便于在停用审批列表中看到「已执行」样例。
- 由于使用了 `localStorage` 缓存（key `apa.processOfflineApproval.v1`），bump key 到 `v2` 以让浏览器自动重置，保证三种场景立即生效。

### 3. 验证（手动）

- 进入 `/process-development`，三条目标流程行操作菜单中均出现「申请停用」。
- `process-2`：弹窗显示阻塞依赖列表，提交按钮禁用。
- `process-5`：弹窗显示「无依赖」，填写原因 → 提交 → Toast「已下线」，流程状态变化（接现有逻辑）。
- `process-8`：弹窗显示「无依赖」，提交后进入待审批，可在停用审批列表中看到 `PENDING_APPROVAL` 记录。

## 不改动

- 不修改 OfflineRequestModal 交互与文案。
- 不修改 PROCESS_OFFLINE 绑定数据。
- 不改动其它流程的依赖判定行为。