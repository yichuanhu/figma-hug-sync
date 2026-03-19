

# Phase 1 实施计划：需求列表页

## 概述
构建需求列表页（RequirementsWorkbench），包含表格、多维度筛选、状态 Tag、操作列，遵循 ProcessDevelopment 页面的成熟模式。Mock 业务数据使用英文，UI 标签使用 i18n。

## 新增/修改文件

### 1. 需求类型定义
**新建** `src/pages/Requirements/RequirementsWorkbench/types.ts`

定义核心类型：
- `RequirementStatus`: `'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ASSESSING' | 'DEVELOPING' | 'DEVELOPED' | 'RUNNING' | 'STOPPED' | 'ARCHIVED'`
- `RequirementPriority`: `'LOW' | 'MEDIUM' | 'HIGH'`
- `RequirementItem`: id, title, description, businessBackground, department, departmentId, creatorId, contactInfo, priority, status, draftStatus, approvalStatus, developmentStatus, operationStatus, expectedLaunchDate, attachments, createdAt, updatedAt

### 2. Mock 数据
**新建** `src/pages/Requirements/RequirementsWorkbench/mockData.ts`

- 生成 30+ 条 mock 需求数据，**业务内容全部英文**（如 "Monthly Financial Report Automation", "Finance Department", "John Smith"）
- 部门：Finance, HR, Procurement, Logistics, IT, Sales
- 人员：John Smith, Emily Chen, Michael Wang, Sarah Li, David Zhang
- 状态覆盖所有枚举值
- 提供 `fetchRequirementList` 模拟 API 函数（支持分页、搜索、筛选、排序）
- 状态颜色映射常量 `statusConfig`：DRAFT=grey, PENDING=orange, APPROVED=green, REJECTED=red, ASSESSING=purple, DEVELOPING=blue, DEVELOPED=cyan, RUNNING=green, STOPPED=orange, ARCHIVED=grey
- 优先级颜色映射：HIGH=red, MEDIUM=orange, LOW=blue

### 3. 需求列表页主组件
**改写** `src/pages/Requirements/RequirementsWorkbench/index.tsx`

复用 ProcessDevelopment 页面模式：
- **顶部**：标题（i18n）+ [新建需求] [批量导入] 按钮（Phase 2 实现功能，此阶段仅展示按钮）
- **工具栏**：搜索框 + FilterPopover（筛选维度：状态、部门、优先级）
- **表格列**：
  - 标题（点击打开详情抽屉，Phase 3 实现）
  - 部门
  - 状态 Tag（彩色）
  - 优先级 Tag
  - 创建人（UserNameWithCard）
  - 期望上线时间
  - 更新时间
  - 操作（查看/编辑/删除，根据状态控制显隐）
- **分页**：Semi Table 内置分页
- **空状态/骨架屏**：复用 EmptyState、TableSkeleton
- **排序**：支持 updated_at 列排序

### 4. 样式
**改写** `src/pages/Requirements/RequirementsWorkbench/index.less`

参考 ProcessDevelopment 的样式结构。

### 5. i18n 翻译
**修改** `public/i18n/zh-CN.json` 和 `public/i18n/en.json`

新增 `requirements` 命名空间下的键：
- 表格列标题（title, department, status, priority, creator, expectedLaunchDate, updatedAt, actions）
- 状态枚举标签（draft, pending, approved, rejected, assessing, developing, developed, running, stopped, archived）
- 优先级枚举标签（high, medium, low）
- 按钮文案（newRequirement, batchImport）
- 筛选标签（filterStatus, filterDepartment, filterPriority）
- 操作文案（view, edit, delete, confirmDelete）

## 实施顺序
1. types.ts → 2. mockData.ts → 3. i18n keys → 4. index.tsx + index.less

