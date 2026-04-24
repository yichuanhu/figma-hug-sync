

# 运维中心「配置管理」恢复分组名称

## 一、问题

上一轮将 5 个子菜单合并为单个入口后，原本的「配置管理」分组标题被一并移除，导致侧边栏中该项直接平铺在「数据大盘」分组之后，缺少与「数据大盘」对称的分组归属感。

## 二、目标

在侧边栏运维中心下，恢复「配置管理」作为分组标题（`isGroupLabel: true`），其下保留单个可点击菜单项「配置管理」，与「数据大盘」分组在视觉与结构上保持对称。

## 三、修改方案

### 1. 侧边栏（`src/components/layout/Sidebar/index.tsx`）

在「数据大盘」分组之后、原合并入口的位置，恢复为「分组标题 + 单个子项」结构：

```ts
// 分组标题
{ key: 'mtConfigGroup', labelKey: 'sidebar.mtConfigGroup', isGroupLabel: true },
// 唯一子项
{ key: 'mtConfigManagement', labelKey: 'sidebar.mtConfigManagement',
  icon: <Settings size={18} strokeWidth={2} />, path: '/maintenance/config' },
```

路径匹配逻辑保持不变：`/maintenance/config*` → `mtConfigManagement`。

### 2. i18n（`public/i18n/zh-CN.json` / `en.json`）

新增分组标题文案：

- `sidebar.mtConfigGroup`：中文「配置管理」 / 英文「Configuration」
- `sidebar.mtConfigManagement` 已存在（中文「配置管理」），保留作为子项标签。

> 分组标题与子项中文同名属预期：与「数据大盘」分组下「系统指标 / 业务指标」的层级表达方式一致，分组名表达归类，子项名表达功能入口。如需差异化，可将分组名调整为「配置」，子项保持「配置管理」——此为可选，等待用户偏好后再定。

## 四、文件改动清单

- `src/components/layout/Sidebar/index.tsx` — 在 `mtConfigManagement` 之前插入 `mtConfigGroup` 分组标题项
- `public/i18n/zh-CN.json`、`public/i18n/en.json` — 新增 `sidebar.mtConfigGroup`

## 五、不在范围

- 不改路由、不改页面 Tab 逻辑
- 不调整「数据大盘」分组及其子项
- 不恢复此前已移除的 5 个子菜单 key

