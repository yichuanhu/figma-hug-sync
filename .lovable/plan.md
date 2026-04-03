

# 协作者权限继承逻辑优化计划

## 需求概要

根据 STORY-002 文档，实现资源依赖级联继承的前端逻辑：
- **层级继承**：机器人继承机器人组权限
- **依赖继承**：参数/凭据/队列/文件继承流程权限
- **最终权限** = MAX(直接权限, 部门权限, 层级继承, 依赖继承)
- **级联操作**：流程添加/移除/变更协作者时，自动级联到依赖资产

## 当前状态

现有实现使用静态 Mock 数据，继承关系已有基本的 UI 展示（继承来源展开/折叠），但缺乏：
1. 级联传播逻辑（添加/移除/变更时自动同步依赖资产）
2. MAX 权限合并计算
3. 资产间依赖关系的数据模型
4. 继承权限来源的分类展示（层级继承 vs 依赖继承）

## 实现步骤

### 第 1 步：扩展类型定义

**文件**: `src/api/index.ts`

- 新增 `CollaboratorSource` 类型，区分 `'DIRECT' | 'INHERITED_HIERARCHY' | 'INHERITED_DEPENDENCY' | 'DEPARTMENT'`
- 扩展 `CollaboratorInheritanceSource` 增加 `source_type` 字段（标识是层级继承还是依赖继承）
- 新增 `AssetDependency` 接口描述资产依赖关系
- 新增继承关系映射常量 `INHERITANCE_RULES`：定义哪些资产类型可以从哪些父类型继承

### 第 2 步：Mock 依赖关系数据

**文件**: `src/components/CollaboratorManager/mockData.ts`（新建）

抽取并扩展 Mock 数据为独立模块：
- Mock 资产依赖图：流程→参数/凭据/队列/文件，机器人组→机器人
- Mock 协作者数据，包含直接分配和继承两种来源
- 提供 `getAssetDependencies(assetType, assetId)` 函数
- 提供 `getCollaborators(assetType, assetId)` 函数，内部实现 MAX 权限合并

### 第 3 步：实现级联传播逻辑

**文件**: `src/hooks/useCollaboratorCascade.ts`（新建）

```typescript
useCollaboratorCascade(assetType, assetId)
  → { 
      addCollaborator(collaborators) // 添加时级联到依赖资产
      removeCollaborator(collaboratorId) // 移除时级联清理继承权限
      updateRole(collaboratorId, newRole) // 变更时级联更新
    }
```

核心逻辑：
- **添加**：查找当前资产的所有依赖资产，为每个依赖资产添加相同角色的继承协作者
- **移除**：从依赖资产中移除来源为当前资产的继承记录；如有直接分配权限则保留
- **变更角色**：更新依赖资产上对应继承记录的角色，重新计算 MAX 最终权限
- **冲突处理**：`final_role = MAX(所有来源权限)`

### 第 4 步：更新权限合并计算

**文件**: `src/hooks/useCollaboratorPermission.ts`

增强权限计算逻辑：
- 收集所有权限来源（直接、部门、层级继承、依赖继承）
- 使用 `COLLABORATOR_ROLE_PRIORITY` 取 MAX
- 返回 `final_role` 和各来源明细

### 第 5 步：更新 CollaboratorTab 级联行为

**文件**: `src/components/CollaboratorManager/CollaboratorTab/index.tsx`

- 引入 `useCollaboratorCascade`，替换现有的简单增删改逻辑
- 添加协作者时调用级联添加
- 移除协作者时调用级联移除，并在确认弹窗中提示"将同时从 N 个依赖资产移除"
- 变更角色时调用级联更新
- 继承行权限来源展示增加来源类型标签（"继承自机器人组" vs "继承自流程"）
- 继承行展开详情增加最终权限计算说明：`MAX(USER, MAINTAINER, USER) = MAINTAINER`

### 第 6 步：更新 Mock 数据展示

更新 `generateMockCollaborators` 以体现：
- 混合来源协作者（同时有直接和继承权限的用户）
- 多源继承合并（同一用户从多个流程继承，合并为一行）
- 层级继承示例（机器人从机器人组继承）
- `final_role` 正确反映 MAX 计算结果

### 第 7 步：i18n 补充

**文件**: `public/i18n/zh-CN.json`, `public/i18n/en.json`

新增词条：
- 权限来源类型：直接分配、继承自机器人组、继承自流程
- 级联提示：「将同时为 N 个依赖资产添加协作者」
- MAX 计算说明文案
- 移除级联提示文案

## 文件变更汇总

| 文件 | 操作 |
|------|------|
| `src/api/index.ts` | 修改：扩展继承来源类型、新增依赖关系接口 |
| `src/components/CollaboratorManager/mockData.ts` | 新建：统一 Mock 数据与依赖图 |
| `src/hooks/useCollaboratorCascade.ts` | 新建：级联传播逻辑 Hook |
| `src/hooks/useCollaboratorPermission.ts` | 修改：增强 MAX 权限合并 |
| `src/components/CollaboratorManager/CollaboratorTab/index.tsx` | 修改：集成级联逻辑、优化继承展示 |
| `public/i18n/zh-CN.json` | 修改：新增继承相关词条 |
| `public/i18n/en.json` | 修改：新增继承相关词条 |

