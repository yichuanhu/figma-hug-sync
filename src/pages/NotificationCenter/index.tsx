import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography, Pagination, Toast } from '@douyinfe/semi-ui';
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
  dateRange: null,
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
      if (filters.readFilter === 'read' && !n.read) return false;
      if (filters.categories.length && !filters.categories.includes(n.category)) return false;
      if (filters.severities.length && !filters.severities.includes(n.severity)) return false;
      if (filters.dateRange) {
        const [s, e] = filters.dateRange;
        const t = new Date(n.createdAt).getTime();
        if (t < s.getTime() || t > e.getTime()) return false;
      }
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
    filters.severities.length > 0 ||
    !!filters.dateRange ||
    filters.readFilter !== 'all';

  const handleMarkRead = (id: string) => {
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllRead = () => {
    setList((prev) => prev.map((n) => ({ ...n, read: true })));
    Toast.success(t('notificationCenter.toast.allRead'));
  };

  const handleOpen = (n: Notification) => {
    openNotification(n, navigate, handleMarkRead);
  };

  const handleFilterChange = (next: FilterValues) => {
    setFilters(next);
    setCurrentPage(1);
  };

  return (
    <div className="notification-center-page">
      <div className="notification-center-header">
        <Title heading={3} className="title">{t('notificationCenter.title')}</Title>
        <Text type="tertiary" className="subtitle">{t('notificationCenter.subtitle')}</Text>
      </div>

      <NotificationStatsCards stats={stats} />

      <NotificationFilterBar
        values={filters}
        unreadCount={stats.unread}
        totalCount={list.length}
        onChange={handleFilterChange}
        onMarkAllRead={handleMarkAllRead}
        hasUnread={stats.unread > 0}
      />

      <div className="notification-center-table-wrap">
        <NotificationTable
          data={pageData}
          onOpen={handleOpen}
          onMarkRead={handleMarkRead}
          hasFilters={hasFilters}
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
