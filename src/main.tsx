import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// 导入 Laiye 主题 CSS (已包含 Semi UI 基础样式)
import '@semi-bot/semi-theme-laiye/semi.min.css';
import './index.css';

createRoot(document.getElementById("root")!).render(<App />);
