## 改动范围

仅修改 `src/pages/SharingCenter/MyShared/index.tsx`，并补充 i18n 词条。

## 1. 名称列拆成 3 列（名称 / 类型 / 版本）

将现在合并的「名称」列拆成 3 个独立列：

- **名称**：只显示名称文本（不再带资产图标，不再带版本 Tag）。使用 `Text` + ellipsis showTooltip。
- **类型**：新增独立列，宽度 ~120px。显示资产类型标签：
  - 流程：`智能自动化流程` / `Workflow`，蓝色 light Tag（small）。
  - 知识：`知识` / `Knowledge`，绿色 light Tag（small）。
- **版本**：新增独立列，宽度 ~90px。
  - 流程类资产：显示 `currentVersion`（如 `v2.3.1`），蓝色 light Tag（small）。
  - 知识类资产：显示 `-`。

实现方式：直接在 `columns` 内联渲染，不再调用 `AssetIdentity`（其它使用方不动）。

i18n 新增：
- `sharing.assetSupply.col.type` = `类型` / `Type`
- `sharing.assetSupply.col.version` = `版本` / `Version`

## 2. 类型筛选样式对齐

把现在的 `Dropdown + Button` 改为 Semi UI `Select`，与其他模块的下拉筛选一致：

- 使用 `Select`，宽度约 200px。
- 选项：全部 / 智能自动化流程 / 知识。
- 字体使用 Semi 默认（不加粗）。
- 保留前缀 `类型：`（通过 `prefix` 或 placeholder 复用现有 i18n key）。

不改动其它筛选行（搜索、状态 FilterPopover、清空按钮）。

## 验证

- 表头：`名称 | 类型 | 版本 | 描述 | 状态 | 复用次数 | 更新时间 | 操作`。
- 流程行：类型列显示「智能自动化流程」Tag，版本列显示版本 Tag。
- 知识行：类型列显示「知识」Tag，版本列显示 `-`。
- 类型筛选下拉外观与需求/流程模块的 Select 一致，字体不加粗。