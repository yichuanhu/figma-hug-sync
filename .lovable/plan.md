## 需求模板 v9 对齐 — P0/P1 实施计划（v4 最终）

### P0-1 移除「预设可更新」机制

**`src/pages/Requirements/RequirementsWorkbench/types.ts`** （L330-335）
- 删除字段 `source_preset_version`、`preset_update_available`
- 保留 `source_preset_key`，注释改为：「基于预设复制时写入；仅标记初始来源，不参与升级追踪」

**`src/pages/Requirements/RequirementsWorkbench/schemeConfig.ts`**
- 删除 `PRESET_LATEST_VERSIONS`、`decorateRuntime`、`getPresetLatestVersion`
- `buildTenantDefaultFromPreset` / `cloneSchemeAsDraft` 移除 `source_preset_version` 写入
- `fetchSchemes` 中 `.map(decorateRuntime)` 改为 `.map(s => ({ ...s }))`

**`src/pages/Requirements/RequirementsScheme/index.tsx`**
- 删除「预制可更新」Tag 整块

### P0-2 默认方案只显示「默认」

- 列表 `index.tsx`：「已激活」Tag 条件改为 `s.status === 'active' && !s.is_preset && !s.is_tenant_default`
- `SchemeDetailDrawer/index.tsx`：同上

### P0-3 平台预设不能出现「启用」入口

**`SchemeDetailDrawer/index.tsx`** `extraActions`
- 仅 `!scheme.is_preset && !scheme.is_tenant_default && scheme.status !== 'active'` 显示「启用」
- `deleteAction` 增加 `!scheme.is_tenant_default` 排除

### P0-4 系统固定字段 `number` + 详情抽屉系统字段区始终展示

- 抽出常量 `RequirementsScheme/components/SchemeBuilder/FormBuilder/systemFields.ts`：
  顺序 title → number → department_id → owner_id → position_level → position_cost → execution_frequency → single_duration
- `FormBuilder/index.tsx` 改为引用该常量
- `SchemeDetailDrawer/index.tsx` Fields Tab 两段式：系统固定字段区始终展示；自定义字段区独立 Empty

### P0-5 默认方案异常横幅

`index.tsx`：`getDefaultSchemeHealth() !== 'ok'` → `Banner type="danger"` 文案「租户默认需求模板异常，请恢复默认模板」

### P0-6 基于预设创建：进入未保存态

**`index.tsx`** `handleCloneFromPreset`：删除 `cloneSchemeAsDraft` 调用，改为 `navigate('/requirements/scheme/builder/new?preset=' + encodeURIComponent(sourceId))`

**`SchemeBuilder/index.tsx`**：用 `useSearchParams` 读 `?preset=...`；新增 `buildDraftFromPreset(sourceId)` 把 preset 的 custom_fields/cost_config/...拷入空白 draft，并写 `source_preset_key = src.code`；不调用任何 store 写入接口；点击「保存草稿」时走原 `createSchemeDraft` + `updateSchemeBuilder` 路径，需把 `source_preset_key` 一并传入 `updateSchemeBuilder` 的允许字段
- 保留 `cloneSchemeAsDraft` 不删（`forkActiveScheme` 仍使用）

### P1-6 激活按钮 disabled + 区分原因 Tooltip（修订）

**`index.tsx`** `renderActionMenu` 草稿分支：
```tsx
const hasDepartment = (s.applicable_department_ids ?? []).length > 0;
const validation = validateScheme(s.id);
const canActivate = hasDepartment && validation.ok;
const reason = !hasDepartment ? '请先在编辑页配置适用部门'
  : !validation.ok ? '请先完善字段配置' : '';
const activateItem = (
  <Dropdown.Item key="activate" icon={<CheckCircle size={14} />}
    disabled={!canActivate}
    onClick={(e) => { e.stopPropagation(); if (canActivate) handleActivate(s); }}>
    {t('requirements.scheme.activate')}
  </Dropdown.Item>
);
items.push(canActivate ? activateItem : (
  // ✨ disabled Dropdown.Item 自身不触发 hover 事件，外层 span 承接 Tooltip
  <Tooltip key="activate-tip" content={reason} position="left">
    <span style={{ display: 'block' }}>{activateItem}</span>
  </Tooltip>
));
```
- `handleActivate` 移除「部门为空 → Toast + 跳编辑」副作用
- 同样的 span 包裹也应用到 list 页 `setDefaultItem`（已有 `hasBinding` Tooltip 逻辑）以保持一致

