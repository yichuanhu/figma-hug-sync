

## 计划：替换首页中心入口卡片图标

### 操作内容

将用户上传的 5 个 SVG 文件替换到 `src/assets/icons/` 目录下对应的图标文件：

| 上传文件 | 目标文件 |
|---|---|
| 需求中心-7.svg | `src/assets/icons/home-requirements.svg` |
| 开发中心-7.svg | `src/assets/icons/home-development.svg` |
| 调度中心-11.svg | `src/assets/icons/home-scheduling.svg` |
| 运营中心-7.svg | `src/assets/icons/home-operations.svg` |
| 运维中心-7.svg | `src/assets/icons/home-maintenance.svg` |

### 技术说明

- 上传的 SVG 均已包含 `blur(2px)` 毛玻璃效果，与快速开始图标风格一致
- 调度中心图标 viewBox 为 `24x24`，其余为 `28x28`，容器会自动缩放，无需额外处理
- 组件通过 `?raw` 方式导入 SVG 并用 `dangerouslySetInnerHTML` 注入，仅需替换文件，无需修改组件代码

### 修改文件

- `src/assets/icons/home-requirements.svg` — 替换为上传内容
- `src/assets/icons/home-development.svg` — 替换为上传内容
- `src/assets/icons/home-scheduling.svg` — 替换为上传内容
- `src/assets/icons/home-operations.svg` — 替换为上传内容
- `src/assets/icons/home-maintenance.svg` — 替换为上传内容

