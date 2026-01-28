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

### 4.2 Descriptions 组件规范

**所有 Descriptions 组件必须使用 `align="left"` 属性，确保标签左对齐：**

```tsx
// ✅ 正确 - 添加 align="left"
<Descriptions data={descriptionData} align="left" />

// ❌ 错误 - 缺少 align 属性
<Descriptions data={descriptionData} />
```

### 4.3 组件拆分原则

- 保持组件小而专注
- 复杂逻辑抽取到自定义 hooks
- 模态框、抽屉等独立为单独组件

### 4.4 命名规范

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

## 7. API 类型定义规范

### 7.1 文件位置与职责

API 类型定义集中在 `src/api/index.ts` 文件中：

- **仅包含 TypeScript 接口定义**，不包含任何可执行逻辑
- 该文件会根据后端 API 规范持续更新
- 所有组件必须直接从此文件导入类型定义

```typescript
// src/api/index.ts - 仅类型定义
export interface LYProcessResponse {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  // ...
}

export interface LYListResponse<T> {
  range: LYRangeResponse;
  list: T[];
}

export interface GetProcessesParams {
  keyword?: string;
  offset?: number;
  size?: number;
  sort_by?: string;
}
```

### 7.2 Mock 数据实现规范

**Mock 数据必须在各模块组件内部实现**，严格遵循 API 类型定义：

```typescript
// ✅ 正确 - 在页面组件中生成符合 API 类型的 mock 数据
import type { LYProcessResponse, LYListResponseLYProcessResponse } from '@/api';

const generateMockLYProcessResponse = (index: number): LYProcessResponse => ({
  id: `process-${index}`,
  name: `流程名称 ${index}`,
  description: `流程描述 ${index}`,
  status: 'DRAFT',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  creator_name: '张三',
  // 确保所有字段符合接口定义
});

const fetchProcessList = async (params: GetProcessesParams): Promise<LYListResponseLYProcessResponse> => {
  // 模拟 API 调用，返回符合类型定义的数据
  return {
    range: { offset: params.offset || 0, size: params.size || 20, total: mockData.length },
    list: mockData.slice(offset, offset + size),
  };
};
```

### 7.3 字段命名规范

- API 类型使用 **snake_case** 命名（如 `created_at`、`sync_status`）
- 与后端 API 保持一致
- 组件内部变量可使用 camelCase，但 API 交互必须使用原始字段名

### 7.4 搜索输入框防抖规范（重要）

**所有表格搜索输入框必须使用 lodash 的 debounce 进行防抖处理**，避免频繁触发 API 请求：

```tsx
import { useState, useMemo } from 'react';
import { debounce } from 'lodash';

// ✅ 正确 - 使用 useMemo + debounce
const handleSearch = useMemo(
  () =>
    debounce((value: string) => {
      setQueryParams((prev) => ({ ...prev, offset: 0, keyword: value }));
    }, 500),
  []
);

// 在 Input 组件中使用
<Input
  prefix={<IconSearch />}
  placeholder={t('module.searchPlaceholder')}
  onChange={handleSearch}
  showClear
/>

// ❌ 错误 - 直接触发状态更新
const handleSearch = (keyword: string) => {
  setQueryParams((prev) => ({ ...prev, offset: 0, keyword }));
};
```

**规范说明：**
- 使用 `useMemo` 包装 `debounce` 确保函数引用稳定
- 默认防抖延迟设置为 500ms
- 适用于所有需要实时搜索的输入框场景
- 需安装 lodash 依赖：`lodash` 和 `@types/lodash`

---

## 8. 空状态/缺省状态规范（重要）

**所有页面和组件都必须考虑空状态的展示**，确保用户在各种场景下都有良好的体验：

### 8.1 必须处理的空状态场景

| 场景 | 使用变体 | 示例 |
|------|----------|------|
| 列表无数据 | `noData` | 表格首次加载为空 |
| 搜索/筛选无结果 | `noResult` | 搜索关键词无匹配 |
| 加载失败 | `error` | API 请求失败、网络错误 |
| 无权限访问 | `noAccess` | 用户权限不足 |
| 功能维护中 | `maintenance` | 服务暂时不可用 |
| 资源未找到 | `notFound` | 404 页面、资源不存在 |

