import { useTranslation } from 'react-i18next';
import { Tag, Modal, Typography } from '@douyinfe/semi-ui';
import useEmblaCarousel from 'embla-carousel-react';
import { useState, useEffect, useCallback } from 'react';
import { Palette, Cpu, Megaphone } from 'lucide-react';
import type { PlatformAnnouncement } from '@/pages/Operations/PlatformOperations/mockData';
import {
  getBannerAnnouncements,
  getPublishedAnnouncements,
  usePlatformOpsData,
} from '@/pages/Operations/PlatformOperations/mockData';
import apaCreatorBanner from '@/assets/banners/apa-creator-release.png';
import apaWorkerBanner from '@/assets/banners/apa-worker-release.png';
import './index.less';

const bannerImageMap: Record<string, string> = {
  'apa-creator-release': apaCreatorBanner,
  'apa-worker-release': apaWorkerBanner,
};

const bannerIconMap: Record<string, React.ComponentType<any>> = {
  Palette,
  Cpu,
  Megaphone,
};

const priorityConfig: Record<string, { color: 'red' | 'orange' | 'blue'; label: string }> = {
  urgent: { color: 'red', label: 'Urgent' },
  important: { color: 'orange', label: 'Important' },
  normal: { color: 'blue', label: 'Normal' },
};

const AnnouncementSection = () => {
  const { t } = useTranslation();
  usePlatformOpsData();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [detail, setDetail] = useState<PlatformAnnouncement | null>(null);

  const banners = getBannerAnnouncements();
  const announcements = getPublishedAnnouncements(5);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    const interval = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => {
      clearInterval(interval);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const resolveBannerImage = (b: ReturnType<typeof getBannerAnnouncements>[number]) => {
    if (b.bannerImageUrl) return b.bannerImageUrl;
    if (b.bannerImageKey && bannerImageMap[b.bannerImageKey]) return bannerImageMap[b.bannerImageKey];
    return undefined;
  };

  return (
    <div className="home-card announcement-section">
      <div className="home-card-header">
        <span className="home-card-title">{t('homepage.announcements.title')}</span>
      </div>

      <div className="announcement-body">
        <div className="banner-carousel" ref={emblaRef}>
          <div className="banner-carousel-container">
            {banners.map((banner) => {
              const img = resolveBannerImage(banner);
              const IconComp = banner.bannerIcon ? bannerIconMap[banner.bannerIcon] : undefined;
              return (
                <div
                  key={banner.id}
                  className={`banner-slide${img ? ' has-image' : ''}`}
                  style={img ? undefined : { background: banner.bannerGradient ?? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  onClick={() => setDetail(banner)}
                >
                  {img ? (
                    <img src={img} alt={banner.title} className="banner-slide-image" />
                  ) : (
                    <>
                      <div className="banner-slide-content">
                        <div className="banner-slide-title">{banner.title}</div>
                        <div className="banner-slide-subtitle">{banner.summary}</div>
                        {banner.bannerVersion && (
                          <div className="banner-slide-version">{banner.bannerVersion}</div>
                        )}
                      </div>
                      <div className="banner-slide-icon">
                        {IconComp ? <IconComp size={48} strokeWidth={1.5} /> : <Megaphone size={48} strokeWidth={1.5} />}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {banners.length > 1 && (
            <div className="banner-dots">
              {banners.map((_, index) => (
                <button
                  key={index}
                  className={`banner-dot ${index === selectedIndex ? 'active' : ''}`}
                  onClick={() => emblaApi?.scrollTo(index)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="announcement-list">
          {announcements.slice(0, 3).map((item) => {
            const config = priorityConfig[item.priority];
            return (
              <div key={item.id} className="announcement-item" onClick={() => setDetail(item)}>
                <div className="announcement-item-left">
                  <div className="announcement-item-title-row">
                    <Tag color={config.color} size="small">{config.label}</Tag>
                    <span className="announcement-item-title">{item.title}</span>
                  </div>
                  {item.summary && <div className="announcement-item-subtitle">{item.summary}</div>}
                </div>
                <div className="announcement-item-time">
                  {item.publishedAt ? item.publishedAt.slice(0, 10) : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        title={detail?.title}
        visible={!!detail}
        onCancel={() => setDetail(null)}
        footer={null}
        width={520}
        centered
      >
        {detail && (
          <div className="announcement-detail">
            <div className="announcement-detail-meta">
              <Tag color={priorityConfig[detail.priority].color} size="small">
                {priorityConfig[detail.priority].label}
              </Tag>
              {detail.publishedAt && (
                <Typography.Text type="tertiary" size="small">
                  {detail.publishedAt.slice(0, 16).replace('T', ' ')}
                </Typography.Text>
              )}
            </div>
            {detail.summary && (
              <Typography.Paragraph className="announcement-detail-summary">
                {detail.summary}
              </Typography.Paragraph>
            )}
            <Typography.Paragraph className="announcement-detail-content">
              {detail.content}
            </Typography.Paragraph>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AnnouncementSection;
