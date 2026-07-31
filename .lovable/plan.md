## 目标

把命令库详情抽屉里的「新增版本」弹窗（UploadCommandVersionModal）的上传交互，改成与「导入命令库」弹窗（ImportCommandModal）完全一致的样式与规则。

## 交互改动

1. 移除现有的虚线拖拽区（Inbox 图标 + 拖拽文案）。
2. 改为与导入弹窗一致的上传字段结构：
   - 标签行：红色 `*` + 字段名 + 问号 Tooltip 说明
   - 控制行：「上传」按钮（Upload 图标）+ 灰色格式提示文案
   - 已选文件行：文件图标 + 文件名（超长省略并 Tooltip）+ 文件大小 + 关闭图标可移除
3. 两个上传项，与导入命令库保持一致：
   - 命令库文件：仅支持 .plg，不超过 100M
   - 命令库源码：仅支持 .zip，不超过 100M
4. 校验规则一致：扩展名不符 / 超过 100M 时 Toast 提示并拒绝上传。
5. 弹窗仍保留版本相关表单字段：版本号（必填）、更新说明；字段顺序为 版本号 → 更新说明 → 命令库文件 → 命令库源码。
6. 底部按钮：两个文件与版本号齐全前，主按钮置灰不可点（与导入弹窗一致）。

## 技术细节

- 将 ImportCommandModal 中的 `UploadField` 子组件与 `formatSize` 提取为共享文件（`components/UploadField/`，含 index.tsx 与 index.less），供两个弹窗复用，避免样式漂移。
- ImportCommandModal 改为引用共享组件，视觉与行为不变。
- UploadCommandVersionModal 的 `onSuccess` 回调载荷扩展为 `{ version, note, fileName, fileSize, sourceFileName, sourceFileSize }`，详情抽屉新增版本时同时写入 `file_name` 与 `source_file_name`，使版本详情右侧的「命令库文件 / 命令库源代码文件」两行都有真实值。
- 相应更新 CommandLibrary 列表页/抽屉中处理新增版本的回调，接收新增字段。