### 8.2 使用统一的 EmptyState 组件

```tsx
import EmptyState from '@/components/EmptyState';

// 表格空状态 - 根据是否有搜索条件动态切换
<Table
  empty={
    <EmptyState 
      variant={queryParams.keyword ? 'noResult' : 'noData'}
      description={queryParams.keyword ? t('common.noResult') : t('module.noData')} 
    />
  }
/>

// 加载失败 - 带重试按钮
<EmptyState 
  variant="error" 
  description={t('common.loadError')} 
  actions={['retry']} 
  onRetry={() => refetch()} 
/>

// 404 页面 - 带导航按钮
<EmptyState 
  variant="notFound" 
  description={t('common.notFound')} 
  actions={['goHome', 'goBack']} 
/>
```

### 8.3 EmptyState 组件支持的操作按钮

| 操作类型 | 说明 | 使用场景 |
|----------|------|----------|
| `retry` | 重试按钮 | 加载失败、网络错误 |
| `goHome` | 返回首页 | 404、无权限 |
| `goBack` | 返回上一页 | 404、资源不存在 |

### 8.4 开发检查清单

在提交代码前，请确认以下场景都有对应的空状态处理：

- [ ] 列表页面初始无数据
- [ ] 搜索/筛选结果为空
- [ ] 详情抽屉中的子表格为空
- [ ] 弹窗中的列表为空
- [ ] API 请求失败时的错误展示
- [ ] 路由不存在时的 404 页面

---

## 9. 详情抽屉（SideSheet）规范

所有详情抽屉遵循统一的"浮动卡片"视觉风格，确保一致的用户体验。

### 9.1 基础配置

```tsx
<SideSheet
  className="card-sidesheet module-detail-drawer"
  visible={visible}
  placement="right"
  mask={false}           // 无遮罩
  closable={false}       // 自定义关闭按钮
  title={renderHeader()}
  // 注意：不设置 headerStyle，使用默认高度以保持一致性
>
```

**样式规范（index.less）：**

```less
// 全局覆盖 - SideSheet header 和 body 样式
.card-sidesheet.module-detail-drawer {
  .semi-sidesheet-header {
    border-bottom: 1px solid var(--semi-color-border);
  }

  .semi-sidesheet-body {
    padding: 0;
    position: relative;
  }

  .semi-tabs-bar {
    padding: 0 24px;
  }

  // Descriptions 标签左对齐
  .semi-descriptions {
    .semi-descriptions-item-key {
      text-align: left;
    }
  }
}
```

### 9.2 Header 操作按钮规范

Header 使用纯图标按钮，统一间距为 8px：

```tsx
const renderHeader = () => (
  <Row type="flex" justify="space-between" align="middle" className="module-detail-drawer-header">
    <Col>
      <Title heading={5} className="module-detail-drawer-header-title">{item?.name}</Title>
    </Col>
    <Col>
      <Space spacing={8}>
        {/* 编辑按钮 */}
        <Tooltip content={t('common.edit')}>
          <Button
            icon={<IconEditStroked />}
            theme="borderless"
            onClick={handleEdit}
          />
        </Tooltip>
        
        {/* 删除按钮 - 条件禁用 */}
        <Tooltip content={item?.is_published ? t('module.detail.cannotDeletePublished') : t('common.delete')}>
          <Button
            icon={<IconDeleteStroked className={item?.is_published ? '' : 'module-detail-drawer-header-delete-icon'} />}
            theme="borderless"
            disabled={item?.is_published}
            onClick={handleDelete}
          />
        </Tooltip>
        
        <Divider layout="vertical" className="module-detail-drawer-header-divider" />
        
        {/* 关闭按钮 */}
        <Button
          icon={<IconClose />}
          theme="borderless"
          className="module-detail-drawer-header-close-btn"
          onClick={onClose}
        />
      </Space>
    </Col>
  </Row>
);
```

### 9.3 操作按钮禁用状态规范

**当某些操作不允许执行时（如已发布数据不允许删除），按钮需要：**

1. **设置 `disabled={true}`** - 禁用点击
2. **移除红色样式类** - 禁用时图标不显示红色，使用默认灰色
3. **Tooltip 显示禁用原因** - 动态切换提示文案

