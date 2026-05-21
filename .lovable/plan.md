## 问题 1：创建页面没有取消按钮，后退会留下空草稿

### 现状
- 列表页 `handleCreateNew` 立刻调用 `createSchemeDraft()` 写入 store，再跳转到编辑页
- 用户后退（或点左上 ChevronLeft）即使没有保存，空白草稿也已经留在了列表里
- 头部只有「保存草稿」「设为默认」「激活」，缺少显式「取消」

### 改造方案

**1. 列表页：创建空白模版改为「不预创建」**

`src/pages/Requirements/RequirementsScheme/index.tsx`：

- `handleCreateNew` 改为直接 `navigate('/requirements/scheme/builder/new')`，**不再**调用 `createSchemeDraft`
- 「基于预设创建」(`cloneSchemeAsDraft`) 本期保持现状

**2. 编辑页：支持 `id === 'new'` 内存草稿模式**

`src/pages/Requirements/RequirementsScheme/components/SchemeBuilder/index.tsx`：

- 检测 `id === 'new'` 时：
  - 不调用 `getSchemeById`，本地构造一个初始草稿（字段同 `createSchemeDraft`：空 `custom_fields`、`status: 'inactive'`、`is_preset: false` 等）
  - `savedScheme = null`、`draftScheme = 内存草稿`、`dirty = true`、`editMode` 视为 `custom_inactive`
- `handleSaveDraft` 在 `new` 模式下：
  - 调 `createSchemeDraft({ name, description, version })` 真正落库，再 `updateSchemeBuilder(newId, {...全量字段})` 一次性写入当前编辑内容
  - 同步 `setSchemeBindingsForScheme(newId, expandedDeptIds)`
  - `navigate(\`/requirements/scheme/builder/\${newId}\`, { replace: true })`（防止后退又回到 `new`）
- 「激活」「设为默认」按钮在 `new` 模式下隐藏或禁用 —— 必须先保存得到真实 id

**3. 头部新增「取消」按钮**

在右侧按钮组最左侧追加 `<Button onClick={handleCancel}>取消</Button>`：

- `new` 模式：未编辑 → 直接 `navigate('/requirements/scheme')`；已编辑过内容 → 弹「放弃创建？此次新建的内容将不保留」确认
- 已有方案：复用现有 `guardedNavigate` 逻辑（dirty 才弹确认）
- 左上角 ChevronLeft 返回按钮行为保持一致

## 问题 2：自定义字段区根本看不到「添加字段」按钮

### 真正的原因
按钮其实存在（`FormBuilder/index.tsx` 底部 `.add-field-bar` → `<AddFieldPopover>`），但在当前视口 1106×674 下：

- 头部 (~60) + 适用部门卡片 (~120) + 7 个系统字段 (~46×7 ≈ 322) + 间距和标题 (~80) 已经填满首屏
- 「自定义字段（0）」分组在空状态下还会再加 ~80px 的占位
- 「添加字段」按钮被推到首屏以下
- `.scheme-builder-body` 没有 `overflow: auto`，依赖外层 `.app-layout-content-card` 滚动；但 `.scheme-builder` 本身又是 `height: 100%`，导致内部内容溢出后没有任何视觉滚动提示，用户以为没按钮

### 修复方案

调整 `FormBuilder` 让「添加字段」按钮始终可见：

**方案 A（推荐）**：把「添加字段」按钮提升到自定义字段分组的**标题右侧**，而不是放在卡片最底部。
- `.canvas-section-title` 改为 `display: flex; justify-content: space-between`
- 右侧放一个尺寸更小的「+ 添加字段」`Button`（仍弹 `AddFieldPopover` 内容）
- 同时**保留**底部 `.add-field-bar`（字段较多时方便末尾追加），但当字段为 0 时把空状态本身做成可点击的占位卡片（点击直接弹出字段类型选择）

**方案 B（备选）**：让 `.scheme-builder-body` 自身 `overflow: auto`，并在空状态时收起系统字段为可折叠分组，把首屏让给自定义字段。

实施时采用 **方案 A**：体验最直观，无论滚动与否，添加入口始终在首屏可见。

## 涉及文件

- `src/pages/Requirements/RequirementsScheme/index.tsx`
- `src/pages/Requirements/RequirementsScheme/components/SchemeBuilder/index.tsx`
- `src/pages/Requirements/RequirementsScheme/components/SchemeBuilder/FormBuilder/index.tsx`
- `src/pages/Requirements/RequirementsScheme/components/SchemeBuilder/index.less`（标题右侧按钮样式 / 空状态占位卡片样式）

## 不动的事项

- `createSchemeDraft` / `updateSchemeBuilder` API 签名不变
- 「基于预设创建」流程不变
- 其它编辑模式（preset / tenant_default / custom_active）行为不变
- 字段配置面板、字段校验逻辑不变
