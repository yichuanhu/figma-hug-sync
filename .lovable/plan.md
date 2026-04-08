

# 协作者搜索框统一化 + 组织架构按钮样式优化

## 变更概要

两处修改：
1. 将搜索框改为单一容器，内部包含：已选 Tag + 搜索输入 + 角色选择按钮 + 添加按钮，去掉当前外层 `.collaborator-panel-search-area` 的额外包裹层
2. "从组织架构添加"改为 Semi UI 的 `Button` 次按钮样式

## 文件变更

| 文件 | 变更 |
|------|------|
| `CollaboratorPanel/index.tsx` | 搜索框结构扁平化；组织架构按钮改为 `<Button type="tertiary">` |
| `CollaboratorPanel/index.less` | 移除 `.collaborator-panel-search-area` 外层样式，调整搜索框为直接挂在面板下的单容器；移除 `.collaborator-panel-action-row` 相关样式，改为按钮区域 |

### 具体改动

**1. 搜索框（index.tsx L464-536）**

移除 `.collaborator-panel-search-area` 包裹 div，`.collaborator-panel-search-input-box` 直接作为搜索区域容器，加上 `margin: 0 24px 12px` 定位。内部结构保持不变：`Tag[]` + `Input` + `divider` + `role-text-btn` + `add-btn`，全部在同一个圆角边框容器内。

**2. 组织架构按钮（index.tsx L557-565）**

将当前的 `.collaborator-panel-action-row` div 替换为：

```tsx
<div style={{ padding: '8px 24px 16px' }}>
  <Button
    type="tertiary"
    icon={<IconFlowChartStroked />}
    block
    onClick={() => setAddModalVisible(true)}
  >
    {t('collaborator.panel.addFromOrg')}
  </Button>
</div>
```

**3. Less 清理**

- `.collaborator-panel-search-area` 的 `padding` 移到 `.collaborator-panel-search-input-box` 的 `margin` 上
- 移除快捷视图中 `.collaborator-panel-action-row` 的圆形图标背景样式（管理视图中如果也用到则保留）

