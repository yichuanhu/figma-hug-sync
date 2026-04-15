## 需求文档：资源依赖前置 — 流程级别管理

### 一、需求背景与目标

#### 1.1 现状

当前资源依赖的管理流程如下：

1. 用户在「创建发布」时选择流程及版本
2. 系统调用 `detectDependencies` 接口，解析版本包中引用的资源名称
3. 用户在发布配置页为每个依赖资源填写生产环境值，并可手动补充额外依赖
4. 依赖关系仅存在于发布记录中，不在流程层面持久化

#### 1.2 变更目标

将资源依赖的管理**前置到流程管理阶段**：

- 依赖列表挂在**流程维度**，所有版本共享
- 上传新版本时自动解析并**增量合并**到流程依赖中
- 用户可在流程详情中随时手动添加/删除依赖
- 发布时直接读取流程已有的依赖列表，无需重新解析

#### 1.3 变更驱动

本次变更由**前端交互优化**驱动：前端已将依赖管理 UI 从发布流程中前置到流程详情抽屉，因此需要后端配合新增流程级别的依赖存储、上传时的增量合并逻辑、以及对应的 CRUD 接口。

---

### 二、核心设计

```text
流程 A 的依赖列表（流程维度统一维护）
├── ERP API Address    [自动解析] ← v1.0 上传时解析出
├── Order Queue        [自动解析] ← v1.0 上传时解析出
├── Batch Count        [自动解析] ← v2.0 上传时新增
├── SFTP Credential    [手动添加] ← 用户手动添加一次，永久保留
└── Debug Mode         [手动添加]

发布时：选中流程 → 直接读取 process.dependencies → 配置生产值 → 发布
```

**关键规则**：
- **增量合并**：新版本解析出的依赖只做新增，不删除已有依赖
- **手动依赖永久保留**：用户手动添加的依赖不会因版本更新而丢失
- **去重**：以 `resource_id` 去重，已存在的资源不重复添加

---

### 三、数据模型

#### 3.1 流程依赖数据结构

```typescript
interface LYProcessDependency {
  resource_id: string;           // 资源ID（关联资源管理中的记录）
  resource_name: string;         // 资源名称
  resource_type: ResourceType;   // PARAMETER | CREDENTIAL | QUEUE | FILE
  source: 'AUTO_DETECTED' | 'MANUAL';  // 来源：自动解析 / 手动添加
  param_type?: 'TEXT' | 'BOOLEAN' | 'NUMBER';  // 参数类型（仅 PARAMETER 类型）
  original_name?: string;        // 源文件名（仅 FILE 类型）
  resource_value?: string;       // 资源当前值（后端从资源管理表联查）
}
```

#### 3.2 流程响应扩展

`LYProcessResponse` 新增 `dependencies` 字段：

```typescript
interface LYProcessResponse {
  // ...existing fields
  dependencies?: LYProcessDependency[];
}
```

---

### 四、前端变更说明（已实现）

#### 4.1 流程详情抽屉 — 新增「资源依赖」Tab

在 `ProcessDetailDrawer` 现有的「详情」「版本管理」后新增第三个 Tab：

```text
┌──────────────────────────────────────────────────────┐
│  详情  │  版本管理  │  资源依赖 (6)                   │
├──────────────────────────────────────────────────────┤
│                                    [+ 添加依赖]      │
│──────────────────────────────────────────────────────│
│  参数 (3)                                             │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 🔗 ERP API Address        [自动解析]             │ │
│  │    https://erp.example.com/api/v2                │ │
│  │ 🔗 Batch Count            [自动解析]             │ │
│  │    500                                           │ │
│  │ 🔗 Debug Mode             [手动添加] [🗑]        │ │
│  │    true                                          │ │
│  └──────────────────────────────────────────────────┘ │
│  凭据 (2)                                             │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 🔗 ERP Credential         [自动解析]             │ │
│  │    ••••••••                                      │ │
│  │ 🔗 SFTP Credential        [手动添加] [🗑]        │ │
│  │    ••••••••                                      │ │
│  └──────────────────────────────────────────────────┘ │
│  队列 (1)                                             │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 🔗 Order Queue            [自动解析]             │ │
│  │    12 messages                                   │ │
│  └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

- 按资源类型分组展示（参数 / 凭据 / 队列 / 文件）
- 每项显示：资源名称（可点击跳转） + 资源当前值 + 来源标签（自动解析 / 手动添加）
- 资源名称为主色链接样式，点击后跳转到对应资源管理页面（参数/凭据/队列/文件）
- 凭据类型的值以掩码 `••••••••` 显示
- 手动添加的可删除，自动解析的不可删除
- `development` 上下文可编辑，`scheduling` 上下文只读

#### 4.2 上传版本后自动刷新依赖

上传成功后，前端调用后端接口刷新流程详情数据，获取最新的依赖列表，并 Toast 提示「已自动解析出 N 项新资源依赖」。

#### 4.3 创建发布 — 简化配置

- 移除 `detectDependencies` 调用和 loading 状态
- 第二步直接从所选流程的 `dependencies` 字段聚合资源列表
- 保留发布级别的「添加依赖」按钮用于临时补充

---

### 五、后端变更需求

> 以下变更均由前端需求变更（依赖管理前置到流程维度）驱动，需后端配合调整。

#### 5.1 版本上传后自动解析并合并依赖

**触发时机**：用户上传新版本包成功后

**处理流程**：

```text
上传版本包成功
    │
    ▼
