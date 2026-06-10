
## 问题汇总

1. **横向滚动条要滚到表格底部才看见**：Semi Table 默认把横向滚动条挂在表格 body 底部，纵向内容很长时用户根本看不到。需要让横向滚动条**始终吸附在可视区底部**。
2. **操作列未居中**：表头与 ··· 内容左对齐。
3. **固定列左侧分割线太粗**：默认阴影笨重，需替换为 1px 细线。

## 修复方案

### 1. 横向滚动条吸底（核心）

Semi Table 支持 `sticky` 配置：

```tsx
<Table
  sticky={{ top: 0 }}    // 表头吸顶
  scroll={{ x: 'max-content', y: ... }}
/>
```

但 Semi 没有内置「横向滚动条吸底」开关。两种可行做法，**优先方案 A**：

**方案 A：让 Table 自身的滚动容器同时承担横纵滚动**
- 不要在外层 `.xxx-table` 上再加 `overflow: auto`；
- 表格 `scroll={{ y: <可视高度> }}`，Semi 会把 tbody 设为纵向滚动容器，横向滚动条出现在 tbody 底部 = 可视区底部，自然「吸底」。
- 当前许多列表页是外层 div `flex:1; overflow:auto`，表格 `scroll={{ x: ... }}`（没有 y）；这种结构下横向滚动条在表格最底部（远低于视口）。需要改为：外层不滚，传 `scroll={{ x: 'max-content', y: '100%' }}` 或具体像素高度。

**方案 B（备选）**：在外层 `.app-layout-content-card` 加一个全局 CSS hack，监听 `.semi-table-body` 让其横向滚动条 sticky 到视口底部（复杂且兼容性差，不采用）。

→ 采用方案 A：把列表页的表格容器从「外层滚动 + Table 无 y」改为「Table 自带 y 滚动」。具体写法：

```tsx
<div className="xxx-table">  {/* flex:1; min-height:0; display:flex */}
  <Table
    scroll={{ x: 'max-content', y: '100%' }}  // 关键
    sticky                                     // 表头吸顶
    ...
  />
</div>
```

CSS 配套：让 `.semi-table` / `.semi-table-container` 撑满 `.xxx-table` 容器（`height:100%`），保证 `y:'100%'` 能正确计算。

### 2. 操作列居中

所有列表页"操作"列加 `align: 'center' as const`。

### 3. 固定列分割线变细

在 `src/styles/semi-overrides.css` 覆盖：

```css
.semi-table-fixed-right { box-shadow: -1px 0 0 0 var(--semi-color-border) !important; }
.semi-table-fixed-left  { box-shadow:  1px 0 0 0 var(--semi-color-border) !important; }
```

（类名以实际渲染 DOM 为准，必要时调整。）

### 4. 涉及文件

- **全局样式**：`src/styles/semi-overrides.css` —— 固定列细线
- **列表页**（上一轮加过 `fixed:'right'` 的全部页面）三处改动：
  - 操作列 `align: 'center' as const`
  - Table 改为 `scroll={{ x: 'max-content', y: '100%' }}` + `sticky`
  - 外层容器若有 `overflow: auto` 改为 `overflow: hidden`，并保证子级 `.semi-table` `height:100%`

涵盖：需求中心 / 调度中心 / 开发中心 / 流程·文件·凭据·参数·队列管理组件 / 个人中心 / 运营 / 共享中心 等约 25 个文件。

### 5. 验证

- 列总宽超容器时：底部横向滚动条始终可见（不必滚到表末）；
- 操作列固定右侧，左侧仅 1px 细线；
- 表头吸顶；操作列表头/内容居中；
- 行点击 / Dropdown / 分页正常。
