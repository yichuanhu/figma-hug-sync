## 目标

按照简化后的 Story（STORY-001-PG-DOCUMENTS）调整流程资料 Tab：移除「关联层级」三选一概念（PROCESS / PROCESS_VERSION / PUBLISH_RECORD），改为统一归档到流程，只保留可选的「适用流程版本」字段。

## 一、Mock 层（`src/mocks/processDocuments.ts`）

- 移除类型 `ProcessDocumentTargetType` 与常量 `PROCESS_DOCUMENT_TARGET_LABEL`。
- 移除 `getPublishRecordsByProcess` 与 `publishRecordStore`、`ProcessPublishRecordBrief`。
- `ProcessDocument` 字段调整：
  - 删除 `target_type`、`target_id`、`target_label`
  - 新增 `applicable_version_id?: string`、`applicable_version_label?: string`（即版本号；流程级资料时两者为空）
- `CreateDocumentInput` 同步：去掉 target_* 三个字段，新增可选 `applicable_version_id` / `applicable_version_label`。
- `ListDocumentsFilter`：删除 `targetTypes`，新增可选 `applicableVersionIds?: string[]`。
- 种子数据按新结构改写（一条流程级 + 一条带 v1.1.0 版本 + 一条带 v2.0.0 版本，去掉发布单维度）。
- `listProcessDocuments` 的 keyword 不再匹配 `target_label`，改匹配 `file_name`（兼具版本号匹配可选保留）。

## 二、上传弹窗（`UploadDocumentModal/index.tsx`）

- 删除「关联层级」`RadioGroup` 与「关联对象」`Select` 两个表单项。
- 新增「适用版本」`Select`（可选、可清空），选项 = `versions`（版本号），placeholder「不指定则归档到流程级」。
- state：移除 `targetType` / `targetId` / `publishRecords` / `targetOptions`；新增 `applicableVersionId: string | undefined`。
- `handleSubmit`：透传 `applicable_version_id` 与对应 `applicable_version_label`（从 versions 查得），无选则 undefined。
- 清理 import：`RadioGroup` / `Radio` / `PROCESS_DOCUMENT_TARGET_LABEL` / `getPublishRecordsByProcess` / `ProcessDocumentTargetType`。
- 提交按钮禁用条件改为 `!selectedFile`（不再要求 targetId）。

## 三、资料列表（`DocumentsTab/index.tsx`）

- 列变更：
  - 删除「关联对象」列（`target_label` + `PROCESS_DOCUMENT_TARGET_LABEL` 前缀）
  - 新增「适用版本」列：当 `applicable_version_label` 为空时显示「流程级」（灰色 Text），否则显示版本号 Tag
- `FilterPopover`：移除「关联层级」分组，新增「适用版本」分组（多选，选项 = 当前流程的 `versions` + 一项「流程级」对应空值）。
  - 实现细节：filter 值为 `applicableVersionIds`，「流程级」用特殊常量 `__PROCESS_LEVEL__` 占位，在 `listProcessDocuments` 中识别为「`applicable_version_id` 为空」。
- 移除对 `targetTypes` state 与 `ProcessDocumentTargetType` 的引用。
- 搜索 placeholder 改为「搜索资料名称」。
- 清理 import：`PROCESS_DOCUMENT_TARGET_LABEL`、`ProcessDocumentTargetType`、`Text`（如不再使用）。

## 四、权限点（不动）

`useProcessDocumentPermission` 已对齐 view/upload/download/delete 四个权限点，无需调整。

## 五、不改动

- 抽屉其它 Tab、Header、`EditProcessModal`、i18n、其他详情页
- 权限 hook、文件大小限制（100MB）、Toast 文案风格

## 收益

- 删除「关联层级」三态复杂度，与简化后的 Story 字段（仅 `applicable_version_id`）一一对应
- 上传与筛选只剩「适用版本（可选）」一个维度，符合 R-05 / AC-FUNC-02
