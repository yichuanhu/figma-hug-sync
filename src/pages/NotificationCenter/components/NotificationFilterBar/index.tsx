import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Tabs, TabPane, Button, Badge } from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { CheckCheck, Trash2 } from 'lucide-react';
import FilterPopover, { FilterSection } from '@/components/FilterPopover';
import type { NotificationCategory, NotificationReadFilter, NotificationSeverity } from '@/pages/NotificationCenter/types';
import './index.less';

export interface FilterValues {
  readFilter: NotificationReadFilter;
  search: string;
  categories: NotificationCategory[];
  severities: NotificationSeverity[];
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
  const [filterVisible, setFilterVisible] = useState(false);

  const sections: FilterSection[] = [
    {
      key: 'categories',
      label: t('notificationCenter.filter.category'),
      type: 'checkbox',
      value: values.categories,
      options: [
        { value: 'task', label: t('notificationCenter.category.task') },
        { value: 'robot', label: t('notificationCenter.category.robot') },
        { value: 'trigger', label: t('notificationCenter.category.trigger') },
        { value: 'license', label: t('notificationCenter.category.license') },
      ],
    },
    {
      key: 'severities',
      label: t('notificationCenter.filter.severity'),
      type: 'checkbox',
      value: values.severities,
      options: [
        { value: 'HIGH', label: t('notificationCenter.severity.high') },
        { value: 'MEDIUM', label: t('notificationCenter.severity.medium') },
        { value: 'LOW', label: t('notificationCenter.severity.low') },
      ],
    },
  ];

  return (
    <div className="notification-filter-bar">
      <Tabs
        type="line"
        size="medium"
        activeKey={values.readFilter}
        onChange={(k) => onChange({ ...values, readFilter: k as NotificationReadFilter })}
      >
        <TabPane itemKey="all" tab={<span>{t('notificationCenter.tabs.all')} <Badge count={totalCount} type="primary" /></span>} />
        <TabPane itemKey="unread" tab={<span>{t('notificationCenter.tabs.unread')} <Badge count={unreadCount} type="danger" /></span>} />
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
        <FilterPopover
          visible={filterVisible}
          onVisibleChange={setFilterVisible}
          sections={sections}
          onConfirm={(next) =>
            onChange({
              ...values,
              categories: (next.categories as NotificationCategory[]) || [],
              severities: (next.severities as NotificationSeverity[]) || [],
            })
          }
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
