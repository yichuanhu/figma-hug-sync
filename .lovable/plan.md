

## 核查结论

查阅文档 `requirement-center-design-5.md` 与 `story-003-RC-REQ-CREATE-4.md`，关于「优先级」的归属：

- 文档中 `priority` 属于 **system_fields（系统预定义字段）**，与 `title`、`department_id`、`owner_id` 同级，不属于自定义评估字段。
- 但文档同时强调：需求收集表单按 Scheme 渲染，系统字段与自定义字段融合展示，**未明确把 priority 划入"基本信息"分组**。基本信息（Basic Info）按业界惯例通常指「标识 + 归属」类字段（标题、部门、负责人、联系方式），而 priority 属于「评估/管理属性」。
- 参考文档 §6 的表单分组示例：`基本信息（标题/部门/负责人）` → `业务背景` → `评估属性（优先级/期望上线日期/标签）` → `附件`。

## 结论

文档**没有**把"优先级"放在"基本信息"里。您的判断与文档一致。

## 调整方案

延续上一轮的拆分思路，但更贴合文档：

- **基本信息**（3 项）：标题、所属部门、需求负责人
- **需求详情**（Scheme 驱动 + 评估属性）：
  - 顶部插入"优先级"（系统字段，medium 宽度）
  - 其后渲染当前激活方案的所有自定义字段

### 改动文件
`src/pages/Requirements/RequirementsWorkbench/components/RequirementFormModal/index.tsx`

- 从「基本信息」grid 中删除 `Form.Select field="priority"`
- 在「需求详情」section 标题之后、`SchemeFieldsRenderer` 之前插入 `priority` Select（`scheme-field-w-medium`）
- 当 Scheme 没有自定义字段时，仍然渲染「需求详情」区块以承载 priority

### 验收
1. 「基本信息」仅 3 项：标题、所属部门、需求负责人
2. 「需求详情」第一项为「优先级」，其后才是业务背景等 Scheme 字段
3. 提交/编辑时 priority 仍正确写入

