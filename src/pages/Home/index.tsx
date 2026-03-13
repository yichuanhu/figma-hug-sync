import { useRef, useCallback, useState, useEffect } from 'react';
import WelcomeSection from './components/WelcomeSection';
import ShortcutsSection from './components/ShortcutsSection';
import MetricsSection from './components/MetricsSection';
import RecentActivitySection from './components/RecentActivitySection';
import NotificationSection from './components/NotificationSection';
import AnnouncementSection from './components/AnnouncementSection';
import ResourceSection from './components/ResourceSection';
import './index.less';

const Home = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [haloOpacity, setHaloOpacity] = useState(1);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const opacity = Math.max(0, 1 - el.scrollTop / 300);
    setHaloOpacity(opacity);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="home-page" ref={scrollRef}>
      <div className="home-halo" style={{ opacity: haloOpacity }} />
      <WelcomeSection />
      <div className="home-content">
        <div className="home-left-column">
          <ShortcutsSection />
          <MetricsSection />
          <RecentActivitySection />
        </div>
        <div className="home-right-column">
          <NotificationSection />
          <AnnouncementSection />
          <ResourceSection />
        </div>
      </div>
    </div>
  );
};

export default Home;
