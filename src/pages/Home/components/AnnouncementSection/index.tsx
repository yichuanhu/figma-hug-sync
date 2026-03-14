import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag } from '@douyinfe/semi-ui';
import useEmblaCarousel from 'embla-carousel-react';
import { Palette, Cpu, ChevronRight } from 'lucide-react';
import { announcements, banners } from '../../mockData';
import apaCreatorBanner from '@/assets/banners/apa-creator-release.png';
import './index.less';

const bannerImageMap: Record<string, string> = {
  'apa-creator-release': apaCreatorBanner,
};

const bannerIconMap: Record<string, React.ComponentType<any>> = {
  Palette,
  Cpu,
};

const priorityConfig: Record<string, { color: 'red' | 'orange' | 'blue'; label: string }> = {
  urgent: { color: 'red', label: '紧急' },
  important: { color: 'orange', label: '重要' },
  normal: { color: 'blue', label: '普通' },
};

const AnnouncementSection = () => {
  const { t } = useTranslation();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();

    // Auto-play
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    return () => {
      clearInterval(interval);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="home-card announcement-section">
      <div className="home-card-header">
        <span className="home-card-title">{t('homepage.announcements.title')}</span>
        <span className="announcement-more">{t('homepage.announcements.viewAll')} <ChevronRight size={14} strokeWidth={2} /></span>
      </div>

      {/* Banner Carousel */}
      <div className="banner-carousel" ref={emblaRef}>
        <div className="banner-carousel-container">
          {banners.map((banner) => {
            const IconComp = bannerIconMap[banner.icon];
            return (
              <div
                key={banner.id}
                className="banner-slide"
                style={{ background: banner.gradient }}
              >
                <div className="banner-slide-content">
                  <div className="banner-slide-title">{banner.title}</div>
                  <div className="banner-slide-subtitle">{banner.subtitle}</div>
                  <div className="banner-slide-version">{banner.version}</div>
                </div>
                <div className="banner-slide-icon">
                  {IconComp && <IconComp size={48} strokeWidth={1.5} />}
                </div>
              </div>
            );
          })}
        </div>
        <div className="banner-dots">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`banner-dot ${index === selectedIndex ? 'active' : ''}`}
              onClick={() => emblaApi?.scrollTo(index)}
            />
          ))}
        </div>
      </div>

      {/* Announcement List */}
      <div className="announcement-list">
        {announcements.map((item) => {
          const config = priorityConfig[item.priority];
          return (
            <div key={item.id} className="announcement-item">
              <div className="announcement-item-left">
                <div className="announcement-item-title-row">
                  <Tag color={config.color} size="small">{config.label}</Tag>
                  <span className="announcement-item-title">{item.title}</span>
                </div>
                <div className="announcement-item-subtitle">{item.subtitle}</div>
              </div>
              <div className="announcement-item-time">{item.time}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnnouncementSection;
