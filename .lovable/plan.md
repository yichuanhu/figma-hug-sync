## 一、目标与定位

依照 `story-map-3` 与 8 个 Story 文档，将现有共享中心（Showcases / APA Skills / ACP Skills / CreatorComponents）**全部废弃**，重构为统一的「**资产市场**」：

- 4 类资产：**流程块（SNIPPET）/ 流程（WORKFLOW）/ 知识（KNOWLEDGE）/ 技能（SKILL）**
- 2 类来源：**🏠 NATIVE（原生，知识/技能）/ 🔗 DEV_CENTER（开发中心，流程/流程块）**
- 用户角色：**使用者**（浏览/复用/收藏）+ **创建者**（仅可新建知识/技能）

## 二、信息架构与路由

侧边栏「共享中心」二级菜单替换为：


| 菜单项      | 路由                          |
| -------- | --------------------------- |
| 资产市场（聚合） | `/sharing/market`           |
| 流程块库     | `/sharing/market/snippet`   |
| 流程库      | `/sharing/market/workflow`  |
| 知识中心     | `/sharing/market/knowledge` |
| 技能库      | `/sharing/market/skill`     |


详情页：`/sharing/market/:type/:id`（4 类共用通用框架）
创建页（仅 NATIVE）：`/sharing/market/knowledge/create`、`/sharing/market/skill/create`（本期占位）

旧路由 `/sharing/components/creator`、`/sharing/skills/apa`、`/sharing/skills/acp`、`/sharing/showcases` 全部删除并 Redirect 到 `/sharing/market`。

## 三、页面与组件设计

### 1. 资产市场聚合页 `MarketHome`

页头：标题「资产市场」+ 搜索框（320px，≥2 字符 / 300ms 防抖，搜名称/描述/标签）+ 「+ 新建资产 ▼」Dropdown（创建知识 / 创建技能）。

工具栏：5 Tab `[全部(N)] [流程块(N)] [流程(N)] [知识(N)] [技能(N)]`，下方 `来源筛选 [全部/原生/开发中心]` + `排序 [复用次数/最新发布]`。

主体：响应式资产卡片网格（auto-fill min 300px），每页 12，独立 `.list-pagination` 分页栏。

空状态：`EmptyState` + 「暂无可用资产」/「暂无 X 资产」。

### 2. 子市场页（4 个）

复用聚合页布局，但锁定单一 assetType，去掉 5 Tab，保留搜索 + 来源筛选 + 排序。

- **技能库**特殊：在搜索行下增加「类型」横向标签筛选（文档处理/数据分析/内容生成/知识检索/工具调用/其他）+ 卡片显示调用次数 / 成功率 / 评分（替代复用次数/版本号）。
- **流程库 / 流程块库**：来源固定为 DEV_CENTER（隐藏来源筛选），显示版本号。
- **知识中心**：来源固定为 NATIVE。
  &nbsp;
  注意：4类资产的优先级为 流程 > 知识 > 技能 > 流程块

### 3. 通用资产详情页 `AssetDetail`

整页布局（非 Drawer），结构：

```
← 返回
┌ 资产基本信息卡 ────────────────────────┐
│ 名称   [来源徽标]      [☆ 收藏] [📋 复用] │
│ 描述                                    │
│ 创建者 / 创建时间 / 复用次数 / 当前版本    │
│ 标签                                    │
└─────────────────────────────────────┘
Tabs（懒加载）：[内容] [版本历史(N)] [复用记录(N)]
（技能多 2 个 Tab：参数定义 / 执行配置）
```

- 内容渲染区按类型切换：流程/流程块只读 YAML/JSON 预览块；知识富文本 + 附件下载列表；技能由参数 Tab 与执行配置 Tab 接管。
- 版本历史 `Table`：版本号 / 变更说明 / 创建者 / 创建时间 / [查看] → 弹窗只读快照；点 [复用] 可基于历史版本复用。
- 复用记录 `Table`：复用者（UserNameWithCard）/ 版本 / 复用类型 / 复用时间 / 适配说明。

