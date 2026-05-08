# 实施计划：STORY-014 立项后双步编辑与变更日志双向闭环

## 目标
为已进入「立项后」（PENDING_PROJECT / DEVELOPING / LAUNCHED / OFFLINE）阶段的需求，建立「编辑→草稿→发布变更→开发响应→变更日志」的闭环：
- 立项后系统字段（id/status/scheme_id/owner 等）锁定，仅业务字段可编辑
- 编辑时进入草稿态（按用户隔离），保存不影响线上需求
- 发布变更需填写变更说明（≥10 字），DEV_IMPACT 类需二次确认
- 写入「需求变更日志」时间线，变更同步到关联工作空间，开发侧可在 7 天内响应（ACK / ADJUSTED / REJECTED）
- 工作空间列表 / 项目详情 / 工作空间详情头部展示「未响应红点 + 超时 ⚠️」

## 范围（本轮）
- STORY-014 全部前端 + Mock；不做 STORY-013、不做字段迁移与重启
- 不做全局侧边栏徽标聚合，仅本轮约定的项目页与工作空间内红点

## 文件改动

### 新建
- `src/pages/Requirements/RequirementsWorkbench/utils/fieldEditability.ts`
  - `SYSTEM_LOCKED_FIELDS`、`POST_PROJECT_STATUSES`、`isFieldEditableInPostProject`、`classifyChangeType`、`computeFieldDiffs`
- `src/pages/Requirements/RequirementsWorkbench/components/PublishChangeModal/index.tsx`（520px）
- `src/pages/Requirements/RequirementsWorkbench/components/ChangeLogTab/index.tsx`（Timeline）
- `src/pages/Requirements/RequirementsWorkbench/components/DevResponsePanel/index.tsx`（520px Modal）
- `src/pages/Requirements/RequirementsWorkbench/components/UnackedBadge/index.tsx`

### 编辑
- `types.ts`：新增 `ChangeType` / `ChangedFieldDiff` / `DevResponse` / `RequirementChangeLog` / `RequirementDraft`
- `mockData.ts`：新增 `getDraft / saveDraft / discardDraft / publishChange / respondChange / listChangeLogs / countUnackedByWorkspace`，DEV_IMPACT 并发互斥
- `RequirementFormModal/index.tsx`：立项后模式禁用系统字段；保存时若处于立项后态走 `saveDraft`；提交按钮调出 `PublishChangeModal`
- `RequirementDetailDrawer/index.tsx`：新增「变更日志」Tab；展示开发响应面板入口；接收 `?openDevResponse=1` 自动弹窗
- `RequirementsWorkbench/index.tsx`：解析 query 自动打开详情抽屉并直达响应面板
- `RequirementsProjects/index.tsx`：列表「工作空间数 / 名称」列追加红点 + 超时图标
- `RequirementsProjects/components/ProjectDetailDrawer/index.tsx`：工作空间表行内红点；点击跳到 workbench
- `public/i18n/zh-CN.json` / `en.json`：`requirements.changeLog.*` / `requirements.publish.*` / `requirements.devResponse.*` / `requirements.unacked.*`

## 验证点
1. 立项后需求编辑：title/priority 可改，owner/department 灰显锁定
2. 保存草稿后，列表与详情仍展示原值；同一用户重新进入弹窗看到草稿数据
3. 发布变更需填变更说明 ≥10 字；DEV_IMPACT 弹二次确认
4. 同一需求已存在 PENDING DEV_IMPACT 时，再次发布同类返回 `DEV_IMPACT_CONCURRENT_PENDING`
5. 变更日志 Tab 出现新条目，颜色区分 CONTENT / DEV_IMPACT / SYSTEM；超过 7 天的 PENDING 显示 ⚠️ 超时
6. 工作空间列表 / 项目详情 / 工作空间详情显示未响应红点；点击跳转到响应面板
7. 开发响应：ACK 直通；REJECTED 需 ≥10 字理由；ADJUSTED 直通
