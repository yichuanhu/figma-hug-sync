

# WEP 平台首页 - 完整实施方案

## 页面布局

```text
┌──────────────────────────────────────────────────────────────┐
│  Hi 张三，欢迎来到 WEP 平台                                     │
│  2026年3月13日 星期五                                          │
│                                                              │
│  ┌──────── 左列（~65%）───────────┐ ┌──── 右列（~35%）─────┐  │
│  │                               │ │                      │  │
│  │  快捷操作（2×2 横向卡片）         │ │  个人通知              │  │
│  │  ┌───────────┐ ┌───────────┐  │ │  未读 5               │  │
│  │  │新建流程 [ic]│ │新建机器人[ic]│  │ │  · 任务执行失败        │  │
│  │  │从空白开始   │ │自动化机器人  │  │ │  · 审批待处理          │  │
│  │  └───────────┘ └───────────┘  │ │  · ...               │  │
│  │  ┌───────────┐ ┌───────────┐  │ │                      │  │
│  │  │创建任务 [ic]│ │队列管理 [ic]│  │ ├──────────────────────┤  │
│  │  │快速创建即时 │ │消息队列轻松  │  │ │                      │  │
│  │  └───────────┘ └───────────┘  │ │  平台公告              │  │
│  │                               │ │  🔴 系统维护通知        │  │
│  ├───────────────────────────────┤ │  🔵 开发者大赛          │  │
│  │                               │ │                      │  │
│  │  核心指标（4列×2行，7个指标）     │ ├──────────────────────┤  │
│  │  机器人 25 ↑   流程 120 ↑      │ │                      │  │
│  │  今日任务 345  成功率 98.5%     │ │  资源获取              │  │
│  │  节省工时 156h 节约成本 ¥23万   │ │  Creator 下载          │  │
│  │  本周新增 12                    │ │  用户手册              │  │
│  │                               │ │  API 文档             │  │
│  ├───────────────────────────────┤ │                      │  │
│  │                               │ │                      │  │
│  │  最近活动（时间线）              │ │                      │  │
│  │  · 创建流程「财务报表」10:25     │ │                      │  │
│  │  · 执行任务「数据同步」09:15     │ │                      │  │
│  └───────────────────────────────┘ └──────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## 区块详情

### 1. 欢迎语（全宽，无卡片）
- 标题 20px 加粗 + 日期副文本 14px

### 2. 快捷操作（左列，2×2 卡片网格）
- `grid-template-columns: repeat(2, 1fr)`，gap 12px
- 每个卡片：左侧标题(14px 加粗)+描述(12px 副文本)，右侧彩色圆角图标容器(36px)
- 4个入口：

| 操作 | 描述 | 图标颜色 |
|------|------|---------|
| 新建流程 | 从空白开始创建 | 蓝色 |
| 新建机器人 | 自动化机器人创建 | 紫色 |
| 创建任务 | 快速创建即时任务 | 橙色 |
| 队列管理 | 消息队列轻松管理 | 青色 |

### 3. 核心指标（左列，4列×2行网格）
- `grid-template-columns: repeat(4, 1fr)`，7个指标卡片
- 每个卡片：指标名(12px 副文本) + 数值(24px 加粗) + 趋势箭头(success/danger色)
- 支持"我的部门/全平台"切换（Semi RadioGroup）
- 7个指标：机器人数量、流程数量、今日任务数、成功率、本月节省工时、累计节约成本、本周新增流程数

### 4. 最近活动（左列，时间线列表）
- Semi Timeline 或自定义列表，最近10条操作记录
- 每条：操作类型图标 + 描述 + 时间

### 5. 个人通知（右列）
- 标题 + 未读数 Badge，通知列表带未读红点
- 点击跳转或展开详情

### 6. 平台公告（右列）
- 列表 + 优先级 Tag（紧急/重要/普通，红/橙/蓝）

### 7. 资源获取（右列）
- 小卡片列表，图标 + 名称 + 描述 + 外链/下载按钮

## 文件结构

```text
src/pages/Home/
├── index.tsx              # 页面入口，欢迎语 + 双栏 Grid
├── index.less             # 页面级样式
├── types.ts               # 所有类型定义
├── mockData.ts            # 集中 Mock 数据
├── components/
│   ├── WelcomeSection/index.tsx
│   ├── ShortcutsSection/index.tsx + index.less
│   ├── MetricsSection/index.tsx + index.less
│   │   └── MetricCard.tsx
│   ├── RecentActivitySection/index.tsx + index.less
│   ├── NotificationSection/index.tsx + index.less
│   ├── AnnouncementSection/index.tsx + index.less
│   └── ResourceSection/index.tsx + index.less
```

## 改动范围

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/pages/Home/**` | 新建 | 首页全部组件（约15个文件） |
| `src/App.tsx` | 修改 | 路由 `"/"` 从 `<Index />` 改为 `<Home />` |
| `src/components/layout/Sidebar/index.tsx` | 修改 | `getSelectedKeyByPath` 和 `getActiveCenterByPath` 中 `"/"` 选中 `home` 图标 |
| `public/i18n/zh-CN.json` + `en.json` | 修改 | 添加 `homepage.*` i18n key |

## 视觉规范

- 页面可滚动，`overflow-y: auto`
- 双栏：`grid-template-columns: 1fr 380px`，gap 20px
- 卡片：`var(--semi-color-bg-0)`，`border-radius: 12px`，轻阴影，padding 20px
- 快捷操作卡片：淡色背景边框，hover 阴影提升
- 指标趋势：`--semi-color-success`（上升绿）/ `--semi-color-danger`（下降红）
- 图标统一使用 `lucide-react`

## 数据策略

全部 Mock 数据集中在 `mockData.ts`，结构按需求文档 API 响应格式设计，后续替换数据源即可接入真实 API。

## 实施步骤

1. 创建 `types.ts` + `mockData.ts` + Home 页面框架 + WelcomeSection
2. ShortcutsSection（2×2）+ MetricsSection（7个指标）
3. NotificationSection + AnnouncementSection + ResourceSection（右列）
4. RecentActivitySection（最近活动）
5. 修改 `App.tsx` 路由 + Sidebar 选中逻辑 + i18n key

