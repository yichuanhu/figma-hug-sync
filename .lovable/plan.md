我看到的问题是：你那边编辑器预览一直显示 `Preview has not been built yet`，但我这边用独立预览会正常渲染首页，所以这更像是预览 iframe / dev server / HMR 状态卡住，或者某次全局状态样式改动触发了构建链路不稳定，而不是某个页面本身白屏。

Do I know what the issue is? 目前可以确认：不是首页运行时崩溃；还不能确认是否存在隐藏的构建错误，需要进一步用构建日志和预览服务状态验证。

## 处理计划

1. **先恢复预览服务状态**
   - 重启 Vite 预览服务，排除编辑器 iframe 缓存或 HMR 卡死。
   - 重新打开首页和你之前所在页面，确认是否还出现 `Preview has not been built yet`。

2. **检查最近改动的高风险点**
   - 重点检查全局状态字段改造涉及的文件：
     - `src/components/StatusDot/index.tsx`
     - `src/components/StatusDot/index.less`
     - `src/components/sharing/StatusTag/index.tsx`
     - 需求中心、调度中心、开发中心、运营中心里被替换 `<Tag>` 的页面
   - 排查是否存在导入路径、类型、Less 编译、Semi Tag color 类型不兼容等问题。

3. **如果有构建错误，直接修复根因**
   - 若是某些状态颜色值不兼容，统一在共享 `StatusDot` 内做兜底映射。
   - 若是某些文件缺少导入或仍引用已移除的 `Tag`，补齐或清理。
   - 若是 HMR 组件导出不稳定，只处理相关导出结构，不扩大范围。

4. **验证**
   - 确认构建/类型检查通过。
   - 用浏览器预览验证首页和一个状态字段页面都能正常打开。
   - 如果我的预览正常但你那边编辑器仍是黑屏，我会明确告诉你这是编辑器预览缓存/平台侧占位，需要刷新或从历史恢复对比。

## 兜底方案

如果修复后仍频繁出现同样问题，我会建议先回退到全局状态样式改造前的稳定版本，再分模块小步改造，避免一次性改动太多页面导致预览链路反复不稳定。

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>