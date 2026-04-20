
## 目标
按需求文档明确的关联规则，**移除需求中心侧"直接关联已有流程"的能力**，统一收敛到「工作空间 → 需求」与「流程 → 需求」两个唯一入口；并在需求详情中把"关联流程"由可编辑入口改为只读的回溯展示。

## 一、规则对齐结论（与代码现状对比）

| 规则 | 文档要求 | 当前代码 | 处置 |
|---|---|---|---|
| 需求中心直接关联已有流程 | ❌ 禁止 | ✅ 存在 `ManageLinkedProcessesModal`，需求详情可增删流程 | **移除入口** |
| 工作空间 → 关联需求 | ✅ 唯一入口 | ✅ `RequirementsProjects/LinkRequirementsModal` 已具备 | 保留 |
| 流程创建时回填需求 | ✅ 在工作空间上下文创建流程时选关联需求 | 待确认（开发中心侧） | 本次不动，仅在文档中记录 |
| 关联约束（需求 N:1 工作空间，已发布禁止解除） | 文档要求 | 已在 `linkRequirements` + `hasPublishedProcess` 中实现 | 保留 |
| 状态联动（关联后需求转「开发中」） | 文档要求 | 待核对 | 文档化为后续动作，非本次范围 |

## 二、本次实现范围

### 1. 需求详情抽屉：移除「管理关联流程」入口
- 删除/隐藏 `RequirementDetailDrawer` 中调用 `ManageLinkedProcessesModal` 的按钮（如「管理」「添加流程」等编辑入口）。
- "关联流程"区域**保留为只读列表**，作为回溯展示（说明这些流程是从工作空间 / 开发中心侧反向关联进来的）。
- 空态文案改为引导：`请在工作空间详情页关联需求，或在开发中心创建流程时选择本需求`，不再提供"立即关联"按钮。

### 2. 列表行操作：移除「关联流程」类操作（若有）
- 检查 `RequirementsWorkbench/index.tsx` 行操作下拉，若存在"关联流程"类入口则移除。

### 3. 文件保留策略
- `ManageLinkedProcessesModal/` 组件**暂不删除**，仅断开调用点，避免误删影响其它潜在引用；后续确认无引用后再清理。
- `mockData.ts` 中 `MOCK_PROCESS_POOL` / `addLinkedProcesses` / `removeLinkedProcess` 同样保留（仍可能被开发中心侧逻辑使用）。

### 4. 文档更新
更新 `.lovable/plan.md`，新增「关联关系规则」小节，写入：
- 唯一入口：工作空间 → 需求；流程创建时 → 需求
- 需求中心侧只读展示
- 关联约束与状态联动

### 5. i18n
- 调整 `requirements.linkedProcesses.*` 中描述空态/引导的文案（中英双语），不新增键，仅改文案。

## 三、不做的事
- 不改 `RequirementsProjects` 工作空间侧的关联弹窗。
- 不改开发中心侧流程创建逻辑。
- 不删除现有 mock 与组件文件。
- 不调整状态机（开发中状态联动留待后续）。

## 涉及文件
- `src/pages/Requirements/RequirementsWorkbench/components/RequirementDetailDrawer/`（移除调用入口，列表改只读）
- `src/pages/Requirements/RequirementsWorkbench/index.tsx`（如有行内关联流程操作则移除）
- `public/i18n/zh-CN.json` / `public/i18n/en.json`（空态引导文案）
- `.lovable/plan.md`（追加「关联关系规则」小节）
