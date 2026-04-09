

# 协作者功能统一与组件化

## 问题分析

1. **图标不一致**：详情抽屉 header 使用 `Users` 图标，表格操作菜单使用 `UserPlus` 图标
2. **页面覆盖不全**：开发中心的 ProcessDevelopment 仍使用旧的 `CollaboratorAddModal`，TaskManagement 和 ReleaseManagement 缺少协作者功能
3. **重复代码**：每个页面都独立维护 `addCollaboratorModalVisible` + `addCollaboratorAssetId` 状态和 `CollaboratorPanel` 渲染逻辑

## 改动方案

### 1. 统一图标为 `UserPlus`

将详情抽屉 header 中的协作者按钮图标从 `Users` 改为 `UserPlus`，与表格操作菜单保持一致。

**文件**: `src/components/DetailDrawerWrapper/index.tsx`
- L299: `<Users size={14}>` → `<UserPlus size={14} strokeWidth={2}>`

同时统一 `FileDetailDrawer` 中手动渲染的协作者按钮图标。

### 2. 创建 `useCollaboratorAction` Hook

提取通用的协作者操作逻辑为一个可复用的 Hook。

**新文件**: `src/hooks/useCollaboratorAction.ts`

```typescript
interface UseCollaboratorActionReturn {
  collaboratorVisible: boolean;
  collaboratorAssetId: string;
  openCollaborator: (assetId: string) => void;
  closeCollaborator: () => void;
  setCollaboratorVisible: (visible: boolean) => void;
  renderCollaboratorPanel: (assetType, context, canManage?) => ReactNode;
}
```

封装状态管理 (`visible`, `assetId`) + `CollaboratorPanel` 渲染，各页面只需调用 Hook 即可。

### 3. 各页面接入 Hook

**已有协作者功能的页面**（替换重复代码为 Hook）：
- `src/components/CredentialManagement/CredentialManagementContent/index.tsx`
- `src/components/ParameterManagement/ParameterManagementContent/index.tsx`
- `src/components/QueueManagement/QueueManagementContent/index.tsx`
- `src/components/ProcessManagement/ProcessManagementContent/index.tsx`
- `src/components/FileManagement/FileManagementContent/index.tsx`
- `src/pages/Scheduling/TemplateManagement/TemplateManagementPage/index.tsx`
- `src/pages/Scheduling/WorkerManagement/index.tsx`
- `src/pages/Scheduling/WorkerManagement/WorkerGroupManagement/index.tsx`
- `src/pages/Scheduling/AutoExecutionPolicy/.../TimeTriggerList/index.tsx`
- `src/pages/Scheduling/AutoExecutionPolicy/.../QueueTriggerList/index.tsx`

**使用旧组件的页面**（`CollaboratorAddModal` → Hook）：
- `src/pages/Development/ProcessDevelopment/index.tsx`

**缺少协作者功能的页面**（新增）：
- `src/pages/Scheduling/TaskManagement/TaskManagementPage/index.tsx` — 表格操作菜单添加"添加协作者"
- `src/pages/Scheduling/TaskManagement/components/TaskDetailDrawer/index.tsx` — 详情抽屉添加 `collaboratorProps`

注：`CollaboratorAssetType` 需新增 `'TASK'` 类型，以及对应的 `ASSET_AVAILABLE_ROLES` 配置。

ReleaseManagement（发布管理）属于版本发布流程，不涉及资产级协作者管理，不纳入。

### 4. API 类型扩展

**文件**: `src/api/index.ts`
- `CollaboratorAssetType` 新增 `'TASK'`
- `ASSET_AVAILABLE_ROLES` 新增 `TASK` 映射

## 文件变更汇总

| 文件 | 改动 |
|------|------|
| `src/hooks/useCollaboratorAction.ts` | 新建 Hook，封装协作者弹窗状态+渲染 |
| `src/api/index.ts` | 新增 `TASK` 资产类型 |
| `src/components/DetailDrawerWrapper/index.tsx` | 图标 Users → UserPlus |
| 10 个已有协作者的页面 | 替换重复代码为 Hook |
| `src/pages/Development/ProcessDevelopment/index.tsx` | CollaboratorAddModal → Hook |
| `src/pages/Scheduling/TaskManagement/...` (2 个文件) | 新增协作者功能 |
| `src/components/FileManagement/.../FileDetailDrawer/index.tsx` | 图标统一 |

共约 **16 个文件**。

