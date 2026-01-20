# 开发规范文档

## 1. 目录结构规范

项目采用模块化目录结构，按功能中心组织：

```
src/
├── assets/                    # 静态资源（图片、图标等）
│   └── icons/                 # SVG 图标
├── components/                # 公共组件
│   ├── icons/                 # 图标组件
│   └── layout/                # 布局组件
├── i18n/                      # 国际化配置
├── lib/                       # 工具函数
├── pages/                     # 页面模块
│   ├── Development/           # 开发中心
│   │   ├── ProcessDevelopment/
│   │   │   ├── index.tsx      # 主入口
│   │   │   ├── index.less     # 样式文件
│   │   │   ├── components/    # 模块专用组件
│   │   │   └── hooks/         # 模块专用 hooks
│   │   └── DevelopmentWorkbench/
│   ├── Operations/            # 运营中心
│   ├── Scheduling/            # 调度中心
│   ├── Maintenance/           # 运维中心
│   └── Requirements/          # 需求中心
└── styles/                    # 全局样式
    ├── global.less
    ├── pm.less
    └── index.less
```

### 模块文件夹结构

每个模块文件夹应包含：
- `index.tsx` - 主入口文件
- `index.less` - 模块样式文件
- `components/` - 模块专用组件（如有）
- `hooks/` - 模块专用 hooks（如有）

### 组件文件夹规范（重要）

**所有组件必须使用文件夹结构**，不允许使用单独的 `.tsx` 文件：

```
// ✅ 正确 - 组件放在文件夹中
components/
├── CreateProcessModal/
│   ├── index.tsx      # 组件逻辑
│   └── index.less     # 组件样式
├── EditProcessModal/
│   ├── index.tsx
│   └── index.less

// ❌ 错误 - 不允许单独文件
components/
├── CreateProcessModal.tsx
├── EditProcessModal.tsx
```

同样适用于 hooks：
```
hooks/
├── useOpenProcess/
│   ├── index.tsx
│   └── index.less    # 如有样式需求
```

**注意：不使用 index.ts 桶文件（barrel files），直接引入具体文件。**

---

## 2. 样式规范

### 2.1 使用 Less

- 所有样式必须写在 `.less` 文件中
- 组件只能使用 `className` 属性
- **禁止使用内联 `style` 属性**
- **禁止使用 Tailwind CSS**

### 2.2 样式文件命名

- 样式文件与组件同名，放在同一目录下
- 例如：`ProcessDevelopment/index.tsx` 对应 `ProcessDevelopment/index.less`

### 2.3 Less 嵌套规范

使用 BEM 风格命名，结合 Less 嵌套：

```less
.process-development {
  display: flex;
  flex-direction: column;
  
  &-header {
    padding: 20px 24px;
    
    &-title {
      margin-bottom: 24px;
    }
    
    &-toolbar {
      display: flex;
      justify-content: space-between;
    }
  }
  
  &-table {
    flex: 1;
    overflow: hidden;
  }
}
```

### 2.4 使用 Semi Design Token

优先使用 Semi UI 的设计变量：

```less
// 推荐
background-color: var(--semi-color-bg-0);
color: var(--semi-color-text-0);
border-color: var(--semi-color-border);

// 不推荐
background-color: #ffffff;
color: #333333;
```

---

## 3. 导入路径规范

### 3.1 别名路径

- `@` 别名指向 `src` 目录
- 跨模块引用使用 `@` 别名

```typescript
// 跨模块引用 - 使用别名
import AppLayout from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';
```

### 3.2 相对路径

- 同模块内文件使用相对路径

```typescript
// 同模块内 - 使用相对路径
import CreateProcessModal from './components/CreateProcessModal';
import { useOpenProcess } from './hooks/useOpenProcess';
import './index.less';
```

---

## 4. 组件规范

### 4.1 UI 框架

- 使用 `@douyinfe/semi-ui` 作为主要 UI 框架
- 使用 `@semi-bot/semi-theme-laiye` 主题

### 4.2 组件拆分原则

- 保持组件小而专注
- 复杂逻辑抽取到自定义 hooks
- 模态框、抽屉等独立为单独组件

### 4.3 命名规范

- 组件使用 PascalCase：`CreateProcessModal`
- hooks 使用 camelCase 并以 use 开头：`useOpenProcess`
- 样式类名使用 kebab-case：`process-development-header`

---

## 5. 页面布局规范

### 5.1 标准页面结构

所有页面遵循统一布局模式：
- 固定头部：面包屑 + 操作按钮
- 可滚动内容区：数据表格

```tsx
<div className="module-name">
  <div className="module-name-breadcrumb">
    <Breadcrumb />
  </div>
  
  <div className="module-name-header">
    <div className="module-name-header-title">
      <Title />
    </div>
    <div className="module-name-header-toolbar">
      {/* 搜索和操作按钮 */}
    </div>
  </div>
  
  <div className="module-name-table">
    <Table scroll={{ y: 'calc(100vh - 320px)' }} />
  </div>
</div>
```

### 5.2 表格规范

- 使用 Semi UI Table 组件内置分页功能
- 不单独使用 Pagination 组件
- 通过 `scroll` 属性控制表格滚动
- 使用 `loading` 属性显示加载状态（不使用骨架屏）

---

## 6. 国际化规范

### 6.1 配置

- 使用 `react-i18next` 和 `i18next-http-backend`
- 语言文件放在 `public/i18n/{{lng}}.json`

### 6.2 使用方式

```typescript
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t } = useTranslation();
  return <span>{t('common.save')}</span>;
};
```

---

## 7. 其他约定

### 7.1 路由配置

- 路由集中在 `src/App.tsx` 中配置
- 使用 `react-router-dom`

### 7.2 状态管理

- 使用 `@tanstack/react-query` 进行数据获取
- 组件内状态使用 `useState`
- 复杂状态逻辑抽取到自定义 hooks

### 7.3 开发原则

- 严格按照设计稿还原
- 不添加设计稿中没有的功能或菜单
- 视觉样式修改需确认后再执行
