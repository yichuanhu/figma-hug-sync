## 调整内容

将侧边栏 **开发中心** 下的分组标题「发布管理」改名为「流程上下线管理」，组内 5 个菜单项保持不变，顺序与图片一致：

1. 流程发布
2. 发布审批
3. 发布审批模板
4. 停用审批
5. 停用审批模板

## 技术细节

- `src/components/layout/Sidebar/index.tsx` 第 254 行：分组项 `publishManagement` 的 `labelKey` 保持 `sidebar.publishManagement`，组内子项顺序已与目标一致，无需调整顺序。
- `public/i18n/zh-CN.json`：将 `sidebar.publishManagement` 由「发布管理」改为「流程上下线管理」。
- `public/i18n/en.json`：同步英文翻译为 `Process Lifecycle Management`（或更贴合的表达）。

不涉及路由、页面组件或业务逻辑变更。
