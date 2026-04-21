

## 计划：基本信息 Tab + 右侧属性面板 + 版本切换 重构

依据 STORY-003 §6.3 与 R-13：版本切换为详情页**头部下拉**（非独立 Tab），历史版本只读展示。

### 改造范围

**A. 版本历史：Tab → 头部版本切换器**
- 移除独立的「版本历史」Tab
- 在抽屉头部标题区下方新增 `版本: [v1 ▼]` 下拉（仅当 `historyVersions.length >= 1` 即存在多版本时显示；单版本不渲染）
- 选择历史版本后：
  - 整个详情页（基本信息 / 评估 / 成本预估 Tab + 右侧属性面板）切换为该版本的 `snapshot` 数据**只读视图**
  - 顶部显示黄色 Banner：「当前查看历史版本 v{n}，只读」+「返回最新版本」按钮
  - 头部「编辑」「删除」「下线」等操作按钮在历史版本视图下隐藏
- 仅有 1 个版本（无历史）时不展示版本下拉，行为同当前

**B. 基本信息 Tab（overview）**
- 移除内嵌的 `ArtifactSection`（关联与交付区块）
- 在「描述」之后新增 **Schema 自定义字段动态渲染区**：从 `data.form_data` 按 scheme 顺序以 key/value 行展示；为空时不渲染
- 保留：标题、描述、业务背景、附件、审批进度、活动流
- 不再展示「联系人信息」

**C. 右侧属性面板**
新结构：
```text
[ 状态 ]   [ 优先级 ]
─────────────────────────
归属部门         Finance
项目负责人        张三 (UserNameWithCard)   ← 新增，绑定 owner_name/owner_id，空值"未指派"
创建者           John Smith (UserNameWithCard)
期望上线日期      2026-04-19
─────────────────────────
关联工作空间      财务自动化空间（只读文本，未关联→灰字"未关联"）
所属项目         数字化项目（灰字，由工作空间继承，只读）
─────────────────────────
创建时间 / 更新时间
─────────────────────────
[草稿态：提交审批] / [审批进度区]
```
- 删除「联系人信息」(`contactInfo`) 行
- 新增「项目负责人」行（UserNameWithCard）
- 「关联工作空间 / 所属项目」改为只读文本，不再可点击

**D. 不动项**
- 评估 Tab、成本预估 Tab 保持现状
- 抽屉头部右上角操作按钮（分享 / 下线 / 删除 / 全屏 / 上一条下一条）保持现状

### 改动文件
- `RequirementDetailDrawer/index.tsx`
  - 移除 `versionHistory` Tab
  - 头部新增版本下拉（Select）+ 历史版本只读 Banner
  - 新增 `viewingVersion` 状态：`'current' | number`；非 current 时整个详情数据从 `historyVersions[n].snapshot` 读取
  - PropertyPanel：删除 contactInfo，新增 projectOwner，调整顺序
  - 历史版本视图下隐藏编辑/删除/下线按钮、移除 ArtifactSection、Tab 内表单只读
  - overview Tab：移除 `<ArtifactSection />`；新增自定义字段渲染块
- `VersionHistoryTab/` 目录可删除（或保留为兼容壳，不再被引用）
- `ArtifactSection.tsx` 不再被引用（保留文件不动）
- i18n（zh-CN / en）新增：
  - `requirements.fields.projectOwner` / `requirements.detail.ownerUnassigned`
  - `requirements.detail.customFieldsTitle`
  - `requirements.detail.versionLabel` / `requirements.detail.versionLatest` / `requirements.detail.viewingHistoryBanner` / `requirements.detail.backToLatest`

### 验收
1. 详情抽屉 Tab 仅剩：基本信息 / 评估 / 成本预估（移除「版本历史」Tab）
2. 多版本需求：头部显示「版本：v3 ▼」下拉，可选择历史版本；单版本需求不显示下拉
3. 选择历史版本后：黄色 Banner 提示只读 + 返回最新版本按钮；表单内容、属性面板均切换为对应版本快照；编辑/删除/下线按钮隐藏
4. 「返回最新版本」点击后恢复当前版本视图与所有操作按钮
5. 基本信息 Tab 不再出现「关联与交付」区块；如需求模板有自定义字段，在描述下方展示
6. 右侧属性面板「联系人信息」消失，新增「项目负责人」行（UserNameWithCard，空值显示"未指派"）
7. 右侧字段顺序：状态/优先级 → 归属部门 / 项目负责人 / 创建者 / 期望上线日期 → 关联工作空间 / 所属项目（只读） → 创建/更新时间

