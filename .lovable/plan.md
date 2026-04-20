
## 目标
将需求详情抽屉「概览」Tab 中的审批流程展示（`ApprovalFlowProgress`）改造为飞书审批流风格，提升信息密度与可读性。

## 飞书审批流核心特征
1. **垂直时间线布局**：每个审批节点纵向排列，左侧是状态图标 + 连接线，右侧是节点详情。
2. **节点状态图标**：圆形彩色图标（绿色对勾=通过，红色叉=驳回，蓝色实心=进行中，灰色空心=未开始），通过连接线串联。
3. **节点头部**：层级名称 + 审批模式标签（会签/或签/依次），右侧显示状态文字（已通过/审批中/待审批）。
4. **审批人列表**：每行一个审批人，含头像 + 姓名 + 状态 + 操作时间，已操作者展示评论气泡。
5. **当前节点高亮**：进行中节点采用主色边框或左侧色条，已完成节点保持常规色，未开始节点淡化。
6. **整体收拢/展开**：保留现有顶部 header toggle（默认收拢仅展示概要 Steps；展开后显示飞书风格时间线）。

## 实现方案

### 1. 重构 `ApprovalFlowProgress/index.tsx`
- 移除现有 `Steps` 组件作为概要的方案，改为：
  - **收起态**：顶部一行展示「当前 L{n} {名称} · 进行中 / 已完成」+ 简化的小圆点进度（n 个圆点串联）。
  - **展开态**：飞书风格垂直时间线（自定义 div 实现，不依赖 Semi `Timeline`，便于精确控制视觉）。
- 时间线节点结构：
  ```text
  ●──┐  L1 部门主管审批 [会签]              已通过
     │    ┌─────────────────────────┐
     │    │ 👤 张三  已通过  03-15 14:20 │
     │    │   "同意，符合预算"            │
     │    └─────────────────────────┘
  ●──┘
  ●──┐  L2 财务审批 [或签]                  审批中
     │    ┌─────────────────────────┐
     │    │ 👤 李四  待审批              │
     │    │ 👤 王五  待审批              │
     │    └─────────────────────────┘
  ○
  ```
- 状态图标：使用 Lucide `CheckCircle2` / `XCircle` / `Clock`（填充色背景圆），未开始用空心圆 `Circle`。
- 当前层级整体加左侧 3px 主色条 + 浅蓝背景。

### 2. 重写 `index.less`
- 时间线左侧轨道：32px 宽列承载状态圆点与连接线（`::before` 1px dashed/solid 线）。
- 节点卡片：圆角 6px，padding 12px，背景 `--semi-color-fill-0`，当前节点 `--semi-color-primary-light-default` + 左侧色条。
- 审批人行：flex 布局，头像 24px、姓名、状态 Tag、时间右对齐。
- 评论气泡：浅灰背景 + 6px 圆角，`margin-left: 32px`（与头像对齐缩进）。

### 3. 保留现有逻辑
- `computeLevelStatus` 复用。
- i18n key 不变（`requirements.approvalFlow.*`）。
- `config.currentLevel` 驱动高亮与进度。

### 4. 范围
- 仅修改 `ApprovalFlowProgress/index.tsx` 与 `index.less`，不改类型与数据结构。
- 不影响审批操作弹窗等其他逻辑。

## 涉及文件
- `src/pages/Requirements/RequirementsWorkbench/components/ApprovalFlowProgress/index.tsx`
- `src/pages/Requirements/RequirementsWorkbench/components/ApprovalFlowProgress/index.less`
