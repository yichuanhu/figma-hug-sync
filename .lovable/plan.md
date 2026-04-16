

## 发布流程中依赖缺失的闭环交互（修订版）

### 核心思路

用户的建议非常合理——发布配置页不应重复实现一套缺失资源的处理交互，而是引导用户回到流程详情的「资源依赖」Tab 去处理。这样保持了单一职责：依赖管理统一在流程详情完成，发布页只做校验和拦截。

### 交互设计

**Step 1 — 流程选择阶段**
- 若某流程存在 `status === 'MISSING'` 的依赖，在流程项旁显示橙色 `AlertTriangle` 图标
- 不阻止选择，仅视觉提示

**Step 2 — 发布配置阶段**
- 当聚合后的资源依赖中存在 MISSING 状态时，在「资源依赖」Card 顶部显示警告 Banner
- Banner 文案：「以下流程包含已失效的依赖资源，请先前往处理后再发布」
- Banner 下方列出存在缺失依赖的流程名称，每个流程旁带「前往处理」链接按钮
- 点击「前往处理」→ 导航到该流程的详情页，自动打开抽屉并切换到「资源依赖」Tab（复用已有的 URL 参数机制 `?processId=xxx&tab=dependencies`）
- 底部「确认发布」按钮置灰，hover Tooltip 提示「存在失效依赖资源，无法发布」

**关键优势**
- 依赖处理交互集中在 DependencyTab，无需在发布页重复实现
- 用户处理完后回到发布页，重新进入 Step 2 时会重新聚合依赖，MISSING 状态自然消失

### 修改文件

| 文件 | 修改 |
|------|------|
| `CreateReleasePage/index.tsx` | 聚合依赖时传递 `status`；计算 `hasMissingResources` 禁用提交按钮 |
| `ProcessSelectionStep/index.tsx` | MISSING 依赖的流程显示 AlertTriangle 图标 |
| `ReleaseConfigStep/index.tsx` | 资源依赖 Card 顶部渲染 MISSING Banner + 流程列表 + 「前往处理」按钮 |
| `ReleaseConfigStep/index.less` | Banner 和缺失流程列表样式 |
| `public/i18n/zh-CN.json` | 新增发布缺失相关文案 |
| `public/i18n/en.json` | 对应英文文案 |

### i18n 新增文案

```json
// zh-CN
"release.create.missingDependencyBanner": "以下流程包含已失效的依赖资源，请先前往处理后再发布",
"release.create.goHandleDependency": "前往处理",
"release.create.cannotPublishMissing": "存在失效依赖资源，无法发布",
"release.create.hasMissingDependency": "存在失效依赖"
```

