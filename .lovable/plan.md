

# 统计：Semi 图标 → Lucide 图标映射表

共发现 **55 个** Semi UI 图标在项目中使用，分布于 **93 个文件**。以下是完整的映射关系：

## 映射表

| Semi 图标 | 使用次数 | Lucide 替代 | 说明 |
|-----------|---------|-------------|------|
| `IconDeleteStroked` | ~100 | `Trash2` | 删除 |
| `IconSearchStroked` | ~61 | `Search` | 搜索 |
| `IconEditStroked` | ~52 | `Pencil` | 编辑 |
| `IconMoreStroked` | ~40 | `MoreHorizontal` 或 `Ellipsis` | 更多操作 |
| `IconPlusStroked` | ~38 | `Plus` | 新增 |
| `IconHelpCircleStroked` | ~19 | `HelpCircle` | 帮助提示 |
| `IconEyeOpenedStroked` | ~17 | `Eye` | 查看 |
| `IconChevronLeft` | ~17 | `ChevronLeft` | 左箭头 |
| `IconMinusCircleStroked` | ~16 | `MinusCircle` | 减少/移除 |
| `IconExternalOpenStroked` | ~15 | `ExternalLink` | 外部链接 |
| `IconStarStroked` | ~12 | `Star` | 收藏/评分 |
| `IconUpload` | ~10 | `Upload` | 上传（已有部分使用Lucide） |
| `IconFlowChartStroked` | ~10 | `GitBranch` 或 `Network` | 流程/组织架构 |
| `IconDownloadStroked` | ~10 | `Download` | 下载 |
| `IconClose` | ~10 | `X` | 关闭（已有部分使用Lucide） |
| `IconInbox` | ~9 | `Inbox` | 收件箱/空状态（已有部分使用Lucide） |
| `IconAlertCircle` | ~9 | `AlertCircle` | 警告圆形 |
| `IconChevronUp` | ~8 | `ChevronUp` | 上箭头 |
| `IconChevronRight` | ~8 | `ChevronRight` | 右箭头 |
| `IconChevronDown` | ~8 | `ChevronDown` | 下箭头 |
| `IconCrossCircleStroked` | ~7 | `XCircle` | 错误/关闭圆形 |
| `IconRefresh` | ~6 | `RefreshCw` | 刷新（已有部分使用Lucide） |
| `IconPlayCircle` | ~6 | `PlayCircle` | 运行（已有部分使用Lucide） |
| `IconSendStroked` | ~5 | `Send` | 发送/提交 |
| `IconVolume` | ~4 | `Volume2` | 音量 |
| `IconUserListStroked` | ~4 | `Users` | 用户列表 |
| `IconLink` | ~4 | `Link` | 链接（已有部分使用Lucide） |
| `IconKeyStroked` | ~4 | `Key` | 密钥/凭据 |
| `IconInfoCircle` | ~4 | `Info` | 信息 |
| `IconClockStroked` | ~4 | `Clock` | 时间 |
| `IconAlertTriangle` | ~4 | `AlertTriangle` | 三角警告 |
| `IconFilterStroked` | ~3 | `Filter` | 筛选 |
| `IconBellStroked` | ~3 | `Bell` | 通知 |
| `IconVideoStroked` | ~2 | `Video` | 视频 |
| `IconUserGroup` | ~2 | `Users` | 用户组 |
| `IconUserAdd` | ~2 | `UserPlus` | 添加用户（已有部分使用Lucide） |
| `IconTick` | ~2 | `Check` | 勾选（已有部分使用Lucide） |
| `IconMinimize` | ~2 | `Minimize2` | 最小化（已有部分使用Lucide） |
| `IconMaximize` | ~2 | `Maximize2` | 最大化（已有部分使用Lucide） |
| `IconMap` | ~2 | `Map` | 地图 |
| `IconList` | ~2 | `List` | 列表视图 |
| `IconImageStroked` | ~2 | `Image` | 图片 |
| `IconHomeStroked` | ~2 | `Home` | 首页 |
| `IconGridView` | ~2 | `LayoutGrid` | 网格视图 |
| `IconCopyStroked` | ~2 | `Copy` | 复制 |
| `IconChevronRightStroked` | ~2 | `ChevronRight` | 同 IconChevronRight |
| `IconChevronDownStroked` | ~2 | `ChevronDown` | 同 IconChevronDown |
| `IconCheckCircleStroked` | ~2 | `CheckCircle` | 成功勾选 |
| `IconCalendarStroked` | ~2 | `Calendar` | 日历 |
| `IconBookStroked` | ~2 | `BookOpen` | 文档/书籍 |
| `IconArrowUp` | ~2 | `ArrowUp` | 向上 |
| `IconArrowLeft` | ~2 | `ArrowLeft` | 向左 |
| `IconArrowDown` | ~2 | `ArrowDown` | 向下 |
| `IconApartment` | ~2 | `Building2` | 组织/部门 |
| `IconSourceControl` | ~1 | `GitBranch` | 版本控制 |
| `IconFolderStroked` | ~1 | `Folder` | 文件夹 |
| `IconCloudStroked` | ~1 | `Cloud` | 云 |

## 已部分迁移的图标

以下图标在项目中已有部分文件使用了 Lucide 版本，需要统一剩余文件：
- `PlayCircle`、`X`、`Check`、`Inbox`、`RefreshCw`、`Upload`、`Link`、`UserPlus`、`Maximize2`、`Minimize2`

## 统一规范

所有 Lucide 图标使用 `size={16} strokeWidth={2}`（按钮/操作场景）或 `size={14} strokeWidth={2}`（行内/小尺寸场景），与现有标准保持一致。

## 实施范围

共涉及 **93 个文件**，约 **460 处** import 需要修改。确认映射表无误后可批量替换。

