# 开发规范文档

## 1. 目录结构规范

项目采用模块化目录结构，按功能中心组织：

```
src/
├── api/                       # API 定义和类型
│   └── process.ts             # 自动化流程 API
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

### 1.1 API 文件夹规范

`src/api/` 目录存放后端 API 定义文件：

- **文件来源**：API 定义文件由后端自动生成，前端直接使用
- **类型复用**：组件应直接导入 API 文件中的类型，不需要重复定义
- **Mock 数据**：开发阶段的 Mock 数据应参考 API 类型生成
- **扩展类型**：如需前端特有字段，使用 `extends` 或 `Omit/Pick` 扩展 API 类型

```tsx
// 推荐 - 导入并扩展 API 类型
import type { LYProcessResponse, GetProcessesParams } from '@/api/process';

interface ProcessItem extends Omit<LYProcessResponse, 'creator_id'> {
  // 前端扩展字段
  creator: { name: string; avatar: string };
}

// 不推荐 - 重复定义类型
interface ProcessItem {
  id: string;
  name: string;
  // ...
}
```

### 1.2 组件文件夹结构规范

**每个组件/Hook 必须使用独立文件夹**，包含 `index.tsx` 和 `index.less`：

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout/
│   │   │   ├── index.tsx     # 组件入口
│   │   │   └── index.less    # 组件样式
│   │   └── Sidebar/
│   │       ├── index.tsx
│   │       └── index.less
│   └── icons/
│       └── HomeIcon/
│           └── index.tsx     # 纯图标组件可省略 less
├── pages/
│   └── Development/
│       └── ProcessDevelopment/
│           ├── index.tsx
│           ├── index.less
│           ├── components/
│           │   ├── CreateProcessModal/
│           │   │   ├── index.tsx
│           │   │   └── index.less
│           │   └── ProcessDetailDrawer/
│           │       ├── index.tsx
│           │       └── index.less
│           └── hooks/
│               └── useOpenProcess/
│                   ├── index.tsx
│                   └── index.less
```

**命名规范**：
- 文件夹名使用 PascalCase（如 `CreateProcessModal`）
- 入口文件固定为 `index.tsx`
- 样式文件固定为 `index.less`
- 导入时使用文件夹路径（如 `./components/CreateProcessModal`）

```tsx
// ✅ 推荐
import CreateProcessModal from './components/CreateProcessModal';
import { useOpenProcess } from './hooks/useOpenProcess';

// ❌ 不推荐 - 直接文件名
import CreateProcessModal from './components/CreateProcessModal.tsx';
```

**注意：不使用 index.ts 桶文件（barrel files），直接引入具体文件夹。**

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

**使用层级嵌套避免样式冲突**：

- **禁止使用 `&-` 连字符拼接**：容易产生一级类名，导致全局样式冲突
- **推荐使用嵌套子类**：使用 `.parent .child` 结构确保样式隔离
- 顶层类名应具有模块唯一性，如 `.create-process-modal`、`.worker-detail-drawer`

```less
// ✅ 推荐 - 层级嵌套
.create-process-modal {
  .modal-form {
    padding-top: 4px;

    .select-full {
      width: 100%;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

// ❌ 不推荐 - 使用 &- 拼接产生平级类名
.create-process-modal {
  &-form {
    padding-top: 4px;
  }

  &-select-full {
    width: 100%;
  }

  &-footer {
    display: flex;
  }
}
```

**说明**：
- `&-form` 编译后为 `.create-process-modal-form`，是独立的一级选择器
- `.modal-form` 嵌套在父级下，编译后为 `.create-process-modal .modal-form`，具有层级隔离

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

### 2.5 优先使用 Semi UI 组件布局

**布局优先级**：优先使用 Semi UI 提供的布局组件，而非自定义 CSS：

1. **栅格系统**：使用 `Row` 和 `Col` 组件进行响应式布局
2. **间距组件**：使用 `Space` 组件处理元素间距
3. **Flex 布局**：仅在组件不满足需求时使用 CSS flexbox

```tsx
// 推荐 - 使用 Semi UI 组件
import { Row, Col, Space } from '@douyinfe/semi-ui';

<Row type="flex" justify="space-between" align="middle">
  <Col>
    <Space>
      <Input prefix={<IconSearch />} placeholder="搜索" />
      <Button icon={<IconFilter />}>筛选</Button>
    </Space>
  </Col>
  <Col>
    <Button theme="solid" type="primary">新建</Button>
  </Col>
</Row>

// 不推荐 - 使用自定义 CSS
<div className="toolbar">
  <div className="toolbar-left">...</div>
  <div className="toolbar-right">...</div>
</div>
```

**Less 文件同步原则**：
- 当使用 Semi UI 组件替代 CSS 布局时，必须同步删除 Less 文件中对应的冗余样式代码
- 保留必要的间距、边距等无法由组件处理的样式
- 在 Less 文件中添加注释说明布局由组件处理

