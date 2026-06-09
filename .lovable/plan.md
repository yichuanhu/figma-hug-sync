## 目标

根据 STORY-017 v9（2026-06-09）与 demo.json 数据结构升级需求分类：
- 分类结构由「键 + 平铺枚举值」改为「分类维度 → 一级枚举值 → 二级枚举值」的层级树。
- 分类维度不可选，仅枚举值可选；一级、二级枚举值均可选择（不要求叶子）。
- 每个维度作为独立的「级联选择器」，最多选 1 个值；可选 0–3 个维度。
- 涉及页面：新建/编辑需求页（`RequirementCreatePage`）、需求详情抽屉（`RequirementDetailDrawer`）。

## 改动点

### 1. Mock 类型与数据（`src/mocks/classification/`）

`types.ts`
- 新增 `ClassificationItem`（即 demo.json 中 `node_type=item` 的节点）：`id / category_id / parent_id / name / description? / index? / path / selectable / children: ClassificationItem[]`。
- 重构 `ClassificationKey`（维度节点）：`id / name / description? / status / node_type:'category' / selectable:false / field / persist_field / applicableBusinessObjectTypes / children: ClassificationItem[]`，移除原 `values`。
- `ClassificationAssignmentItem` 改为单值：`{ classificationKeyId: string; itemId: string | null; path?: string[] }`；同步更新 `EntityClassification.values` 为单值结构 `selectedItem: { id; name; path: Array<{id;name}> } | null`。

`mockData.ts`
- 用 demo.json 的三套维度（场景/重复性/操作类型）重写，包含层级 `children`；保留各 `field`、`persist_field`，便于详情快照展示。

`service.ts`
- `fetchClassificationsForEntity` 返回新结构（过滤 INACTIVE 节点，递归过滤 children）。
- `assignEntityClassifications` 接收单值列表；空 `itemId` 视为清除该维度。
- `fetchEntityClassifications` 返回带路径快照的结构。

### 2. 字段组件 `ClassificationTagsField`

- `ClassificationValueMap` 变为 `Record<string /*keyId*/, string | null /*itemId*/>`（单选）。
- 每个维度用 Semi `Cascader`：
  - `treeData` = 维度的 `children`（递归映射 `value/label/children`）。
  - `changeOnSelect` = true（允许一级或二级被选中）。
  - `displayProp="label"`，单选；`showClear`；`placeholder="请选择"`。
- 维度数量上限提示：「已选择 N/3 个维度」（仅提示，不强校验，因为本身最多有 N 个维度，仍非必选）。
- `required` 默认 `false`，移除"至少选 1 个"强制错误（按文档分类标签为可选字段）。
- 编辑回填：把 `EntityClassification` 的单值与 `path` 还原为 Cascader 的 `value: string[]`（完整路径数组）。
- 只读视图：按维度逐行显示「维度名：一级 / 二级」（用 ` / ` 链路展示，与 `DepartmentPath` 风格一致），空时显示「—」。
- loading/error/empty 状态文案与样式保留。

### 3. 新建/编辑页 `RequirementCreatePage`

- 状态类型从 `Record<string,string[]>` 改为 `Record<string,string|null>`。
- 提交 payload：`classifications` 数组改为 `{ classificationKeyId, itemId, path }`；保留对应 `persist_field` 写入需求 mock 中（用于详情回显）。
- 不再依赖必选错误（`forceClsError` 仍保留，但 required 默认 false）。

### 4. 需求详情抽屉 `RequirementDetailDrawer`

- 用 `ClassificationTagsField readonly` 渲染分类区域，显示链路式标签：
  - 行格式：`场景： 财务流程 / 报销处理`
  - 多维度纵向排列；空维度跳过；全部为空显示「暂无分类标签」。
- 区域标题保持「分类标签」。

### 5. 不改动

- 列表表格、筛选、其他模块（流程/任务）暂不改动。
- 后端 schema 与接口由后端配套实现，本次只调整前端 mock。

## 技术细节

```ts
// types.ts 关键结构
export interface ClassificationItem {
  id: string;
  category_id: string;
  parent_id: string;
  name: string;
  description?: string;
  index?: number;
  path: string;
  node_type: 'item';
  selectable: boolean;
  children: ClassificationItem[];
}

export interface ClassificationKey {
  id: string;
  name: string;
  description?: string;
  status: ClassificationStatus;
  node_type: 'category';
  selectable: false;
  field: string;            // e.g. 'scene_item_id'
  persist_field: string;    // e.g. 'classification_scene_item_id'
  applicableBusinessObjectTypes: BusinessObjectType[];
  children: ClassificationItem[];
  order?: number;
}

export type ClassificationValueMap = Record<string, string | null>;

export interface ClassificationAssignmentItem {
  classificationKeyId: string;
  itemId: string | null;
  path?: string[]; // 名称路径快照
}
```

```tsx
// Cascader 用法
<Cascader
  treeData={toCascaderData(key.children)}
  value={value[key.id] ? findPath(key.children, value[key.id]) : []}
  onChange={(v) => onChange({ ...value, [key.id]: (v as string[])?.at(-1) ?? null })}
  changeOnSelect
  showClear
  placeholder="请选择"
  style={{ width: '100%' }}
/>
```

## 待确认

1. 详情页只读链路展示是否使用 ` / ` 分隔（与部门链路风格统一）？默认使用。
2. 当 FEAT-003 返回空时，新建页是否完全隐藏「分类标签」标题（文档 R-11 是隐藏整个区域）？默认隐藏。
