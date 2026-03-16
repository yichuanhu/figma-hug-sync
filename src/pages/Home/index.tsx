import WelcomeSection from './components/WelcomeSection';
import CenterEntrySection from './components/CenterEntrySection';
import ShortcutsSection from './components/ShortcutsSection';
import MetricsSection from './components/MetricsSection';
import RecentActivitySection from './components/RecentActivitySection';
import NotificationSection from './components/NotificationSection';
import AnnouncementSection from './components/AnnouncementSection';
import ResourceSection from './components/ResourceSection';
import './index.less';

const Home = () => {
  return (
    <div className="home-page">
      <WelcomeSection />
      <CenterEntrySection />
      <div className="home-content">
        <div className="home-left-column">
          <ShortcutsSection />
          <MetricsSection />
          <AnnouncementSection />
        </div>
        <div className="home-right-column">
          <NotificationSection />
          <RecentActivitySection />
          <ResourceSection />
        </div>
      </div>
    </div>
  );
};

export default Home;
