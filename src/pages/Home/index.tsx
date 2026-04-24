import WelcomeSection from './components/WelcomeSection';
import ShortcutsSection from './components/ShortcutsSection';
import MetricsSection from './components/MetricsSection';
import NotificationSection from './components/NotificationSection';
import ResourceSection from './components/ResourceSection';
import './index.less';

const Home = () => {
  return (
    <div className="home-page">
      <WelcomeSection />
      <div className="home-content">
        <div className="home-left-column">
          <ShortcutsSection />
          <MetricsSection />
        </div>
        <div className="home-right-column">
          <NotificationSection />
          <ResourceSection />
        </div>
      </div>
    </div>
  );
};

export default Home;
