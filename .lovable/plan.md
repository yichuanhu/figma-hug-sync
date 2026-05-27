## 目标

将流程详情「详情」Tab 的基本信息按用户要求重排为两组，使用两段 `Descriptions` 和分组小标题。

## 分组与字段顺序

**第一组：基础信息**
1. 流程名称
2. 描述
3. 状态
4. 创建者
5. 归属者
6. 归属部门
7. 创建时间
8. 更新时间

**第二组：生命周期信息**
1. 开发工程师
2. 代码审核员
3. 开发完成时间
4. 部署上线时间
5. 流程下线时间

## 改动范围

仅修改 `src/components/ProcessManagement/ProcessManagementContent/components/ProcessDetailDrawer/index.tsx`：

1. 将原单一 `descriptionData` 数组拆分为 `basicGroupData` 与 `lifecycleGroupData` 两个数组。
2. 第一组中移除「关联需求/归属项目/工作空间」三项（如有 `linkedRequirement` 仍保留在基础信息组尾部，紧跟「更新时间」之前，作为只读补充——待用户确认；当前计划：**保留**在基础信息组内紧随「归属部门」之后，避免功能丢失）。
3. 第二组中：
   - 移除原先「查看修正历史」按钮挂在 `offline_at` 行右侧的写法，改为放在第二组小标题右侧的链接按钮，更直观。
   - 三个时间字段沿用现有 Tooltip / 已修正 Tag / 铅笔修正按钮。
4. Tab 渲染处替换为：

```text
<div class="process-detail-drawer-tab-content">
  <Title heading={6}>基础信息</Title>
  <Descriptions data={basicGroupData} align="left" />
  <Divider margin="16px" />
  <div 标题行>
    <Title heading={6}>生命周期信息</Title>
    <Button 链接 type="primary">查看修正历史</Button>   // 仅 canView 时
  </div>
  <Descriptions data={lifecycleGroupData} align="left" />
</div>
```

5. 标题字号使用 Semi `Typography.Title heading={6}`，与项目其他详情抽屉保持一致；分组之间用 `Divider` 或 16px 间距。
6. 若 `basicInfoPermission.canView` 或 `lifecyclePermission.canView` 为 false，对应组隐藏（包括组标题）。

## 不改动

- 弹窗 `BasicInfoEditModal`、`LifecycleAdjustModal`、`LifecycleHistoryModal` 逻辑。
- Mock 数据、权限 hook、其他 Tab。
- 国际化键值（标题「基础信息」「生命周期信息」直接使用中文文案，与现有「生命周期台账」一致采用硬编码中文；如需 i18n 后续单独处理）。
