

## 计划：重构需求详情「关联结果」展示

按需求文档 STORY-009（生命周期聚合）+ STORY-003 R-12（详情页只读展示关联结果，无关联动作），将原"关联流程/应用"区块重构为「**关联与交付**」区块，对齐文档 §6.1 摘要结构。

### 当前问题
- 区块名为"关联流程/应用"，把"流程清单"当主角，但文档的主角是"项目/工作空间关联结果 + 聚合摘要"
- 缺少：关联项目、关联工作空间、聚合依据摘要、人工下线入口
- 流程列表混杂"贡献度/说明/操作"等无文档依据的字段（已在上一步移除）
- 没有解释"状态由聚合得出，无法在此手动关联"

### 改造方案

**1. 区块更名**
- `关联流程/应用` → `关联与交付`（i18n: `requirements.delivery.title`）
- 副标题说明：`状态由项目/工作空间关联结果与流程状态自动聚合，本页不支持手动关联`

**2. 区块内容结构（自上而下）**

```text
+--------------------------------------------------------------+
| 关联与交付                                       [下线]       |
| 状态由聚合得出，本页不支持手动关联                            |
+--------------------------------------------------------------+
| 关联项目      ：数字化转型项目  →                             |
| 关联工作空间  ：财务自动化一期  →                             |
| 关联方式      ：由项目/工作空间管理侧建立                     |
+--------------------------------------------------------------+
| 已归属流程  2 个    [已发布 1] [开发中 1] [已停止 0]          |
+--------------------------------------------------------------+
| 流程清单（只读，类型 / 名称 / 状态 三列，名称可跳转流程详情） |
+--------------------------------------------------------------+
```

- **关联项目 / 工作空间**：以 `Descriptions` 或 key-value 行展示，名称为可点击链接（跳到对应详情）；为空时显示「暂未关联」灰字
- **聚合摘要 chip 行**：复用现有 `aggregateLinkedStatus`，新增"已发布 / 开发中 / 已停止"分桶 Tag（绿/蓝/灰），与文档 §6.1 摘要数字一致
- **流程清单**：保留现有三列表格（类型 / 名称 / 状态），名称仍可跳转
- **"下线"按钮**（右上角）：仅当需求当前状态为 `ONLINE` 时显示，触发"下线确认"弹窗（Modal，含原因 TextArea），提交后调用 `onOfflineRequirement` 回调将主状态置为 `OFFLINE`（接入预留，第一期可仅 Toast 占位）
- 异常提示：若存在"未归属流程"（mock 字段 `unboundProcessCount > 0`），在聚合摘要下显示一条灰色提示「存在 X 个未归属流程，未计入聚合」

**3. 数据字段（mock 扩展）**
`RequirementItem` 新增可选只读字段（mock 层填充，无需后端约定）：
- `linkedProject?: { id: string; name: string }`
- `linkedWorkspace?: { id: string; name: string }`
- `unboundProcessCount?: number`

**4. 改动文件**
- `src/pages/Requirements/RequirementsWorkbench/components/RequirementDetailDrawer/ArtifactSection.tsx`
  - 重写为上述结构；表格简化保留三列
  - 新增聚合分桶 Tag 行（按 `linkedProcesses` status 计数）
  - 新增"下线"按钮 + 确认 Modal（仅 ONLINE 状态可见）
- `src/pages/Requirements/RequirementsWorkbench/types.ts`
  - 在 `RequirementItem` 增加 `linkedProject` / `linkedWorkspace` / `unboundProcessCount`
- `src/pages/Requirements/RequirementsWorkbench/utils/aggregateLinkedStatus.ts`
  - 新增 `bucketLinkedProcesses(list)` 工具，返回 `{ online, developing, stopped, pending, failed }` 计数
- `src/pages/Requirements/RequirementsWorkbench/mocks/*` (相关 mock 数据)
  - 为部分需求填充 `linkedProject` / `linkedWorkspace` 示例
- `public/i18n/zh-CN.json` / `en.json`
  - 新增 `requirements.delivery.*`：`title / subtitle / linkedProject / linkedWorkspace / linkedBy / processCount / bucketOnline / bucketDeveloping / bucketStopped / unboundHint / offline / offlineConfirm.title / offlineConfirm.reason / offlineConfirm.placeholder / offlineConfirm.ok / offlineConfirm.cancel / emptyLinks`

### 验收
1. 打开任意需求详情，区块标题显示「关联与交付」+ 副标题说明
2. 显示关联项目 / 工作空间名称（可点击）；无关联时显示「暂未关联」
3. 聚合 Tag 行展示「已发布 N / 开发中 N / 已停止 N」+ 总数，与下方流程列表数量一致
4. 流程列表只保留三列（类型/名称/状态），名称可跳转
5. 当主状态为「已上线」时显示「下线」按钮，点击弹出原因输入确认框，提交后 Toast「已下线」（占位）
6. 当存在未归属流程时（mock 命中），显示灰字提示

