问题：当前「未发布」和「需审批」前缀均使用 text-2 灰色，视觉上缺乏层次，用户反馈看起来丑。

方案：将「需审批」前缀的文字颜色从灰色恢复为蓝色主色，但通过降低不透明度来降低视觉饱和度，使其既与「未发布」的灰色区分开，又不会过于抢眼。

技术实现：
- 在 `ProcessSelectionStep/index.less` 中，将 `.row-meta__approval-prefix` 的 `color` 从 `var(--semi-color-text-2)` 恢复为 `var(--semi-color-primary)`，并添加 `opacity: 0.72` 降低饱和度。
- 保持「未发布」为灰色、「有新版本可发布」为琥珀色、「已发布」为绿色的现有配色不变。
- 无需改动 TSX 逻辑，仅调整样式 token。