```tsx
// ✅ 正确 - 禁用时移除红色图标样式
<Tooltip content={item?.is_published ? t('module.detail.cannotDeletePublished') : t('common.delete')}>
  <Button
    icon={<IconDeleteStroked className={item?.is_published ? '' : 'module-detail-drawer-header-delete-icon'} />}
    theme="borderless"
    disabled={item?.is_published}
    onClick={handleDelete}
  />
</Tooltip>

// ❌ 错误 - 禁用时仍显示红色图标
<Button
  icon={<IconDeleteStroked className="module-detail-drawer-header-delete-icon" />}
  disabled={item?.is_published}
/>
```

**对应的 Less 样式：**

```less
.module-detail-drawer {
  &-header {
    &-delete-icon {
      color: var(--semi-color-danger);  // 仅启用时显示红色
    }
  }
}
```

### 9.4 Tab 与标题显示规范

**有多个 Tab 时：**
- 使用 Semi UI Tabs 组件进行切换
- Tab 名称统一：基本信息 -> "基本信息"

**移除 Tab 后：**
- 需要在内容区域顶部显示区块标题，保持上下文清晰

```tsx
// 无 Tab 时，显示区块标题
<div className="module-detail-drawer-content">
  <Text strong className="module-detail-drawer-section-title">
    {t('module.detail.tabs.basicInfo')}
  </Text>
  <Descriptions align="left" data={descriptionData} />
</div>
```

```less
.module-detail-drawer {
  &-section-title {
    display: block;
    margin-bottom: 16px;
    font-size: 14px;
  }
}
```

### 9.5 尺寸与拖拽规范

| 属性 | 值 | 说明 |
|------|-----|------|
| 默认宽度 | 900px | 统一默认宽度 |
| 最小宽度 | 576px | 拖拽时最小限制 |
| 宽度持久化 | localStorage | 记住用户调整后的宽度 |
| 边距 | 8px | 与屏幕边缘间距 |
| 圆角 | 8px | 卡片圆角 |

### 9.6 源表格行选中样式

当抽屉打开时，源表格中对应的行需要高亮显示：

```less
// 表格行选中状态
.module-row-selected {
  background-color: var(--semi-color-fill-1) !important;
}
```

### 9.7 上一条/下一条导航

支持在抽屉内快速浏览列表数据，包含自动翻页功能：

```tsx
<Space>
  <Button icon={<IconChevronUp />} disabled={!hasPrev} onClick={handlePrev}>
    {t('common.previousItem')}
  </Button>
  <Button icon={<IconChevronDown />} disabled={!hasNext} onClick={handleNext}>
    {t('common.nextItem')}
  </Button>
</Space>
```

---

## 10. 弹窗（Modal）规范

所有弹窗遵循统一的结构和视觉规范，确保一致的用户体验。

### 10.1 基础结构

**Modal 设置 `footer={null}`，将 footer 移入 Form 组件内部**，以支持 `htmlType="submit"`：

```tsx
<Modal
  className="module-modal"
  title={t('module.modal.title')}
  visible={visible}
  onCancel={onCancel}
  footer={null}              // 关键：禁用默认 footer
  closeOnEsc
  maskClosable={false}
  width={520}
>
  <Form onSubmit={handleSubmit} labelPosition="top">
    {/* 表单内容 */}
    <Form.Input field="name" label={t('module.fields.name')} />
    
    {/* Footer 在 Form 内部 */}
    <div className="module-modal-footer">
      <Button theme="light" onClick={onCancel}>
        {t('common.cancel')}
      </Button>
      <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
        {t('common.confirm')}
      </Button>
    </div>
  </Form>
</Modal>
```

### 10.2 表单间距规范

| 属性 | 值 | 说明 |
|------|-----|------|
| Form 顶部内边距 | 4px | `padding-top: 4px` |
| 字段标签与输入框间距 | 4px | Semi UI 默认 |
| 字段之间间距 | 使用 Form 默认 | 无需额外设置 |

```less
.module-modal {
  .module-modal-form {
    padding-top: 4px;

    .semi-select {
      width: 100%;  // Select 组件撑满宽度
    }
  }
}
```

### 10.3 Footer 样式规范

Footer 需要有顶部分隔线，按钮右对齐：