### 4. 共用组件

`src/pages/Sharing/Market/components/`

- `AssetCard`：统一卡片，显示类型图标（4 色 Lucide）+ 名称 + 描述（2 行截断）+ 标签 + 来源徽标 + 度量信息（reuseCount 或技能特有指标）+ ⭐收藏 + 📋复用按钮，停止冒泡。
- `SourceBadge`：`<Tag>` 组件，NATIVE → blue「🏠 原生」，DEV_CENTER → violet「🔗 开发中心」。
- `AssetTypeIcon`：FileBox/Workflow/BookOpen/Sparkles + 4 色背景。
- `MarketToolbar`：搜索 + 来源筛选 + 排序的复合行。
- `CreateAssetDropdown`：「+ 新建资产」按钮。
- `AssetListGrid`：网格 + 分页 + 空态 + 加载骨架。

### 5. 数据与 Mock

新增 `src/pages/Sharing/Market/mockData.ts` 与 `types.ts`：

- `Asset`、`AssetVersion`、`ReuseRecord`、`Collection`、`SkillAsset`（参数/执行配置/调用示例）
- 至少：4 类各 6–10 条 PUBLISHED 资产，每条 2–4 个版本，3–5 条复用记录。
- 收藏状态 per-user，先用 `useState` 持久化到 `localStorage`（key: `sharing.collections`）。

### 6. i18n

`public/i18n/zh-CN.json` 与 `en.json` 新增 `sharing.market.*` 与 `sidebar.market*` 全套词条；删除 `sharing.creatorComponents.*`、`sharing.skills.*`、`sharing.showcases.*`。

### 7. 删除清单

- `src/pages/Sharing/Components/`、`Skills/`、`Showcases/` 整目录
- `App.tsx` 旧路由与对应 import
- Sidebar `sharingCenterMenu` 替换为新 5 项

## 四、技术细节

- 卡片网格：`grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`，align-content/items: start。
- 列表容器遵循 `app-layout-content-card` + `flex: 1; overflow: auto`。
- 分页：Semi `Pagination`，`size="small"`，固定 `pageSize=12`，独立 `.list-pagination` 行。
- Tabs：`keepDOM={false}`，子市场不需要 keepDOM。
- 详情页 Tab 数据**懒加载**：进入 Tab 时再请求/读取 mock。
- 复用：`Modal.confirm` 跳过，直接调用 → `Toast.success('复用成功')`，本地 `reuseCount + 1`、卡片/详情同步刷新。
- 收藏：乐观更新 + 切换星形图标（Lucide Star，filled/outline）。
- 历史版本「查看」用 520px Modal 展示只读 `<pre>` 内容。
- 错误态：列表加载失败 EmptyState `error` + 重试按钮；详情 404 → EmptyState `not-found` + 返回链接。

## 五、本期不做（明确移出范围）

- 真实后端接入（继续 mock）
- 创建知识 / 创建技能的完整表单页（仅占位路由 + Toast「即将上线」）
- 收藏夹独立管理页
- 适配复用（reuseType=ADAPTATION）
- 我的共享 / 审批管理 / 资产管理 CRUD（属于 FEAT-107/108）
- 资产比较、缩略图、搜索建议、跨类型混合排序之外的高级排序

## 六、交付步骤

1. 新增类型与 mock；建立 `Sharing/Market/` 目录骨架。
2. 实现 `AssetCard` / `SourceBadge` / 工具栏 / 网格组件。
3. 实现聚合页 `MarketHome`（5 Tab + 搜索 + 筛选 + 分页）。
4. 实现 4 个子市场页（复用聚合页核心逻辑，技能库扩展）。
5. 实现通用 `AssetDetail` + 内容/版本/复用 Tab + 技能扩展 Tab。
6. 接入收藏/复用动作 + Toast。
7. 改 Sidebar 菜单与 App 路由（含旧路由 Redirect）。
8. 删除旧目录与对应 i18n / 新增词条。
9. 整体走查：空态 / 加载 / 404 / 响应式 / 暗色模式。