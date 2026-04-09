import { createRoot } from "react-dom/client";
import { Toast } from '@douyinfe/semi-ui';
import '@douyinfe/semi-ui/lib/es/_base/base.css';

import App from "./App.tsx";
import './i18n';
import './styles/semi-overrides.css';
import './styles/index.less';
import './styles/app.less';

// 全局设置 Toast 为多色样式
Toast.config({ theme: 'light' });

createRoot(document.getElementById("root")!).render(<App />);
