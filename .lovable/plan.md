

## 计划：将首页 5 个中心入口图标从 foreignObject 迁移到纯 SVG 滤镜

### 涉及文件

1. `src/assets/icons/home-requirements.svg`
2. `src/assets/icons/home-development.svg`
3. `src/assets/icons/home-scheduling.svg`
4. `src/assets/icons/home-operations.svg`
5. `src/assets/icons/home-maintenance.svg`

### 当前结构（5 个文件通用模式）

```text
1. 底层形状 (背景渐变 path)
2. <foreignObject> + backdrop-filter:blur(2px) + clip-path  ← 问题所在
3. <g filter="innerShadow"> 前景形状 (半透明色 + 渐变)
4. 图标细节 path (白色)
5. <defs>: innerShadow filter, clipPath, linearGradients
```

### 转换方案

对每个 SVG 执行以下操作：

1. **新增模糊滤镜**（在 `<defs>` 中）：
```xml
<filter id="glassBlur" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
</filter>
```

2. **替换 foreignObject**：用一个 `<g>` 包裹底层形状的副本，应用模糊滤镜，并用前景形状作为 `<clipPath>` 裁切，模拟 backdrop-filter 效果：
```xml
<clipPath id="glassClip">
  <path d="[前景形状路径]"/>
</clipPath>
<g clip-path="url(#glassClip)">
  <g filter="url(#glassBlur)">
    <path d="[底层形状路径]" fill="[原底层渐变]"/>
  </g>
</g>
```

3. **移除**：`<foreignObject>` 元素及其对应的 `bgblur_*_clip_path`

4. **保持不变**：inner shadow filter、前景半透明层、图标细节路径、渐变定义

### 不修改任何组件代码

组件仍通过 `?raw` + `dangerouslySetInnerHTML` 注入，只替换 SVG 文件内容。

