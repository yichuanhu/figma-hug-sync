

## 方案：统一筛选栏布局顺序与筛选框自适应宽度

### 一、自动化流程页面筛选项顺序调整

**文件**：`src/pages/Development/ProcessDevelopment/index.tsx`

当前顺序：`搜索框 → FilterPopover（筛选） → DepartmentSelect（归属部门）`
队列页面顺序：`搜索框 → DepartmentSelect（归属部门） → FilterPopover（筛选）`

将 `DepartmentSelect` 移到 `FilterPopover` 前面，与队列页面保持一致。

---

### 二、所有筛选下拉框宽度改为自适应

当前所有非 DepartmentSelect 的筛选 Select 均使用 `style={{ width: 200 }}`，需改为 `style={{ width: 'auto', minWidth: 120 }}`，使宽度跟随 placeholder 文字长度自适应。

DepartmentSelect 已有 `width: 'auto', minWidth: 120, maxWidth: 600`，无需修改。

需修改的文件和筛选项：

| # | 文件 | 筛选项 | 当前 width | 改为 |
|---|------|--------|-----------|------|
| 1 | `TimeTriggerList/index.tsx` | 流程 Select | 200 | auto, minWidth: 120 |
| 2 | `TimeTriggerList/index.tsx` | 状态 Select | 200 | auto, minWidth: 120 |
| 3 | `QueueTriggerList/index.tsx` | 流程 Select | 200 | auto, minWidth: 120 |
| 4 | `QueueTriggerList/index.tsx` | 队列 Select | 200 | auto, minWidth: 120 |
| 5 | `QueueTriggerList/index.tsx` | 状态 Select | 200 | auto, minWidth: 120 |
| 6 | `TemplateManagementPage/index.tsx` | 流程 Select | 200 | auto, minWidth: 120 |
| 7 | `WorkerManagement/index.tsx` | 分组 Select | 200 | auto, minWidth: 120 |
| 8 | `ReleaseListPage/index.tsx` | 发布者 Select | 200 | auto, minWidth: 120 |
| 9 | `Showcases/index.tsx` | 标签 Select | 200 | auto, minWidth: 120 |
| 10 | `APASkills/index.tsx` | 标签 Select | 200 | auto, minWidth: 120 |
| 11 | `ACPSkills/index.tsx` | 标签 Select | 200 | auto, minWidth: 120 |
| 12 | `CreatorComponents/index.tsx` | 标签 Select | 200 | auto, minWidth: 120 |

---

### 修改文件汇总

| 改动类型 | 文件数 |
|---------|--------|
| 顺序调整 | 1（ProcessDevelopment） |
| 宽度自适应 | 12（上表所列） |

总计 **12 个文件**，改动量极小（每处仅修改 style 属性或调换 JSX 顺序）。

