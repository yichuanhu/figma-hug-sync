import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography, Pagination, Toast, Modal } from '@douyinfe/semi-ui';
import { Trash2 } from 'lucide-react';
import NotificationFilterBar, { FilterValues } from './components/NotificationFilterBar';
import NotificationTable from './components/NotificationTable';
import { mockNotifications } from './mockData';
import type { Notification } from './types';
import { openNotification } from '@/utils/notificationLink';
import './index.less';

const { Title, Text } = Typography;

const initialFilters: FilterValues = {
  readFilter: 'all',
  search: '',
  categories: [],
  severities: [],
};

const NotificationCenter = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [list, setList] = useState<Notification[]>(mockNotifications);
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const stats = useMemo(
    () => ({
      unread: list.filter((n) => !n.read).length,
      task: list.filter((n) => n.category === 'task').length,
      robot: list.filter((n) => n.category === 'robot').length,
      license: list.filter((n) => n.category === 'license').length,
    }),
    [list],
  );

  const filtered = useMemo(() => {
    const kw = filters.search.trim().toLowerCase();
    return list.filter((n) => {
      if (filters.readFilter === 'unread' && n.read) return false;
      if (filters.categories.length && !filters.categories.includes(n.category)) return false;
      if (filters.severities.length && !filters.severities.includes(n.severity)) return false;
      if (kw) {
        const txt = `${n.title} ${n.description}`.toLowerCase();
        if (!txt.includes(kw)) return false;
      }
      return true;
    });
  }, [list, filters]);

  const total = filtered.length;
  const pageData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const hasFilters =
    !!filters.search ||
    filters.categories.length > 0 ||
    filters.severities.length > 0;

  const handleMarkRead = (id: string) => {
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const filteredUnreadIds = useMemo(
    () => new Set(filtered.filter((n) => !n.read).map((n) => n.id)),
    [filtered],
  );
  const filteredReadIds = useMemo(
    () => new Set(filtered.filter((n) => n.read).map((n) => n.id)),
    [filtered],
  );

  const handleMarkAllRead = () => {
    if (filteredUnreadIds.size === 0) return;
    setList((prev) => prev.map((n) => (filteredUnreadIds.has(n.id) ? { ...n, read: true } : n)));
    Toast.success(t('notificationCenter.toast.allRead'));
  };

  const handleOpen = (n: Notification) => {
    openNotification(n, navigate, n.read ? () => {} : handleMarkRead);
  };

  const handleClearRead = () => {
    if (filteredReadIds.size === 0) return;
    Modal.warning({
      title: t('notificationCenter.confirm.clearReadTitle'),
      content: t('notificationCenter.confirm.clearReadContent'),
      icon: <Trash2 size={20} color="hsl(var(--destructive))" />,
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      hasCancel: true,
      okButtonProps: { type: 'danger' },
      onOk: () => {
        setList((prev) => prev.filter((n) => !filteredReadIds.has(n.id)));
        Toast.success(t('notificationCenter.toast.clearedRead'));
      },
    });
  };

  const handleFilterChange = (next: FilterValues) => {
    setFilters(next);
    setCurrentPage(1);
  };

  return (
    <div className="notification-center-page">
      <div className="notification-center-header">
        <Title heading={3} className="title">{t('notificationCenter.title')}</Title>
      </div>

      <NotificationFilterBar
        values={filters}
        unreadCount={stats.unread}
        totalCount={list.length}
        onChange={handleFilterChange}
        onMarkAllRead={handleMarkAllRead}
        onClearRead={handleClearRead}
        hasUnread={filteredUnreadIds.size > 0}
        hasRead={filteredReadIds.size > 0}
      />

      <div className="notification-center-table-wrap">
        <NotificationTable
          data={pageData}
          onOpen={handleOpen}
          onMarkRead={handleMarkRead}
          hasFilters={hasFilters}
          readFilter={filters.readFilter}
        />
      </div>

      {total > 0 && (
        <div className="list-pagination">
          <Text type="tertiary">
            {t('common.showingRecords', {
              start: (currentPage - 1) * pageSize + 1,
              end: Math.min(currentPage * pageSize, total),
              total,
            })}
          </Text>
          <div className="list-pagination-right">
            <Text type="tertiary">{t('common.totalPages', { total: Math.ceil(total / pageSize) })}</Text>
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              pageSizeOpts={[10, 20, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
