将「业务指标配置」工具栏中搜索框与筛选按钮的左右顺序调整为：

- 左侧：搜索框（320px）→ 筛选按钮（FilterPopover）
- 右侧：刷新按钮 → 新建指标按钮

仅需修改 `src/pages/Operations/MetricsConfig/index.tsx` 中的工具栏 JSX 结构，以及 `index.less` 中新增 `.metrics-config-toolbar-left` 样式类。