## 目标

修改流程详情抽屉中「审批进度」Tab：
1. **始终只读**：即使当前用户是审批人也不显示「通过/拒绝」按钮，审批操作只在「发布审批」「停用审批」页面进行。
2. **布局对齐**：参考 `PublishApprovals/components/DetailDrawer` 的卡片 + Timeline 风格，替换当前自定义 grid+小圆点布局。

## 改动范围

仅一个文件 + 同目录 less：
- `src/components/ProcessManagement/ProcessManagementContent/components/ProcessDetailDrawer/components/ApprovalProgressTab/index.tsx`
- `…/ApprovalProgressTab/index.less`

## 设计

### 顶部只读提示
- 文案改为：「审批进度仅供查看。如需审批，请前往「发布审批 / 停用审批」页面。」
- 视觉沿用现有 info 浅色条（`semi-color-info-light-default`）。
- 不渲染任何操作按钮（当前也没有，保持并加注释明确"此处永久只读"）。

### 主体布局（参考 PublishApprovalDetailDrawer）

```text
┌─ 基本信息（Card title="基本信息"）────────────────┐
│ 流程名称：客户信息同步                            │
│ 版本号  ：v1.0.0  [发布审批中 Tag]                │
│ 申请人  ：王五                                    │
│ 所属部门：Finance Department                      │
│ 提交时间：2026/06/12 17:25:34                     │
│ 发布说明：首次上线，对接 CRM 客户主数据           │
└──────────────────────────────────────────────────┘
┌─ 审批流：{template.name}  当前第 X/Y 级 ─────────┐
│ Timeline                                          │
│  ● 王五  通过（第 1 级）  2026/06/12 17:30        │
│      备注：…                                      │
│  ○ 李四  待审批（第 2 级）                        │
│  ○ 张三  待审批（第 3 级）                        │
└──────────────────────────────────────────────────┘
```

- 使用 Semi `Card` + `Timeline`，与 PublishApprovalDetailDrawer 完全一致的 `.detail-section` / `.info-row` 类名沿用其样式（在本 less 中复用相同变量，或直接复制 PublishApprovals less 中的卡片样式块到本组件 less）。
- Timeline.Item `type` 映射：`approve→success`、`reject→error`、当前待审批级→`ongoing`、未到级→`default`。
- `scheduling` context 字段差异：将「版本号」改为「下线原因」，并按当前实现保留「执行错误」「执行时间」字段。

### 状态 Tag
保持现有映射，但放到「版本号/标题」行旁边，整体风格与 PublishApprovalDetailDrawer 的 `STATUS_TAG` 一致（`type="light"`）。

### 删除项
- 旧的 `__summary` grid、`__levels`、`__level-num` 圆点样式块全部移除。
- 不再保留自绘的 Check/X/Clock/Circle 圆形 step，统一交给 Timeline 渲染。

## 验证
- 进入「流程开发 → 任一流程详情 → 审批进度」：看到 Card+Timeline 布局，与发布审批详情抽屉一致；无任何操作按钮。
- 进入「调度管理 → 流程详情 → 审批进度」（下线场景）：同样布局，字段切换为下线相关。

## 不在范围
- 审批操作逻辑、权限判断、Mock 数据
- 抽屉头部/Tab 顺序
- 翻译 key 调整（仅 readonly tip 文案微调）
