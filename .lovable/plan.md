

# 协作者名称列宽度自适应抽屉宽度

## 问题

当前名称列中的协作者名称、部门字段、继承来源名称均使用固定 `maxWidth`（200px、360px、280px），导致抽屉宽度变化时文字截断不跟随调整，浪费空间或展示不足。

## 方案

将所有硬编码的 `maxWidth` 改为 CSS 百分比/flex 布局自适应，让文字截断宽度跟随名称列实际宽度变化。

### 文件变更

| 文件 | 变更 |
|------|------|
| `CollaboratorTab/index.tsx` | 移除名称、部门、继承来源的固定 `maxWidth` 内联样式，改用 CSS class 控制 |
| `CollaboratorTab/index.less` | 新增/修改样式，使用 `max-width: 100%` + `overflow: hidden` 实现自适应截断 |

### 技术细节

**1. 协作者名称（第284行）**

移除 `style={{ maxWidth: 200 }}`，改为 CSS：
```less
&-label {
  // 已有 flex
  min-width: 0; // 允许 flex 子元素收缩
  
  .semi-typography {
    min-width: 0;
    flex: 1;
  }
}
```

**2. 部门字段（第294行）**

移除 `style={{ maxWidth: 360 }}`，在 `&-info` 下依赖已有的 `min-width: 0; flex: 1` 使 Text 自然撑满可用宽度：
```less
&-info {
  // 已有 min-width: 0; flex: 1
  .semi-typography {
    max-width: 100%;
  }
}
```

**3. 继承来源名称（第229行）**

移除 `style={{ maxWidth: 280, display: 'inline-block', verticalAlign: 'middle' }}`，改用 CSS class：
```less
&-source-detail-item {
  min-width: 0;
  
  .semi-typography {
    flex: 1;
    min-width: 0;
  }
}
```

来源 item 改为 `flex` 布局（已有），来源名称 Text 用 `flex: 1; min-width: 0` 自动填充剩余空间，角色名 Text 用 `flex-shrink: 0` 保持不被压缩。

**4. Tooltip 的 maxWidth**

Tooltip 的 `style={{ maxWidth: 360 }}` 保留，这是气泡本身的宽度限制，与列宽无关。

