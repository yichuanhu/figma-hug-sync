# 优化状态列「审批中」提示展示

## 问题

当前状态列宽 180px，「● 开发中」+「发布审批中」彩色 Tag 横向放不下，导致状态文字被竖向挤压换行（截图中「开 发 中」、「已 归 档」竖排），非常难看。

## 方案：Tag 改为图标徽标（icon-only badge）

把 `ApprovalHintCell` 的 Tag 文字去掉，只保留一个 16px 的彩色圆形图标徽标，悬浮 Tooltip 显示完整文案（"发布审批中 (1/3)" 等），点击仍然打开抽屉「审批进度」Tab。

效果：状态单元从 `● 开发中 [📄 发布审批…]` 变为 `● 开发中  📄`（图标带浅色圆底），整体宽度 ≈ 100px，180px 列宽充裕，绝不换行。

## 改动点

1. **`ApprovalHintCell/index.tsx`**
   - 移除 Tag 组件，改为 16px × 16px 圆形容器（`borderRadius: 50%`、对应色系浅底 `semi-color-{color}-light-default`、图标颜色 `semi-color-{color}`）
   - 图标尺寸 12px，居中
   - 保留 `cursor: pointer`、`onClick stopPropagation`、外层 Tooltip
   - Tooltip 内容改为「文案 + 进度」一行，例如 `发布审批中 · 第 1 / 3 级`
   - `!hint` 分支：状态列里返回 `null`（不再占位 `-`，因为状态本身已经显示）；流程名列同理

2. **`ProcessManagementContent/index.tsx`**
   - 状态列外层 div 增加 `whiteSpace: 'nowrap'`，双保险防止换行
   - 状态列 width 可以从 180 收回到 140（节省空间）
   - 流程名列（调度中心 context）保持现有布局，图标徽标天然占位极小

## 不在范围

- 不改 `useProcessApprovalHints` Hook、mock 数据、抽屉 Tab
- 不改其它列宽
- 不增删 i18n key（Tooltip 复用已有的 `publishPending` / `offlinePending` / `offlineExecuting` / `offlineFailed` 和 `levelTooltip`）

## 验收

- 状态列 `● 开发中` 与圆形图标徽标同行展示，不换行
- 鼠标悬浮图标显示完整审批状态 + 级数
- 点击图标打开流程详情抽屉「审批进度」Tab
- 无审批时状态列只显示状态圆点 + 文字，无多余 `-`
