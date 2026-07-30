## 目标

在保持现有产品风格（DetailDrawerWrapper 900px 抽屉、卡片化布局、Semi UI 来也主题、Lucide 图标）的前提下，把「命令库详情」的内容与字段改为参考图的信息结构，同时保留平台侧的管理字段。

## 一、基本信息 Tab 改造

顶部保留卡片，卡片内首行为「首字母方形图标（蓝底圆角 8px）+ 命令库名称」，下方使用 `Descriptions`（align="left"）按以下顺序展示：

| 字段 | 说明 |
| --- | --- |
| 发布者 | UserNameWithCard |
| 创建者 | UserNameWithCard（由原「负责人」改名） |
| 所属部门 | DepartmentPath |
| 状态 | StatusDot（开发中 / 已发布 / 已归档） |
| 安装次数 | 数值 |
| 最新版本 | 最新激活版本号 |
| 选择命令库版本 | Select 下拉（版本列表，默认最新）+ 右侧「下载离线版本」主色按钮（Lucide Download 图标，点击 Toast 提示原型不支持） |
| 命令库介绍 | ExpandableText，3 行截断 |
| 更新说明 | 跟随所选版本的版本说明，如「首次发布 1.0.0」 |
| 兼容系统 | 如 Windows x64, Windows x86，Tag 展示 |

原「入参定义 / 出参定义」两张参数表从基本信息 Tab 移除，改为下方「包含命令」区域。

## 二、包含命令区块

基本信息 Tab 底部新增卡片「包含命令」，`Table size="small"`，列：

- 命令名称（单行省略 + smart tooltip）
- 使用说明（单行省略）

行可展开查看该命令的入参/出参定义（沿用现有参数表列：参数名、类型、必填、默认值、说明）。

## 三、版本 Tab

保持现有左侧版本列表 + 右侧版本详情结构，字段对齐新模型：版本号、状态、上传人、上传时间、发布时间、包文件、更新说明、兼容系统。

## 技术细节

- `src/mocks/commandLibrary.ts`：`CommandItem` 增加 `publisher_id/publisher_name`、`install_count: number`、`compatible_systems: string[]`（如 `['Windows x64','Windows x86']`）、`commands: { name: string; usage: string; inputs: CommandParam[]; outputs: CommandParam[] }[]`；`owner_*` 语义改为创建者。为 30 条 mock 生成 2~4 条包含命令。
- `src/pages/Development/CommandLibrary/components/CommandDetailDrawer/index.tsx`：按上面结构重排基本信息 Tab，新增版本 Select + 下载按钮、包含命令表格。
- `index.less`：新增图标块、标题行、版本选择行样式，沿用现有卡片圆角/间距变量。
- 列表页若展示「负责人」列，同步改名为「创建者」。
- 纯前端原型，无后端改动。
