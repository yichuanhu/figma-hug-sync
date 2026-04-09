

# 优化协作者弹窗与组织架构弹窗的交互体验（修订版）

## 问题

当前有**两个入口**会触发关闭主弹窗→打开组织架构弹窗的生硬跳转：
1. **快捷添加视图**：底部"从组织架构添加"按钮（L527 `handleOpenOrgModal`）
2. **管理视图**：底部"添加协作者"按钮（L557 `handleOpenOrgModal`）

两处都调用 `handleOpenOrgModal`，先 `onVisibleChange(false)` 关闭 660px 主弹窗，再 `setAddModalVisible(true)` 打开 900px 组织架构弹窗，导致动画叠加、位置偏移。

## 方案

将两个独立 Modal 合并为**单个 Modal 内的三视图切换**，通过 `panelView` 状态控制。

### 视图结构

```text
panelView: 'quick' | 'manage' | 'org'

quick  ─→ "从组织架构添加"按钮 ─→ org（记录 previousView = 'quick'）
manage ─→ "添加协作者"按钮    ─→ org（记录 previousView = 'manage'）
org    ─→ 返回按钮           ─→ previousView（quick 或 manage）
```

### 具体改动

**文件**: `src/components/CollaboratorManager/CollaboratorPanel/index.tsx`

1. **扩展 panelView 类型**：`'quick' | 'manage' | 'org'`，新增 `previousView` 状态记录来源视图
2. **将 CollaboratorAddModal 内容内联**：组织架构浏览（面包屑、部门树、搜索、已选列表）作为 `org` 视图渲染在同一 Modal 内
3. **动态 Modal 宽度**：`org` 视图 900px，其余 660px
4. **动态 Modal 标题**：
   - `quick` → "添加协作者"
   - `manage` → ← 管理协作者
   - `org` → ← 从组织架构添加
5. **删除互斥逻辑**：移除 `handleOpenOrgModal`、`handleAddModalClose`、`handleAddSuccess`、`addModalVisible` 状态及 `CollaboratorAddModal` 引用
6. **两个入口统一改为视图切换**：
   - 快捷视图"从组织架构添加"按钮：`setPanelView('org'); setPreviousView('quick')`
   - 管理视图"添加协作者"按钮：`setPanelView('org'); setPreviousView('manage')`
7. **org 视图返回**：点击返回按钮 → `setPanelView(previousView)`，同时清空组织架构相关状态

**文件**: `src/components/CollaboratorManager/CollaboratorPanel/index.less`

- 添加 Modal 宽度过渡：`transition: width 0.2s ease`
- 添加 `org` 视图的两栏布局样式（左侧部门树 + 右侧已选列表）

### Modal 标题与返回逻辑

| panelView | 标题左侧 | 返回目标 |
|-----------|----------|----------|
| `quick` | "添加协作者" | - |
| `manage` | ← 管理协作者 | `quick` |
| `org` | ← 从组织架构添加 | `previousView`（quick 或 manage） |

| 文件 | 改动 |
|------|------|
| `CollaboratorPanel/index.tsx` | 合并 org 视图，删除互斥逻辑，动态宽度，两个入口统一改为视图切换 |
| `CollaboratorPanel/index.less` | org 视图样式，Modal 宽度过渡动画 |

