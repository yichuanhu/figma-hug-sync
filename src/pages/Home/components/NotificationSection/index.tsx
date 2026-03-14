import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@douyinfe/semi-ui';
import { ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import { notifications } from '../../mockData';
import './index.less';

const NotificationSection = () => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className={`home-card notification-section ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="home-card-header">
        <div className="notification-title-group">
          <span className="home-card-title">{t('homepage.notifications.title')}</span>
          {unreadCount > 0 && <Badge count={unreadCount} />}
        </div>
        <div className="notification-actions">
          <button
            className="notification-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
          >
            <span>{collapsed ? t('homepage.notifications.expand') : t('homepage.notifications.collapse')}</span>
            {collapsed ? <ChevronDown size={14} strokeWidth={2} /> : <ChevronUp size={14} strokeWidth={2} />}
          </button>
          <button className="notification-more-btn">
            <span>{t('homepage.notifications.more')}</span>
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
      {!collapsed && (
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
      )}
    </div>
  );
};

export default NotificationSection;
