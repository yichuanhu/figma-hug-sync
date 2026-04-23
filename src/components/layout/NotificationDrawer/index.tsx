import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SideSheet, Tabs, TabPane, Button, Tooltip, Typography, Toast } from '@douyinfe/semi-ui';
import { ArrowRight, CheckCheck, Settings, X, Check } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import RelativeTime from '@/pages/Requirements/RequirementsWorkbench/components/RelativeTime';
import SeverityTag from '@/pages/NotificationCenter/components/SeverityTag';
import CategoryBadge from '@/pages/NotificationCenter/components/CategoryBadge';
import { mockNotifications } from '@/pages/NotificationCenter/mockData';
import type { Notification, NotificationCategory } from '@/pages/NotificationCenter/types';
import { openNotification } from '@/utils/notificationLink';
import './index.less';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type TabKey = 'all' | 'unread';
type CatKey = 'all' | NotificationCategory;

const NotificationDrawer = ({ visible, onClose }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [list, setList] = useState<Notification[]>(mockNotifications);
  const [tab, setTab] = useState<TabKey>('all');
  const [cat, setCat] = useState<CatKey>('all');

  const unreadCount = useMemo(() => list.filter((n) => !n.read).length, [list]);
  const filtered = useMemo(() => {
    return list
      .filter((n) => (tab === 'unread' ? !n.read : true))
      .filter((n) => (cat === 'all' ? true : n.category === cat))
      .slice(0, 20);
  }, [list, tab, cat]);

  const handleMarkRead = (id: string) => {
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllRead = () => {
    setList((prev) => prev.map((n) => ({ ...n, read: true })));
    Toast.success(t('notificationCenter.toast.allRead'));
  };

  const handleOpen = (n: Notification) => {
    openNotification(n, navigate, handleMarkRead);
    onClose();
  };

  const handleViewAll = () => {
    onClose();
    navigate('/notification-center');
  };

  const cats: { key: CatKey; label: string }[] = [
    { key: 'all', label: t('notificationCenter.category.all') },
    { key: 'task', label: t('notificationCenter.category.task') },
    { key: 'robot', label: t('notificationCenter.category.robot') },
    { key: 'trigger', label: t('notificationCenter.category.trigger') },
    { key: 'license', label: t('notificationCenter.category.license') },
  ];

  return (
    <SideSheet
      visible={visible}
      onCancel={onClose}
      width={480}
      mask={false}
      className="notification-drawer"
      placement="right"
      headerStyle={{ display: 'none' }}
    >
      <div className="notification-drawer-header">
        <span className="notification-drawer-title">{t('notificationCenter.title')}</span>
        <div className="notification-drawer-header-actions">
          <Tooltip content={t('notificationCenter.actions.markAllRead')}>
            <Button
              theme="borderless"
              type="tertiary"
              size="small"
              disabled={unreadCount === 0}
              icon={<CheckCheck size={16} strokeWidth={2} />}
              onClick={handleMarkAllRead}
            />
          </Tooltip>
          <Button
            theme="borderless"
            type="tertiary"
            size="small"
            icon={<X size={16} strokeWidth={2} />}
            onClick={onClose}
          />
        </div>
      </div>

      <Tabs
        type="line"
        size="small"
        activeKey={tab}
        onChange={(k) => setTab(k as TabKey)}
        className="notification-drawer-tabs"
      >
        <TabPane itemKey="all" tab={`${t('notificationCenter.tabs.all')} (${list.length > 99 ? '99+' : list.length})`} />
        <TabPane itemKey="unread" tab={`${t('notificationCenter.tabs.unread')} (${unreadCount > 99 ? '99+' : unreadCount})`} />
      </Tabs>

      <div className="notification-drawer-cats">
        {cats.map((c) => (
          <button
            key={c.key}
            className={`notification-drawer-cat ${cat === c.key ? 'active' : ''}`}
            onClick={() => setCat(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="notification-drawer-list">
        {filtered.length === 0 ? (
          <div className="notification-drawer-empty">
            <EmptyState description={t('notificationCenter.empty')} size={120} />
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`notification-drawer-item ${n.read ? 'read' : 'unread'}`}
              onClick={() => handleOpen(n)}
            >
              <span className={`notification-drawer-item-dot ${n.read ? 'read' : 'unread'}`} />
              <div className="notification-drawer-item-content">
                <div className="notification-drawer-item-meta">
                  <SeverityTag severity={n.severity} />
                  <CategoryBadge category={n.category} />
                </div>
                <Typography.Text
                  strong={!n.read}
                  className="notification-drawer-item-title"
                  ellipsis={{ rows: 2, showTooltip: { opts: { content: n.title } } }}
                >
                  {n.title}
                </Typography.Text>
                <Typography.Text
                  type="tertiary"
                  size="small"
                  className="notification-drawer-item-desc"
                  ellipsis={{ rows: 2, showTooltip: { opts: { content: n.description } } }}
                >
                  {n.description}
                </Typography.Text>
                <div className="notification-drawer-item-footer">
                  <RelativeTime value={n.createdAt} />
                  <div className="notification-drawer-item-actions" onClick={(e) => e.stopPropagation()}>
                    {!n.read && (
                      <Tooltip content={t('notificationCenter.actions.markRead')}>
                        <Button
                          theme="borderless"
                          type="tertiary"
                          size="small"
                          icon={<Check size={14} strokeWidth={2} />}
                          onClick={() => handleMarkRead(n.id)}
                        />
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="notification-drawer-footer">
        <Button
          block
          theme="light"
          type="primary"
          icon={<ArrowRight size={14} strokeWidth={2} />}
          iconPosition="right"
          onClick={handleViewAll}
        >
          {t('notificationCenter.drawer.viewAll')}
        </Button>
      </div>
    </SideSheet>
  );
};

export default NotificationDrawer;
