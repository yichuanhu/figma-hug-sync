
## 目标
彻底移除需求详情抽屉中「+ 新增关联」按钮及相关新增弹窗，将交付物表格变为只读视图。

## 改动点

### `ArtifactSection.tsx`
- 删除 header 右侧的「+ 新增关联」按钮（含 `canEdit || canManageProcesses` 分支）。
- 删除 `Modal` 新增弹窗整段（含 `Form`、`typeOptions`、`mockNonProcessArtifacts` 选项渲染）。
- 删除 `handleAdd`、`modalVisible` state、`mockNonProcessArtifacts` 常量、`MOCK_PROCESS_POOL` 引用、未使用的 i18n key 引用。
- 保留：表格渲染、流程行的跳转链接、聚合状态 Tag、空态文案、只读提示。
- `handleRemove`：保留（非流程类历史数据仍允许删除以便清理）。如希望完全只读，可一并移除删除按钮——见下方「可选」。

### 可选（请在实现时确认）
默认保留非流程交付物的删除按钮（仅清理用），如需**完全只读**（含删除也禁掉），实现时一并移除 `columns` 中的 action 列与 `handleRemove`。本次按「保留删除」执行。

### i18n
- 不新增 key。被删代码引用但其他地方未使用的 key（如 `requirements.artifact.addNew/addTitle/selectType/selectArtifact/typeRequired/artifactRequired/contributionLabel/contributionRequired/contributionDesc/descriptionLabel/descriptionPlaceholder/duplicateError/addSuccess/confirm`）暂不删除，避免影响其他模块；后续统一清理。

## 涉及文件
- `src/pages/Requirements/RequirementsWorkbench/components/RequirementDetailDrawer/ArtifactSection.tsx`
