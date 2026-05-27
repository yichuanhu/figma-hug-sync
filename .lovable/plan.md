## 目标

根据 `STORY-001-PG-DOCUMENTS`，在流程详情抽屉新增「资料」Tab，支持流程相关交付物（设计文档、测试报告、用户手册、部署说明、其他）的归档管理。

## 范围

- 仅调整 `ProcessDetailDrawer`（`src/components/ProcessManagement/ProcessManagementContent/components/ProcessDetailDrawer/`），开发中心与调度中心共用。
- 不新增独立路由、不改后端业务逻辑（mock 模拟即可）。
- 权限点（`process_document.view/upload/download/delete`）以前端 mock 开关形式留出预留，便于后续接入 UCI。

## 详情

### 1. 新增 Tab：`资料`

位置：放在「依赖」与「工时」之间。Tab 标题带数量徽标 `资料 (N)`。

### 2. 子组件 `DocumentsTab`

路径：`.../ProcessDetailDrawer/components/DocumentsTab/{index.tsx, index.less}`

- **顶部工具栏**：左侧筛选 `资料类型`（多选 FilterPopover）+ `关联层级`（PROCESS / PROCESS_VERSION / PUBLISH_RECORD），右侧 `上传资料` 主按钮。
- **列表**：Semi `Table size="small"`，列：资料名称（点击下载）、资料类型 Tag、关联对象（流程名 / 版本号 / 发布记录号，可点击跳转）、文件大小、上传人（`UserNameWithCard`）、上传时间、操作（下载 / 删除）。
- **空状态**：复用 `EmptyState` `no-data` 图，描述「暂无流程资料」+ 上传按钮。
- 删除走 `Modal.confirm`，符合项目标准；删除/上传后局部刷新。

### 3. 上传弹窗 `UploadDocumentModal`

路径：`.../ProcessDetailDrawer/components/UploadDocumentModal/index.tsx`

- 基于 `FormModal`，宽度 520px。
- 字段顺序：
  1. `资料类型`（必填，Select）：设计文档 / 测试报告 / 用户手册 / 部署说明 / 其他。
  2. `关联层级`（必填，Radio）：流程 / 流程版本 / 发布记录。
  3. `关联对象`（必填，Select，依据关联层级动态加载）：
     - 流程层级 → 自动选中当前流程，禁用。
     - 流程版本 → 列出 `versionData`。
     - 发布记录 → 列出当前流程下的发布记录（mock 提供）。
  4. `文件`（必填，Upload）：复用 `UploadFileModal` 同款拖拽样式（Lucide `Inbox` 图标、隐藏原生列表、自定义文件信息）；单文件，限制 100MB。
  5. `备注`（可选，TextArea，最长 500 字符）。
- 提交时 mock 调用 `POST /api/processes/{processId}/documents`，写入本地 mock store。

### 4. Mock 数据

新建 `src/mocks/processDocuments.ts`：

- 类型 `ProcessDocument { id, processId, target_type, target_id, document_type, file_name, file_size, mime_type, uploader_id, uploader_name, uploaded_at, remark }`。
- 提供 `listDocuments(processId, filter)`、`createDocument(...)`、`deleteDocument(id)`、`downloadDocument(id)` 接口；用 in-memory `Map` 持久化当前会话。
- 预置每个流程 2-3 条样例资料，覆盖三种 `target_type`。

### 5. 权限预留

新增 `useProcessDocumentPermission(processId)` Hook（mock 全部返回 true）：暴露 `canView / canUpload / canDownload / canDelete`，组件按权限隐藏对应按钮，便于后续接 UCI。

### 6. 文案与 i18n

在 `public/i18n/zh-CN.json` 与 `en.json` 的 `development.processDevelopment.detail` 命名空间下新增 `documents.*` key（tab 标题、列表列名、资料类型、关联层级、上传弹窗字段、空态、确认删除等）。

### 7. 详情抽屉接线

`ProcessDetailDrawer/index.tsx`：
- 引入并渲染新 `<TabPane itemKey="documents">`；
- 通过 `versions` prop 传给 Tab，用于关联对象选择；
- 不改其他 Tab。

## 不改动

- 现有「详情 / 版本 / 依赖 / 工时 / ROI」Tab 内容与样式。
- 路由、Sidebar、ApprovalConfig、发布/停用审批页面。
- 既有文件服务（沿用 mock）。

## ASCII 结构

```text
ProcessDetailDrawer
└── Tabs
    ├── 详情
    ├── 版本
    ├── 依赖
    ├── 资料 (N)   ← 新增
    │   ├── Toolbar [类型筛选] [层级筛选]      [上传资料]
    │   └── Table  名称 | 类型 | 关联对象 | 大小 | 上传人 | 时间 | 操作
    ├── 工时
    └── ROI 配置
```
