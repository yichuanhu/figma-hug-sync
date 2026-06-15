## 问题
当前发布页 `ProcessSelectionStep` 行内的「未发布」用 `text-2` 灰色显示，视觉上和占位文字、分隔符混在一起，缺乏状态感。

## 参考实现
需求中心使用统一的 `@/components/StatusDot` 组件（彩色圆点 + `text-0` 深色标签文字），状态色映射定义在 `RequirementsWorkbench/statusConfig.ts`：
- `PENDING_PROJECT` 待立项 → `cyan`
- `PENDING_APPROVAL` 审批中 → `orange`
- `DEVELOPING` 开发中 → `blue`
- `LAUNCHED` 已上线 → `green`
- `DRAFT` / `WITHDRAWN` → `grey`

关键设计：圆点用颜色区分状态，**文字本身始终是 text-0 深色**，不会出现整段灰色文字看不清的情况。

## 方案
将 `ProcessSelectionStep` 行内自实现的「彩色文字 + 圆点」改为复用 `@/components/StatusDot`，并按需求中心的语义对齐配色：

- 未发布 → `cyan`（与「待立项」语义一致：等待进入下一阶段）
- 有新版本可发布 → `orange`（与「待审批」一致：提示用户关注）
- 已发布 → `green`（与「已上线」一致）

文字部分由 `StatusDot` 自动渲染为 `text-0` 深色，不再使用饱和彩色文字。

## 技术实现
1. `ProcessSelectionStep/index.tsx`：
   - 引入 `import StatusDot from '@/components/StatusDot';`
   - 在 `renderRowMeta` 中将状态段从 `<span className="row-meta__status ..."><span className="row-meta__dot"/>...</span>` 替换为 `<StatusDot color={...} label={statusText} />`
   - 移除 `statusKey`/`row-meta__status--*` 分支，仅保留颜色映射 `pending→'cyan' | new→'orange' | published→'green'`

2. `ProcessSelectionStep/index.less`：
   - 删除 `.row-meta__status`、`.row-meta__dot` 相关样式（由 StatusDot 接管）
   - 保留 `.row-meta`、`.row-meta__sep`、`.row-meta__approval*`、`.row-meta__version`
   - 缩小 StatusDot 字号至 12px 以匹配 row-meta：在 `.row-meta` 下加 `.ly-status-dot { font-size: 12px; }`

3. 不改变 TSX 业务逻辑、不改动审批前缀颜色（已是 primary 0.72）。