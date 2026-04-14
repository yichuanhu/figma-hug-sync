

## 方案：UI 修复 + 筛选工具栏统一优化

### 一、UI 修复（2项）

#### 1. 自动化流程页面搜索框宽度统一为 320px
**文件**：`src/pages/Development/ProcessDevelopment/index.less`

当前 `&-search-input` 仅设置了 `width: 320px`，在空状态下可能被 flex 布局压缩。添加 `min-width: 320px` 保证固定宽度。

#### 2. 新建发布页面 transfer-container 高度改为 600px
**文件**：`src/pages/Development/ReleaseManagement/CreateReleasePage/components/ProcessSelectionStep/index.less`

第 4 行 `height: calc(100vh - 380px)` → `height: 600px`，保留 `min-height: 400px`。

---

### 二、筛选工具栏优化（3项）

#### 1. 统一所有筛选项 placeholder 为"筛选XXX"格式

需要修改 placeholder 的组件及目标文案：

| 组件/页面 | 当前 placeholder | 改为 |
|-----------|-----------------|------|
| TimeTriggerList - 流程 Select | `timeTrigger.filter.allProcesses` | "筛选流程" |
| TimeTriggerList - 状态 Select | `timeTrigger.filter.allStatus` | "筛选状态" |
| QueueTriggerList - 流程 Select | `queueTrigger.filter.allProcesses` | "筛选流程" |
| QueueTriggerList - 队列 Select | `queueTrigger.filter.allQueues` | "筛选队列" |
| QueueTriggerList - 状态 Select | `queueTrigger.filter.allStatus` | "筛选状态" |
| TemplateManagement - 流程 Select | `template.filterByProcess` | "筛选流程" |
| 所有 DepartmentSelect 筛选 (12处) | `common.owningDepartment` | "筛选归属部门" |
| Sharing 页面 DepartmentSelect | `sharing.filter.department` | "筛选归属部门" |
| Sharing 标签 Select (4处) | `sharing.filter.tags` | "筛选标签" |

**i18n 新增 key**（`zh-CN.json` / `en.json`）：
- `common.filterProcess` → 筛选流程 / Filter Process
- `common.filterStatus` → 筛选状态 / Filter Status
- `common.filterQueue` → 筛选队列 / Filter Queue
- `common.filterDepartment` → 筛选归属部门 / Filter Department
- `common.filterTags` → 筛选标签 / Filter Tags

#### 2. 所有筛选下拉改为多选样式

以下 Select 当前为单选，需添加 `multiple`、`maxTagCount={1}`、`showClear`：

| 文件 | 筛选项 | 改动 |
|------|--------|------|
| `TimeTriggerList/index.tsx` | 流程 Select | 单选→多选，value/onChange 类型改为数组 |
| `TimeTriggerList/index.tsx` | 状态 Select | 单选→多选 |
| `QueueTriggerList/index.tsx` | 流程 Select | 单选→多选，移除"全部"选项 |
| `QueueTriggerList/index.tsx` | 队列 Select | 单选→多选，移除"全部"选项 |
| `QueueTriggerList/index.tsx` | 状态 Select | 单选→多选 |
| `TemplateManagement/index.tsx` | 流程 Select | 单选→多选 |

同时修改对应的过滤逻辑：从 `item.field === value` 改为 `!array.length || array.includes(item.field)`，queryParams 类型从 `string | undefined` 改为 `string[]`。

#### 3. DepartmentSelect 改为非级联选择

**文件**：`src/components/DepartmentSelect/index.tsx`

在 `<TreeSelect>` 上添加 `checkRelation="unRelated"`，使多选时选中父节点不自动选中子节点。

---

### 修改文件汇总

| 类别 | 文件数 | 文件 |
|------|--------|------|
| CSS 修复 | 2 | `ProcessDevelopment/index.less`, `ProcessSelectionStep/index.less` |
| DepartmentSelect | 1 | `DepartmentSelect/index.tsx` |
| 单选→多选 + placeholder | 3 | `TimeTriggerList/index.tsx`, `QueueTriggerList/index.tsx`, `TemplateManagementPage/index.tsx` |
| 仅 placeholder | ~12 | 各管理页面的 DepartmentSelect placeholder、Sharing 页面标签 Select |
| i18n | 2 | `zh-CN.json`, `en.json` |

总计约 **20 个文件**。

