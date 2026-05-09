## 目标
在调度中心 `/scheduling/credentials` 凭据模块新增「分配值（ASSIGNED_VALUE）」凭据类型，包含创建、单条管理、批量导入全流程；所有功能仅在 `context='scheduling'` 时可见，不影响开发中心。数据全部 mock。

## 范围
- STORY-024-001（分配值类型管理）+ STORY-024-002（批量导入）完整实现
- 仅作用于 `CredentialManagementContent`（共享组件）的 scheduling 分支

## 技术改动清单

### 1. 类型与配置扩展
- `src/api/index.ts`：`CredentialType` 增加 `'ASSIGNED_VALUE'`
- `CredentialManagementContent/index.tsx` 与 `CredentialDetailDrawer/index.tsx` 的 `typeConfig` 增加 `ASSIGNED_VALUE`（橙色 tag，i18n key `credential.type.assignedValue`）
- `typeFilterOptions` 增加分配值选项

### 2. 列表页（`CredentialManagementContent/index.tsx`）
- mock 生成器追加若干 ASSIGNED_VALUE 示例
- 工具栏「新建」按钮：`context==='scheduling'` 时也显示（当前仅 development 显示，需放开以满足"全部功能仅在调度中心"）；development 下保持原行为
- 操作列：当 `context==='scheduling'` 且 `record.credential_type==='ASSIGNED_VALUE'` 时新增「导入」菜单项（Lucide `Upload` 图标），点击打开 `ImportAssignedValueModal`

### 3. 创建/编辑凭据 Modal（仅 scheduling）
- `CreateCredentialModal`：`context==='scheduling'` 时 `typeOptions` 新增「分配值」；选中后表单切换：
  - 隐藏「关联个人凭据」相关字段（本就无）
  - `Form.Slot value` 标题文案改为"生产值（运行时未匹配的回退值）"，仅展示 username/password 两项（不展示测试值）
  - 其他字段（名称/部门/工作空间/Owner/描述）保持
- `EditCredentialModal`：类型字段恒置灰（已有行为），分配值类型时同样隐藏测试值

### 4. 详情抽屉新增「分配值」Tab
- 新文件 `CredentialManagementContent/components/CredentialDetailDrawer/AssignedValuesTab/index.tsx`（+ `index.less`）
- 仅当 `context==='scheduling' && credential.credential_type==='ASSIGNED_VALUE'` 时在 `CredentialDetailDrawer` 渲染该 TabPane（位于「基本信息」与「使用记录」之间）
- 内容：
  - 顶部：`共 N 条分配值`（左）；右侧 `[导入] [+ 新增]` 两个按钮
  - 表格列：用户（UserNameWithCard）、账号、密码（固定 ******）、描述、操作（编辑 / 删除）
  - 空态：`EmptyState variant="noData"`，文案「暂无分配值，请新增或批量导入」
  - 分页 size=20，沿用 `.list-pagination` 规范
- mock 存储：模块级 `Map<credentialId, AssignedValue[]>`，由抽屉操作读写并触发刷新

### 5. 新增/编辑分配值 Modal
- `CredentialDetailDrawer/AssignedValueFormModal/index.tsx`
- 520px Modal；字段：
  - 用户（`OwnerSearchSelect` 仅可选用户叶子，必填，编辑时置灰）
  - 账号（必填）
  - 密码（必填；编辑时占位"留空表示保持原值"，可空）
  - 描述（选填）
- 校验：必填校验 + 同凭据下 user_id 唯一（手动新增重复则 Toast.error "该用户已存在分配值映射"）

### 6. 批量导入 Modal
- `CredentialManagementContent/components/ImportAssignedValueModal/index.tsx`（与 `ImportResultModal/index.tsx` 同目录）
- 上半区：`[下载分配值批量导入模板]` 按钮 → 调用前端用 `xlsx` 库（已在依赖中或退而用 Blob CSV/简单 xml 模拟）生成"分配值批量导入模板.xlsx"，列：username/account/password/description；若 `xlsx` 未装则触发下载一个静态 Base64 占位 xlsx
- 提示文案五条（按文档）
- 下半区：拖拽/点击上传（仅 .xlsx，<=5MB），上传后显示文件名
- 底部按钮：取消 / 导入（loading）
- 「导入」点击：mock 解析（不真正解析 Excel，按 mock 逻辑生成结果），随机 30 行结果含 created/updated/skipped/failed 四种 sub_status，写入 mock 存储

### 7. 导入结果 Modal
- `ImportResultModal/index.tsx`：520→680px Modal
- 顶部 6 列摘要卡（导入总数 / 成功 / 新建 / 更新 / 跳过 / 解析失败）
- 下方表格：行号 / 用户名 / 状态（Tag：成功-绿、失败-红、跳过-灰）/ 子状态 / 原因
- 单按钮「确定」，关闭后刷新分配值列表

### 8. 模板下载实现
- 检查 `package.json` 是否有 `xlsx`；无则用 `SheetJS` 的 `XLSX` (若可) 或退化为下载预先 base64 内联的最小 xlsx 文件（在新文件 `assets/assignedValueImportTemplate.ts` 提供 base64 数据）

### 9. i18n
- `public/i18n/zh-CN.json` & `en.json` 新增：
  - `credential.type.assignedValue`
  - `credential.actions.import`
  - `credential.assignedValue.*`（tab 标题、空态、按钮、列名、提示、密码占位、删除确认、错误文案）
  - `credential.import.*`（弹窗标题、提示、文件大小/格式错误、模板下载按钮、导入按钮、结果摘要列名、状态标签、关闭按钮）

### 10. 视觉与规范
- 遵循 mem 中已存约束：520px Modal、`.list-pagination`、Lucide 图标 stroke 2、Toast 浅色、Form blur/change 校验、空态居中
- 列表/Tab 文案均不出现现有"测试值"列错位

## 不在范围
- 真正的 Excel 解析与 SM4 加密（mock 不实现）
- 运行时凭据获取流程（前端无运行时）
- 开发中心相关变化（保持原状）
- 个人凭据/固定值流程不动

## 验收要点
1. 调度中心凭据列表存在分配值类型记录，操作下拉含「导入」
2. 新建凭据下拉含「分配值」，选中后表单切换为分配值模式
3. 分配值类型详情抽屉出现「分配值」Tab，可增删改、可分页
4. 「导入」对话框可下载模板、上传 .xlsx、点击导入后显示结果弹窗
5. 关闭结果弹窗后分配值列表自动刷新
6. 开发中心 `/development/credentials` 不出现以上任何新增 UI