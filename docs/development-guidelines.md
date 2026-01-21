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

**必须使用嵌套的类结构（.parent .child）而不是 BEM 连接符（&-modifier）**，以避免全局样式污染：

```less
// ✅ 正确 - 使用嵌套
.sidebar {
  display: flex;
  height: 100%;

  .sidebar-icon-bar {
    width: 60px;
    display: flex;
    flex-direction: column;

    &.with-border {
      border-right: 1px solid var(--semi-color-border);
    }
  }

  .sidebar-menu-item {
    margin-bottom: 4px;

    .sidebar-menu-content {
      display: flex;
      cursor: pointer;

      &.selected {
        background-color: var(--semi-color-primary-light-default);
      }
    }
  }
}

// ❌ 错误 - 不使用 BEM 连接符
.sidebar {
  &-icon-bar { ... }  // 错误：会生成 .sidebar-icon-bar（单层）
  &-menu-item { ... } // 这种方式容易造成全局冲突
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
    {/* 操作栏使用 Semi UI 栅格布局 */}
    <Row type="flex" justify="space-between" align="middle" className="module-name-header-toolbar">
      <Col>
        <Input prefix={<IconSearch />} />
      </Col>
      <Col>
        <Space>
          <Button>操作1</Button>
          <Button>操作2</Button>
        </Space>
      </Col>
    </Row>
  </div>
  
  <div className="module-name-table">
    <Table scroll={{ y: 'calc(100vh - 320px)' }} />
  </div>
</div>
```

### 5.2 栅格布局规范（重要）

**所有操作栏、工具栏布局必须使用 Semi UI 栅格组件（Row、Col、Space），禁止使用 CSS flex 布局**：

```tsx
// ✅ 正确 - 使用 Semi UI 栅格组件
import { Row, Col, Space } from '@douyinfe/semi-ui';

<Row type="flex" justify="space-between" align="middle">
  <Col>
    <Space>
      <Input prefix={<IconSearch />} />
      <Button icon={<IconFilter />}>筛选</Button>
    </Space>
  </Col>
  <Col>
    <Button icon={<IconPlus />} theme="solid" type="primary">新建</Button>
  </Col>
</Row>

// ❌ 错误 - 不使用 CSS flex 布局
<div className="toolbar">
  <div className="search">...</div>
  <div className="actions">...</div>
</div>

// Less 中也不应该有这样的样式：
.toolbar {
  display: flex;           // ❌ 错误
  justify-content: space-between;  // ❌ 错误
}
```

**Space 组件用法**：
- 默认间距：`<Space>` 用于普通按钮组
- 自定义间距：`<Space spacing={4}>` 用于图标按钮组（如抽屉操作按钮）

### 5.3 表格规范

- 使用 Semi UI Table 组件内置分页功能
- 不单独使用 Pagination 组件
- 通过 `scroll` 属性控制表格滚动
- 使用 `loading` 属性显示加载状态（不使用骨架屏）

### 5.4 表格分页数据规范（重要）

**所有表格的分页信息必须直接使用接口返回的响应数据，禁止新增独立的 state 值来维护分页信息：**

```tsx
// ✅ 正确 - 直接使用接口返回的 LYListResponse 类型
import type { LYListResponseLYProcessResponse } from '@/api';

const [listResponse, setListResponse] = useState<LYListResponseLYProcessResponse>({
  range: { offset: 0, size: 20, total: 0 },
  list: [],
});

// 从响应中直接获取分页信息
const { range, list } = listResponse;
const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
const pageSize = range?.size || 20;
const total = range?.total || 0;

// 数据加载直接设置完整响应
const loadData = async () => {
  const response = await fetchData(queryParams);
  setListResponse(response);
};

// Table 分页配置
<Table
  dataSource={list}
  pagination={{
    total,
    pageSize,
    currentPage,
    onPageChange: (page) => {
      setQueryParams((prev) => ({ ...prev, offset: (page - 1) * pageSize }));
    },
  }}
/>

// ❌ 错误 - 不单独维护分页 state
const [data, setData] = useState<DataItem[]>([]);
const [rangeInfo, setRangeInfo] = useState({ offset: 0, size: 20, total: 0 }); // 禁止
const [pagination, setPagination] = useState({ page: 1, total: 0 }); // 禁止
```

**规范说明：**
- 接口返回的 `LYListResponse` 类型包含 `range`（分页信息）和 `list`（数据列表）
- 只需维护一个 state 存储完整的接口响应
- 分页信息通过解构从响应中获取，无需额外 state
- 这样可以确保数据与分页信息始终同步，避免状态不一致

### 5.5 删除确认弹窗规范（重要）

**所有删除操作必须使用 `Modal.confirm` + `Toast` 组合，禁止创建单独的删除弹窗组件：**

```tsx
import { Modal, Toast } from '@douyinfe/semi-ui';
import { IconDeleteStroked } from '@douyinfe/semi-icons';

// ✅ 正确 - 使用 Modal.confirm
const handleDeleteClick = (item: ItemData) => {
  Modal.confirm({
    title: t('module.deleteModal.title'),
    icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
    content: (
      <>
        <div>{t('module.deleteModal.confirmMessage', { name: item.name })}</div>
        <div style={{ color: 'var(--semi-color-text-2)', marginTop: 8 }}>
          {t('module.deleteModal.deleteWarning')}
        </div>
      </>
    ),
    okText: t('module.deleteModal.confirmDelete'),
    cancelText: t('common.cancel'),
    okButtonProps: { type: 'danger' },
    onOk: async () => {
      try {
        // 执行删除 API 调用
        await deleteItem(item.id);
        
        // 重新加载数据
        loadData();
        
        // 显示成功提示
        Toast.success(t('module.deleteModal.success'));
      } catch (error) {
        // 显示错误提示
        Toast.error(t('module.deleteModal.error'));
        throw error;
      }
    },
  });
};

// ❌ 错误 - 不创建单独的删除弹窗组件
// components/DeleteModal/index.tsx  ← 禁止
```

**删除前置校验（如有未完成任务等）：**

```tsx
const handleDeleteClick = (item: ItemData) => {
  // 检查是否可删除
  if (item.status === 'BUSY') {
    Modal.warning({
      title: t('module.deleteModal.cannotDelete'),
      content: t('module.deleteModal.hasPendingTasks'),
      okText: t('common.confirm'),
    });
    return;
  }

  // 正常删除流程
  Modal.confirm({ ... });
};
```

**i18n 词条结构：**

```json
{
  "module": {
    "deleteModal": {
      "title": "删除确认",
      "confirmMessage": "确定要删除「{{name}}」吗？",
      "deleteWarning": "删除后将无法恢复。",
      "cannotDelete": "无法删除",
      "hasPendingTasks": "当前有未完成任务，请稍后再试。",
      "confirmDelete": "确认删除",
      "success": "删除成功！",
      "error": "删除失败，请重试"
    }
  }
}
```

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
