

# 通知中心前端设计方案（FEAT-021 APA 通知中心集成）

## 一、需求理解

后端 APA 模块作为"事件生产者"，调用公共服务平台 `FEAT-010-NOTIFICATION-SERVICE` 的 `POST /api/notifications/send` 接口，通知中心 UI 由通知服务统一提供。本期前端需在 APA Commander 应用内**集成通知中心入口与通知列表展示**，支持 13 个事件分类（任务/机器人/触发器/授权）的站内信查看、筛选、跳转与已读管理。

> v0.9.1 仅站内信（IN_APP）渠道；不实现邮件渠道与通知偏好配置。

---

## 二、信息架构

### 入口位置
1. **侧边栏底部铃铛**（已存在 `sidebar-bottom-bell`）：点击打开 **通知抽屉**（轻量浏览，最近 20 条）。
2. **抽屉底部"查看全部"** → 跳转 **通知中心独立页面** `/notification-center`（完整列表 + 筛选 + 分页）。
3. **首页 `NotificationSection`**：保留现状，"更多 →"按钮跳转 `/notification-center`。

### 路由
- 新增路由：`/notification-center`，挂载在 `AppLayout` 下，使用现有 `.app-layout-content-card` 容器规范。

---

## 三、页面设计

### 3.1 通知抽屉（NotificationDrawer）

宽度 **480px**（轻量浏览，比标准 900px 详情抽屉窄），右侧滑出，无遮罩。

```text
┌──────────────────────────────────────────┐
│ 通知中心             [全部已读] [设置] [×] │
├──────────────────────────────────────────┤
│ [全部 99+] [未读 12]                      │
├──────────────────────────────────────────┤
│ 分类: [全部▼] [任务][机器人][触发器][授权] │
├──────────────────────────────────────────┤
│ ●[高][任务失败]                           │
│  任务"每日对账"执行失败                    │
│  财务对账流程 v3 · robot-fin-01           │
│  10 分钟前              [查看 →]          │
│ ─────────────────────────────────────     │
│ ●[高][机器人离线]                         │
│  机器人 robot-fin-02 已离线               │
│  心跳超时 90s                             │
│  30 分钟前              [查看 →]          │
│ ─────────────────────────────────────     │
│ ○[低][任务成功] 任务"月报"完成 · 1h 前    │
├──────────────────────────────────────────┤
│           [查看全部通知 →]                │
└──────────────────────────────────────────┘
```

**关键交互：**
- 分类标签使用 Semi UI `Tabs` (style="card") 切换。
- 单条通知 hover 高亮 + 点击跳转 `linkUrl`（基于事件分类拼接：`/scheduling-center/...`）并自动标记已读。
- 单条右上角悬浮显示 `[标记已读]` 操作按钮。
- 顶部"全部已读"批量操作；点击"设置"图标占位（v0.9.2 通知偏好）。
- 列表无数据时使用标准 `EmptyState` 组件。

### 3.2 通知中心独立页面 `/notification-center`

遵循"管理子页面"标准（`Typography.Title heading={3}` + 24px 全局内边距 + `.app-layout-content-card`）。

```text
┌─────────────────────────────────────────────────────────┐
│ 通知中心                                                 │
│ 集中查看 APA 平台的任务/机器人/触发器/授权通知           │
├─────────────────────────────────────────────────────────┤
│ ┌─────────┬─────────┬─────────┬─────────┐              │
│ │ 未读 12 │ 任务 5  │ 机器人 4│ 授权 3  │ ←统计卡片    │
│ └─────────┴─────────┴─────────┴─────────┘              │
├─────────────────────────────────────────────────────────┤
│ [全部] [未读] [已读]                                     │
│ [搜索 320px] [分类▼] [严重度▼] [时间范围▼]  [全部已读]  │
├─────────────────────────────────────────────────────────┤
│ Table (size="small"):                                    │
│  □ │ 状态 │ 严重度 │ 分类  │ 标题(主+副描述) │ 时间 │ 操作│
│  ● │ 未读 │ [高]   │ 任务  │ 每日对账失败... │ 10m │ 查看 │
│  ○ │ 已读 │ [低]   │ 机器人│ robot 恢复在线  │ 1h  │ 查看 │
│ ...                                                       │
├─────────────────────────────────────────────────────────┤
│              .list-pagination (外部分页栏)               │
└─────────────────────────────────────────────────────────┘
```

**字段映射（来自 §8 通知事件总览）：**

| 列 | 数据源 | 渲染 |
|---|---|---|
| 状态 | `read: boolean` | 红点（未读）/ 灰圆（已读） |
| 严重度 | 模板严重度（高/中/低） | Tag：red / orange / grey |
| 分类 | task / robot / trigger / license | 中文 Tag + Lucide 图标（CheckSquare / Bot / CalendarClock / Shield） |
| 标题 | 模板渲染后的 title | `Typography.Text ellipsis={{ showTooltip: true }}` |
| 描述 | 模板变量拼接 | 单行省略，Tooltip 全文 |
| 时间 | createdAt | 复用 `RelativeTime` 组件（"10 分钟前" + Tooltip 完整时间） |
| 操作 | linkUrl | "查看"按钮：跳转 `linkUrl` + 标记已读 |

