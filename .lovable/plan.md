

## 问题分析

当前凭据（CREDENTIAL）类型资源的生产值输入只有一个 `Input`（password 类型），但凭据实际包含**账号（username）**和**密码（password）**两个字段，需要拆分为两个独立输入框。

## 修改方案

### 1. 数据结构扩展 (`CreateReleasePage/index.tsx`)

在 `ResourceConfig` 接口中增加凭据专用字段：

```typescript
export interface ResourceConfig {
  // ...existing fields
  production_username?: string;  // 凭据账号
  production_password?: string;  // 凭据密码
}
```

初始化资源时，凭据类型的 `production_username` 和 `production_password` 初始化为空字符串。

提交验证逻辑中，凭据类型检查 `production_username` 和 `production_password` 而非 `production_value`。

### 2. 凭据卡片UI改造 (`ReleaseConfigStep/index.tsx`)

当 `isCredential` 为 true 时，生产值区域渲染两个输入框（账号 + 密码），替代当前单个 password 输入框：

```
生产值
├── 账号: [Input - text]
└── 密码: [Input - password]
```

布局参考现有 `CreateCredentialModal` 中的 value-group 样式，使用垂直排列、左侧标签对齐的方式。

### 3. 样式适配 (`ReleaseConfigStep/index.less`)

新增凭据值组的样式类，包含两行输入框的间距和标签宽度定义。

### 涉及文件

- `src/pages/Development/ReleaseManagement/CreateReleasePage/index.tsx` — 数据结构 + 验证逻辑
- `src/pages/Development/ReleaseManagement/CreateReleasePage/components/ReleaseConfigStep/index.tsx` — 凭据卡片渲染逻辑
- `src/pages/Development/ReleaseManagement/CreateReleasePage/components/ReleaseConfigStep/index.less` — 样式

