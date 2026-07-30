## 目标

把「命令库详情」抽屉从当前单页双栏结构，改回两个页签：**基本信息**、**版本**，视觉与交互完全对齐「自动化流程详情抽屉」（`ProcessDetailDrawer`），同时字段内容遵循命令库自身的数据逻辑（独立实体，不关联需求、不接入发布单/停用审批）。

## 一、头部（保持现有）

- 首字母方块图标 + 命令库名称 + 状态 Tag（开发中 / 已发布 / 已归档）。
- 副标题：`所有者：{owner_name}`（UserNameWithCard）。
- 右侧操作区沿用：编辑 / 删除 / 上下条导航 / 关闭。
- 抽屉宽度 900px、`DetailDrawerWrapper`、无遮罩，不变。

## 二、Tab 1「基本信息」

参照流程详情的做法：`Title heading={6}` 小节标题 + `Descriptions align="left"`。

**基础信息**
| 字段 | 来源 |
| --- | --- |
| 命令库名称 | `name` |
| 状态 | 状态 Tag |
| 所属部门 | `owning_department_name`（DepartmentPath） |
| 创建者 | `owner_name`（UserNameWithCard） |
| 适用平台 | `platforms` Tag 组 |
| 兼容系统 | `compatible_systems` 文本 |
| 命令库介绍 | `description`（ExpandableText） |

**发布信息**（Divider 分隔的第二组）
| 字段 | 来源 |
| --- | --- |
| 当前版本 | `current_version`，无则 `-` |
| 发布人 | `publisher_name` |
| 安装次数 | `install_count` |
| 创建时间 | `created_at` |
| 更新时间 | `updated_at` |

## 三、Tab 2「版本」

完全复用流程详情「版本」Tab 的左右布局与样式类结构：

**左栏（280px）**
- 标题「历史版本」+ 说明 Tooltip。
- 主色按钮「上传版本」（复用 `UploadCommandVersionModal`）。
- 版本卡片：版本号 +（最新启用版本显示绿点 Tooltip）+ 右侧「已发布 / 未发布」Tag，选中项蓝色描边。
- 无版本时：整个 Tab 显示空状态 + 「上传版本」按钮。

**右栏（自适应）**
- 小节「版本信息」：Descriptions —— 版本号、状态、上传人、创建时间、发布时间、更新说明（ExpandableText）、命令库文件（图标+文件名+大小+下载按钮）、源码文件（同前）。
- 小节下方「删除版本」按钮（红字，已发布版本禁用并 Tooltip「已发布版本不可删除」），与流程详情一致。
- 小节「入参」「出参」：该版本 `inputs` / `outputs`，用与流程详情一致的变量卡片样式（名称 + 类型 Tag + 必填标识 + 默认值 + 描述）；无数据则不渲染该小节。

移除当前单页结构中的启用 Switch 与「查看已删除版本」链接（流程详情无此交互），版本启用状态改为只读 Tag 展示。

## 四、「包含命令」如何处理

命令库特有的 `commands`（名称 + 使用说明 + 入参/出参）不再单列 Tab（需求限定只有两个页签），放在「基本信息」Tab 底部作为第三个小节「包含命令」：小型表格（命令名称 / 使用说明），行展开显示该命令的入参出参表。

## 技术细节

- 仅改动 `src/pages/Development/CommandLibrary/components/CommandDetailDrawer/index.tsx` 与 `index.less`。
- `index.less` 参照 `ProcessDetailDrawer/index.less` 的 tabs / version-layout / version-sidebar / version-detail 样式重写，类名前缀 `command-detail-drawer-`。
- 数据模型 `src/mocks/commandLibrary.ts` 无需改动（`source_file_*` 字段已具备）。
- 纯前端原型，无后端改动。
