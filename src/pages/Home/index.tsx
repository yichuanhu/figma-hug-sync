import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import WelcomeSection from './components/WelcomeSection';
import ShortcutsSection from './components/ShortcutsSection';
import MetricsSection from './components/MetricsSection';
import NotificationSection from './components/NotificationSection';
import ColumnEmpty from './components/ColumnEmpty';
import './index.less';

const Home = () => {
  const navigate = useNavigate();

  const leftModules = [<ShortcutsSection key="s" />, <MetricsSection key="m" />].filter(Boolean);

  return (
    <div className="home-page">
      <WelcomeSection />
      <div className="home-content">
        <div className="home-left-column">
          {leftModules.length > 0 ? (
            leftModules
          ) : (
            <ColumnEmpty
              icon={<Sparkles size={22} strokeWidth={2} />}
              title="暂无可用模块"
              description="当前左栏的快速开始与核心指标模块均已隐藏，开启后将在此处展示。"
              actionText="前往个性化设置"
              onAction={() => navigate('/personal-center')}
            />
          )}
        </div>
        <div className="home-right-column">
          <NotificationSection />
        </div>
      </div>
    </div>
  );
};

export default Home;
