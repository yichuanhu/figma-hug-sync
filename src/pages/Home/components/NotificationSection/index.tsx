import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@douyinfe/semi-ui';
import { ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import SeverityTag from '@/pages/NotificationCenter/components/SeverityTag';
import RelativeTime from '@/pages/Requirements/RequirementsWorkbench/components/RelativeTime';
import { mockNotifications } from '@/pages/NotificationCenter/mockData';
import './index.less';

const NotificationSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

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
          <button className="notification-more-btn" onClick={() => navigate('/notification-center')}>
            <span>{t('homepage.notifications.more')}</span>
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="notification-list">
          {mockNotifications.slice(0, 5).map((item) => (
            <div key={item.id} className="notification-item">
              <div className="notification-item-content">
                <div className="notification-item-title-row">
                  <SeverityTag severity={item.severity} />
                  <span className={`notification-item-title ${item.read ? '' : 'unread'}`}>{item.title}</span>
                </div>
                <div className="notification-item-time">
                  <RelativeTime value={item.createdAt} />
                </div>
              </div>
              <span className={`notification-item-dot ${item.read ? 'read' : 'unread'}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationSection;
