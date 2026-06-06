## 目标

实现 STORY-011：在任务列表（`TaskManagementPage`）增加「导出」按钮，按当前搜索/筛选/排序条件导出任务清单为 `.xlsx` 文件。本期为前端 Mock 实现（页面与 `fetchTaskList` 都在前端 mock 里），不涉及后端接口；交互、字段、校验、限额按 Story 全部落地，便于后续替换为真实 `POST /api/tasks/list/export`。

## 方案

### 1. 入口与位置

`TaskManagementPage` 工具栏 `toolbar-actions` 区，新增「导出」按钮，放在「刷新」与「新建任务」之间：

```
[刷新]  [导出]  [新建任务(primary solid)]
```

- 图标用 lucide `Download`，theme 默认（非 primary），不抢「新建任务」的视觉权重。
- 按钮 disabled 条件：列表 `loading` 时禁用。

### 2. 导出流程（AC-FUNC-01/02/04/06、AC-ERR-01/02）

点击「导出」时：

1. 复用当前筛选条件（与 `loadData` 完全一致的参数集合）调用一次 `fetchTaskList`，但 `offset=0, size=10001`（上限 +1，用于探测是否超限）。
2. 根据返回的 `total`（叠加权限后的命中数；mock 下即过滤后数量）：
   - `total === 0` → `Toast.info('当前筛选条件下没有可导出的任务')`，不弹确认框，不生成文件。**(AC-FUNC-04)**
   - `total > 10000` → `Toast.warning('当前筛选结果超过 10,000 条，请缩小筛选范围后重新导出')`，不生成文件。**(AC-ERR-02, R-06)**
   - `0 < total ≤ 10000` → 弹出 `Modal.confirm` 确认框（见 §3）。
3. 用户确认后，使用已拿到的 `list`（截断到 `total` 条）写 `.xlsx`，触发浏览器下载；成功后 `Toast.success('导出成功，共 N 条')`。**(AC-FUNC-06)**
4. 任一步骤异常 → `Toast.error('导出失败，请稍后重试')`，筛选条件保持不变。**(AC-ERR-01)**

整个过程用本地 `exporting` state 控制按钮 loading 态，避免重复点击。

### 3. 导出确认 Modal（步骤 2 要求）

`Modal.confirm`，标题「导出任务清单」，内容展示：

- 「导出范围：当前筛选条件下的全部任务」
- 「预计导出数量：**N** 条」
- 当前生效的筛选条件摘要（复用现有 chips 文案逻辑生成的纯文本列表，最多列 8 条，超出折叠为「等 N 项筛选」）。

按钮：「确认导出」/「取消」。

### 4. 导出字段（AC-FUNC-03, §3.3）

按 Story 顺序生成列，全部从 `LYTaskResponseExt` 现有字段派生，**不含**输入参数 / 凭据 / 输出参数 / 日志 / 截图 / 录屏本体（AC-ERR-03, R-05）：

| 列名 | 来源 |
|---|---|
| 任务编号 | `task_id` |
| 流程名称 | `process_name` |
| 任务状态 | `t(taskStatusConfig[task_status].i18nKey)` |
| 执行目标 | `execution_target_name`（含 group/单机，已合并） |
| 所属触发器 | `trigger_name` ?? `trigger_id` ?? `t('task.triggerSource.' + trigger_source)` 降级 |
| 任务创建时间 | `dayjs(create_time).format('YYYY-MM-DD HH:mm:ss')` |
| 优先级 | `t(priorityConfig[priority].i18nKey)` |
| 是否录屏 | `enable_recording ? '是' : '否'` |
| 是否包含任务截图 | `has_screenshot ? '是' : '否'` |
| 创建人 | `creator_name` |
| 所属部门 | `owning_department_name` |

文件名：`任务清单_YYYYMMDD_HHmmss.xlsx`。

### 5. 文件生成

使用项目已安装的 `xlsx`（`node_modules/xlsx` 已存在，无需新增依赖）：

```ts
import * as XLSX from 'xlsx';
const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, '任务清单');
XLSX.writeFile(wb, fileName);
```

`writeFile` 会直接触发浏览器下载，无需 file-saver。

### 6. 国际化

文案统一走 `t()`，新增 key 到 `public/i18n/zh-CN.json` 与 `public/i18n/en.json`：

- `task.export` = 导出 / Export
- `task.exportConfirmTitle` = 导出任务清单 / Export Task List
- `task.exportConfirmScope` = 导出范围：当前筛选条件下的全部任务 / ...
- `task.exportConfirmCount` = `预计导出数量：{{count}} 条` / `Estimated count: {{count}}`
- `task.exportEmpty` / `task.exportOverLimit` / `task.exportSuccess` / `task.exportFailed`
- 表头 11 个 key（`task.export.column.*`）

### 7. 不在范围内（与 Story 一致，明确不做）

- 不导出日志、截图、录屏、入参、出参、凭据值。
- 不做定时 / 订阅式导出。
- 不新增导出权限项（沿用列表查看权限；mock 不涉及）。
- 不实现审计日志写入（R-07，后端能力，前端 mock 仅在 `console.info` 留痕，便于后续替换）。
- 仅本任务列表页（`TaskManagementPage`）落地，不同步到其他列表。

## 涉及文件

- `src/pages/Scheduling/TaskManagement/TaskManagementPage/index.tsx`
  - 新增 `exporting` state、`handleExport`、`buildExportRows`、确认 Modal。
  - 工具栏新增「导出」按钮。
- `public/i18n/zh-CN.json`、`public/i18n/en.json`：新增上述 key。
- 不新增依赖（`xlsx` 已在 `node_modules`，确认在 `package.json` 中存在即可；若仅是 transitive，则 `bun add xlsx` 一次）。

## 验证

- 不加任何筛选 → 导出，文件包含全部 58 条 mock 任务、字段顺序与表头一致。
- 设置「流程 = Auto Order Processing」+「状态 = COMPLETED」→ 确认框显示对应数量；导出文件行数 = 数量。
- 筛选到 0 条 → 不弹确认框，Toast 提示空结果。
- Mock 临时把 `generateMockTaskList` 改为 11000 条本地验证超限分支（验证完恢复）。
- 单选/多选部门 + 包含子部门 → 导出数量与列表显示一致（沿用 `effectiveDepartmentFilter`）。