### P1-7 错误码精细化

list 页 `runWithSchemeErrors` 与 builder 页 `handleSchemeError` 同步追加：
```ts
} else if (['SCHEME_BOUND_CANNOT_SET_DEFAULT','SCHEME_DEFAULT_CANNOT_ACTIVATE','SCHEME_DEFAULT_UNAVAILABLE'].includes(e.code)) {
  Modal.error({ title: '操作不允许', content: e.message });
}
```

### P1-8 已激活普通方案完整编辑 + 保存复用部门冲突校验

- 列表 active 分支：「编辑适用部门」→「编辑」
- `SchemeBuilder/index.tsx`：
  - `isFormReadOnly = editMode === 'preset'`
  - `canEditName` / `showTestDrive` 加入 `custom_active`
  - header 后 Info Banner：「正在编辑已激活方案，保存后将直接覆盖配置，适用部门变更会同步生效绑定」
  - `handleSaveDraft` 重写 `custom_active` 分支：
    1. `validateAllFields` 校验
    2. 部门空校验（≥1）
    3. 部门冲突校验（复用 `getOccupiedDepartmentMapByScheme`，排除自身与租户默认方案）
    4. 冲突 → `Modal.error` 列前 5 个冲突部门
    5. 通过 → `updateSchemeBuilder` 完整保存 + `setSchemeBindingsForScheme` 同步

### P1-9 平台预设缺失空态（修订）

**`index.tsx`** —— **disabled / 空态判定必须基于未过滤全量数据**

- 维护独立全量统计 state：
```tsx
const [stats, setStats] = useState({ hasPresets: false, hasTenantSchemes: false });
```
- 在 `load()` 中同时拉一份**未过滤**数据用于 stats（与 keyword 解耦）：
```tsx
const load = useCallback(async () => {
  setLoading(true);
  try {
    const [filtered, all] = await Promise.all([
      fetchSchemes(keyword),
      fetchSchemes(''),           // 全量未过滤，用于 stats
    ]);
    setSchemes(filtered);
    setStats({
      hasPresets: all.some(s => s.is_preset),
      hasTenantSchemes: all.some(s => !s.is_preset),
    });
  } finally { setLoading(false); }
}, [keyword]);
```
- 当前页面展示集合：
```tsx
const filteredTenantSchemes = schemes.filter(s => !s.is_preset);
```
- 「基于预设创建」按钮：`disabled={!stats.hasPresets}` + Tooltip「平台预设方案不可用」（不受 keyword 影响）
- 空态：
```tsx
{!loading && filteredTenantSchemes.length === 0 ? (
  !stats.hasPresets
    ? <EmptyState variant="error" description="平台预设方案不可用，请联系管理员" />
    : !stats.hasTenantSchemes
      ? <EmptyState variant="noData" description="暂无租户方案，可基于预设创建" />
      : <EmptyState variant="noData" description="未找到匹配的租户方案" />
) : (
  <div className="requirements-scheme-grid">{schemes.map(...)}</div>
)}
```

### 不涉及
- 后端 API、部门绑定数据模型、字段类型清单
- 列表表格化（P2 暂不动）
- i18n 文案文件（新增就地中文硬编码）

### 验证
- 默认方案仅显示「默认」标签
- 预设详情无「启用」按钮
- FormBuilder 与详情抽屉系统字段均 8 个含「编号」；自定义字段为空时只在自定义区 Empty
- 默认方案异常 → 红色 Banner
- 草稿无部门 → 「启用」灰显 + Tooltip「请先在编辑页配置适用部门」（**鼠标 hover 实际可触发**）
- 草稿字段不完整 → 「启用」灰显 + Tooltip「请先完善字段配置」
- 已激活方案编辑 → Info Banner，字段可编辑；保存时部门冲突 Modal.error 阻断
- 「基于预设创建」按钮 disabled 与空态文案**不随搜索词变化**
- 从预设进入编辑页 → 未保存态不写入 schemeStore；放弃后无残留
