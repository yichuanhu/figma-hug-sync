# 简化发布页流程行的状态标记

参考所选方向（v1：圆点 + 彩色文字 + 竖线分隔），把当前过重的紫/灰 Tag、蓝色 Tag 和橙色警告三角统一替换为一行轻量 meta 文本。

## 改造范围

仅修改 `src/pages/Development/ReleaseManagement/CreateReleasePage/components/ProcessSelectionStep/`，不动布局、复选框、版本下拉、右侧面板及业务逻辑（scope 锁定规则保持不变）。

## 视觉规范（每行流程名下方一行 meta）

```text
● 有新版本  |  需审批 · 财务发布审批  |  v2.1.0
```

- 字号 `12px`，行高紧凑；元素间用 `|`（slate-300）分隔。
- **发布状态**（带圆点 + 加粗色字）：
  - 未发布 → slate-500 / 圆点 slate-400
  - 有新版本 → primary（蓝）
  - 已发布 → 成功色（绿，semi `--semi-color-success`）
- **审批范围**（普通灰字 + 强调色前缀）：
  - 需审批 → 前缀"需审批"用 primary 文字色，后接 `·` + 模板名
  - 无需审批 → "无需审批 · {部门名}"，整体 slate-500
- **版本号**：等宽字体（`font-mono`），slate-400。
- 不兼容（被 scope 锁定禁用）的行：保持现有 `opacity: 0.45 + cursor: not-allowed`，meta 区颜色继承父级灰度即可。
- 移除原先的 Semi `Tag` 组件、橙色 `AlertTriangle` 三角图标。

## scope 锁定 Banner

保持现有 `.scope-lock-banner`，仅调整文案前缀从 Tag 风格改为同样的 `● 当前范围：需审批 · 财务发布审批` 文本风格，与行内 meta 视觉一致。

## 技术改动

- `ProcessSelectionStep/index.tsx`
  - 删除 `renderScopeTag`、`renderReleaseStatusTag` 内的 Semi `Tag` 用法，新增 `renderRowMeta(process)` 输出一行 `<div className="row-meta">` 含 status / approval / version 三段，由 `|` 分隔。
  - 移除行内 `IconAlertTriangle` 警告 Tag；改为给"有新版本"和"未发布"用对应色彩自描述。
  - 颜色通过 less 中的 className 控制：`.row-meta__status--pending / --new / --published`、`.row-meta__approval--required / --none`。
- `ProcessSelectionStep/index.less`
  - 新增 `.row-meta` 样式块：`display:flex; align-items:center; gap:8px; font-size:12px; line-height:1;`。
  - `.dot { width:6px; height:6px; border-radius:50%; margin-right:6px; }`，与每个状态变体配对色。
  - `.sep` 用 `color: var(--semi-color-border)`。
  - `.version { font-family: var(--semi-font-family-code, monospace); color: var(--semi-color-text-2); }`。
- 文案 key 复用现有 i18n，不新增。

## 不在范围

- 不改 scope 校验逻辑、不改 Banner 行为、不改右侧已选面板内容、不改其它步骤。
