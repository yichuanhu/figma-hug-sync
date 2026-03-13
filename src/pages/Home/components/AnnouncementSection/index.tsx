import { useTranslation } from 'react-i18next';
import { Tag } from '@douyinfe/semi-ui';
import { announcements } from '../../mockData';
import './index.less';

const priorityConfig: Record<string, { color: 'red' | 'orange' | 'blue'; label: string }> = {
  urgent: { color: 'red', label: '紧急' },
  important: { color: 'orange', label: '重要' },
  normal: { color: 'blue', label: '普通' },
};

const AnnouncementSection = () => {
  const { t } = useTranslation();

  return (
    <div className="home-card announcement-section">
      <div className="home-card-header">
        <span className="home-card-title">{t('homepage.announcements.title')}</span>
      </div>
      <div className="announcement-list">
        {announcements.map((item) => {
          const config = priorityConfig[item.priority];
          return (
            <div key={item.id} className="announcement-item">
              <Tag color={config.color} size="small">{config.label}</Tag>
              <div className="announcement-item-content">
                <div className="announcement-item-title">{item.title}</div>
                <div className="announcement-item-time">{item.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnnouncementSection;
