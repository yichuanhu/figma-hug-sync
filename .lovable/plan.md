在流程详情抽屉的「基本信息」区块增加「关联需求」展示行。

## 背景
流程列表已支持「关联需求」列展示与筛选；详情抽屉（ProcessDetailDrawer）的「基本信息」区块目前缺少该字段。

## 变更范围
仅修改 `ProcessDetailDrawer` 组件，不涉及 API 类型、编辑弹窗或列表逻辑。

## 实施要点

### 1. 新增需求信息查询能力
- 详情抽屉接收的是单个 `LYProcessResponse` 对象，其中仅有 `requirement_id` 字符串，不含需求标题/编号。
- 方案：在 `ProcessDetailDrawer` 内部通过动态 `import('@/pages/Requirements/RequirementsProjects/mockData')` 调用 `fetchRequirementBriefByIds`，异步获取当前 `processData.requirement_id` 对应的 brief 信息（参考列表页已有做法）。
- 使用 `useEffect` + `useState` 管理异步加载状态，避免同步阻塞渲染。

### 2. 「基本信息」增加「关联需求」行
- 在 `basicGroupData` 数组中插入一项，key 为「关联需求」。
- value 展示逻辑与列表列保持一致：
  - 无 `requirement_id`：显示 `-`（Text type="tertiary"）
  - 有 `requirement_id`：蓝色 Tag，前缀 Link2 图标，内容为 `[req_no] title` 或 `title`，点击后 `navigate('/requirements/list', { state: { openRequirementId: reqId } })` 跳转到需求详情。
  - 加载中：显示简短 loading 状态或保持 `-`。

### 3. 样式与交互
- 完全复用列表列中的 Tag + Link2 + ellipsis 样式模式。
- 点击跳转使用 `useNavigate` 或 window 导航，与列表列行为一致。

## 无变更项
- `LYProcessResponse` / `LYCreateProcessRequest` API 类型（已有 `requirement_id`）
- 编辑弹窗 `EditProcessModal`（已有关联需求字段）
- 列表页筛选/列展示
- Mock 数据生成逻辑