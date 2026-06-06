## 目标

把任务列表筛选栏中"归属部门"从 `DepartmentSelect`（树形）替换为类似截图的扁平搜索式下拉：每一项展示部门图标 + 部门名 + 完整路径（如 `laiye/西安中心/中心内部/总账报表部`），支持搜索匹配，并保留多选 + 取并集的筛选逻辑。

## 改动

### 1. `src/components/DepartmentSearchSelect/index.tsx`
- 新增 `multiple?: boolean` 与 `maxTagCount?: number` 两个可选 props。
- `value` / `onChange` 类型扩展为 `string | string[]`。
- `Select` 透传 `multiple` 和 `maxTagCount`，`onChange` 根据 multiple 分发为 string 或 string[]。
- `renderSelectedItem` 在多选时使用默认 Tag 行为（不自定义），单选时保持原来仅显示部门名。
- `renderOptionItem` 保持现状（图标 + 名称 + 路径）。
- 搜索逻辑（`searchText`）保持不变。

### 2. `src/pages/Scheduling/TaskManagement/TaskManagementPage/index.tsx`
- 第 26 行 import 从 `DepartmentSelect` 改为 `DepartmentSearchSelect`。
- 第 1014–1023 行的 `<DepartmentSelect>` 替换为 `<DepartmentSearchSelect>`，传入 `multiple`、`maxTagCount={1}`、`showClear`、`useNameAsValue`、`value={departmentFilter}`、`onChange` 与原逻辑一致、`style={{ width: 168, flexShrink: 0 }}`。
- 不修改 `departmentFilter` 状态、筛选并集逻辑及 i18n。

### 3. 不动的范围
- 其它使用 `DepartmentSelect`（树形）的页面不变，仅本次筛选场景切换组件。
- 不调整执行目标、触发器、搜索条件提示等之前已完成的内容。

## 验证

- 任务列表筛选栏下拉视觉与截图一致：部门图标 + 名称 + 路径，多选 Tag 折叠为 `maxTagCount=1`。
- 输入"中心"能匹配 `中心内部`、`成都中心` 等。
- 选择多个部门时，列表按"部门 ∈ 已选集合"取并集过滤。
