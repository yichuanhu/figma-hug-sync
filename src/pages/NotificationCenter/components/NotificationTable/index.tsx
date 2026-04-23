import { useTranslation } from 'react-i18next';
import { Typography, Tooltip } from '@douyinfe/semi-ui';
import { Bot, CalendarClock, Check, CheckSquare, Shield } from 'lucide-react';
import RelativeTime from '@/pages/Requirements/RequirementsWorkbench/components/RelativeTime';
import EmptyState from '@/components/EmptyState';
import SeverityTag from '../SeverityTag';
import CategoryBadge from '../CategoryBadge';
import type { Notification, NotificationCategory } from '@/pages/NotificationCenter/types';
import './index.less';

interface Props {
  data: Notification[];
  onOpen: (n: Notification) => void;
  onMarkRead: (id: string) => void;
  hasFilters: boolean;
}

const iconMap: Record<NotificationCategory, typeof CheckSquare> = {
  task: CheckSquare,
  robot: Bot,
  trigger: CalendarClock,
  license: Shield,
};

// 与 Stats 卡片色系保持一致
const colorMap: Record<NotificationCategory, { fg: string; bg: string }> = {
  task: { fg: '#3370FF', bg: '#F1F5FF' },
  robot: { fg: '#FF7D00', bg: '#FFF4E8' },
  trigger: { fg: '#0E9F9F', bg: '#E8F8F8' },
  license: { fg: '#7C3AED', bg: '#F3EEFF' },
};

const NotificationTable = ({ data, onOpen, onMarkRead, hasFilters }: Props) => {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <div className="notification-list-empty">
        <EmptyState
          variant={hasFilters ? 'noResult' : 'noData'}
          description={hasFilters ? t('common.noResult') : t('notificationCenter.empty')}
        />
      </div>
    );
  }

  return (
    <ul className="notification-list">
      {data.map((n) => {
        const Icon = iconMap[n.category];
        const { fg, bg } = colorMap[n.category];
        return (
          <li
            key={n.id}
            className={`notification-list-item ${n.read ? 'read' : 'unread'}`}
            onClick={() => onOpen(n)}
          >
            <div className="notification-list-item-avatar" style={{ backgroundColor: bg, color: fg }}>
              <Icon size={18} strokeWidth={2} />
            </div>

            <div className="notification-list-item-main">
              <div className="notification-list-item-title-row">
                <Typography.Text
                  strong={!n.read}
                  ellipsis={{ showTooltip: { opts: { content: n.title } } }}
                  className="notification-list-item-title"
                >
                  {n.title}
                </Typography.Text>
              </div>

              <Typography.Text
                type="tertiary"
                size="small"
                ellipsis={{ showTooltip: { opts: { content: n.description } } }}
                className="notification-list-item-desc"
              >
                {n.description}
              </Typography.Text>

              <div className="notification-list-item-meta">
                <SeverityTag severity={n.severity} />
                <CategoryBadge category={n.category} />
                <span className="notification-list-item-meta-time">
                  <RelativeTime value={n.createdAt} />
                </span>
              </div>
            </div>

            <div className="notification-list-item-side" onClick={(e) => e.stopPropagation()}>
              {!n.read ? (
                <Tooltip content={t('notificationCenter.actions.markRead')}>
                  <button
                    type="button"
                    className="notification-list-item-read-btn"
                    onClick={() => onMarkRead(n.id)}
                    aria-label={t('notificationCenter.actions.markRead')}
                  >
                    <span className="notification-list-item-read-btn-dot" />
                    <Check className="notification-list-item-read-btn-icon" size={14} strokeWidth={2.5} />
                  </button>
                </Tooltip>
              ) : (
                <span className="notification-list-item-dot read" />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default NotificationTable;
