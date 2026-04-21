

## 计划：重写《资源依赖前置 — 流程级别管理》需求文档

依据现有代码实现，对文档进行同步更新。重点补充原文档缺失的「依赖失效（MISSING）」相关交互与逻辑。

### 主要变化点（相对旧文档）

1. **数据模型新增 `status` 字段**：`'ACTIVE' | 'MISSING'`，标记资源是否仍在业务资产表中存在
2. **新增「失效依赖」交互**：
   - DependencyTab 顶部出现警示 Banner（X 项资源已失效）
   - 失效项卡片置灰、不可跳转，显示「前往创建」按钮（携带 defaultName 跳转到对应资源管理页打开创建弹窗）
   - 手动添加按钮（删除）对失效项隐藏
3. **上传版本后失效依赖告警**：新依赖中如有 MISSING，弹出 Modal 列出失效资源名称 + 「前往处理」按钮跳转到资源依赖 Tab；纯新增则 Toast「自动解析出 N 项新资源依赖」
4. **创建发布时阻断**：聚合资源列表中存在 MISSING 时不允许进入下一步，并提供跳转到该流程依赖 Tab 的入口
5. **资源跳转支持双上下文**：`development` → `/dev-center/business-assets/...`；`scheduling` → `/scheduling-center/business-assets/...`
6. **资源值展示规则细化**：
   - PARAMETER：development 显示「测试值」、scheduling 显示「生产值」
   - CREDENTIAL：显示「用户名/账号」字段（不是统一掩码）
   - QUEUE / FILE：仅显示资源名 + 来源标签

### 文档新版结构

```text
一、需求背景与目标
  1.1 现状（发布时实时解析）
  1.2 变更目标（前置到流程维度）
  1.3 变更驱动（前端 UI 优化驱动）

二、核心设计
  - ASCII 示意图
  - 关键规则：增量合并 / 手动永久 / resource_id 去重
  - 新增：失效检测规则（每次读取时与业务资产表比对，标记 status）

三、数据模型
  3.1 LYProcessDependency（含 status 字段）
  3.2 LYProcessResponse / LYPublishableProcessResponse 扩展

四、前端实现说明
  4.1 流程详情抽屉「资源依赖」Tab
      - 分组、卡片、跳转、删除规则
      - 失效 Banner + 失效卡片 + 前往创建
      - context: development / scheduling 行为差异
  4.2 上传版本交互
      - 增量合并 + Toast / Modal 告警
  4.3 创建发布
      - 聚合 dependencies、移除 detectDependencies
      - MISSING 阻断 + 跳转处理

五、后端变更需求
  5.1 上传后自动解析 + 增量合并
  5.2 流程依赖 CRUD 接口
  5.3 流程详情接口扩展（含 status 计算）
  5.4 发布列表接口适配
  5.5 资源失效状态计算（每次响应时与业务资产表 LEFT JOIN，缺失则 status=MISSING）

六、前后端对接要点（表格，新增失效场景行）

七、实施顺序建议
```

### 输出

将重写后的文档写入 `/mnt/documents/资源依赖前置_流程级别管理_需求文档.md`（覆盖原文件），并以 `presentation-artifact` 形式呈现给用户。文档全程使用中文。

