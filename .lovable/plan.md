## 目标

按 `STORY-002-PG-BASIC-INFO` v2 的范围与规则调整流程详情抽屉「基本信息」Tab，使分组、字段、tooltip 与维护入口与 Story 验收标准一致。

仅改动 `src/components/ProcessManagement/ProcessManagementContent/components/ProcessDetailDrawer/index.tsx`（必要时移除已不再需要的 `LifecycleHistoryModal` 引用）。

## 一、基础信息组（第一组）

按 Story §3.1 严格列示，移除不在范围内的字段：

1. 流程名称
2. 描述
3. 状态
4. 创建者
5. 归属者
6. 归属部门
7. 创建时间
8. 更新时间

变更点：
- 移除当前实现中插在「归属部门」与「创建时间」之间的「关联需求 / 归属项目 / 工作空间」三行（Story 范围内未列出，避免混入需求中心字段；`linkedRequirement` 加载逻辑保留给其他 Tab 使用，仅不在基础信息组渲染）。
- 「归属部门」右侧新增编辑按钮（铅笔图标），仅在具备 `process_basic_info.update`（沿用现有 `basicInfoPermission.canUpdate` mock）时显示，点击打开复用现有 `DepartmentSelect` 的轻量编辑（mock 仅在本次先占位为 TODO，本 Story 暂不实现部门修改后的服务端写入；保留按钮以满足 AC-ERR-02 的入口可见性）—— 若你希望本轮直接落地完整编辑流程请告知，否则按"先保留 UI 入口、不开放保存"的稳妥方式处理。

## 二、交付信息组（第二组）

按 Story §3.2 列示，标题为「交付信息」（已更新）：

1. 开发工程师（多人，铅笔编辑，沿用 `BasicInfoEditModal`）
2. 代码审核员（多人，铅笔编辑 + HelpCircle tooltip：说明可手工维护 / 自动写入规则）
3. 开发完成时间
4. 部署上线时间
5. 流程下线时间

每个生命周期时间字段：
- 展示当前生效值（formatDateTime）。
- 若 `source === 'manual_adjust'` 显示「已修正」Tag。
- HelpCircle tooltip 文案改为 Story §3.3 标准文案：
  - 开发完成时间：流程级展示值为最近一次发布申请提交成功时间；关联版本为本次申请发布的流程版本。
  - 部署上线时间：流程级展示值为最近一次发布成功并激活版本时间；关联版本为本次被激活的流程版本。
  - 流程下线时间：流程级展示值为停用审批通过并执行成功时间；关联版本为下线时当前激活版本。
  - tooltip 内同时显示「来源」「原始事件时间」「关联版本」「修正人 / 修正时间 / 修正原因（若有）」。
- 具备 `process_lifecycle.adjust` 时显示铅笔按钮，打开现有 `LifecycleAdjustModal`。

## 三、移除「查看修正历史」入口

依据 Story R-10：「系统仅记录必要操作审计，不提供单独的修正记录列表」。

- 移除交付信息组标题右侧的「查看修正历史」按钮。
- 移除 `LifecycleHistoryModal` 的渲染与相关 state (`lifecycleHistoryVisible`)。文件保留（其他 Story 可能复用），仅本组件不再引用。

## 四、tooltip / Hover 与审计

- 代码审核员 HelpCircle 文案保留现有规则说明，与 R-05、R-06、R-07 表述一致。
- 不改动审计 mock（`/mocks/processBasicInfo.ts`、`/mocks/processLifecycleLedger.ts`）已记录所需字段，满足 R-16。

## 不改动

- 弹窗 `BasicInfoEditModal`、`LifecycleAdjustModal` 内部逻辑。
- 其他 Tab（版本、参数、依赖、协作者等）。
- mock 数据与权限 hook。
- i18n 资源（标题与字段沿用现有 key 与中文硬编码）。

## 待确认

1. 「关联需求 / 归属项目 / 工作空间」三项是否同意从基础信息组移除？（按 Story 严格范围应当移除；如希望保留作为附加展示请告知。）
2. 「归属部门」编辑入口本轮是否需要落地完整编辑+保存流程？默认按"仅保留 UI 入口"的稳妥方式处理。
