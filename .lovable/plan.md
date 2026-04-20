

## 计划：工作空间成员沿用协作者面板视觉

将「管理工作空间成员」与「添加成员」改造为与「添加协作者 / 管理协作者」一致的视觉与交互模式，让用户感知到"添加用户"类操作的一致性。

### 改造目标
统一以下三个视图（与 `CollaboratorPanel` 完全一致的视觉骨架）：

1. **快捷视图（quick）** —— 等价于"添加协作者"
   - 头部：标题「添加成员」+ 右侧 AvatarGroup（头像堆叠 +N） + ChevronRight + 关闭
   - 主体：搜索框（已选用户以 Tag chip 形式内嵌，右侧角色 Select）
   - 命中下拉：搜索结果列表（点击加入已选）
   - 底部右侧按钮：「从组织架构添加」（Network 图标）
   - 提交：底部「确定」

2. **管理视图（manage）** —— 等价于"管理协作者"
   - 头部：返回箭头 +「管理成员」+ 右侧 AvatarGroup + ChevronRight + 关闭
   - 标题区：「所有可访问此工作空间的用户」
   - 列表：每行 = 黑色头像 + 姓名（归属者/部门管理员蓝色 Tag） + 部门 + 右侧角色 Select（含「移除」outerBottomSlot）
   - 底部右侧按钮：「添加成员」（UserPlus 图标） → 切回 quick

3. **组织架构视图（org）** —— 等价于协作者面板的 org view
   - 头部：返回 +「从组织架构选择」
   - 左栏：搜索 + 面包屑 + 部门/用户树（仅勾选 USER，部门节点只用于钻取，不可勾选——因为工作空间成员不接受部门类型）
   - 右栏：已选用户（带角色 Select，可移除）
   - 底部：取消 / 确定

### 与协作者面板的差异（保留工作空间业务规则）
- 协作者类型仅 `USER`（无 `DEPARTMENT` 行；org 视图禁用部门勾选）
- 角色仅 `MANAGER` / `MEMBER`（无 OBSERVER/MAINTAINER 等）
- 无继承/级联（`source` / `inheritance_sources` 全部省略）
- 部门管理员的"自动继承"以蓝色「部门管理员」Tag 标在姓名后（保留现有逻辑），不可移除/改角色
- 必须保留「至少一名管理员」校验提示

### 改动文件
- `src/pages/Requirements/RequirementsProjects/components/WorkspaceMembersModal/index.tsx`
  - 移除 Table + Popconfirm + 旧添加视图，重写为 quick / manage / org 三视图状态机
  - 复用 `CollaboratorRoleSelect` 的视觉，但本地实现一个仅含 MANAGER/MEMBER 两选项 + 「移除」outerBottomSlot 的 `WorkspaceRoleSelect`（同款交互，业务字段不同）
  - 头部 AvatarGroup（黑色背景，姓名首字）+ `+N` Tag + ChevronRight，与协作者面板完全一致
  - 搜索框沿用协作者面板 chip-in-input 模式 + 批量角色 Select
  - org 视图直接复用 `mockOrgTree` 的部门钻取与面包屑结构（从协作者面板抽取或就地复刻），勾选过滤为仅 USER
- `src/pages/Requirements/RequirementsProjects/components/WorkspaceMembersModal/index.less`
  - 全部样式改为对齐 `src/components/CollaboratorManager/CollaboratorPanel/index.less` 的 token（item 行高、头像间距、搜索框、底部按钮区）
- `public/i18n/zh-CN.json` / `en.json`
  - 复用既有 `collaborator.addModal.*` / `collaborator.actions.*` 文案，新增（如缺）`requirements.projects.deptManagerInheritedTag`

### 验收
1. 点击工作空间「成员」按钮 → 默认进入 quick 视图，顶部头像堆叠展示当前成员，与协作者弹窗外观一致
2. 搜索 → 出现下拉 → 点击加入 chip → 选择角色 → 「确定」加入成员
3. 点击头像区右侧 ChevronRight → 进入 manage 视图，所有成员以行卡片展示（黑色头像 + 姓名 + 部门 + 角色 Select）
4. 部门管理员自动出现在列表中，姓名后带蓝色「部门管理员」Tag，角色 Select 不可点
5. 角色下拉中包含「移除」红色操作项；点击触发确认（保留至少一名管理员校验）
6. 点击底部「从组织架构添加」 → org 视图，可钻取部门、勾选用户（部门节点不可勾选）
7. 全部视觉（间距、字号、头像、Tag、按钮位置）与「添加协作者 / 管理协作者」弹窗一致

