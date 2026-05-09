## 目标

对照 STORY-003（详情页通用框架）+ STORY-005（流程子市场），修正 `/sharing-center/market/workflow/:id` 流程详情页与需求不符的部分。

## 现状 vs 需求差异


| #      | 需求（线框/AC）                                   | 当前实现                       | 差异                      | &nbsp; | &nbsp; | &nbsp; |
| ------ | ------------------------------------------- | -------------------------- | ----------------------- | ------ | ------ | ------ |
| 1      | 内容区结构化展示：流程名称、流程详情                          | 直接渲染 `workflow.yaml` 原始字符串 | 内容渲染方式不符                | &nbsp; | &nbsp; | &nbsp; |
| 2      | 注明 "⚠ 此内容由开发中心提供，共享中心不可编辑"（FUNC-AC-03 / E3） | 无任何只读提示                    | 缺失只读 Banner             | &nbsp; | &nbsp; | &nbsp; |
| 3      | Tab 标题 `[内容 (只读)] [版本历史(N)] [复用记录(N)]`      | `内容 / 版本历史 / 复用记录`         | 流程的"内容" Tab 缺 "(只读)" 后缀 | &nbsp; | &nbsp; | &nbsp; |
| 4      | 返回链接文案 "← 返回流程库"                            | 通用 "返回"                    | 文案过于笼统                  | &nbsp; | &nbsp; | &nbsp; |
| 5      | AF1：版本历史可基于历史版本"复用此版本"                      | 弹窗仅展示快照内容，无操作              | 缺"复用此版本"按钮              | &nbsp; | &nbsp; | &nbsp; |
| &nbsp; | &nbsp;                                      | &nbsp;                     | &nbsp;                  | &nbsp; | &nbsp; | &nbsp; |


> 来源徽标 `[🔗 开发中心]`、复用按钮、收藏按钮、标签、版本历史/复用记录列等均已正确，无需调整。

## 实施步骤

### 1.重写流程内容渲染（`AssetDetail/index.tsx`）

新增分支：当 `asset.type === 'WORKFLOW'` 时，渲染结构化只读卡片：

```
┌─ 流程内容（只读） ───────────────────────────┐
│ 流程名称：发票开具自动化流程                 │
│ 流程描述： xxxx                          │
└────────────────────────────────────────────────┘
⚠ 此内容由开发中心提供，共享中心不可编辑
```

- 用 Semi `Descriptions` 展示元信息，`<ol>` 渲染步骤
- 底部使用 Semi `Banner` (`type="info"`, `fullMode={false}`) 显示只读提示
- 非流程类型保持原有 YAML/HTML/技能渲染逻辑

### 4. Tab 标签微调

流程类型时 `内容` Tab 文案改为 `内容（只读）`；其他类型不变。

### 5. 返回链接文案

详情页类型为流程时，返回提示文案改为 "返回流程库"（其他类型保留"返回资产市场"）。新增 i18n key `sharing.market.detail.backWorkflow`。

### 6. 版本预览支持"基于此版本复用"（AF1）

`Modal` footer 增加按钮 `复用此版本`：点击后调用同 `handleReuse` 逻辑（Toast + reuseCount+1）+ 关闭弹窗。

## 涉及文件

- `src/pages/Sharing/Market/types.ts`
- `src/pages/Sharing/Market/mockData.ts`
- `src/pages/Sharing/Market/AssetDetail/index.tsx`
- `src/pages/Sharing/Market/AssetDetail/index.less`（新增 `.workflow-readonly` 样式）
- `public/i18n/zh-CN.json`、`public/i18n/en.json`

## 不在范围

- 流程库列表卡片样式（已符合 STORY-005）
- 知识库 / 技能 / 流程块详情
- 真实 API 接入（继续 mock）