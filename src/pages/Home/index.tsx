import WelcomeSection from './components/WelcomeSection';
import ShortcutsSection from './components/ShortcutsSection';
import MetricsSection from './components/MetricsSection';
import AnnouncementSection from './components/AnnouncementSection';
import NotificationSection from './components/NotificationSection';
import ResourceSection from './components/ResourceSection';
import './index.less';

const Home = () => {
  return (
    <div className="home-page">
      <WelcomeSection />
      <div className="home-content">
        <div className="home-cell home-cell-shortcuts">
          <ShortcutsSection />
        </div>
        <div className="home-cell home-cell-metrics">
          <MetricsSection />
        </div>
        <div className="home-cell home-cell-notification">
          <NotificationSection />
        </div>
        <div className="home-cell home-cell-announcement">
          <AnnouncementSection />
        </div>
        <div className="home-cell home-cell-resource">
          <ResourceSection />
        </div>
      </div>
    </div>
  );
};

export default Home;
