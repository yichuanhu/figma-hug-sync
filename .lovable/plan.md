
# 审批管理（FEAT-108）实现方案

对齐 STORY-001 待审批队列、STORY-002 审批历史、STORY-003 审批层级配置 + 权限点。

## 1. STORY-001 待审批队列处理

页面：`/sharing-center/approvals?tab=pending`

- **顶部 Tabs**：`待审批 (5)` / `审批历史`，Tab 文本带 ⭐徽标，URL 同步 `?tab=`。
- **筛选栏**：来源筛选 `RadioGroup`（全部 / 原生 / 开发中心）+ 关键字搜索 320px + 资产类型快捷筛选。
- **批量操作条**：勾选 ≥1 时浮现 `BatchActionBar`，支持「批量通过」（弹出确认对话框列出待操作条目）。
- **列表**：标准 `Table size="small"`，列：勾选 / 资产名称 / 类型 / 来源徽标 / 提交人·部门 / 提交时间 / 操作。每页 20 条；FIFO 升序。
- **行操作**：`通过` 直接生效；`拒绝` 弹出 `RejectReasonDialog`（理由必填）。操作后写回 store，列表 + 徽标实时刷新。
- **空状态**：标准 PNG 空插画 + 文案。
- **冲突容错**：操作前若 store 中已非 PENDING，Toast「该条目已被其他审批者处理」并刷新列表。

### 1.1 store 改造（共享 MyShared/store）
新增方法：
- `approveAsset(id, comment?)`：状态 → PUBLISHED，写入 approvalEvents，emit。
- `rejectAsset(id, reason)`：状态 → REJECTED，记录 rejectedReason + event。
- `batchApprove(ids[])`：循环调用 + 单次 emit。
- `subscribe(listener)` 已有则复用，否则新增简单订阅器供徽标/列表订阅。

## 2. STORY-002 审批历史回溯

同页 `?tab=history`：

- **筛选区**：结果 Select（全部/通过/拒绝）+ 类型 Select + 来源 Select + 时间范围 `DatePicker type="dateRange"` + 「清空筛选」。
- **列表**：列：资产名 / 类型 / 提交人 / 来源 / 结果 Tag / 审批意见（ExpandableText）/ 审批时间。按审批时间降序（取 approvalEvents 末项时间，store 端补 `decidedAt` 字段方便排序）。
- 当前用户审批过的记录（mock 中以 `approvalEvents.actorName === '当前用户'` 过滤）。
- 两态空状态：无历史 / 筛选无结果（不同插画文案）。

## 3. STORY-003 审批层级配置 + 权限点

### 3.1 配置页 `/sharing-center/admin/approval-levels`（改造）
- 改为标准 `Table size="small"`，列：资产类型 / 当前层级 / 可选层级（Select） / 说明。
- 顶部 `Banner`：解释 NONE/SINGLE 含义，并强调「DEV_CENTER 资产每次同步均需审批」。
- 底部 `[恢复默认] [保存配置]`，保存时弹 `Modal.confirm` 二次确认。
- **贯通到 store**：`MyShared/store` 新增 `getApprovalLevel(type)`；创建/发版逻辑读取，若为 `NONE` → 直接落 `PUBLISHED` 并写入一条「免审批自动通过」事件；为 `SINGLE` → 进 `PENDING_APPROVAL`。配置存 `localStorage` + 内存单例。

### 3.2 权限点只读页 `/sharing-center/admin/permissions`（新增）
- 页头 Title「权限点与角色映射」。
- 上半区：按实体分组列出 19 个权限点（`asset / asset_market / category / approval_rule / asset_approval`），用 `Card` + `Tag` 网格。
- 下半区：标准表格展示 4 个角色 → APA 预置角色 → 共享中心特有权限的映射（来自 STORY-003 §5.3/§5.4）。
- 顶部 Banner 提示「权限点已注册到 APA 统一权限引擎」。

## 4. 侧边栏徽标

- `useApprovalPendingCount()` Hook：订阅 store，返回 `pendingCount()`。
- 找到 SharingCenter 子菜单「审批管理」入口，在文本右侧渲染 `Badge`（>0 时显示，>99 显 99+）。

## 5. 文件变更清单

新增：
- `src/pages/SharingCenter/Approvals/List/components/PendingTab/index.tsx`
- `src/pages/SharingCenter/Approvals/List/components/HistoryTab/index.tsx`
- `src/pages/SharingCenter/Approvals/List/components/BatchApproveBar/index.tsx`
- `src/pages/SharingCenter/Admin/Permissions/index.tsx + .less`
- `src/pages/SharingCenter/shared/useApprovalPendingCount.ts`
- `src/pages/SharingCenter/shared/approvalConfig.ts`（NONE/SINGLE 配置单例 + 订阅）

改造：
- `src/pages/SharingCenter/MyShared/store.ts`：新增 approve/reject/batchApprove + subscribe + 读取 approvalConfig 决定初始状态 + `decidedAt` 字段。
- `src/pages/SharingCenter/Approvals/List/index.tsx`：拆为 PendingTab + HistoryTab，URL 同步、徽标计数。
- `src/pages/SharingCenter/Approvals/Detail/index.tsx`：操作改为调用 store action，加冲突提示。
- `src/pages/SharingCenter/Admin/ApprovalLevels/index.tsx`：表格化 + 恢复默认 + 二次确认。
- `src/App.tsx`：新增 `/sharing-center/admin/permissions` 路由。
- 侧边栏菜单源（共享中心子项）+ 徽标渲染。
- `public/i18n/zh-CN.json` & `en.json`：补齐所有新键（`sharing.approvals.filter.*`、`history.*`、`admin.permissions.*` 等）。

## 6. 技术要点

- 表格规范：`size="small"`、外置 `.list-pagination`、空状态 42px top margin、行点击跳详情且操作列 `stopPropagation`。
- Modal/Toast：Modal 520px；`Toast.config({ theme: 'light' })`。
- 时间筛选用项目统一 `DatePicker` 范围模式；前端内存过滤足以承载 mock 数据量。
- 订阅器用最简 `Set<listener>` + `emit()`，避免引入额外依赖。
- 文案 / 文档全部中文。

## 7. 验收对齐

- AC-FUNC-01..05（队列）、AC-FUNC-01..04（历史）、AC-FUNC-01..04（配置）、AC-ERR 全部覆盖。
- 性能：mock 数据本地过滤 < 100ms；操作即时反馈。
