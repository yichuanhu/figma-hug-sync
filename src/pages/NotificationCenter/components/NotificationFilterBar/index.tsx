import { useTranslation } from 'react-i18next';
import { Input, Tabs, TabPane, Button, Badge } from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { CheckCheck, Trash2 } from 'lucide-react';
import type { NotificationReadFilter } from '@/pages/NotificationCenter/types';
import './index.less';

export interface FilterValues {
  readFilter: NotificationReadFilter;
  search: string;
}

interface Props {
  values: FilterValues;
  unreadCount: number;
  totalCount: number;
  onChange: (next: FilterValues) => void;
  onMarkAllRead: () => void;
  onClearRead: () => void;
  hasUnread: boolean;
  hasRead: boolean;
}

const NotificationFilterBar = ({ values, unreadCount, totalCount, onChange, onMarkAllRead, onClearRead, hasUnread, hasRead }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="notification-filter-bar">
      <Tabs
        type="line"
        size="medium"
        activeKey={values.readFilter}
        onChange={(k) => onChange({ ...values, readFilter: k as NotificationReadFilter })}
      >
        <TabPane itemKey="all" tab={t('notificationCenter.tabs.all')} />
        <TabPane itemKey="unread" tab={<span className="notification-tab-with-count">{t('notificationCenter.tabs.unread')}{unreadCount > 0 && <Badge count={unreadCount} overflowCount={99} type="danger" />}</span>} />
      </Tabs>

      <div className="notification-filter-bar-row">
        <Input
          prefix={<IconSearchStroked />}
          placeholder={t('notificationCenter.filter.searchPlaceholder')}
          value={values.search}
          onChange={(v) => onChange({ ...values, search: v })}
          style={{ width: 320 }}
          showClear
        />
        <div className="notification-filter-bar-spacer" />
        <Button
          theme="light"
          type="tertiary"
          icon={<Trash2 size={16} strokeWidth={2} />}
          disabled={!hasRead}
          onClick={onClearRead}
        >
          {t('notificationCenter.actions.clearRead')}
        </Button>
        <Button
          theme="light"
          type="primary"
          icon={<CheckCheck size={16} strokeWidth={2} />}
          disabled={!hasUnread}
          onClick={onMarkAllRead}
        >
          {t('notificationCenter.actions.markAllRead')}
        </Button>
      </div>
    </div>
  );
};

export default NotificationFilterBar;
