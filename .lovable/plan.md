
## 问题

`ReleaseDetailDrawer` 同时被「流程发布列表」(ReleaseListPage) 和「发布审批」(PublishApprovals) 复用，上一轮按发布审批参考图改造后，列表页详情也被一起改动了。两个场景诉求不同：

- **发布审批详情**：只有 2 个 Tab（发布申请 / 审批进度），重审批视角，使用卡片化「申请快照」+「审批流」（已完成）。
- **流程发布列表详情**：有 3 个 Tab（基本信息 / 审批流程 / 发布内容），重发布执行视角，沿用原有详细展示（流程卡片 + 资源分组卡片 + 链接跳转 + 失败/拒绝 Banner + 时间线）。

## 方案

**拆分为两个独立组件**，互不耦合。

1. 新建 `ReleaseManagement/components/ReleaseListDetailDrawer/`（`index.tsx` + `index.less`）
   - 恢复原始 3 个 Tab：
     - **基本信息**：发布编号、类型、状态、发布人、所属部门、提交时间、描述等（沿用上一版样式，左侧分组展示）
     - **审批流程**：Timeline 形式展示审批记录（无内联审批操作）
     - **发布内容**：流程列表（可点击跳转）+ 按类型分组的资源列表（PARAMETER/CREDENTIAL/QUEUE/FILE，含手动添加 Tag、被使用流程、跳转图标）
   - 头部仍使用文本标题（如 `[RLS-xxx] 发布单详情`），无右侧属性面板（全宽内容）
   - 不带 `approvalContext`，仅查看用途

2. 修改 `ReleaseListPage/index.tsx`：
   - 引用从 `ReleaseDetailDrawer` 切换为 `ReleaseListDetailDrawer`
   - 其余 props（visible/release/releaseList/onClose/onNavigate/extraActions）保持

3. **保留** `ReleaseDetailDrawer`（卡片化 2 Tab 版本）专供 `PublishApprovals` 使用，不再回退；接口、类型、`approvalContext` 协议不变。

4. `OfflineApprovals/components/DetailDrawer` 不变（与发布审批同款卡片化，已完成）。

## 涉及文件

- 新增 `src/pages/Development/ReleaseManagement/components/ReleaseListDetailDrawer/index.tsx`
- 新增 `src/pages/Development/ReleaseManagement/components/ReleaseListDetailDrawer/index.less`
- 编辑 `src/pages/Development/ReleaseManagement/ReleaseListPage/index.tsx`（仅替换 import 与 JSX 标签）

## 不改动

- `ReleaseDetailDrawer`（发布审批专用，已完成卡片化）
- `PublishApprovals/index.tsx`
- `OfflineApprovals/components/DetailDrawer`
- 业务逻辑/API/Mock/i18n

## 实现来源

新组件内容以「卡片化重构前」的旧版 `ReleaseDetailDrawer`（3 Tab：基本信息 / 发布内容 / 审批流程，含 process 卡片、resource 分组、跳转图标、Banner）为模板，去除 `approvalContext` 相关代码，保留只读展示。
