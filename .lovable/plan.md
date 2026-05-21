# 修正方案模板激活确认文案

## 问题
方案/模板激活时弹出的确认框文案是「确定将模板「xxx」设为激活状态？同租户下其他模板将自动失效。」

这是旧版单激活逻辑遗留的文案。实际代码（`schemeConfig.ts` 的 `activateScheme`）已在 STORY-013 v4 改为**多激活**——激活一个方案不再下线其它方案，多个方案可同时生效，按"适用部门"匹配。

## 改动范围
仅修改 i18n 文案，不动业务逻辑。

### `public/i18n/zh-CN.json`
- `requirements.scheme.activateContent`（行 732）
  - 旧：`确定激活模板「{{name}}」？同租户下其他模板将自动失效。`
  - 新：`确定激活模板「{{name}}」？激活后将按"适用部门"参与需求创建的方案匹配。`
- `requirements.scheme.builder.activateContent`（行 833）
  - 旧：`确定将模板「{{name}}」设为激活状态？同租户下其他模板将自动失效。`
  - 新：`确定将模板「{{name}}」设为激活状态？激活后将按"适用部门"参与需求创建的方案匹配。`

### `public/i18n/en.json`
- 同位置两条 `activateContent`：
  - 新：`Activate template "{{name}}"? Once activated, it will participate in scheme matching based on its applicable departments.`

## 不改动
- `schemeConfig.ts` / `RequirementsScheme/index.tsx` / `SchemeBuilder/index.tsx` 业务逻辑保持不变（已是多激活）。
- "适用部门"被其他激活模板占用时的灰显/提示逻辑保持不变。

## 预防
后续涉及"激活/停用/互斥"等业务语义变更时，同步检查 `public/i18n/*.json` 中的相关 `*Title` / `*Content` / `*Tip` 文案，避免逻辑与文案脱节。
