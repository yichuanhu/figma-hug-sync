

## 计划：概览 Tab 重排 + 右侧属性面板精简（修订版）

### 背景澄清
「业务背景」「附件」均属于 scheme 定义的自定义字段（`business_context` / `attachments` 等 key），不再作为独立硬编码区块；统一由「需求详情」区块通过 `ReadonlySchemeFieldsRenderer` 按 scheme 顺序渲染。

### A. 概览 Tab 内容重排

**新顺序（自上而下）：**
```text
1. 需求详情（Schema 自定义字段渲染区，含业务背景/附件等所有 scheme 字段）
2. 审批流程
3. 活动记录
```

**变更要点：**
- **删除「描述」区块**
- **删除独立的「业务背景」区块**（迁入需求详情）
- **删除独立的「附件」区块**（迁入需求详情）
- **「需求详情」置顶**：复用 `ReadonlySchemeFieldsRenderer`，传 `showEmpty={true}` 完整呈现 scheme 结构
  - 标题文案：「需求详情」/「Requirement Details」
  - 无 scheme 或字段为空时显示空状态「暂无需求详情」
- **「审批流程」紧接其后**，位于活动记录之前

### B. ReadonlySchemeFieldsRenderer 增强

为支持业务背景（长文本）、附件（文件列表）等字段类型在只读视图中正确渲染，需补充：
- `textarea` / `rich_text`：多行展示，保留换行；超长时使用 `ExpandableText` 截断 3 行
- `file_upload` / `attachments`：文件列表展示（文件名 + 大小 + 下载链接，使用 Lucide `Paperclip` 图标）
- `date` / `date-range`：按当前 locale 格式化（dayjs）
- 现有 text/number/percentage/select/multi-select/radio/checkbox/boolean 保持不变
- 长文本字段（textarea/rich_text/attachments）单独占整行宽度，不与短字段并排

### C. Mock 数据补强

调整 2-3 个代表性 mock 需求（如 `REQ-2026-0038`）的 `form_data` + 对应 `PRESET_SCHEMES` 定义：
- 将原硬编码的 `business_context`、`attachments` 数据迁移到 scheme 的 `custom_fields` 中
- 补全字段类型样例：text / textarea / number / percentage / select / multi-select / radio / checkbox / date / boolean / file_upload，确保「需求详情」可视化覆盖所有类型

### D. 右侧属性面板调整

- **删除「期望上线日期」字段行**（非 §4.1 系统固定字段）
- 删除后字段顺序：
```text
[ 状态 ]   [ 优先级 ]
─────────────────────────
归属部门         Finance
项目负责人        张三 (UserNameWithCard)
创建者           John Smith (UserNameWithCard)
─────────────────────────
关联工作空间      财务自动化空间（只读）
所属项目         数字化项目（灰字，继承）
─────────────────────────
创建时间 / 更新时间
─────────────────────────
[草稿态：提交审批] / [审批进度区]
```
- 编辑/创建表单保持不变，仅详情属性面板隐藏「期望上线日期」

### 改动文件
- `RequirementDetailDrawer/index.tsx`
  - overview Tab：删除「描述」「业务背景」「附件」三个独立区块；将「需求详情」置顶并 `showEmpty={true}`；审批流程 → 活动记录
  - PropertyPanel：删除「期望上线日期」行
- `ReadonlySchemeFieldsRenderer/index.tsx` + `index.less`
  - 补充 textarea/rich_text/file_upload/date 的格式化与样式
  - 长文本类字段强制占整行
- `mockData.ts` + `PRESET_SCHEMES`
  - 将 business_context/attachments 迁入 scheme custom_fields
  - 扩充字段类型样例覆盖
- `public/i18n/zh-CN.json` / `en.json`
  - `customFieldsTitle` 文案改为「需求详情」/「Requirement Details」
  - 新增空态文案 `customFieldsEmpty`

### 验收
1. 概览 Tab 自上而下顺序为：需求详情 → 审批流程 → 活动记录（仅 3 大区块）
2. 「描述」「业务背景」「附件」不再作为独立区块；业务背景与附件作为 scheme 字段在「需求详情」中按定义顺序展示
3. 「需求详情」覆盖所有字段类型样例（含长文本与文件列表，渲染正确）
4. 右侧属性面板不再显示「期望上线日期」
5. 历史版本只读模式下，上述顺序与字段隐藏逻辑同样生效
6. 方案预览（SchemeDetailDrawer 字段预览 Tab）继续复用增强后的 Renderer，无回归

