import { useTranslation } from 'react-i18next';
import { Table, Typography, Button, Tooltip } from '@douyinfe/semi-ui';
import { ArrowUpRight, Check } from 'lucide-react';
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

  const columns = [
    {
      title: '',
      dataIndex: 'read',
      width: 36,
      render: (read: boolean) => (
        <span className={`notification-table-dot ${read ? 'read' : 'unread'}`} />
      ),
    },
    {
      title: t('notificationCenter.table.severity'),
      dataIndex: 'severity',
      width: 80,
      render: (s: Notification['severity']) => <SeverityTag severity={s} />,
    },
    {
      title: t('notificationCenter.table.category'),
      dataIndex: 'category',
      width: 110,
      render: (c: Notification['category']) => <CategoryBadge category={c} />,
    },
    {
      title: t('notificationCenter.table.content'),
      dataIndex: 'title',
      render: (_: string, record: Notification) => (
        <div className="notification-table-content">
          <Typography.Text
            strong={!record.read}
            ellipsis={{ showTooltip: { opts: { content: record.title } } }}
            style={{ maxWidth: '100%' }}
          >
            {record.title}
          </Typography.Text>
          <Typography.Text
            type="tertiary"
            size="small"
            ellipsis={{ showTooltip: { opts: { content: record.description } } }}
            style={{ maxWidth: '100%' }}
          >
            {record.description}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: t('notificationCenter.table.time'),
      dataIndex: 'createdAt',
      width: 130,
      render: (v: string) => <RelativeTime value={v} />,
    },
    {
      title: t('common.actions'),
      width: 140,
      align: 'right' as const,
      render: (_: unknown, record: Notification) => (
        <div className="notification-table-actions" onClick={(e) => e.stopPropagation()}>
          {!record.read && (
            <Tooltip content={t('notificationCenter.actions.markRead')}>
              <Button
                theme="borderless"
                type="tertiary"
                size="small"
                icon={<Check size={14} strokeWidth={2} />}
                onClick={() => onMarkRead(record.id)}
              />
            </Tooltip>
          )}
          <Button
            theme="borderless"
            type="primary"
            size="small"
            icon={<ArrowUpRight size={14} strokeWidth={2} />}
            onClick={() => onOpen(record)}
          >
            {t('notificationCenter.actions.view')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Table
      className="notification-table"
      columns={columns}
      dataSource={data}
      rowKey="id"
      size="small"
      pagination={false}
      onRow={(record) => ({
        onClick: () => record && onOpen(record as Notification),
        style: { cursor: 'pointer' },
      })}
      empty={
        <EmptyState
          variant={hasFilters ? 'noResult' : 'noData'}
          description={hasFilters ? t('common.noResult') : t('notificationCenter.empty')}
        />
      }
    />
  );
};

export default NotificationTable;
