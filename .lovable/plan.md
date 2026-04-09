

# 移除详情抽屉中残留的协作者 Tab

## 问题

根据已确立的规范，协作者管理统一通过抽屉标题栏右侧的"分享"图标按钮触发 Modal 弹窗完成，详情抽屉内不再使用协作者 Tab。但以下 **6 个文件**仍保留了协作者 Tab：

| 文件 | 资产类型 | 移除 Tab 后剩余 Tab 数 | 处理方式 |
|------|---------|----------------------|---------|
| `ProcessDetailDrawer/index.tsx` | 流程 | 3（基本信息、版本历史、流程参数） | 仅移除协作者 TabPane |
| `WorkerDetailDrawer/index.tsx` | 机器人 | 1（基本信息） | 移除 Tabs 组件，直接平铺内容 |
| `WorkerGroupDetailDrawer/index.tsx` | 机器人组 | 1（基本信息） | 移除 Tabs 组件，直接平铺内容 |
| `TemplateDetailDrawer/index.tsx` | 执行模板 | 2（基本信息、使用历史） | 仅移除协作者 TabPane |
| `TimeTriggerDetailDrawer/index.tsx` | 时间触发器 | 2（基本信息、触发记录） | 仅移除协作者 TabPane |
| `QueueTriggerDetailDrawer/index.tsx` | 队列触发器 | 2（基本信息、触发记录） | 仅移除协作者 TabPane |

## 改动

每个文件：
1. 删除 `CollaboratorTab` 和 `useCollaboratorPermission` 的 import
2. 删除 `canManage` 相关代码
3. 删除 `itemKey="collaborators"` 的 TabPane
4. 对于 WorkerDetailDrawer 和 WorkerGroupDetailDrawer，移除 Tabs 包裹，直接渲染原"基本信息"Tab 的内容
5. 清理 `initialTab` 中对 `'collaborators'` 的引用（如有）

共 **6 个文件**，纯删除操作。

