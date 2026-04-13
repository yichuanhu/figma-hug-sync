

# 综合筛选优化方案

## 目标

将 FilterPopover 中的**动态数据类型**（归属部门、标签等不固定选项）提取为独立的多选下拉框，FilterPopover 仅保留**固定数据类型**（状态、优先级、类别等枚举值），并将 FilterPopover 放到筛选栏最右侧。

## 布局示意

```text
[搜索框] [归属部门 ▼] [标签 ▼] ... [综合筛选 ⊞]
                                      ↑ 最右侧
```

独立下拉框使用 Semi `Select` 组件：`multiple`、`showClear`、`maxTagCount={1}`、`width: 180`。

## 涉及页面及改动

### 1. 需求工作台
**文件**: `src/pages/Requirements/RequirementsWorkbench/index.tsx`
- **提取**: `department`（归属部门）→ 独立多选 Select
- **保留在 FilterPopover**: `status`（状态）、`priority`（优先级）
- **布局**: `[搜索框] [归属部门 ▼] [FilterPopover]`

### 2. 案例展示（Showcases）
**文件**: `src/pages/Sharing/Showcases/index.tsx`
- **提取**: `department`（部门）和 `tags`（标签）→ 两个独立多选 Select
- **结果**: FilterPopover 无剩余固定筛选项，**移除 FilterPopover**
- **布局**: `[搜索框] [部门 ▼] [标签 ▼]`

### 3. APA 技能
**文件**: `src/pages/Sharing/Skills/APASkills/index.tsx`
- **提取**: `tags`（标签）→ 独立多选 Select
- **保留在 FilterPopover**: `category`（类别，固定枚举）
- **布局**: `[搜索框] [标签 ▼] [FilterPopover]`

### 4. ACP 技能
**文件**: `src/pages/Sharing/Skills/ACPSkills/index.tsx`
- 同 APA 技能，完全一致的处理方式

### 5. 创作者组件
**文件**: `src/pages/Sharing/Components/CreatorComponents/index.tsx`
- **提取**: `tags`（标签）→ 独立多选 Select
- **保留在 FilterPopover**: `status`（状态，固定枚举）
- **布局**: `[搜索框] [标签 ▼] [FilterPopover]`

## 不需要改动的页面

- 机器人管理、任务管理 — 归属部门已是独立下拉框
- 队列/凭据/参数/文件管理 — 仅含固定筛选项
- 任务日志/执行日志 — 仅含固定筛选项

## 技术细节

- 每个提取出来的筛选项保留原有 state 变量和过滤逻辑不变
- FilterPopover 的 `sections` 数组移除对应的动态 section，`onConfirm` 回调同步更新
- 独立 Select 的 `onChange` 直接调用对应的 setState
- Showcases 页面完全移除 FilterPopover 相关导入和状态

## 涉及文件清单（共5个）

1. `src/pages/Requirements/RequirementsWorkbench/index.tsx`
2. `src/pages/Sharing/Showcases/index.tsx`
3. `src/pages/Sharing/Skills/APASkills/index.tsx`
4. `src/pages/Sharing/Skills/ACPSkills/index.tsx`
5. `src/pages/Sharing/Components/CreatorComponents/index.tsx`

