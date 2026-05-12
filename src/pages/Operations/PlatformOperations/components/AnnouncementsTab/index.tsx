import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table, Button, Input, Tag, Dropdown, Modal, Toast, Pagination,
} from '@douyinfe/semi-ui';
import dayjs from 'dayjs';
import { Plus, MoreHorizontal, Search } from 'lucide-react';
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

const PAGE_SIZE = 10;

const AnnouncementsTab = () => {
  const { t } = useTranslation();
  usePlatformOpsData();

  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<PlatformAnnouncement | null>(null);

  const all = getAnnouncements();
  const filtered = useMemo(
    () => all.filter((a) => !keyword || a.title.toLowerCase().includes(keyword.toLowerCase())),
    [all, keyword],
  );
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          prefix={<Search size={14} strokeWidth={2} />}
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

      <Table
        size="small"
        columns={columns}
        dataSource={pageData}
        rowKey="id"
        pagination={false}
        empty={<div className="table-empty">{t('operations.platformOperations.announcements.empty')}</div>}
      />

      {filtered.length > 0 && (
        <div className="list-pagination">
          <Pagination
            total={filtered.length}
            currentPage={page}
            pageSize={PAGE_SIZE}
            showTotal
            onChange={setPage}
          />
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
