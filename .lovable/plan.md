## 计划

1. 对齐页面容器结构
   - 移除资产上架页面自身重复使用的 `app-layout-content-card` 类，避免与外层布局卡片叠加导致顶部间距异常。
   - 保留页面自身类名 `my-shared-page`，让它像资产市场页面一样只作为内容容器存在。

2. 对齐页面头部样式
   - 将资产上架页面标题区域改为和资产市场一致的顶部对齐方式。
   - 标题本身使用 `margin: 0`，避免 Semi UI 标题默认 margin 造成下移。
   - 标题区与工具栏间距保持列表页规范。

3. 验证效果
   - 对比 `/sharing-center/my-published` 与 `/sharing-center/market` 的标题顶部位置，确认两者与页面顶部距离一致。