

## 问题本质

你说得对。之前的方案要求手动把 SVG 转成 React JSX 组件并额外添加样式代码，这不仅繁琐，而且效果不理想。

**核心原因**：`<img src="xxx.svg">` 标签会将 SVG 渲染在一个隔离的沙盒中，SVG 内部的 `foreignObject` 和 `backdrop-filter` **完全被浏览器忽略**，所以毛玻璃效果消失。这是浏览器的安全限制，无法绕过。

## 解决方案：`?raw` + `dangerouslySetInnerHTML`

项目中已有成熟的模式 — **MetricsSection** 就是这样做的：

```text
SVG 文件 → import xxx from 'xxx.svg?raw' → dangerouslySetInnerHTML={{ __html: svg }}
```

Vite 的 `?raw` 后缀会把 SVG 文件作为原始字符串导入，然后通过 `dangerouslySetInnerHTML` 直接注入 DOM。这样 SVG 内部的所有效果（包括 `foreignObject`、`backdrop-filter`、滤镜等）都会**原封不动**地保留，无需任何代码修改。

## 实施步骤

### 1. 保存 SVG 文件

将上传的 6 个 SVG 文件保存到 `src/assets/icons/` 目录：
- `home-center.svg` ← home-2.svg
- `development-center.svg` ← 开发中心-4.svg
- `scheduling-center.svg` ← 调度中心-4.svg
- `operations-center.svg` ← 运营中心-4.svg
- `requirements-center.svg` ← 需求中心-4.svg
- `maintenance-center.svg` ← 运维中心-4.svg

### 2. 修改 Sidebar 组件 (`index.tsx`)

- **替换导入**：将 6 个 PNG 导入改为 `?raw` SVG 导入
  ```ts
  import homeCenterIconRaw from '@/assets/icons/home-center.svg?raw';
  // ... 其他5个
  ```

- **替换渲染方式**：将 `<img src={...}>` 替换为 `<div dangerouslySetInnerHTML={{ __html: homeCenterIconRaw }} className="sidebar-center-icon" />`

### 3. 调整 CSS (`index.less`)

`.sidebar-center-icon` 从 `<img>` 变成 `<div>`，需要微调样式确保内部 SVG 正确显示：
```less
.sidebar-center-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 100%;
    height: 100%;
  }
}
```

### 优势

- **零修改 SVG 代码**：上传的文件原样使用
- **完整保留毛玻璃效果**：`foreignObject` + `backdrop-filter` 在 DOM 中正常渲染
- **已验证的项目模式**：与 MetricsSection 使用完全相同的技术方案

