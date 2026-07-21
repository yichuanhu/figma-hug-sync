import { useTranslation } from 'react-i18next';
import { Tag, Modal, Typography } from '@douyinfe/semi-ui';
import useEmblaCarousel from 'embla-carousel-react';
import { useState, useEffect, useCallback } from 'react';
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

const priorityConfig: Record<string, { color: 'red' | 'orange' | 'blue'; label: string }> = {
  urgent: { color: 'red', label: 'Urgent' },
  important: { color: 'orange', label: 'Important' },
  normal: { color: 'blue', label: 'Normal' },
};

const MAX_BADGE_TEXT_LENGTH = 4;

const formatBadgeText = (text: string) => text.slice(0, MAX_BADGE_TEXT_LENGTH);

const AnnouncementSection = () => {
  const { t } = useTranslation();
  usePlatformOpsData();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [detail, setDetail] = useState<PlatformAnnouncement | null>(null);

  const resolveBannerImage = (b: PlatformAnnouncement) => {
    if (b.bannerImageUrl) return b.bannerImageUrl;
    if (b.bannerImageKey && bannerImageMap[b.bannerImageKey]) return bannerImageMap[b.bannerImageKey];
    return undefined;
  };

  // 方案 A：Banner 位只展示配置了图片的公告；无图公告一律走右侧列表
  const banners = getBannerAnnouncements().filter((b) => !!resolveBannerImage(b));
  const hasBanners = banners.length > 0;
  const announcements = getPublishedAnnouncements(hasBanners ? 3 : 6);

  const defaultBadgeText = t('homepage.announcements.badge.new');
  const badgeText = formatBadgeText(defaultBadgeText);

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




  return (
    <div className="home-card announcement-section">
      <div className="home-card-header">
        <span className="home-card-title">{t('homepage.announcements.title')}</span>
      </div>

      <div className={`announcement-body${hasBanners ? '' : ' no-banner'}`}>
        {hasBanners && (
          <div className="banner-carousel" ref={emblaRef}>
            <div className="banner-carousel-container">
              {banners.map((banner, index) => {
                const img = resolveBannerImage(banner)!;
                return (
                  <div
                    key={banner.id}
                    className="banner-slide has-image"
                    onClick={() => setDetail(banner)}
                  >
                    {index === 0 && (
                      <div
                        className="banner-slide-badge"
                        title={defaultBadgeText.length > MAX_BADGE_TEXT_LENGTH ? defaultBadgeText : undefined}
                      >
                        {badgeText}
                      </div>
                    )}
                    <img src={img} alt={banner.title} className="banner-slide-image" />
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
        )}

        <div className="announcement-list">
          {announcements.map((item) => {
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
