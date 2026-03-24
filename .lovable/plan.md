

# 共享中心（Sharing Center）前端设计方案（修订）

## 修订内容

1. Creator 组件页面使用**顶部水平 Tab**
2. **所有 Mock 数据（业务内容）使用英文**，UI 标签通过 i18n 翻译

## 侧边栏菜单结构

```text
共享中心
├─ 可执行组件          (分组标题)
│  └─ Creator 组件     → /sharing/components/creator
├─ AI Skills           (分组标题)
│  ├─ APA Skills       → /sharing/skills/apa
│  └─ ACP Skills       → /sharing/skills/acp
└─ 案例展示            (分组标题)
   └─ 案例列表         → /sharing/showcases
```

## Creator 组件页面布局

Semi UI `Tabs`（顶部）+ `keepDOM={false}`，三个 Tab：Commands、API Connectors、Custom Components。

```text
┌─────────────────────────────────────────────┐
│  Creator 组件                                │
├─────────────────────────────────────────────┤
│  [Commands]  [API Connectors]  [Custom]      │
├─────────────────────────────────────────────┤
│  [Search] [Filter] [Sort]                    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ Card │ │ Card │ │ Card │ │ Card │       │
│  └──────┘ └──────┘ └──────┘ └──────┘       │
└─────────────────────────────────────────────┘
```

## Mock 数据规范

所有业务 Mock 数据使用英文，示例：

- 组件名：`"Invoice Auto-Recognition"`, `"SAP Data Connector"`, `"PDF Parser Widget"`
- 技能名：`"Email Classification"`, `"Document Extraction"`
- 案例名：`"Finance Month-End Closing Automation"`, `"Order Processing Pipeline"`
- 部门名：`"Finance"`, `"Operations"`, `"Human Resources"`
- 标签：`["finance", "invoice", "OCR"]`
- 描述：`"Automatically recognizes and extracts invoice data from scanned documents"`

UI 标签（Tab 名称、筛选标签、列标题等）通过 i18n 提供中英文翻译。

## 改动文件清单

| 文件 | 改动 |
|------|------|
| `src/assets/icons/sharing.svg` | 新增：共享中心图标 |
| `src/components/layout/Sidebar/index.tsx` | 修改：添加共享中心菜单项和路由匹配 |
| `src/App.tsx` | 修改：注册路由（/sharing redirect + 4 页面） |
| `public/i18n/zh-CN.json` | 修改：添加共享中心相关翻译 |
| `public/i18n/en.json` | 修改：对应英文翻译 |
| `src/pages/Sharing/Components/CreatorComponents/index.tsx` | 新增：顶部 Tab 页面 |
| `src/pages/Sharing/Components/CreatorComponents/index.less` | 新增：样式 |
| `src/pages/Sharing/Components/CreatorComponents/types.ts` | 新增：数据类型 |
| `src/pages/Sharing/Components/CreatorComponents/mockData.ts` | 新增：英文 Mock 数据 |
| `src/pages/Sharing/Components/components/ComponentCard/` | 新增：组件卡片 |
| `src/pages/Sharing/Skills/APASkills/` | 新增：APA Skills 列表页（英文 Mock） |
| `src/pages/Sharing/Skills/ACPSkills/` | 新增：ACP Skills 列表页（英文 Mock） |
| `src/pages/Sharing/Skills/components/SkillCard/` | 新增：Skill 卡片 |
| `src/pages/Sharing/Showcases/` | 新增：案例展示列表页（英文 Mock） |

## 实施步骤

1. **导航集成**：图标 + 侧边栏菜单 + 路由 + i18n
2. **Creator 组件页面**：顶部 Tab 三面板 + 组件卡片 + 英文 Mock 数据
3. **Skills 页面**：APA Skills + ACP Skills（英文 Mock）
4. **案例展示页面**（英文 Mock）

