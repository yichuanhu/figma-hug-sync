import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// 直接导入 laiye 主题的编译后 CSS
import '@semi-bot/semi-theme-laiye/semi.css';
// 全局样式
import './styles/index.less';
// 项目样式
import './index.less';

createRoot(document.getElementById("root")!).render(<App />);
