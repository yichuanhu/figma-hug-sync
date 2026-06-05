## 优化目标

当前 `EditProcessModal` 字段较多（基本信息 + 归属 + 交付信息共 9 个），全部平铺在 520px 弹窗内，视觉密度高、层级不清；底部按钮也未完全对齐 FormModal 规范。建议两项最有性价比的优化：

### 1. 按语义分组重构（最主要改动）

参考记忆 `mem://style/modal/form-layout-preference`（字段 > 6 时应使用分组），将字段拆分为两个清晰区块：

```
┌─ 基本信息 ─────────────────┐
│  流程名称 *                │
│  描述                      │
│  关联需求                  │
│  归属部门 *                │
│  归属者 *                  │
└────────────────────────────┘

┌─ 交付信息 ─────────────────┐
│  开发工程师                │
│  代码审核员                │
│  开发完成时间              │
│  部署上线时间              │
│  流程下线时间              │
└────────────────────────────┘
```

- 复用 `FormModal` 已有的 `form-modal-section` + `form-modal-section-title`（左侧 3×14 竖条 + 标题）的视觉，在 `EditProcessModal` 内部用相同 DOM 结构实现，保证与项目其它弹窗一致。
- 删除当前裸文本的 `edit-process-modal-section-title`（"交付信息"），改用标准分组头。
- 在"基本信息"区块上方不再加标题（默认区块），仅"交付信息"作为可视化分组，避免视觉冗余。

### 2. 底部按钮规范化

- 当前已是「取消(light) + 保存(solid primary)」，保留；
- 统一 footer 间距：`padding-top: 20px; margin-top: 20px; border-top: 1px solid var(--semi-color-border)`，对齐 `form-modal-footer` 规范；
- 移除 `padding-bottom: 12px`（Modal 自带 padding）。

### 3. 内容区滚动约束

- 给表单内容包裹 `max-height: calc(100vh - 300px); overflow-y: auto`，避免在小屏（如 1305×853）下弹窗超出视口；底部按钮固定在可视区下方，与 `FormModal` 行为一致。

## 不做的事

- 不改弹窗宽度（保持 520px，与项目 Modal 规范一致）；
- 不改字段顺序（已符合 Name → Dept → Owner → Desc 规范）；
- 不改任何业务/校验逻辑、不动 mock 数据；
- 不折叠交付信息（折叠会让"编辑时不知道有这些字段"，反而降低可发现性）。

## 涉及文件

- `src/components/ProcessManagement/ProcessManagementContent/components/EditProcessModal/index.tsx`：包裹两个分组容器，调整 DOM 结构。
- `src/components/ProcessManagement/ProcessManagementContent/components/EditProcessModal/index.less`：新增 `-section` / `-section-title` / `-content` 样式，更新 `-footer` 边距，删除旧的 `-section-title` 裸样式。
