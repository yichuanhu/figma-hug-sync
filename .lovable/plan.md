

## 问题场景

上传新版本后，系统自动解析出的依赖资源可能在业务资源表中已被删除（找不到对应的 resource_id）。此时需要提示用户这些依赖已失效，并引导用户重新创建对应的业务资源。

## 方案设计

### 1. 数据模型扩展

在 `LYProcessDependency` 接口中新增 `status` 字段：

```ts
export interface LYProcessDependency {
  // ...existing fields
  /** 资源状态：正常 / 已失效（业务资源表中已删除） */
  status?: 'ACTIVE' | 'MISSING';
}
```

### 2. UploadVersionModal — 上传后模拟解析出失效依赖

`handleUpload` 中，模拟部分新解析的依赖 `status: 'MISSING'`，表示在业务资源表中找不到。上传成功后通过 `onSuccess` 回调传递包含失效依赖的完整列表，并用 Toast.warning 提示用户有依赖资源已失效。

### 3. DependencyTab — 失效依赖的视觉与交互

- **卡片样式**：`status === 'MISSING'` 的依赖卡片增加红色/警告边框和淡红背景，与正常卡片区分
- **标签**：在来源标签旁增加红色「已失效」Tag
- **值区域**：显示警告文字（如"对应资源已被删除，请前往业务资产重新创建"）
- **操作按钮**：增加「前往创建」按钮，点击后跳转到对应资源类型的业务资产页面（复用已有的 `RESOURCE_TYPE_ROUTE_MAP` 路由映射）
- **顶部 Banner**：当存在任何 MISSING 状态的依赖时，在 DependencyTab 顶部显示 Banner 警告

### 4. 具体修改文件

| 文件 | 修改内容 |
|------|---------|
| `src/api/index.ts` | `LYProcessDependency` 新增 `status?: 'ACTIVE' \| 'MISSING'` |
| `UploadVersionModal/index.tsx` | 模拟解析出带 `MISSING` 状态的依赖 |
| `DependencyTab/index.tsx` | 渲染失效卡片样式、Banner、「前往创建」按钮 |
| `DependencyTab/index.less` | 新增 `.dependency-tab-missing-card` 样式 |
| `public/i18n/zh-CN.json` | 新增 `processDependency.missing*` 相关文案 |
| `public/i18n/en.json` | 对应英文文案 |

### 5. i18n 新增文案

```json
// zh-CN
"processDependency": {
  "missingBanner": "有 {{count}} 项依赖资源在业务资产中已被删除，请前往重新创建",
  "missingTag": "已失效",
  "missingHint": "对应资源已被删除，请前往业务资产重新创建",
  "goCreate": "前往创建",
  "uploadMissingWarning": "发现 {{count}} 项依赖资源已失效，请在资源依赖页签中处理"
}
```

