import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table, Button, Input, Tag, Dropdown, Modal, Toast, Pagination, Typography,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import dayjs from 'dayjs';
import { Plus, MoreHorizontal } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import {
  getAnnouncements,
  deleteAnnouncement,
  publishAnnouncement,
  unpublishAnnouncement,
  usePlatformOpsData,
  type PlatformAnnouncement,
} from '../../mockData';
import AnnouncementFormModal from '../AnnouncementFormModal';
import './index.less';

const { Text } = Typography;

const PAGE_SIZE_DEFAULT = 20;

const AnnouncementsTab = () => {
  const { t } = useTranslation();
  usePlatformOpsData();

  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<PlatformAnnouncement | null>(null);

  const all = getAnnouncements();
  const filtered = useMemo(
    () => all.filter((a) => !keyword || a.title.toLowerCase().includes(keyword.toLowerCase())),
    [all, keyword],
  );
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = (item: PlatformAnnouncement) => {
    Modal.confirm({
      title: t('operations.platformOperations.announcements.confirm.deleteTitle'),
      content: item.isPublished
        ? t('operations.platformOperations.announcements.confirm.deletePublishedContent')
        : t('operations.platformOperations.announcements.confirm.deleteDraftContent'),
      onOk: () => {
        deleteAnnouncement(item.id);
        Toast.success(t('operations.platformOperations.announcements.toast.deleted'));
      },
    });
  };

  const handlePublish = (item: PlatformAnnouncement) => {
    Modal.confirm({
      title: t('operations.platformOperations.announcements.confirm.publishTitle'),
      content: t('operations.platformOperations.announcements.confirm.publishContent'),
      onOk: () => {
        publishAnnouncement(item.id);
        Toast.success(t('operations.platformOperations.announcements.toast.published'));
      },
    });
  };

  const handleUnpublish = (item: PlatformAnnouncement) => {
    Modal.confirm({
      title: t('operations.platformOperations.announcements.confirm.unpublishTitle'),
      content: t('operations.platformOperations.announcements.confirm.unpublishContent'),
      onOk: () => {
        unpublishAnnouncement(item.id);
        Toast.success(t('operations.platformOperations.announcements.toast.unpublished'));
      },
    });
  };

  const columns = [
    {
      title: t('operations.platformOperations.announcements.columns.title'),
      dataIndex: 'title',
      ellipsis: { showTitle: true },
    },
    {
      title: t('operations.platformOperations.announcements.columns.summary'),
      dataIndex: 'summary',
      ellipsis: { showTitle: true },
      render: (v: string) => v || '—',
    },
    {
      title: t('operations.platformOperations.announcements.columns.isBanner'),
      dataIndex: 'isBanner',
      width: 90,
      render: (v: boolean) => (
        <Tag color={v ? 'blue' : 'grey'} size="small">
          {v
            ? t('operations.platformOperations.announcements.isBanner.yes')
            : t('operations.platformOperations.announcements.isBanner.no')}
        </Tag>
      ),
    },
    {
      title: t('operations.platformOperations.announcements.columns.status'),
      dataIndex: 'isPublished',
      width: 100,
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'grey'} size="small">
          {v
            ? t('operations.platformOperations.announcements.status.published')
            : t('operations.platformOperations.announcements.status.draft')}
        </Tag>
      ),
    },
    {
      title: t('operations.platformOperations.announcements.columns.publishedAt'),
      dataIndex: 'publishedAt',
      width: 160,
      render: (v?: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—'),
    },
    {
      title: t('operations.platformOperations.announcements.columns.actions'),
      width: 160,
      render: (_: unknown, item: PlatformAnnouncement) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <Button
            theme="borderless"
            size="small"
            onClick={() => { setEditing(item); setModalVisible(true); }}
          >
            {t('operations.platformOperations.announcements.actions.edit')}
          </Button>
          {item.isPublished ? (
            <Button theme="borderless" size="small" onClick={() => handleUnpublish(item)}>
              {t('operations.platformOperations.announcements.actions.unpublish')}
            </Button>
          ) : (
            <Button theme="borderless" type="primary" size="small" onClick={() => handlePublish(item)}>
              {t('operations.platformOperations.announcements.actions.publish')}
            </Button>
          )}
          <Dropdown
            trigger="click"
            position="bottomRight"
            render={
              <Dropdown.Menu>
                <Dropdown.Item type="danger" onClick={() => handleDelete(item)}>
                  {t('operations.platformOperations.announcements.actions.delete')}
                </Dropdown.Item>
              </Dropdown.Menu>
            }
          >
            <Button icon={<MoreHorizontal size={14} strokeWidth={2} />} theme="borderless" size="small" />
          </Dropdown>
        </div>
      ),
    },
  ];

  return (
    <div className="platform-ops-announcements-tab">
      <div className="tab-toolbar">
        <Input
          placeholder={t('operations.platformOperations.announcements.searchPlaceholder')}
          value={keyword}
          onChange={(v) => { setKeyword(v); setPage(1); }}
          prefix={<IconSearchStroked />}
          showClear
          style={{ width: 320 }}
        />
        <Button
          theme="solid"
          type="primary"
          icon={<Plus size={14} strokeWidth={2} />}
          onClick={() => { setEditing(null); setModalVisible(true); }}
        >
          {t('operations.platformOperations.announcements.create')}
        </Button>
      </div>

      <div className="tab-table">
        <Table
          size="small"
          columns={columns}
          dataSource={pageData}
          rowKey="id"
          pagination={false}
          empty={
            <EmptyState
              variant={keyword ? 'noResult' : 'noData'}
              description={keyword ? t('common.noResult') : t('operations.platformOperations.announcements.empty')}
            />
          }
        />
      </div>

      {filtered.length > 0 && (
        <div className="list-pagination">
          <Text type="tertiary">
            {t('common.showingRecords', {
              start: (page - 1) * pageSize + 1,
              end: Math.min(page * pageSize, filtered.length),
              total: filtered.length,
            })}
          </Text>
          <div className="list-pagination-right">
            <Text type="tertiary">{t('common.totalPages', { total: Math.ceil(filtered.length / pageSize) })}</Text>
            <Pagination
              total={filtered.length}
              currentPage={page}
              pageSize={pageSize}
              showSizeChanger
              onPageChange={setPage}
              onPageSizeChange={(s: number) => { setPageSize(s); setPage(1); }}
            />
          </div>
        </div>
      )}

      <AnnouncementFormModal
        visible={modalVisible}
        editing={editing}
        onClose={() => setModalVisible(false)}
      />
    </div>
  );
};

export default AnnouncementsTab;
