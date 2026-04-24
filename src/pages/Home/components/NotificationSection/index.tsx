import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Tag } from '@douyinfe/semi-ui';
import { ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import RelativeTime from '@/pages/Requirements/RequirementsWorkbench/components/RelativeTime';
import { mockNotifications } from '@/pages/NotificationCenter/mockData';
import type { NotificationSeverity } from '@/pages/NotificationCenter/types';
import './index.less';

const severityConfig: Record<NotificationSeverity, { color: string; label: string }> = {
  HIGH: { color: 'red', label: '高' },
  MEDIUM: { color: 'orange', label: '中' },
  LOW: { color: 'grey', label: '低' },
};

const NotificationSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const items = mockNotifications.slice(0, 5);
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
          {items.map((item) => {
            const sConfig = severityConfig[item.severity];
            return (
              <div key={item.id} className="notification-item">
                <div className={`notification-item-dot ${item.read ? 'read' : 'unread'}`} />
                <div className="notification-item-content">
                  <div className="notification-item-title-row">
                    <Tag size="small" color={sConfig.color as any}>{sConfig.label}</Tag>
                    <span className="notification-item-title">{item.title}</span>
                  </div>
                  <div className="notification-item-time">
                    <RelativeTime value={item.createdAt} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationSection;
