## 目标
将「业务指标配置」页面顶部的 Tabs（全部 / 已启用 / 已隐藏）替换为「状态筛选」弹出层，使用项目已有的 `FilterPopover` 通用组件，保持与运营中心其他列表页一致的筛选交互风格。

## 变更范围

### 1. 组件：src/pages/Operations/MetricsConfig/index.tsx
- 移除 `Tabs`、`TabPane` 导入与使用。
- 引入 `FilterPopover`。
- 新增 `filterVisible` 状态，类型 `'all' | 'visible' | 'hidden'`。
- 在工具栏左侧放置 `FilterPopover`，配置一个 `radio` 类型的筛选区块：
  - key: `visible`
  - label: `common.status`
  - options: `all` / `visible` / `hidden`，label 分别引用 `metricsConfig.tabAll` / `tabVisible` / `tabHidden`
- `fetchData` 中根据 `filterVisible` 拼接 `visible` 参数（`all` 时传 `undefined`）。
- 空态判断中 `tab !== 'all'` 改为 `filterVisible !== 'all'`；清空筛选时重置 `filterVisible` 为 `'all'`。

### 2. 样式：src/pages/Operations/MetricsConfig/index.less
- 删除 `.semi-tabs-bar { border-bottom: none; }` 样式。
- 保持 `.metrics-config-toolbar` flex 布局不变；`FilterPopover` 触发按钮自然嵌入左侧。

### 3. i18n
- 复用已有 key：`metricsConfig.tabAll`、`metricsConfig.tabVisible`、`metricsConfig.tabHidden`、`common.status`、`common.filter`、`common.reset`、`common.confirm`。
- 无需新增翻译。

### 4. 不改动
- 表格列、弹窗、抽屉、mock 切换器、骨架屏、空态组件均保持不变。

## 预期效果
顶部工具栏左侧显示「筛选」按钮（带有数量角标，当选中非全部时高亮），点击后弹出单选层选择状态；右侧保留搜索框、刷新、新建指标按钮。