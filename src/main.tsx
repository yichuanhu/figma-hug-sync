import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// 直接导入 laiye 主题的编译后 CSS
import '@semi-bot/semi-theme-laiye/semi.css';
import './index.css';

createRoot(document.getElementById("root")!).render(<App />);
