

## 方案 B：语言切换改为菜单项 + 右侧 Toggle

将底部独立的语言切换区域移除，改为菜单区域中的一个普通菜单项，右侧放置 `中 / EN` 文字 Toggle，点击直接切换。

### 改动范围

**`src/components/layout/UserInfoDropdown/index.tsx`**
- 移除底部 `<LanguageSwitcher />` 组件
- 在菜单项列表后新增一个语言切换菜单项，使用 `Globe` 图标，右侧渲染一个内联 Toggle（两个可点击文字 `中` 和 `EN`，当前语言高亮）
- 点击文字直接调用 `i18n.changeLanguage`，点击菜单项行本身则切换到另一种语言

**`src/components/layout/UserInfoDropdown/index.less`**
- 移除 `&__lang` 相关所有样式
- 新增 Toggle 样式：两个文字选项水平排列，当前激活项使用 `var(--semi-color-primary)` 颜色和 `font-weight: 600`，非激活项使用 `var(--semi-color-text-2)`

### 视觉效果

```text
┌──────────────────────────┐
│  👤 用户名               │
│  company                 │
├──────────────────────────┤
│  🖥  管理后台        ↗   │
│  👤  个人设置             │
│  🚪  退出登录             │
│  🌐  语言      [中] EN   │
└──────────────────────────┘
```

激活项用主色 + 加粗，非激活项为次要文字色，两者间用 `/` 分隔。

