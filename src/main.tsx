import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// 直接导入 laiye 主题的编译后 CSS
import '@semi-bot/semi-theme-laiye/semi.css';
// Tailwind CSS
import './tailwind.css';
// 项目样式
import './index.less';
// 导入 i18n 配置
import './i18n';

createRoot(document.getElementById("root")!).render(<App />);
