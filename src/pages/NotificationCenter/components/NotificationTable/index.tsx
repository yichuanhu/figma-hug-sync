import { useTranslation } from 'react-i18next';
import { Typography, Tooltip } from '@douyinfe/semi-ui';
import { Check } from 'lucide-react';
import RelativeTime from '@/pages/Requirements/RequirementsWorkbench/components/RelativeTime';
import EmptyState from '@/components/EmptyState';
import SeverityTag from '../SeverityTag';
import CategoryBadge from '../CategoryBadge';
import type { Notification } from '@/pages/NotificationCenter/types';
import './index.less';

interface Props {
  data: Notification[];
  onOpen: (n: Notification) => void;
  onMarkRead: (id: string) => void;
  hasFilters: boolean;
}

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
      {data.map((n) => (
        <li
          key={n.id}
          className={`notification-list-item ${n.read ? 'read' : 'unread'}`}
          onClick={() => onOpen(n)}
        >
          <div className="notification-list-item-main">
            <div className="notification-list-item-title-row">
              <SeverityTag severity={n.severity} />
              <CategoryBadge category={n.category} />
              <Typography.Text
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
              <RelativeTime value={n.createdAt} />
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
      ))}
    </ul>
  );
};

export default NotificationTable;
