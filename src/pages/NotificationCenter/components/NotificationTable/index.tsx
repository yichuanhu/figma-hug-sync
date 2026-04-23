import { useTranslation } from 'react-i18next';
import { Typography, Button, Tooltip } from '@douyinfe/semi-ui';
import { ArrowUpRight, Bot, CalendarClock, Check, CheckSquare, Shield } from 'lucide-react';
import RelativeTime from '@/pages/Requirements/RequirementsWorkbench/components/RelativeTime';
import EmptyState from '@/components/EmptyState';
import SeverityTag from '../SeverityTag';
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
                <SeverityTag severity={n.severity} />
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
                <span className="notification-list-item-meta-dot">·</span>
                <span>{t(`notificationCenter.category.${n.category}`)}</span>
                <span className="notification-list-item-meta-dot">·</span>
                <span>APA</span>
              </div>
            </div>

            <div className="notification-list-item-side" onClick={(e) => e.stopPropagation()}>
              <span className={`notification-list-item-dot ${n.read ? 'read' : 'unread'}`} />
              <div className="notification-list-item-actions">
                {!n.read && (
                  <Tooltip content={t('notificationCenter.actions.markRead')}>
                    <Button
                      theme="borderless"
                      type="tertiary"
                      size="small"
                      icon={<Check size={14} strokeWidth={2} />}
                      onClick={() => onMarkRead(n.id)}
                    />
                  </Tooltip>
                )}
                <Tooltip content={t('notificationCenter.actions.view')}>
                  <Button
                    theme="borderless"
                    type="primary"
                    size="small"
                    icon={<ArrowUpRight size={14} strokeWidth={2} />}
                    onClick={() => onOpen(n)}
                  />
                </Tooltip>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default NotificationTable;
