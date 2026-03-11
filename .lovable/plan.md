

## 凭据资源展示方式优化

### 问题
当前凭据资源展示为4行，重复出现"测试值"和"生产值"前缀，显得冗余：
- 测试值 - 账号: xxx
- 测试值 - 密码: ******
- 生产值 - 账号: xxx
- 生产值 - 密码: ******

### 方案
改为分组展示，用小标题区分测试值/生产值，每组下列出账号和密码，避免重复前缀：

```text
引用的流程: xxx
先前已发布: 是

测试值
  账号: test_admin    密码: ******

生产值
  账号: admin         密码: ******
```

### 技术实现

**文件**: `ReleaseDetailDrawer/index.tsx` (约170-177行)

将凭据的4行 `<Text>` 替换为两个分组块：
- 每组一个小标题（`<Text type="tertiary" size="small" strong>`）显示"测试值"或"生产值"
- 每组内账号和密码横向排列在一行（用 flex 布局），格式为 `账号: xxx  密码: ******`

**文件**: `ReleaseDetailDrawer/index.less`

添加 `.release-detail-drawer-credential-group` 和 `.release-detail-drawer-credential-row` 样式，实现分组间距和横向排列。

同样适用于参数类型（178-182行）：将测试值和生产值也用分组方式展示，保持一致性。

