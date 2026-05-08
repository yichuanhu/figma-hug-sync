# 「我的共享」FEAT-107 实施方案

覆盖 STORY-001 ~ 007 共 7 个 Story，路由保持 `/sharing-center/my-shared`，新增 ARCHIVED Tab，扩充 mock。分 4 个阶段交付，每阶段完成后可独立预览。

---

## 一、整体架构与目录

新建子目录（component-as-folder，无 barrel）：

```text
src/pages/SharingCenter/MyShared/
  index.tsx                     // 列表页（升级）
  index.less
  components/
    AssetActionsMenu/           // 行操作菜单（来源+状态差异化）
    NewAssetDropdown/           // [+ 新建资产] 下拉
    BatchActionBar/             // 批量操作工具栏
    SemverDialog/               // SemVer 发版对话框（PATCH/MINOR/MAJOR + changeLog）
    VersionHistoryList/         // 版本历史列表（NATIVE & DEV_CENTER 复用，readonly 切换）

src/pages/SharingCenter/MyShared/Create/
  Knowledge/index.tsx           // STORY-002 知识创建
  Skill/index.tsx               // STORY-003 技能创建

src/pages/SharingCenter/MyShared/Edit/
  DevCenter/index.tsx           // STORY-004 DEV_CENTER 展示字段编辑
  Native/index.tsx              // STORY-005 NATIVE 全字段编辑 + 发版
```

新增路由（在 `src/App.tsx`）：

- `/sharing-center/my-shared/create/knowledge` → 知识创建
- `/sharing-center/my-shared/create/skill` → 技能创建
- `/sharing-center/my-shared/edit/:id` → 根据资产 source 自动渲染 DevCenter / Native 编辑器
- `/sharing-center/my-shared/:id/versions` → 版本历史 Tab（也作为详情页子 Tab 入口）

---

## 二、Mock 数据扩充（`src/pages/SharingCenter/shared/mockData.ts`）

- `ShareAsset` 增加：`originUrl?`、`ownerId`、`creatorId`、`archivedAt?`
- 新增 `ShareStatus` 值：`'ARCHIVED'`、`'UNLISTED'`（UNLISTED 不进入任何 Tab，仅用于状态机演示）
- 新增 `AssetVersion` 类型：`{ id, assetId, version, changeLog, isLatest, publisher, publishedAt, content? }`
- 新增 `getVersions(assetId)` mock 生成器：NATIVE 用 SemVer 序列（1.0.0 / 1.0.1 / 1.1.0 / 2.0.0），DEV_CENTER 透传开发中心版本号 + 同步快照
- 至少补齐每种 (source × status) 组合 1~2 条数据，含中英 tag、富文本内容片段、技能 inputParams 示例

---

## 三、阶段一：列表页 STORY-001（核心骨架）

升级 `MyShared/index.tsx`：

1. **Tabs**：5 个 Tab — 已发布 / 草稿 / 待审批 / 已拒绝 / 已归档；`tab=${name}(${count})`，`keepDOM=false`
2. **筛选行**：搜索框（320px、≥2 字符、300ms 防抖、IconSearch 前缀）+ 类型 Select（全部/流程块/流程/知识/技能）+ 来源 Select（全部/原生/开发中心）+「清空筛选」
3. **列表**：保持卡片网格（与现有视觉一致，Card 含 SourceBadge + StatusTag + tags + 更新时间），分页 12/页，外置 `.list-pagination`
4. **批量选择**：卡片左上勾选框 → 选中态高亮 → 顶部 BatchActionBar 出现，操作按钮按已选集合的来源动态启用/禁用；混选 NATIVE+DEV_CENTER 时禁用并 Tooltip 提示
5. **行操作菜单** AssetActionsMenu（按来源 × 状态映射，查看 Story-001 §6.2）：
  - NATIVE PUBLISHED → 查看 / 编辑 / 归档
  - NATIVE DRAFT → 编辑 / 删除 / 发布
  - NATIVE PENDING → 查看
  - NATIVE REJECTED → 查看 / 编辑（修改重提）
  - NATIVE ARCHIVED → 查看 / 恢复 / 删除
  - DEV_CENTER PUBLISHED → 查看 / 编辑展示信息 / 下架 / 在开发中心打开
  - DEV_CENTER PENDING/REJECTED → 查看
  - 删除/归档/恢复/下架使用 `Modal.confirm` 二次确认；操作后本地 mock 状态变更并刷新计数
6. **NewAssetDropdown**：知识/技能可点跳创建页；流程块/流程置灰 + Tooltip「请在开发中心创建」
7. **空状态**：每个 Tab 独立文案 + 引导 CTA（已发布/草稿展示「去新建资产」按钮）；筛选无结果展示统一空状态

---

## 四、阶段二：NATIVE 创建 STORY-002 / 003

子页统一头部：`IconChevronLeft` 返回 + `Title heading={3}`；底部固定操作条「保存草稿」/「发布」。

### Knowledge 创建（STORY-002）

