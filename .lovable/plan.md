

# 首页5项优化 — 前端视觉方案

---

## 1. 各中心快速入口（新增模块，位于快速开始上方）

**布局**: 5列等宽横排，无卡片包裹（直接放在左栏顶部），与下方"快速开始"间距 24px。

```text
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│  📋 需求中心  │  💻 开发中心  │  📅 调度中心  │  📊 运营中心  │  🔧 运维中心  │
│  发现、评估和  │  流程设计、组  │  流程编排、任  │  战略决策、治  │  系统监控、告  │
│  跟踪自动化需求│  件开发和测试部署│  务调度和执行监控│  理监督和价值度量│  警管理和资源运维│
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

**视觉细节**:
- 每个入口为可点击卡片，背景 `var(--semi-color-bg-0)`，圆角 10px，padding 16px
- 左侧放置已有的中心图标（`src/assets/icons/` 下的 png 图标），尺寸 32x32
- 标题 14px 加粗，描述 12px `var(--semi-color-text-2)`
- hover 效果与快捷入口一致：`box-shadow: 0 2px 8px rgba(0,0,0,0.06)`
- 点击后导航至对应中心的首个菜单页面（复用 Sidebar 中已有的路由路径）
- 响应式：960px 以下切换为 2+3 或滚动布局，480px 以下纵向堆叠

---

## 2. 个人通知 — 优先级标签

在每条通知标题前，增加 Semi UI `<Tag>` 组件显示优先级：

```text
┌─────────────────────────────────────────────────┐
│ 🔴 ┌──────┐ 流程「财务月报生成」执行失败           │
│    │ 紧急  │                           10分钟前    │
│    └──────┘                                      │
│ 🔴 ┌──────┐ 审批请求待处理：发布流程「数据同步」     │
│    │ 重要  │                           30分钟前    │
│    └──────┘                                      │
│    ┌──────┐ 流程「客户数据清洗」发布成功            │
│    │ 普通  │                            2小时前    │
│    └──────┘                                      │
└─────────────────────────────────────────────────┘
```

**视觉细节**:
- Tag 放在标题左侧，与标题同行显示，间距 6px
- URGENT: `<Tag color="red" size="small">紧急</Tag>`
- IMPORTANT: `<Tag color="orange" size="small">重要</Tag>`
- NORMAL: `<Tag color="grey" size="small">普通</Tag>` （使用 grey 而非 blue，降低视觉干扰）
- 标题行改为 `display: flex; align-items: center; gap: 6px`，Tag 不换行，标题 `text-overflow: ellipsis`
- mockData 中每条通知新增 `priority` 字段（URGENT / IMPORTANT / NORMAL），根据现有 `type` 合理映射：error→URGENT, warning→IMPORTANT, info/success→NORMAL

---

## 3. "快捷操作" → "快速开始"

仅修改 i18n 文案：
- `zh-CN.json`: `homepage.shortcuts.title` → `"快速开始"`
- `en.json`: → `"Quick Start"`

无视觉变化。

---

## 4. 核心指标 — 成功率与节省工时之间的竖线修复

**问题分析**: 当前 CSS 用 `&:nth-child(4n)::after { display: none }` 隐藏第4个指标（成功率）的右侧竖线。但成功率是第一行最后一个，正确。第5个（节省工时）是第二行第一个，它的右侧竖线应该显示。

实际问题可能是第7个（最后一个）卡片右侧仍显示竖线。

**修复**: 添加 `&:last-child::after { display: none; }` 规则，确保最后一个指标卡片不显示右侧竖线。同时检查 flex-wrap 换行后，每行末尾（第4n个）的竖线逻辑是否正确。

---

## 5. 最近活动 — 展开/收起 + 创建图标替换

```text
┌─ 最近活动 ──────────────────── [收起 ∧] ─┐
│ 🔵 创建流程 财务报表自动生成    今天 10:25  │
│ 🟢 执行任务 数据同步-每日       今天 09:15  │
│ 🟣 发布流程 客户数据清洗 v2.1   今天 08:30  │
│ 🟠 更新凭据 SAP-Production     昨天 17:45  │
│ 🔵 创建机器人 RPA-Worker-05    昨天 16:20  │
│          ... 更多活动 ...                  │
└─────────────────────────────────────────┘

收起后：
┌─ 最近活动 ──────────────────── [展开 ∨] ─┐
└─────────────────────────────────────────┘
```

**视觉细节**:
- Header 右侧增加"收起/展开"按钮，样式复用通知模块的 `notification-collapse-btn`（灰色文字 + ChevronUp/ChevronDown 图标）
- 默认展开，展示前5条活动；点击"收起"后隐藏列表
- 创建类活动图标：从 `Workflow` 改为 `PlusCircle`（lucide-react），保持蓝色配色 `#3370FF` / `#EEF3FF`
- 收起状态下 header 底部 margin 归零（`.is-collapsed .home-card-header { margin-bottom: 0 }`）

---

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `src/pages/Home/components/CenterEntrySection/index.tsx` | 新建 |
| `src/pages/Home/components/CenterEntrySection/index.less` | 新建 |
| `src/pages/Home/index.tsx` | 添加 CenterEntrySection |
| `src/pages/Home/types.ts` | NotificationItem 增加 priority 字段 |
| `src/pages/Home/mockData.ts` | 通知增加 priority 值 |
| `src/pages/Home/components/NotificationSection/index.tsx` | 标题前增加优先级 Tag |
| `src/pages/Home/components/NotificationSection/index.less` | 标题行 flex 布局调整 |
| `src/pages/Home/components/MetricsSection/index.less` | 增加 last-child 竖线隐藏 |
| `src/pages/Home/components/RecentActivitySection/index.tsx` | 增加收起/展开、换创建图标 |
| `src/pages/Home/components/RecentActivitySection/index.less` | 收起状态样式 |
| `public/i18n/zh-CN.json` | 快速开始文案 + 中心入口 i18n |
| `public/i18n/en.json` | 同上英文 |

