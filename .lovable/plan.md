## 目标

在 `ProcessManagementContent`（开发中心-流程开发、调度中心-自动化流程）的筛选弹层中新增两个维度：
- 适用操作系统（Windows / Linux / macOS）
- 开发工程师（多选用户）

## 现状

- 文件：`src/components/ProcessManagement/ProcessManagementContent/index.tsx`
- 当前筛选弹层只有「状态」一个区块，且仅在 `!isSchedulingContext`（开发中心）时显示；调度中心未渲染 `FilterPopover`。
- `LYProcessResponse` 已直接包含 `os?: string | null` 与 `developer_ids?: string[] | null`，可直接用于前端过滤。
- 候选用户来自 `BASIC_INFO_USER_POOL`（`src/mocks/processBasicInfo.ts`）。

## 改动方案

### 1. 调度中心也显示筛选按钮
去掉 `{!isSchedulingContext && <FilterPopover ... />}` 限制，两个上下文都渲染筛选：
- 开发中心：状态 + 适用操作系统 + 开发工程师
- 调度中心：适用操作系统 + 开发工程师（不显示状态区块，保持锁定 `PUBLISHED` 的逻辑）

### 2. 新增筛选状态
```ts
const [osFilter, setOsFilter] = useState<string[]>([]);
const [developerFilter, setDeveloperFilter] = useState<string[]>([]);
```

### 3. 新增筛选区块
- 适用操作系统：`type: 'checkbox'`，选项 Windows / Linux / macOS
- 开发工程师：`type: 'multiSelect'`，选项来自 `BASIC_INFO_USER_POOL`，支持搜索，label 显示 `姓名 · 部门`

### 4. 列表过滤
在 `displayList` 计算中追加：
- `osFilter.length === 0 || (process.os && osFilter.includes(process.os))`
- `developerFilter.length === 0 || (process.developer_ids ?? []).some(id => developerFilter.includes(id))`

### 5. 空状态判定
在 `EmptyState` 的 `noResult` 判定条件中加入 `osFilter.length > 0 || developerFilter.length > 0`。

## 不改动

- 编辑弹窗、详情抽屉、表格列、API 类型
- 其他页面（任务管理、Worker 等）的筛选
