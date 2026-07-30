## 目标

在「开发中心 > 开发任务管理」分组下，新增与「自动化流程」并列的菜单「命令库」。命令是完全独立的实体（不关联需求、不接入发布单与停用审批），列表与详情整体参考自动化流程的视觉与交互，详情仅保留两个 Tab：基本信息、版本。

## 一、导航与路由

- 侧边栏 `developmentCenterMenu` 在 `automationProcess` 之后新增 `commandLibrary`，路径 `/dev-center/command-library`，图标使用 Lucide `Terminal`（stroke 2）。
- 同步更新 Sidebar 中开发中心的路径判定逻辑（`pathname.startsWith('/dev-center/command-library')` 时保持开发中心侧栏展开并高亮）。
- `App.tsx` 注册路由，指向新页面 `src/pages/Development/CommandLibrary`。
- i18n：在 `public/i18n/zh-CN.json` / `en.json` 增加 `sidebar.commandLibrary` 与 `development.commandLibrary.*` 文案（中文为主）。

## 二、列表页（参考自动化流程列表）

页面结构沿用流程列表标准：`Typography.Title heading=3` 标题 → 工具栏（左：320px 搜索框 + 部门筛选 + FilterPopover；右：新建命令按钮）→ `Table size="small"` → 独立 `.list-pagination` 分页条（native=false，支持切换每页条数）。

列顺序：


| 列      | 说明                                                 |
| ------ | -------------------------------------------------- |
| 命令名称   | 点击打开详情抽屉，单行省略 + smart tooltip                      |
| 描述     | 单行省略                                               |
| 状态     | StatusDot：开发中 / 已发布                                |
| 当前版本   | 最新激活版本号                                            |
| 所属部门   | DepartmentPath                                     |
| 创建者    | UserNameWithCard                                   |
| &nbsp; | &nbsp;                                             |
| 更新时间   | &nbsp;                                             |
| 操作     | 编辑 / 上传版本 / 删除（Ellipsis 下拉，行内 stopPropagation）/协作者 |


行为：搜索 500ms 防抖、筛选与搜索变更后页码重置为 1、空态使用标准 EmptyState 插画、加载态使用 TableSkeleton。

## 三、详情抽屉（仅 2 个 Tab）

沿用 `DetailDrawerWrapper`（900px、maskless），头部为命令名称 + 状态标签，头部操作区顺序：协作者 → 编辑 → 删除 → 上下条导航 → 全屏。

**Tab 1 基本信息**：命令名称、所属部门、负责人、适用平台、状态、当前版本、描述（ExpandableText，3 行截断）；下方两张卡片展示「入参定义」「出参定义」表格（参数名、类型、必填、默认值、说明）。

**Tab 2 版本**：与流程版本 Tab 一致的版本列表——按版本号降序，展示版本号、状态（激活/未激活）、上传人、上传时间、版本说明、包文件名，行操作支持删除（激活版本禁止删除）。

## 四、新建 / 编辑 / 上传版本

- 新建、编辑复用 `FormModal`（520px），字段顺序：名称 → 所属部门 → 负责人 → 适用平台 → 描述；Semi UI 原生校验（blur/change）。
- 上传版本弹窗复用现有 UploadVersionModal 的视觉规范（Lucide Inbox 图标、隐藏原生列表、自定义文件信息）。

## 技术细节

- 目录结构遵循「组件即文件夹」：`src/pages/Development/CommandLibrary/{index.tsx,index.less}`，子组件放 `components/CommandDetailDrawer`、`components/CommandFormModal`、`components/UploadCommandVersionModal`。
- 类型定义与 Mock 数据新增 `src/mocks/commandLibrary.ts`，生成约 30 条命令（`command-1` … `command-30`）与各自版本、入参/出参定义，字段命名沿用英文 mock 字段风格。
- 复用现有 `StatusDot`、`FilterPopover`、`DepartmentSearchSelect`、`OwnerSelect`、`UserNameWithCard`、`ExpandableText`、`TableSkeleton`、`EmptyState`，不新增第三方依赖。
- 纯前端原型，不涉及任何后端/数据库改动。