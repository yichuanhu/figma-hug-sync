

## 方案：统一筛选框宽度与空状态布局一致性

### 问题分析

**问题 1：DepartmentSelect 筛选框 placeholder 被截断**
所有 14 个页面的 DepartmentSelect 使用 `minWidth: 120`，但 "筛选归属部门" 需要约 140-150px，导致 placeholder 被截断为 "筛选归属..."。需要将 `minWidth` 从 120 调大。

**问题 2：空数据时搜索框/筛选框宽度塌陷**
大部分页面的搜索框只设了 `width: 320px`，没有 `min-width`。当表格无数据时，flex 布局可能压缩宽度。只有 `ProcessDevelopment` 加了 `min-width: 320px`，其他页面均缺失。

另外 `TimeTriggerList` 和 `QueueTriggerList` 搜索框宽度为 260px，与其他页面的 320px 不一致。

---

### 修改清单

#### A. DepartmentSelect minWidth 统一调大（14处）

所有页面的 `style={{ width: 'auto', minWidth: 120, maxWidth: 600 }}` 改为 `minWidth: 150`，确保 "筛选归属部门" 不被截断。

涉及文件：ProcessDevelopment、ProcessManagementContent、TimeTriggerList、QueueTriggerList、TemplateManagementPage、TaskManagementPage、WorkerManagement、WorkerGroupManagement、Showcases、RequirementsWorkbench、FileManagementContent、ParameterManagementContent、CredentialManagementContent、QueueManagementContent

#### B. 搜索框添加 min-width 防空状态塌陷（16个 .less 文件）

为所有 `width: 320px` 的搜索框 CSS 补充 `min-width: 320px`：

| 文件 | 当前 |
|------|------|
| ProcessManagementContent/index.less | 仅 width: 320px |
| QueueManagementContent/index.less | 仅 width: 320px |
| FileManagementContent/index.less | 仅 width: 320px |
| ParameterManagementContent/index.less | 仅 width: 320px |
| CredentialManagementContent/index.less | 仅 width: 320px |
| WorkerManagement/index.less | 仅 width: 320px |
| WorkerGroupManagement/index.less | 仅 width: 320px |
| TaskManagementPage/index.less | 仅 width: 320px |
| TaskLogPage/index.less | 仅 width: 320px |
| RequirementsWorkbench/index.less | 仅 width: 320px |
| ReleaseListPage/index.less | 仅 width: 320px |
| PersonalCredentialManagement/index.less | 仅 width: 320px |
| QueueMessagesContent/index.less | 仅 width: 320px |
| TimeTriggerList/index.less | width: 260px → 320px + min-width |
| QueueTriggerList/index.less | width: 260px → 320px + min-width |

`ProcessDevelopment/index.less` 已有 min-width，无需修改。

---

### 改动量

共约 **29 处修改**（14 处 tsx minWidth + 15 处 less min-width），每处改动仅 1-2 行。

