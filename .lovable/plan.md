

# 首页5个区块视觉升级方案

## 1. 平台公告 → 产品动态风格 + Banner 轮播

**改动文件**: `AnnouncementSection/index.tsx`, `index.less`, `mockData.ts`, `types.ts`

- 标题改为"产品动态"，右上角加"全部 >"链接
- 顶部新增 Banner 轮播区域（使用 `embla-carousel-react`，已安装），两张轮播卡片：
  - APA Creator 最新发布：渐变背景（蓝紫渐变），左侧标题+副标题+版本号，右侧装饰性截图占位
  - APA Worker 最新发布：渐变背景（蓝绿渐变），同上布局
  - 底部圆点指示器，自动轮播
- 下方公告列表改为参考图样式：左侧标题+描述，右侧缩略图占位（圆角矩形灰色占位块）
- `AnnouncementItem` 类型增加 `subtitle` 字段

## 2. 核心指标 → "我的任务"卡片风格

**改动文件**: `MetricsSection/index.tsx`, `index.less`, `mockData.ts`, `types.ts`

参照"我的任务"截图：每个指标卡片为横向布局，左侧彩色图标+标签，右侧大数值

- 布局从 4 列网格改为**纵向堆叠列表**（每行一个指标），或保持网格但改为 2 列宽卡片
- 每个指标卡片：
  - 左侧 40px 彩色图标容器（圆角 10px），带淡色背景+深色图标
  - 中间标签文字（14px）
  - 右侧数值（24px 加粗）靠右对齐
- 不同指标有不同的主题色（橙、紫、蓝、绿、青等），第一个卡片背景带淡色主题色填充（如截图中"待处理"的浅橙背景）
- `MetricItem` 类型增加 `icon`、`iconColor`、`iconBgColor` 字段

## 3. 个人通知 → 增加收起/更多按钮

**改动文件**: `NotificationSection/index.tsx`, `index.less`

- 右上角增加两个操作按钮（在 Badge 左侧）：
  - **收起按钮**：`ChevronUp`/`ChevronDown` 图标，点击折叠/展开通知列表（用 `useState` 控制 `collapsed` 状态）
  - **更多按钮**：文字"更多"或"查看更多"，带 `ExternalLink` 图标
- 按钮排列：`[收起图标] [更多] [Badge]`
- 收起状态下隐藏 `notification-list`，仅保留卡片 header

## 4. 资源获取 → 学习中心卡片风格

**改动文件**: `ResourceSection/index.tsx`, `index.less`, `mockData.ts`, `types.ts`

参照"学习中心"截图：每个资源卡片右侧有大尺寸的彩色装饰图标

- 移除左侧小图标，改为：左侧标题文字（14px 加粗），右侧大号装饰图标（48px）
- 图标使用 lucide-react，但放大至 36-40px，配合圆形/椭圆淡色背景装饰
- 每个资源有独立的主题色：
  - Creator 下载：蓝色系（望远镜图标 `Telescope`）
  - 用户手册：紫色系（房子图标 `Home`）
  - API 文档：蓝绿色系（宝箱图标 `Package`）
- 移除右侧 ExternalLink 小箭头，移除描述副文本
- `ResourceItem` 类型增加 `iconColor`、`iconBgColor` 字段

## 5. 最近活动 → 类型专属颜色

**改动文件**: `RecentActivitySection/index.tsx`, `index.less`

为每种活动类型定义固定颜色方案：

| 类型 | 颜色 | 图标 |
|------|------|------|
| create | 蓝色 `#3370FF` / `#EEF3FF` | Workflow |
| execute | 绿色 `#00B365` / `#E8F8F0` | Play |
| publish | 紫色 `#7C3AED` / `#F3EEFF` | Upload |
| delete | 红色 `#F53F3F` / `#FFF0F0` | Trash2 |
| update | 橙色 `#FF7D00` / `#FFF3E8` | PenLine |

- 图标容器 `activity-item-icon` 使用类型对应的 `bgColor` 做背景、`color` 做图标色
- 通过 `typeColorMap` 对象在 TSX 中以内联 style 绑定

## 改动文件汇总

| 文件 | 改动 |
|------|------|
| `types.ts` | MetricItem 增加 icon/color 字段，ResourceItem 增加 color 字段，AnnouncementItem 增加 subtitle |
| `mockData.ts` | 更新 metrics、resources、announcements 数据 |
| `AnnouncementSection/*` | Banner 轮播 + 产品动态风格重构 |
| `MetricsSection/*` | 横向卡片布局 + 彩色图标 |
| `NotificationSection/*` | 收起/更多按钮 |
| `ResourceSection/*` | 学习中心大图标风格 |
| `RecentActivitySection/*` | 类型专属颜色映射 |
| `zh-CN.json` + `en.json` | 新增 i18n key |

