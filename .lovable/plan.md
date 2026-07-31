## 问题

当前详情抽屉的字段是照搬「自动化流程详情」的：版本 Tab 里放了 **入参 / 出参** 变量卡片，这是流程（可被调度执行、有运行参数）的概念。命令库本身不被执行，参数只属于「包含命令」这一级，版本层面挂参数在数据逻辑上是错的（`CommandVersion.inputs/outputs` 只是 mock 生成时复用了同一个池子）。

## 一、版本 Tab —— 去掉流程味字段

**移除**：版本详情右栏的「入参」「出参」两个小节（版本不持有参数）。

**改为**：版本详情右栏结构
1. 小节「版本信息」：版本号、状态（已发布 / 未发布）、上传人、创建时间、发布时间、更新说明、命令库文件、源码文件 —— 保持不变，这些是命令库自身的字段。
2. 新增小节「本版本包含命令」：小型表格（命令名称 / 使用说明），行展开显示该命令的入参、出参卡片。参数归属下沉到命令这一级，符合命令库逻辑。
3. 「删除版本」按钮位置与禁用规则不变。

左栏版本列表保持不变（版本号 + 绿点当前启用版本 + 已发布/未发布 Tag）。

## 二、基本信息 Tab —— 字段按命令库语义收敛

**基础信息**
| 字段 | 来源 |
| --- | --- |
| 命令库名称 | `name` |
| 状态 | 状态 Tag |
| 所属部门 | `owning_department_name` |
| 创建者 | `owner_name` |
| 适用平台 | `platforms` |
| 兼容系统 | `compatible_systems` |
| 命令库介绍 | `description` |

**发布信息** —— 把「当前版本」改名为「最新发布版本」（命令库语义：已发布可安装的版本；开发中显示 `-`），其余保留：发布人、安装次数、创建时间、更新时间。

**移除基本信息 Tab 底部的「包含命令」小节** —— 命令清单随版本变化，属于版本维度，统一放到版本 Tab 里，避免两处重复且语义矛盾。

## 技术细节

- 仅改 `src/pages/Development/CommandLibrary/components/CommandDetailDrawer/index.tsx`，以及 `index.less` 中随之失效的类名清理。
- 数据模型 `src/mocks/commandLibrary.ts`：`CommandVersion` 增加 `commands: CommandEntry[]`（每个版本各自的命令清单，mock 中不同版本命令数略有差异），`inputs`/`outputs` 从 `CommandVersion` 上移除。
- `src/pages/Development/CommandLibrary/index.tsx` 中上传新版本时补充初始化 `commands: []`。
- 纯前端原型，无后端改动。
