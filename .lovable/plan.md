
## 目标

参考图重做「发布审批详情」和「停用审批详情」抽屉，使其视觉与需求审批一致且更精致：内容用卡片包裹、关键信息以"标签—值"行展示、流程与资源用紧凑表格、右侧属性面板字段顺序与参考图一致；标题区显示编号 + 流程数 tag + 状态点。

## 视觉变更（仅 UI / 样式，不改业务逻辑）

### 抽屉标题
- 标题改为：`RLS-20260622-019`（强）+ `共 N 个流程` 灰色 Tag + `● 待审批` StatusDot
- 停用单：`OFL-xxx` + `流程：xxx` Tag + 状态点

### 左侧 Tab1「发布申请」/「停用申请」
内容由当前的"分组 + 标题"改为 **卡片堆叠**：
1. **卡片：发布申请快照 / 停用申请快照**
   - `.detail-snapshot-card`：白底、`1px solid var(--semi-color-border)`、`border-radius: 8px`、`padding: 16px 20px`
   - 卡片标题 `Title heading=6`，下方为两列 grid（label 80px tertiary 文字 + value）行间距 12px
   - 字段（发布）：发布编号 / 发布类型 / 发布状态（StatusDot）/ 流程数量 / 资源数量 / 提交时间 / 描述（ExpandableText 占整行）
   - 字段（停用）：申请编号 / 流程名称 / 状态 / 申请人 / 提交时间 / 停用原因
2. **卡片：流程与版本 (N)**
   - Semi `Table size="small"` 列：流程名称 / 版本 / 描述；行高紧凑、无外边框
3. **卡片：资源 (N)**（发布单专用）
   - Semi `Table size="small"` 列：资源名称 / 类型 / 来源流程 / 手动添加（是/否）
4. **卡片：依赖检查快照**（停用单专用）
   - 内部保留现有 dependency 渲染

错误/拒绝/失败 Banner 保留在卡片之上。

### 左侧 Tab2「审批进度」
内容同样改为卡片：
1. **卡片：审批流**
   - 右上角显示「当前第 X / Y 级」
   - Timeline：未审批级别用蓝色待审样式（`type="default"` + 蓝点）+ `● 待审批` 文字；已审批保持现有 success/error 样式；显示审批人列表 + 第 N 级
2. **卡片：审批记录**
   - 有记录：展示 records timeline
   - 无记录：使用 EmptyState（图标 + 「暂无审批记录」）
3. **审批操作区**（保留现状：TextArea + 通过/拒绝按钮，放在卡片下方）

### 右侧属性面板字段顺序（按参考图）
发布：审批状态 / 开发者 / 所属部门 / 当前级别 / 提交时间 / 发布编号
停用：审批状态 / 申请人 / 所属部门 / 当前级别 / 提交时间 / 申请编号
- 字段排版改为上下结构（label 在上 tertiary small，value 在下，无 divider 分组），与参考图一致
- 复用 `requirement-detail-property-panel` 但新增/覆写 `.detail-property-stacked` 类，去掉 divider，每项 `margin-bottom: 20px`

## 涉及文件

1. `src/pages/Development/ReleaseManagement/components/ReleaseDetailDrawer/index.tsx`
   - 重写 `renderOverviewTab`：拆为 SnapshotCard + ProcessTable + ResourceTable
   - 重写 `renderApprovalTab`：拆为审批流 Card + 审批记录 Card
   - 重写 `ReleasePropertyPanel`：去 divider、堆叠样式、字段顺序对齐参考图
   - 抽屉 title 改为 ReactNode（编号 + Tag + StatusDot）

2. `src/pages/Development/ReleaseManagement/components/ReleaseDetailDrawer/index.less`
   - 新增 `.detail-snapshot-card` / `.detail-snapshot-grid` / `.detail-snapshot-row`
   - 新增 `.detail-table-card`（Table 包裹卡片，去掉 Table 自身边框，使用卡片边框）
   - 新增 `.detail-property-stacked`（覆写 requirement-detail-property-* 的 divider/排版）
   - 新增 `.detail-approval-card` + `.detail-approval-card-header`（带"当前第 X/Y 级"右上角）

3. `src/pages/Development/OfflineApprovals/components/DetailDrawer/index.tsx`
   - 同上结构：SnapshotCard（编号/流程/状态/申请人/提交时间/停用原因）+ 依赖检查 Card
   - 审批 Tab 拆卡片
   - PropertyPanel 改堆叠
   - 抽屉 title 改 ReactNode

4. `src/pages/Development/OfflineApprovals/components/DetailDrawer/index.less`
   - 复用上述类（通过 `@import` ReleaseDetailDrawer 的样式或独立定义同名类）；保留依赖列表样式

## 不改动

- 业务逻辑：approve/reject/retry API、Mock、列表页、`DetailDrawerWrapper`、`UserNameWithCard`、`StatusDot`、`ExpandableText`、i18n key 一律不动
- 当前的 `approvalContext` prop 协议保持不变
- 需求审批抽屉 (`RequirementDetailDrawer`) 不动

## 验证

通过浏览器预览 `/dev-center/publish-approvals` 与 `/dev-center/offline-approvals`，对比参考图核对：标题构成、卡片边框/留白、字段顺序、Timeline 待审样式、空状态、右侧属性面板顺序。
