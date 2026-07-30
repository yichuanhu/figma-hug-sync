## 目标

把「命令库详情」抽屉从当前的双 Tab（基本信息 / 版本）结构，重做为参考图的单页结构：左侧历史版本列表，右侧所选版本的详情字段。保持现有产品风格（DetailDrawerWrapper 900px、Semi UI 来也主题、Lucide 图标）。

## 一、头部

- 主标题行：蓝底圆角 8px 首字母方块图标 + 命令库名称 + 状态 Tag（开发中 / 已发布 / 已归档）。
- 副标题行：`所有者：{创建者}`，使用 UserNameWithCard，灰色小字。
- 右侧沿用现有 header 操作区（编辑 / 删除 / 上下条导航 / 关闭）。

## 二、内容区（去掉 Tabs）

左右两栏，中间一条竖分隔线。

### 左栏（约 280px）

- 标题「历史版本」+ 右侧主色按钮「+ 新增版本」（复用现有 UploadCommandVersionModal）。
- 下方链接「查看已删除版本」（原型：Toast 提示暂不支持）。
- 版本卡片列表：每项 = Switch（是否启用/发布，仅一个版本可启用）+ 版本号 + 右侧删除图标（已启用版本禁用删除并 Tooltip 提示）。选中项蓝色描边 + 圆角 8px。
- 无版本时展示空状态 + 「新增版本」按钮。

### 右栏（自适应）

按参考图纵向排列「灰色标签 + 黑色内容」的字段块（不用 Descriptions，用自定义 field 结构，标签 13px tertiary，内容 14px text-0，块间距 20px）：

| 字段 | 内容 |
| --- | --- |
| 版本号 | 所选版本号 |
| 创建时间 | 版本上传时间 |
| 命令库介绍 | ExpandableText（命令库描述） |
| 更新说明 | 所选版本 version_note |
| 兼容系统 | `Windows x64, Windows x86` 文本形式 |
| 命令库文件 | 文件图标 + 文件名 + 下载图标按钮（Toast 原型提示） |
| 命令库源码文件 | 同上，源码包文件名 |

平台侧字段（所属部门、状态、安装次数、发布者）不再单列展示：状态进标题 Tag，创建者进副标题，其余移除以对齐参考图。

## 三、包含命令

参考图中无此区块，移除「包含命令」表格及入参/出参表格展示。

## 技术细节

- `src/mocks/commandLibrary.ts`：`CommandVersion` 增加 `source_file_name`、`source_file_size`（源码包）；保留其余字段。
- `src/pages/Development/CommandLibrary/components/CommandDetailDrawer/index.tsx`：删除 Tabs、Descriptions、ParamTable、包含命令表格，改为上述两栏布局；Switch 切换启用版本走本地 state。
- `index.less`：新增 header 双行、左栏版本卡片（选中态 `--semi-color-primary` 1px 描边）、右栏字段块样式；清理不再使用的样式。
- 纯前端原型，无后端改动。
