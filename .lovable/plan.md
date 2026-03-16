

## 计划：给所有功能页面内容卡片添加淡蓝色渐变晕影背景

### 做什么
在 `src/components/layout/AppLayout/index.less` 的 `.app-layout-content-card` 上添加一个 `::before` 伪元素，使用与首页相同风格但更淡的蓝色 radial-gradient 晕影，让所有功能页面（流程开发、文件管理等）获得与首页一致的视觉氛围。

### 具体改动

**文件：`src/components/layout/AppLayout/index.less`**
- 给 `.app-layout-content-card` 添加 `position: relative` 和 `overflow: hidden`
- 添加 `::before` 伪元素，使用 `radial-gradient(ellipse at center top, rgba(152, 205, 253, 0.08) 0%, transparent 70%)`（比首页的 0.15 更淡，约为一半透明度）
- 确保内容层级高于晕影（`z-index` 处理）

**文件：`src/pages/Home/index.less`**
- 首页已有自己更浓的晕影效果，无需改动，两者不冲突（首页的 `::before` 在 `.app-layout-content-card:has(.home-page)` 上会覆盖全局的）

### 影响范围
- 全局生效，所有通过 AppLayout 渲染的页面自动获得背景晕影
- 首页保持现有更浓的晕影不变
- 改动量极小，仅修改一个 less 文件