解析版本包，提取引用的资源名称列表
（此步骤与现有的 detectDependencies 解析逻辑一致）
    │
    ▼
遍历每个解析出的资源名称，查询资源管理表获取完整信息
    │
    ├── 参数名称 → 查询参数管理表 → 获取 resource_id、param_type
    ├── 凭据名称 → 查询凭据管理表 → 获取 resource_id
    ├── 队列名称 → 查询队列管理表 → 获取 resource_id
    └── 文件名称 → 查询文件管理表 → 获取 resource_id、original_name
    │
    ▼
增量合并到流程的 dependencies 列表
    ├── 以 resource_id 去重，已存在的不重复添加
    ├── 不删除已有依赖（包括手动添加的和之前版本解析的）
    └── source 标记为 'AUTO_DETECTED'
    │
    ▼
返回新增的依赖数量（供前端 Toast 提示使用）
```

#### 5.2 流程依赖 CRUD 接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取流程依赖 | GET | `/processes/{process_id}/dependencies` | 返回流程的完整依赖列表 |
| 手动添加依赖 | POST | `/processes/{process_id}/dependencies` | 添加一项或多项依赖，source 标记为 MANUAL |
| 删除手动依赖 | DELETE | `/processes/{process_id}/dependencies/{resource_id}` | 仅允许删除 source=MANUAL 的依赖 |

**请求/响应示例**：

```jsonc
// POST /processes/{process_id}/dependencies
// Request Body
{
  "resources": [
    {
      "resource_id": "param-001",
      "resource_name": "Debug Mode",
      "resource_type": "PARAMETER",
      "param_type": "BOOLEAN"
    }
  ]
}

// Response
{
  "added_count": 1
}
```

```jsonc
// DELETE /processes/{process_id}/dependencies/{resource_id}
// Response 200 OK（仅 source=MANUAL 可删除，否则返回 400/403）
```

#### 5.3 流程详情接口扩展

`GET /processes/{process_id}` 响应中新增 `dependencies` 字段：

```jsonc
{
  "process_id": "proc-001",
  "process_name": "Order Processing",
  // ...existing fields
  "dependencies": [
    {
      "resource_id": "param-001",
      "resource_name": "ERP API Address",
      "resource_type": "PARAMETER",
      "source": "AUTO_DETECTED",
      "param_type": "TEXT"
    },
    {
      "resource_id": "cred-002",
      "resource_name": "SFTP Credential",
      "resource_type": "CREDENTIAL",
      "source": "MANUAL"
    }
  ]
}
```

#### 5.4 发布相关接口适配

发布可选流程列表接口（如 `GET /processes/publishable`）同样返回 `dependencies` 字段，前端在创建发布第二步直接读取，**不再调用独立的 `detectDependencies` 接口**。

---

### 六、前后端对接要点

| 场景 | 前端行为 | 后端职责 |
|------|----------|----------|
| 查看流程依赖 | 读取 `process.dependencies` 渲染分组列表 | 流程详情接口返回 `dependencies`，联查资源管理表获取最新信息 |
| 上传新版本 | 上传成功后刷新流程详情，展示新增依赖数量 | 上传处理中自动触发解析 → 资源匹配 → 增量合并，返回新增数量 |
| 手动添加依赖 | 调用 POST 接口，传入资源 ID 和类型 | 校验资源存在性，写入依赖记录，source=MANUAL |
| 删除手动依赖 | 调用 DELETE 接口 | 校验 source=MANUAL 才允许删除，否则拒绝 |
| 创建发布 | 从所选流程的 dependencies 聚合，不调用 detectDependencies | 发布流程列表接口返回 dependencies 字段 |

---

### 七、实施顺序建议

| 阶段 | 角色 | 工作内容 |
|------|------|----------|
| 1 | 后端 | 流程依赖存储模型设计 + CRUD 接口开发（GET/POST/DELETE） |
| 2 | 后端 | 版本上传后的自动解析 + 资源管理表匹配 + 增量合并逻辑 |
| 3 | 后端 | 流程详情和发布列表接口扩展 dependencies 字段 |
| 4 | 前端 | 对接后端接口，替换现有 Mock 数据 |
| 5 | 联调 | 上传版本 → 自动解析 → 依赖展示 → 发布聚合 全链路验证 |
