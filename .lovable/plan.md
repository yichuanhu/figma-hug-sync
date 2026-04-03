

# 协作者管理功能实现计划（方案 C：详情抽屉 Tab + 弹窗添加）

## 交互方案概述

在每个资产的详情抽屉中新增「协作者」Tab，展示协作者列表；通过表格行「更多」菜单新增「管理协作者」入口直接打开详情抽屉的协作者 Tab。添加协作者使用独立 900px 弹窗（双栏布局：左侧部门树 + 右侧已选列表）。

```text
┌── 资产详情抽屉 (900px) ──────────────────────┐
│  流程：财务报销流程                         [×] │
│  ┌────────┬──────────┬───────────┐           │
│  │基本信息 │ 版本管理  │ 协作者 ③  │           │
│  └────────┴──────────┴───────────┘           │
│  ┌──────────────────────────────────────┐    │
│  │ 🔍 搜索            [+ 添加协作人]    │    │
│  ├──────────────────────────────────────┤    │
│  │ 名称        类型   角色    来源  操作 │    │
│  │ 张三(归属)   个人  管理者  直接   --  │    │
│  │ 李四         个人  ▼维护者 直接  [×]  │    │
│  │ 财务部       部门  ▼使用者 直接  [×]  │    │
│  │ 王五         个人   维护者 继承   --  │    │
│  │  └─ 继承自: 报销流程→USER,           │    │
│  │            采购流程→MAINT             │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

---

## 实现步骤

### 第 1 步：API 类型定义与 Mock 数据

**文件**: `src/api/index.ts`

新增类型：
- `CollaboratorRole`: `'MANAGER' | 'MAINTAINER' | 'USER' | 'OBSERVER'`
- `CollaboratorType`: `'USER' | 'DEPARTMENT'`
- `AssetType`: `'PROCESS' | 'PARAMETER' | 'CREDENTIAL' | 'QUEUE' | 'FILE' | 'WORKER' | 'WORKER_GROUP' | 'TRIGGER' | 'TASK_TEMPLATE'`
- `AssetCollaborator` 接口：含 id、asset_type、collaborator_type、collaborator_name、role、is_owner、inheritance_sources、final_role 等字段
- `CollaboratorAddRequest`、`CollaboratorUpdateRequest` 请求类型
- 资产类型→可用角色映射（触发器不支持 USER）

### 第 2 步：共享组件 — CollaboratorTab

**文件**: `src/components/CollaboratorManager/CollaboratorTab/index.tsx` + `index.less`

协作者列表 Tab 内容组件，嵌入各详情抽屉的 TabPane 中：
- 顶部：搜索框 + 「添加协作人」按钮（仅 MANAGER 可见）
- 表格列：名称（含用户/部门图标）、类型、角色（MANAGER 可操作的下拉选择）、权限来源、操作（移除按钮）
- 归属者行：角色下拉禁用，无移除按钮，显示「归属者」标签
- 继承行：角色下拉禁用，无移除按钮，可展开查看继承来源详情（最多3个）
- 底部分页

Props：`assetType`、`assetId`、`context`、`canManage`

### 第 3 步：共享组件 — CollaboratorAddModal

**文件**: `src/components/CollaboratorManager/CollaboratorAddModal/index.tsx` + `index.less`

900px 弹窗，双栏布局：
- 左栏（约 50%）：部门树 + 搜索框，勾选用户/部门
- 右栏（约 50%）：已选协作人列表，每项带角色下拉（默认「使用者」）和删除按钮
- 已存在的协作者在左栏置灰不可选
- 底部：取消 + 添加按钮
- 角色下拉根据 assetType 过滤可用角色

### 第 4 步：共享组件 — CollaboratorRoleSelect

**文件**: `src/components/CollaboratorManager/CollaboratorRoleSelect/index.tsx`

角色下拉选择器，根据 assetType 过滤可用角色，每个选项带权限说明文案。归属者/继承权限时 disabled。

### 第 5 步：权限 Hook

**文件**: `src/hooks/useCollaboratorPermission.ts`

```typescript
useCollaboratorPermission(assetType, assetId)
  → { role, canManage, canEdit, canUse, canView, loading }
```

当前阶段使用 Mock 数据，后续接入真实 API。

### 第 6 步：集成到各资产详情抽屉

为以下模块的详情抽屉添加「协作者」TabPane：

| 模块 | 详情抽屉文件 | 现有 Tab |
|------|------------|---------|
| 流程 | `ProcessDetailDrawer` | 详情、版本管理 → +协作者 |
| 凭据 | `CredentialDetailDrawer` | 基本信息、使用记录 → +协作者 |
| 参数 | `ParameterDetailDrawer` | 无Tab → 改为 Tab 布局 +协作者 |
| 队列 | `QueueDetailDrawer` | 无Tab → 改为 Tab 布局 +协作者 |
| 文件 | `FileDetailDrawer` | 视具体情况 +协作者 |
| 机器人 | `WorkerDetailDrawer` | 有Tab → +协作者 |
| 机器人分组 | 待确认 | +协作者 |
| 触发器 | 待确认 | +协作者 |
| 任务模板 | 待确认 | +协作者 |

改动模式统一：引入 `CollaboratorTab`，添加 `<TabPane tab="协作者" itemKey="collaborators">`。

### 第 7 步：表格行菜单增加入口

为每个资产的 `Dropdown.Menu` 添加「管理协作者」菜单项（Users 图标），点击后打开详情抽屉并切换到协作者 Tab（通过 `initialTab='collaborators'`）。

### 第 8 步：移除确认弹窗

使用 `Modal.confirm` 实现移除协作者确认对话框，符合项目现有删除确认规范。

### 第 9 步：任务派发权限集成（STORY-003）

在任务派发弹窗的「执行目标」选择器中：
- 调用权限检查判断用户对机器人/机器人组是否有 USER+ 权限
- 无权限的选项禁用并显示 Tooltip 提示
- 派发时二次验证权限

### 第 10 步：i18n

在 `public/i18n/zh-CN.json` 和 `en.json` 中新增 `collaborator` 命名空间，约 60 个键：角色名称、操作按钮、权限来源描述、确认对话框文案、错误提示等。

---

## 文件变更汇总

| 文件 | 操作 |
|------|------|
| `src/api/index.ts` | 新增协作者相关类型 |
| `src/components/CollaboratorManager/CollaboratorTab/` | 新建：协作者列表 Tab 组件 |
| `src/components/CollaboratorManager/CollaboratorAddModal/` | 新建：添加协作者弹窗 |
| `src/components/CollaboratorManager/CollaboratorRoleSelect/` | 新建：角色选择器 |
| `src/hooks/useCollaboratorPermission.ts` | 新建：权限判断 Hook |
| 9个 DetailDrawer 组件 | 修改：新增协作者 TabPane |
| 9个 ManagementContent 组件 | 修改：Dropdown 菜单新增入口 |
| `public/i18n/zh-CN.json` | 新增 collaborator 命名空间 |
| `public/i18n/en.json` | 新增 collaborator 命名空间 |