- 表单字段：名称（2-100）→ 知识类型（操作手册/错误码/最佳实践/FAQ）→ 分类 → 标签（TagInput）→ 描述（10-500）
- 富文本：先用轻量自研封装（`contentEditable` + 工具条按钮：B/I/U、列表、链接、代码块、引用、表格简版）。Toolbar 占位预留 Tiptap 接入点
- 附件上传：Semi `Upload`（自定义渲染，单文件 ≤10MB，支持 PDF/Excel/Word/图片）
- 校验：Semi UI 原生 trigger=['blur','change']
- 「保存草稿」→ 写入 mock，状态 DRAFT；「发布」→ PENDING_APPROVAL，版本 1.0.0

### Skill 创建（STORY-003）

- 表单字段：名称 → 技能类型（6 种）→ 标签 → 描述
- 输入参数表（TableEditable）：参数名 / 类型(string|number|boolean|object|array) / 必填 / 描述 / 默认值
- 输出参数表
- 执行配置：超时（默认 30s）+ 重试策略 RadioGroup（none/fixed/exponential）
- 调用示例：代码编辑（先用 `<textarea>` + 等宽字体；预留 Monaco 接入点），Tab 切换 JSON/curl/Python
- 校验：至少 1 个输入参数 OR 勾选「无参数」

---

## 五、阶段三：编辑 STORY-004 / 005 + 发版 STORY-007

### DevCenter 编辑页（STORY-004）

- 仅展示字段可编辑：名称/描述/标签
- 内容区域只读卡片（流程块代码 / 流程定义文本预览），顶部按钮「在开发中心编辑内容」打开 originUrl
- 「保存」直接更新 Asset 元数据，不创建新版本，不进入审批

### Native 编辑页（STORY-005）

- 复用阶段二的 Knowledge/Skill 表单，按资产类型动态渲染
- 「保存」→ 仅 DRAFT 状态生效（继续编辑草稿）
- 「发布新版本」→ 弹 SemverDialog

### SemverDialog（STORY-007）

- 首发（DRAFT→PUBLISHED）：跳过增量选择，仅收集 changeLog（5-200 字符），版本固定 1.0.0；提交 → PENDING_APPROVAL
- 后续（PUBLISHED→PUBLISHED）：RadioGroup MAJOR/MINOR/PATCH（PATCH 默认 + 当前版本预览，例如「当前 1.2.3 → 1.2.4」），changeLog 必填；提交 → 创建新 AssetVersion，旧版本 isLatest=false，新版本 isLatest=true，状态保持 PUBLISHED（免审批）

### 路由守卫

- `/edit/:id` 页加载时检查 `currentUser.id === asset.creatorId`，否则 `Toast.warning + navigate('/sharing-center/my-shared')`

---

## 六、阶段四：版本历史 STORY-006 / 007

新增 VersionHistoryList 组件，作为 `/sharing-center/my-shared/:id/versions` 页面的主体（也通过资产详情页 Tab 复用）：

- **NATIVE**：列表项显示 `v1.2.3 · [latest 徽标] · changeLog · 发布者头像/昵称 · 发布时间`，按 createdAt 降序；latest 高亮
- **DEV_CENTER**：列表项显示 `v原样版本号 · 快照徽标 · 同步时间`，顶部「在开发中心查看」按钮打开 originUrl；只读，无操作
- 切换路径：列表页行操作菜单/详情页 Tab → 该页面

---

## 七、技术细节

- **状态管理**：本期纯 mock，使用 `useReducer` + 本模块单例 store（`MyShared/store.ts`），所有变更走 reducer 派发，便于跨页面（编辑→列表）同步
- **i18n**：在 `public/i18n/zh-CN.json` 和 `en.json` 的 `sharing.myShared` 节点下新增 keys（tabs.archived、filters.*、actions.*、newAsset.*、batch.*、empty.* 子节点、create/edit/version 命名空间）。中文必须使用「流程块」、「原生」、「开发中心」等已有词汇
- **图标**：Lucide React（IconSearch 例外用 Semi 给输入框前缀）；NewAssetDropdown 用 Plus + ChevronDown
- **Toast**：`theme: 'light'`；删除/归档/下架成功后给短确认
- **空状态插画**：复用 `src/assets/empty-state` 现有 PNG
- **样式**：所有新页面置于 `.app-layout-content-card`，flex 列布局；24px 全局内边距；卡片 12px 圆角、`0 1px 3px` 基础阴影

---

## 八、验收清单

- 5 Tab + 实时计数徽标
- 类型/来源/关键词组合筛选；关键词≥2 字符 300ms 防抖
- 分页 12/页，外置分页条
- 新建下拉：知识/技能跳页，流程块/流程置灰 Tooltip
- 行操作按 source × status 差异化（10 种组合全覆盖）
- 批量选择按来源分组，混选阻止
- NATIVE 知识创建：富文本 + 附件 + 草稿/发布
- NATIVE 技能创建：参数表 + 执行配置 + 示例
- DEV_CENTER 编辑：仅展示字段，内容只读 + 跳转
- NATIVE 编辑 + SemVer 发版：首发 1.0.0 跳过增量，后续 PATCH 默认；isLatest 自动迁移
- 版本历史：NATIVE 含 changeLog/latest 徽标；DEV_CENTER 只读快照
- 路由守卫：非创建者无法进入编辑页
- 物理删除二次确认（仅 NATIVE DRAFT/ARCHIVED）
- mock 含 ARCHIVED/UNLISTED 各类资产，覆盖演示