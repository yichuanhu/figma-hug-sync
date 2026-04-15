

## 需求方案：资源依赖前置 — 流程级别管理

### 核心设计

依赖统一挂在**流程维度**，所有版本共享同一份依赖列表。上传新版本时自动解析并**增量合并**到流程依赖中，手动添加的依赖永久保留。

```text
流程 A 的依赖列表（统一维护）
├── ERP API Address    [自动解析] ← v1.0 上传时解析出
├── Order Queue        [自动解析] ← v1.0 上传时解析出
├── Batch Count        [自动解析] ← v2.0 上传时新增
├── SFTP Credential    [手动添加] ← 用户手动添加一次，永久保留
└── Debug Mode         [手动添加]

发布时：选中流程 → 直接读取流程.dependencies → 配置生产值 → 发布
```

### 数据模型变更

**`src/api/index.ts`** 新增类型，扩展 `LYProcessResponse`：

```typescript
interface LYProcessDependency {
  resource_id: string;
  resource_name: string;
  resource_type: ResourceType; // PARAMETER | CREDENTIAL | QUEUE | FILE
  source: 'AUTO_DETECTED' | 'MANUAL';
  param_type?: 'TEXT' | 'BOOLEAN' | 'NUMBER';
  original_name?: string; // 文件资源
}

// LYProcessResponse 新增字段
dependencies?: LYProcessDependency[];
```

### 前端展示方案

#### 1. 流程详情抽屉 — 新增「资源依赖」Tab

在 `ProcessDetailDrawer` 现有的「详情」「版本管理」后新增第三个 Tab。

```text
┌─────────────────────────────────────────────┐
│  详情  │  版本管理  │  资源依赖 (6)          │
├─────────────────────────────────────────────┤
│                         [+ 添加依赖]         │
│─────────────────────────────────────────────│
│  参数 (3)                                    │
│  ┌─────────────────────────────────────────┐ │
│  │ ERP API Address        [自动解析]       │ │
│  │ Batch Count            [自动解析]       │ │
│  │ Debug Mode             [手动添加] [🗑]  │ │
│  └─────────────────────────────────────────┘ │
│  凭据 (2)                                    │
│  ┌─────────────────────────────────────────┐ │
│  │ ERP Credential         [自动解析]       │ │
│  │ SFTP Credential        [手动添加] [🗑]  │ │
│  └─────────────────────────────────────────┘ │
│  队列 (1)                                    │
│  ┌─────────────────────────────────────────┐ │
│  │ Order Queue            [自动解析]       │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

- 按资源类型分组展示（复用 ReleaseConfigStep 的分组样式）
- 每项显示：资源名称 + 来源标签（自动解析/手动添加）
- 手动添加的可删除，自动解析的不可删除
- 右上角「添加依赖」按钮，复用 `AddResourceModal`
- `development` 上下文可编辑，`scheduling` 上下文只读（隐藏添加/删除按钮）

#### 2. 上传版本后自动解析

`UploadVersionModal` 上传成功回调中触发 Mock 依赖解析，增量合并到流程的依赖列表，Toast 提示「已自动解析出 N 项新资源依赖」。

#### 3. 创建发布 — 简化

`CreateReleasePage` 第二步改为直接聚合所选流程的 `dependencies` 字段，移除 `detectDependencies` 调用和 `detectingDependencies` loading。仍保留发布级别的「添加依赖」按钮用于临时补充。

### 涉及文件

| 文件 | 改动 |
|------|------|
| `src/api/index.ts` | 新增 `LYProcessDependency`，扩展 `LYProcessResponse` |
| `ProcessDetailDrawer/index.tsx` | 新增「资源依赖」TabPane |
| `ProcessDetailDrawer/index.less` | 依赖 Tab 样式 |
| 新建 `ProcessDetailDrawer/components/DependencyTab/` | 依赖管理组件（分组展示 + 添加/删除） |
| `AddResourceModal` | 从 Release 目录提取为共享组件（或直接引用） |
| `UploadVersionModal/index.tsx` | 上传成功后触发依赖解析并合并 |
| `CreateReleasePage/index.tsx` | 移除 `detectDependencies`，改读流程依赖 |
| `ReleaseConfigStep/index.tsx` | 资源卡片新增来源流程标注 |
| `ProcessManagementContent/index.tsx` | Mock 数据中为流程添加 `dependencies` 字段 |
| i18n `zh-CN.json` / `en.json` | 新增依赖管理相关词条 |

### 实施顺序

1. 数据模型 + Mock 数据（API 类型 + 流程 Mock 补充 dependencies）
2. DependencyTab 组件 + 集成到 ProcessDetailDrawer
3. UploadVersionModal 自动解析合并
4. CreateReleasePage 简化（读取流程依赖替代 detectDependencies）
5. i18n 词条补充