```less
// 示例：布局已由 Semi UI 组件处理
&-toolbar {
  margin-bottom: 16px;
  // 布局使用 Semi UI Row/Col/Space 组件，不在此定义
}
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

## 5. 路由规范

### 5.1 路由配置

- 路由配置集中在 `src/router/index.tsx` 中
- 使用 `react-router-dom`
- 支持多级嵌套结构
- 每个路由需配置 `meta.title` 用于面包屑

```typescript
// 路由配置示例
const routes: AppRouteObject[] = [
  {
    path: '/dev',
    meta: { title: '开发中心' },
    element: <Outlet />,
    children: [
      {
        path: 'task-mgmt',
        meta: { title: '开发任务管理' },
        element: <Outlet />,
        children: [
          {
            path: 'process-development',
            element: <ProcessDevelopment />,
            meta: { title: '自动化流程' },
          }
        ],
      }
    ],
  }
];
```

### 5.2 路由渲染

- 路由渲染组件在 `src/router/Routers.tsx`
- 使用递归方式渲染嵌套路由
- 布局组件 `AppLayout` 包裹所有页面

### 5.3 面包屑

- 面包屑由 `AppLayout` 组件统一处理
- 根据路由配置的 `meta.title` 自动生成
- 页面组件内**不再单独处理面包屑**
- 面包屑生成逻辑在 `src/router/utils.ts`

---

## 6. 页面布局规范

### 6.1 标准页面结构

所有页面遵循统一布局模式：
- 固定头部：标题 + 操作按钮（面包屑由Layout处理）
- 可滚动内容区：数据表格

```tsx
<div className="module-name">
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

### 6.2 表格规范

- 使用 Semi UI Table 组件内置分页功能
- 不单独使用 Pagination 组件
- 通过 `scroll` 属性控制表格滚动
- 使用 `loading` 属性显示加载状态（不使用骨架屏）

---

## 7. 国际化规范

### 7.1 配置

- 使用 `react-i18next` 和 `i18next-http-backend`
- 语言文件放在 `public/i18n/{{lng}}.json`

### 7.2 使用方式

```typescript
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t } = useTranslation();
  return <span>{t('common.save')}</span>;
};
```

## 8. 其他约定

### 8.1 目录结构

```
src/
├── router/                    # 路由配置
│   ├── index.tsx              # 路由定义
│   ├── Routers.tsx            # 路由渲染组件
│   └── utils.ts               # 路由工具函数（面包屑生成等）
├── components/
│   └── layout/
│       └── AppLayout.tsx      # 布局组件（含面包屑）
└── pages/                     # 页面组件（不含面包屑）
```

### 8.2 状态管理

- 使用 `@tanstack/react-query` 进行数据获取
- 组件内状态使用 `useState`
- 复杂状态逻辑抽取到自定义 hooks

### 8.3 开发原则

- 严格按照设计稿还原
- 不添加设计稿中没有的功能或菜单
- 视觉样式修改需确认后再执行

---

## 9. 代码格式化规范

项目使用 Prettier 进行代码格式化，配置文件位于项目根目录 `.prettierrc`。

### 9.1 Prettier 配置

```json
{
  "semi": true,              // 使用分号
  "singleQuote": true,       // 使用单引号
  "tabWidth": 4,             // 缩进宽度 4 空格
  "trailingComma": "es5",    // ES5 兼容的尾逗号
  "printWidth": 160,         // 每行最大 160 字符
  "bracketSpacing": true,    // 对象括号内空格
  "arrowParens": "avoid",    // 箭头函数单参数不加括号
  "endOfLine": "auto"        // 自动换行符
}
```

### 9.2 格式化忽略

`.prettierignore` 配置忽略的文件：

```
# Lock files
package-lock.json
pnpm-lock.yaml
yarn.lock
```

### 9.3 代码示例

```tsx
// 遵循 Prettier 配置的代码风格
import { useState, useCallback, useMemo } from 'react';
import { Button, Table, Modal, Form, Input, Select, Space, Row, Col, Typography } from '@douyinfe/semi-ui';

const Component = () => {
    const [visible, setVisible] = useState(false);
    const [data, setData] = useState<DataItem[]>([]);

    const handleSubmit = useCallback(values => {
        console.log('提交数据:', values);
        setVisible(false);
    }, []);

    const columns = useMemo(
        () => [
            { title: '名称', dataIndex: 'name', key: 'name' },
            { title: '状态', dataIndex: 'status', key: 'status' },
        ],
        []
    );

    return (
        <div className="component-container">
            <Button onClick={() => setVisible(true)}>打开</Button>
            <Table columns={columns} dataSource={data} />
        </div>
    );
};
```
