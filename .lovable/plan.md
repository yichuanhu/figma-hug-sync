

## 调整：方案上传改为「上传 YAML 文件」

### 需求依据
文档 §3.2 明确："第一期：cost_config（含 rate_table）通过 YAML 文件离线配置，由实施人员在部署时根据客户实际情况编写，客户如需调整费率也由实施人员协助修改 YAML 后**重新上传 Scheme**"。Scheme 完整结构（meta / form / cost_config / assessment / workflow）也是 YAML 文件，因此 UI 应是**文件上传**，而非文本粘贴。

### 当前实现差距
`src/pages/Requirements/RequirementsScheme/index.tsx` 上传弹窗使用 `TextArea` 让用户粘贴 YAML 文本。需改为标准的拖拽/点选 `.yaml`/`.yml` 文件上传交互。

---

## 实施方案（单次提交）

### 改动 1：上传弹窗改为文件上传
文件：`src/pages/Requirements/RequirementsScheme/index.tsx`

- 移除 `TextArea` + 直接粘贴 YAML 的交互
- 引入 Semi UI `Upload`（`draggable`，`accept=".yaml,.yml"`，`limit=1`）
  - 视觉遵循 [Upload Modal 标准 v3]：Lucide `Inbox` 图标（size=36, strokeWidth=2），隐藏原生文件列表，自定义已选文件展示（文件名 + 大小 + 移除按钮）
- 选中文件后用 `FileReader.readAsText()` 读取内容，仍走 `parseSchemeYaml(text)` 解析
- 校验：
  - 仅允许 `.yaml` / `.yml`，超过 1MB 拒绝并 Toast
  - 解析失败：错误列表展示在已选文件下方（保留现有 `parseErrors` 渲染样式）
- 「解析并创建」按钮：仅当文件已选且解析无致命错误时可点击；点击时再次解析并 `addScheme`
- 关闭弹窗时清空已选文件和错误

### 改动 2：i18n 文案补齐
文件：`public/i18n/zh-CN.json`、`public/i18n/en.json`

- `requirements.scheme.uploadDragHint`：「点击或拖拽 YAML 文件到此区域上传」/ "Click or drag a YAML file here to upload"
- `requirements.scheme.uploadFileTypeHint`：「仅支持 .yaml / .yml 格式，单文件不超过 1MB」
- `requirements.scheme.uploadFileTypeError`：「仅支持 .yaml 或 .yml 文件」
- `requirements.scheme.uploadFileTooLarge`：「文件大小不能超过 1MB」
- 弹窗副标题 `uploadHint` 改为引导性文案（说明 YAML 需包含 meta / custom_fields / assessment_models / approval_flow / cost_config 等节点）
- 移除/不再使用粘贴示例 placeholder

### 不改动
- `parseSchemeYaml`：解析逻辑无需变化（仍接收字符串）
- `cost_config` 类型与 `RPA-PRO` 预设：本次仅调整上传交互；类型与文档对齐（`rate_table` 数组化、`default_rate` 等）作为后续单独需求处理
- `ManageLinkedProcessesModal` 等其他模块

---

## 影响面

| 文件 | 改动 |
|---|---|
| `src/pages/Requirements/RequirementsScheme/index.tsx` | 上传弹窗：TextArea → Upload（拖拽/点选 YAML） |
| `public/i18n/zh-CN.json` / `en.json` | 新增 4 条上传相关文案，调整 `uploadHint` |

---

## 验证清单
1. 进入「需求中心 → 方案管理」点「上传方案」，弹窗显示 Inbox 拖拽区
2. 拖入 `.txt` 文件 → Toast 报错；拖入 >1MB `.yaml` → Toast 报错
3. 拖入合法 YAML 文件 → 显示文件名 + 大小 + ×；点「解析并创建」 → 成功 Toast，方案出现在列表
4. 拖入语法错误 YAML → 错误列表显示行号
5. 关闭重开弹窗 → 状态已清空

