import { useTranslation } from 'react-i18next';
import { Badge } from '@douyinfe/semi-ui';
import { notifications } from '../../mockData';
import './index.less';

const NotificationSection = () => {
  const { t } = useTranslation();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="home-card notification-section">
      <div className="home-card-header">
        <span className="home-card-title">{t('homepage.notifications.title')}</span>
        {unreadCount > 0 && <Badge count={unreadCount} />}
      </div>
      <div className="notification-list">
        {notifications.map((item) => (
          <div key={item.id} className="notification-item">
            <div className={`notification-item-dot ${item.read ? 'read' : 'unread'}`} />
            <div className="notification-item-content">
              <div className="notification-item-title">{item.title}</div>
              <div className="notification-item-time">{item.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationSection;