**筛选器：**
- 搜索框 320px 固定宽度（标准）。
- 分类、严重度、时间范围使用 `FilterPopover`（280px 标准）。
- 时间范围预设：今天 / 最近 7 天 / 最近 30 天 / 自定义。

**Tab 计数**：未读数动态展示在"未读"标签上，类似 `Badge`。

### 3.3 链接跳转策略（适配 APA 路由）

后端 PRD §11 提供平台相对路径 `/scheduling/tasks/{id}` 等，前端按 APA 实际路由映射：

| 事件分类 | 后端 linkUrl | APA 实际路由 |
|---|---|---|
| task.* | `/scheduling/tasks/{taskId}` | `/scheduling-center/task-execution/task-list?taskId={taskId}`（自动打开详情抽屉） |
| robot.* | `/scheduling/robots/{robotId}` | `/scheduling-center/resource-monitoring/worker-management?workerId={robotId}` |
| trigger.* | `/scheduling/triggers/{triggerId}` | 触发器详情（待开发，先占位 toast 提示） |
| license.* | `/admin/licenses/{licenseId}` | 占位（属管理后台范围） |

跳转适配封装在 `src/utils/notificationLink.ts`，统一处理。

---

## 四、技术实现

### 4.1 目录结构（component-as-folder + @ 别名，无 barrel）

```text
src/pages/NotificationCenter/
  index.tsx              // 通知中心独立页（路由 /notification-center）
  index.less
  mockData.ts            // 13 个事件类型的 mock 通知（中英文双语）
  types.ts               // Notification、NotificationCategory、Severity 类型
  components/
    NotificationStatsCards/   index.tsx + index.less   // 顶部 4 个统计卡片
    NotificationFilterBar/    index.tsx + index.less   // 搜索 + 筛选 + Tab + 批量操作
    NotificationTable/        index.tsx + index.less   // 主列表
    SeverityTag/              index.tsx                // 高/中/低 Tag 复用
    CategoryBadge/            index.tsx                // 任务/机器人/触发器/授权 Tag

src/components/layout/NotificationDrawer/
  index.tsx              // 侧边栏铃铛触发的轻量抽屉
  index.less

src/utils/notificationLink.ts   // linkUrl → APA 路由映射
```

### 4.2 数据模型 `types.ts`

```typescript
export type NotificationCategory = 'task' | 'robot' | 'trigger' | 'license';
export type NotificationSeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type NotificationTemplateId =
  | 'task.failed' | 'task.timeout' | 'task.permanent_failed'
  | 'task.queue_overdue' | 'task.success' | 'task.stopped'
  | 'robot.offline' | 'robot.recovered' | 'robot.maintenance'
  | 'trigger.time_failed' | 'trigger.queue_invalid'
  | 'license.expiring' | 'license.expired';

export interface Notification {
  id: string;
  templateId: NotificationTemplateId;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;          // 模板渲染后的标题
  description: string;    // 描述/正文
  linkUrl: string;        // 后端给定相对路径
  createdAt: string;      // ISO-8601
  read: boolean;
  variables?: Record<string, string>;  // 原始变量
}
```

### 4.3 与现有规范的对接

- 复用 **`RelativeTime`** 组件展示时间。
- 复用 **`FilterPopover`**（280px）做分类/严重度/时间筛选。
- 复用 **`EmptyState`** 处理空数据/搜索无结果。
- 复用 **`useTranslation`** + `public/i18n/zh-CN.json`、`en.json` 添加 `notificationCenter.*` 命名空间翻译键。
- 表格使用 `Table size="small"`，分页使用外部 `.list-pagination`（pagination={false} + 独立 `Pagination`）。
- Toast 使用统一 `light` 主题。
- 抽屉风格遵循"无遮罩、`DetailDrawerWrapper` 风格阴影"，但宽度 480px（区别于 900px 业务详情抽屉，因为这是浏览面板而非详情）。

### 4.4 路由与入口接入

1. `src/App.tsx` 新增：
   ```tsx
   import NotificationCenter from "@/pages/NotificationCenter";
   <Route path="/notification-center" element={<NotificationCenter />} />
   ```
2. 侧边栏铃铛 `sidebar-bottom-bell`（`src/components/layout/Sidebar/index.tsx` 第 738 行）：
   - 现状仅 Tooltip，改为点击打开 `NotificationDrawer`。
   - 在铃铛上叠加未读计数 `Badge`（>99 显示 99+）。
3. 首页 `NotificationSection` 的"更多 →"按钮 → `navigate('/notification-center')`。

### 4.5 Mock 数据策略

`mockData.ts` 提供 ~30 条覆盖全部 13 个 `templateId` 的通知数据，含未读/已读混合、4 个分类均匀分布、近 7 天时间范围分布，符合系统 mock 数据规范（英文字段、proc-001 风格 ID）。

---

## 五、范围说明

**包含：**
- 通知中心独立页面、侧边栏通知抽屉、铃铛未读计数。
- 13 类通知的展示、筛选、搜索、批量已读、跳转。
- 中英文双语。

**不包含（v0.9.1 范围外）：**
- 邮件通道、通知偏好/订阅设置（仅占位"设置"图标）。
- 模板注册管理 UI（属于公共服务平台 FEAT-010）。
- 真实后端 API 对接（先用 mock，后端 `GET /api/notifications` 接口由 FEAT-010 提供时再切换）。
- license/trigger 详情页跳转（路由未实现，先 toast 占位）。

