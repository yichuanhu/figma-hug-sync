

# 首页核心指标卡片与资源获取卡片底部对齐

## 一、问题

首页采用左右两列 grid 布局：
- 左列：快速开始（Shortcuts）+ 核心指标（Metrics）
- 右列：个人通知（Notification）+ 资源获取（Resource）

由于 `.home-content` 配置了 `align-items: start`，且左右栏是 `flex-direction: column` + `gap: 24px`，两列高度由各自内容决定。当前右列内容比左列高，导致左列底部留白，**核心指标卡底部高于资源获取卡底部**。

## 二、目标

让左列「核心指标」卡的底部与右列「资源获取」卡的底部水平对齐：增加核心指标卡片高度，撑满右列剩余高度。

## 三、修改方案（仅样式，不动结构）

**文件：`src/pages/Home/index.less`**

1. `.home-content`：移除 `align-items: start`（或改为 `stretch`，grid 默认即 `stretch`），让左右列高度相等。
2. `.home-left-column` / `.home-right-column`：保持 `display: flex; flex-direction: column; gap: 24px;`，并显式 `height: 100%`，使列容器与 grid track 同高。
3. 左列内子模块策略：
   - `ShortcutsSection`（`.home-card`）保持自适应内容高度（`flex-shrink: 0`）。
   - `MetricsSection`（`.home-card.metrics-section`）追加 `flex: 1 1 auto`，吸收剩余空间，从而底部对齐右列底部。

**文件：`src/pages/Home/components/MetricsSection/index.less`**

4. `.metrics-section`：让卡片成为列方向 flex 容器，`.metrics-grid` 设置 `flex: 1`，使内部网格垂直撑开。
5. `.metric-card`：将 `align-items: flex-start` 调整为 `align-items: center`（或保持 flex-start 但允许内容垂直居中分布），让指标在更高的卡片中视觉居中、不下沉到顶部。

## 四、影响范围

- 仅影响首页左右两列的高度对齐与核心指标内部留白。
- 当右列只有 1 个模块（极端隐藏场景）或左列被替换为 `ColumnEmpty` 时，由于 `ColumnEmpty` 已具最小高度，行为保持稳定。
- 响应式断点 `≤960px` 下变为单列布局，`flex: 1` 不会造成异常拉伸。

## 五、文件改动清单

- `src/pages/Home/index.less` — `.home-content` 去掉 `align-items: start`；左右列加 `height: 100%`；`.metrics-section` 追加 `flex: 1`
- `src/pages/Home/components/MetricsSection/index.less` — `.metrics-section` 改为 `display: flex; flex-direction: column;`，`.metrics-grid` 加 `flex: 1`，`.metric-card` 垂直居中

## 六、不在范围

- 不调整核心指标的字段、图标、列数与配色
- 不修改右列资源获取卡片
- 不调整响应式断点阈值