```less
.module-modal {
  &-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 12px;
    padding-top: 16px;
    padding-bottom: 12px;
    border-top: 1px solid var(--semi-color-border);
  }
}
```

### 10.4 内容滚动区域规范

**当弹窗内容过多时，需要固定 footer，仅内容区域滚动**：

```tsx
<Modal footer={null} width={520}>
  <Form onSubmit={handleSubmit} labelPosition="top">
    {/* 可滚动内容区域 */}
    <div className="module-modal-scroll-content">
      <Form.Input field="name" label={t('module.fields.name')} />
      <Form.TextArea field="description" label={t('module.fields.description')} />
      {/* 更多字段... */}
    </div>
    
    {/* 固定 Footer */}
    <div className="module-modal-footer">
      <Button theme="light" onClick={onCancel}>{t('common.cancel')}</Button>
      <Button htmlType="submit" theme="solid" type="primary">{t('common.confirm')}</Button>
    </div>
  </Form>
</Modal>
```

```less
.module-modal {
  &-scroll-content {
    max-height: calc(100vh - 300px);  // 关键：限制最大高度
    overflow-y: auto;
  }

  &-footer {
    // footer 样式保持不变，不在滚动区域内
  }
}
```

### 10.5 Banner/Alert 样式规范

弹窗内的信息提示（Banner、Alert）必须使用 8px 圆角：

```tsx
<Banner
  type="warning"
  description={t('module.modal.warningMessage')}
  style={{ borderRadius: 8 }}
/>
```

```less
// 或在 Less 中统一设置
.module-modal {
  .semi-banner {
    border-radius: 8px;
  }
}
```

### 10.6 表单元素宽度规范

| 元素类型 | 宽度 | 说明 |
|----------|------|------|
| Select 下拉框 | 100% | 撑满表单宽度 |
| 并排输入框 | flex: 1 | 等宽分配 |
| 搜索输入框 | 320px | 列表页统一宽度 |
| 日期选择器 | 320px | 与搜索输入框对齐 |

```less
.module-modal {
  // Select 撑满
  .semi-select {
    width: 100%;
  }

  // 并排输入框等宽
  &-inline-fields {
    display: flex;
    gap: 12px;

    .semi-form-field {
      flex: 1;
    }
  }
}
```

### 10.7 RadioGroup 选择规范

用于互斥选项（如桌面类型选择）：

```tsx
<Form.RadioGroup
  field="desktop_type"
  label={t('module.fields.desktopType')}
  initValue="console"
>
  <Radio value="console">{t('module.desktopType.console')}</Radio>
  <Radio value="remote">{t('module.desktopType.remote')}</Radio>
</Form.RadioGroup>
```

### 10.8 删除确认弹窗规范

**使用 `Modal.confirm` + `Toast` 组合，禁止创建单独的删除弹窗组件**：

```tsx
import { Modal, Toast } from '@douyinfe/semi-ui';
import { IconDeleteStroked } from '@douyinfe/semi-icons';

const handleDelete = (item: ItemData) => {
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
        await deleteItem(item.id);
        loadData();
        Toast.success(t('module.deleteModal.success'));
      } catch (error) {
        Toast.error(t('module.deleteModal.error'));
        throw error;
      }
    },
  });
};
```

### 10.9 特殊弹窗配置

**Open Process 确认弹窗**（防抖动）：

```tsx
<Modal
  motion={false}  // 禁用动画防止抖动
  footer={
    <Row type="flex" justify="space-between" align="middle">
      <Col>
        <Checkbox>{t('module.dontRemind')}</Checkbox>
      </Col>
      <Col>
        <Space>
          <Button onClick={onCancel}>{t('common.cancel')}</Button>
          <Button theme="solid" type="primary" onClick={onConfirm}>{t('common.confirm')}</Button>
        </Space>
      </Col>
    </Row>
  }
>
```

---

## 11. 其他约定

### 11.1 路由配置

- 路由集中在 `src/App.tsx` 中配置
- 使用 `react-router-dom`

### 11.2 状态管理

- 使用 `@tanstack/react-query` 进行数据获取
- 组件内状态使用 `useState`
- 复杂状态逻辑抽取到自定义 hooks

### 11.3 开发原则

- 严格按照设计稿还原
- 不添加设计稿中没有的功能或菜单
- 视觉样式修改需确认后再执行
