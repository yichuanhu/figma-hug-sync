

## 中心入口卡片视觉优化

### 调整内容

**1. 降低渐变色饱和度**

将渐变终点色的饱和度降低，使用更灰调、柔和的色彩：

| 中心 | 当前终点色 | 优化后终点色 | Hover 终点色 |
|------|-----------|-------------|-------------|
| 需求 | #D6E4FF | #E8EDF5 | #DEE5F2 |
| 开发 | #D1EDE0 | #E3EDE8 | #D9EAE1 |
| 调度 | #FFE8CC | #F2EBE2 | #EDE5DA |
| 运营 | #EAD5FF | #EBE5F2 | #E2DCEC |
| 运维 | #FFD4D4 | #F2E5E5 | #ECDCDC |

渐变方向改为 `135deg`，过渡更自然：`linear-gradient(135deg, #FFFFFF 0%, <midColor> 60%, <endColor> 100%)`

**2. 移除图标容器背景**

- 去掉 `iconBg` 属性和 `.center-entry-icon-wrapper` 的背景色、圆角
- 图标直接裸露展示，无容器包裹
- 保留 40x40 尺寸用于对齐，图标尺寸从 24px 调整为 28px

### 文件变更

1. **`index.tsx`** — 移除 `iconBg` 字段，更新所有 gradient/hoverGradient 值，去掉 icon-wrapper 的 backgroundColor style
2. **`index.less`** — `.center-entry-icon-wrapper` 去掉 background-color、border-radius，图标尺寸调整为 28px

