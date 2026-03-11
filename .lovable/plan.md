

## 凭据测试值拆分为账号+密码展示

### 修改内容

**1. 数据结构扩展** (`CreateReleasePage/index.tsx`)

在 `ResourceConfig` 中增加 `test_username` 和 `test_password` 字段，用于凭据的测试值展示。

**2. UI 适配** (`ReleaseConfigStep/index.tsx`)

在 `renderResourceCard` 中，当 `isCredential` 为 true 时，左侧"测试值"区域也渲染为账号+密码两行展示（与生产值对称）：
- 账号：显示 `resource.test_username || '-'`
- 密码：显示为掩码 `******`（根据凭据安全规范，不展示明文密码）

**3. Mock 数据适配**

初始化凭据资源时填充 `test_username` 和 `test_password` 示例数据。

### 涉及文件
- `src/pages/Development/ReleaseManagement/CreateReleasePage/index.tsx`
- `src/pages/Development/ReleaseManagement/CreateReleasePage/components/ReleaseConfigStep/index.tsx`

