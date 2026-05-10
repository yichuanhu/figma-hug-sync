## 目标

将 `src/pages/SharingCenter/Admin/Permissions/index.tsx` 与 i18n 全量对齐 `sharing-center-L1-permission-management-v1.0.0.md`：12 个 `SC_*` 权限点（5 类）+ 4 个内置角色模板，并补上「角色 × 权限」矩阵。

---

## 一、页面信息架构调整

旧版（不符合规范）：5 个实体 × 19 个 `entity.action` 权限点；4 个角色仅文本描述。

新版结构（自上而下）：

1. **页面标题**：`权限点与角色`（heading=3）
2. **引导 Banner（info）**：「共享中心向 APA 权限引擎注册 12 个 `SC_*` 权限点（命名 `SC_{ENTITY}_{ACTION}`），由 APA AuthContext 统一承载 `hasPermission()` 检查。角色绑定可在 APA 管理后台调整。」
3. **Section A — 权限点（按 5 类分组卡片）**
   - 资产浏览 / 资产操作 / 展示与上架 / 审批 / 管理
   - 每张卡片：分类标题 + 该分类下的权限点列表，每条 = `Tag(SC_*)` + 一行说明文字
4. **Section B — 内置角色模板**
   - 4 张角色卡片（管理员 / 上架者 / 审批者 / 使用者）：角色名 + 一句定位 + 已绑定权限点 Tag 云 + 权限点数量统计
5. **Section C — 角色 × 权限矩阵**
   - Semi `Table size="small"`：第一列「权限点」，后 4 列对应 4 个角色，单元格用 `IconTickCircle`（绑定）/ `—`（未绑定）
   - 表头加 ARCH 角色映射小字（如「资产上架者 / 上架者」）
6. **Section D — 业务规则提示（tertiary 文本）**
   - BR-PERM-SC-002：`publishedBy` 匹配业务层判断
   - BR-PERM-SC-003：DEV_CENTER 元信息只读

---

## 二、权限点与角色绑定数据（写入常量）

```text
分类               权限点                  绑定角色（管/上/审/使）
资产浏览           SC_ASSET_VIEW           ✓ ✓ ✓ ✓
资产浏览           SC_ASSET_REUSE          ✓ ✓ ✓ ✓
资产操作           SC_ASSET_CREATE         ✓ ✓ · ·
资产操作           SC_ASSET_EDIT           ✓ ✓ · ·
资产操作           SC_ASSET_DELETE         ✓ ✓ · ·
展示与上架         SC_DISPLAY_EDIT         ✓ ✓ · ·
展示与上架         SC_PUBLISH_SUBMIT       ✓ ✓ · ·
展示与上架         SC_PUBLISH_MANAGE       ✓ ✓ · ·
展示与上架         SC_PUBLISH_FEATURE      ✓ ✓ · ·
审批               SC_APPROVAL_VIEW        ✓ · ✓ ·
审批               SC_APPROVAL_HANDLE      ✓ · ✓ ·
管理               SC_ADMIN_RULE           ✓ · · ·
```

每个权限点描述照搬 L1 §4.1 表格。

---

## 三、文件改动

### 1. `src/pages/SharingCenter/Admin/Permissions/index.tsx`（重写）
- 移除旧 `GROUPS`（entity/items）与 `roles` 文本拼接
- 新增 `PERMISSION_GROUPS`（5 类 × 12 点，含 i18n 描述 key）
- 新增 `ROLE_TEMPLATES`（4 角色 + 绑定数组 + ARCH 映射 key）
- 渲染顺序：Title → Banner → 权限点分组卡片 → 角色卡片 → 角色×权限矩阵 → 规则提示
- 图标：`IconTickCircle`（Semi）表示绑定；表格首列固定列名

### 2. `src/pages/SharingCenter/Admin/Permissions/index.less`
- 保留 `.entity-grid` 样式，重命名为 `.permission-groups`
- 新增 `.role-grid`（4 列响应式，<900 视口降为 2 列）
- `.matrix-section .semi-table-cell` 内 ✓ 居中

### 3. `public/i18n/zh-CN.json` 与 `public/i18n/en.json` — `sharing.admin.permissions`
- **改写**：`pageTitle`、`notice`
- **新增**：
  - `groups.{browse|operate|publish|approval|admin}` 五个分类标题
  - `points.{SC_*}.label` 与 `points.{SC_*}.desc`（12 × 2）
  - `roles.{admin|publisher|approver|consumer}.label`、`.summary`、`.archMapping`
  - `sectionTitles.points` / `.roles` / `.matrix`
  - `matrix.permission` 列名
  - `rules.br002` / `rules.br003`
- **删除**：`entities.*`、`entityTitle`、`roleTitle`、`col.{role|apa|permissions}`、`allPermissions`、旧 `roles.creator` 等冗余键

### 4. 不动
- 路由、菜单入口、`Permissions` 文件夹位置不改
- 不引入新的 mock store（纯静态页）

---

## 四、验收点

- [ ] 页面标题「权限点与角色」，Banner 文案含「12 个 `SC_*`」「APA AuthContext」
- [ ] 5 张分类卡片共显示 12 个 `SC_*` Tag，每条带说明
- [ ] 4 张角色卡片显示绑定权限点数（12/9/4/2）
- [ ] 角色×权限矩阵 12 行 5 列，✓ 数与上表完全一致
- [ ] 中英文切换无 missing key；旧 entity.* 键彻底移除
- [ ] 1006px 视口下卡片不挤压、矩阵不出现横向滚动条溢出
