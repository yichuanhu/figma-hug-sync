## 目标

调整「开发中心 > 命令库」详情抽屉（`CommandDetailDrawer`）两个页签。

## 1. 基本信息 Tab

- 删除「发布信息」分组标题、上方的 `Divider` 及 `publishGroupData`（最新发布版本、发布人、安装次数、发布时间）。
- 页签仅保留「基础信息」一组：命令库名称、状态、所属部门、创建者、适用平台、兼容系统、命令库介绍。

## 2. 版本 Tab（按参考图重做）

左侧「历史版本」栏：
- 标题行：左侧「历史版本」文字，右侧改为 `+ 新增版本` 主色按钮（替换原先整行宽度的上传按钮与 HelpCircle 提示）。
- 标题行下方增加「查看已删除版本」文字链接（原型：点击 Toast 提示暂无已删除版本）。
- 版本卡片：左侧 `Switch`（控制该版本启用/发布状态，切换后更新 `is_active`）+ 版本号，右侧垂直居中的删除图标（`Trash2`，hover 显示，已启用版本禁用并 Tooltip 提示）。选中项使用浅蓝底 + 主色描边（对齐参考图）。
- 侧栏宽度加宽到约 260px，卡片间距 8px。

右侧版本详情：
- 改为「标签在上、值在下」的纵向字段列表（不再用 `Descriptions` 两列），字段顺序：版本号、创建时间、命令库介绍、更新说明、兼容系统、命令库文件、命令库源代码文件。
- 命令库介绍取该命令库的 `description`；兼容系统取 `compatible_systems`，以「, 」连接。
- 文件行沿用现有 `FileLine`（图标 + 文件名 + 下载按钮），去掉文件大小以贴合参考图。
- 移除右侧原有的「删除版本」按钮（删除入口已移至左侧卡片）与「版本信息」小标题。
- 「本版本包含命令」表格保留，置于字段列表下方（命令库核心信息，不属于参考图裁剪范围）。

## 技术说明

改动文件：
- `src/pages/Development/CommandLibrary/components/CommandDetailDrawer/index.tsx`
- `src/pages/Development/CommandLibrary/components/CommandDetailDrawer/index.less`

新增本地状态用于 Switch 切换（原型内存态，不落库）；样式全部使用 Semi 设计变量（`--semi-color-primary`、`--semi-color-text-2` 等），不硬编码色值。
