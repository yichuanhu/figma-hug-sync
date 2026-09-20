# 公有云板块（Cloud）

本目录存放**公有云（SaaS）**相关的全部代码，与现有私有部署代码完全隔离：

- 独立路由入口：`/cloud/*`（在 `src/App.tsx` 中仅挂载一个 `CloudApp`）
- 独立布局：`src/cloud/layout/CloudLayout`（业务代码隔离，视觉规范与当前 APA 项目保持一致）
- 独立 Mock 数据与类型：`src/cloud/mock`、`src/cloud/types.ts`
- 页面样式与页面或布局同目录维护

约束：

1. 公有云代码**只允许**引用通用基础设施（Semi UI、lucide-react、react-router、i18n），
   不得 import `src/pages/**`、`src/components/**` 中的私有部署业务组件。
2. 私有部署代码同样不得 import `src/cloud/**`。
3. 仅复用视觉设计风格（圆角、卡片、间距、Semi 主题变量）。

目录结构：

```
src/cloud/
  index.tsx          # CloudApp：公有云内部路由
  types.ts           # 公有云领域模型
  mock/              # Mock 数据
  layout/CloudLayout # APA 风格侧边栏 + 页面容器
  pages/
    CloudHome/       # 首页（概览、我的产品、最近收支、团队空间）
    TeamManagement/  # 团队管理（拥有的团队、成员、邀请、加入的团队）
    Billing/         # 费用与资源（积分中心 / 资源包 / 套餐与订阅）
```
