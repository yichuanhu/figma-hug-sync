import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// i18n 国际化配置
import './i18n';
// 直接导入 laiye 主题的编译后 CSS
import '@semi-bot/semi-theme-laiye/semi.css';
// Semi 样式覆盖（必须在 semi.css 之后）
import './styles/semi-overrides.css';
// 全局样式
import './styles/index.less';
// 项目样式
import './styles/app.less';

createRoot(document.getElementById("root")!).render(<App />);
