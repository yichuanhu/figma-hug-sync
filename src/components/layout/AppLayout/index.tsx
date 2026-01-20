import { useState, ReactNode } from 'react';
import Sidebar from '../Sidebar';
import './index.less';

interface AppLayoutProps {
    children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="app-layout">
            {/* 侧边栏 */}
            <div className={`sidebar-container ${collapsed ? 'collapsed' : 'expanded'}`}>
                <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
            </div>

            {/* 内容区域 */}
            <div className="content-area">
                <div className="content-card">{children}</div>
            </div>
        </div>
    );
};

export default AppLayout;
