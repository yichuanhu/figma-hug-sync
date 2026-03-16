

# 三项改动实施计划

## 1. 平台公告：Banner 与列表改为左右排列

当前 Banner 轮播在上、公告列表在下（上下排列）。改为左右并排布局：

```text
┌─────────────────────────────────────────────┐
│ 平台公告                                      │
│ ┌──────────────────┐  ┌───────────────────┐  │
│ │                  │  │ 🔴 紧急 标题...     │  │
│ │  Banner 轮播      │  │ 🟠 重要 标题...     │  │
│ │  (左侧, 约50%)   │  │ 🔵 普通 标题...     │  │
│ │                  │  │ ...               │  │
│ └──────────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────┘
```

**文件变更**：
- `AnnouncementSection/index.less`：在 `.announcement-section` 内添加 `.announcement-body` 容器，使用 `display: flex; gap: 16px`，Banner 占 `flex: 1`，列表占 `flex: 1`；移除 Banner 的 `margin-bottom`
- `AnnouncementSection/index.tsx`：用 `.announcement-body` 包裹 Banner 和列表

## 2. 核心指标自适应重构

当前问题：使用 `flex-wrap` 但媒体查询里写了 `grid-template-columns`（flex 布局下无效），导致响应式失效。

**重构方案**：改用 CSS Grid 统一布局：
- 默认：`repeat(4, 1fr)` — 4 列，每行末尾隐藏分隔线
- ≤960px：`repeat(2, 1fr)` — 2 列，偶数项隐藏分隔线
- ≤480px：`repeat(1, 1fr)` — 1 列，全部隐藏分隔线

**文件变更**：
- `MetricsSection/index.less`：`.metrics-grid` 改用 `display: grid`，移除 `flex-wrap` 和 `max-width: 25%`，正确设置各断点下的 `grid-template-columns` 和分隔线隐藏规则

## 3. 中心卡片渐变方向调整 + 去除边框阴影

当前：渐变从左上（色彩）到右下（白色），有 `border` 和 hover `box-shadow`。

调整为：
- 渐变方向改为 `to right`（从左到右），左侧 70% 为白色，右侧 30% 为主题色
- 即 `linear-gradient(to right, #FFFFFF 0%, #FFFFFF 70%, 主题色 100%)`
- 移除 `border: 1px solid rgba(0,0,0,0.04)` 和 hover 时的 `box-shadow`
- 保留 hover 时的渐变微调（白色区域稍减）

**文件变更**：
- `CenterEntrySection/index.tsx`：更新每个 entry 的 `gradient` 和 `hoverGradient` 值
- `CenterEntrySection/index.less`：移除 `border` 和 `box-shadow`

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `AnnouncementSection/index.tsx` | 添加 `.announcement-body` 包裹 Banner+列表 |
| `AnnouncementSection/index.less` | 左右并排布局样式 |
| `MetricsSection/index.less` | flex→grid 重构，修复响应式 |
| `CenterEntrySection/index.tsx` | 渐变值调整（左白右彩，7:3） |
| `CenterEntrySection/index.less` | 移除 border 和 box-shadow |

