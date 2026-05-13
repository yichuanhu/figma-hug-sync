import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table, Button, Input, Tag, Dropdown, Modal, Toast, Pagination, Typography,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import dayjs from 'dayjs';
import { Upload as UploadIcon, Download, Trash2, Ellipsis } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import {
  getResources,
  deleteResource,
  usePlatformOpsData,
  type DownloadableResource,
} from '../../mockData';
import ResourceUploadModal from '../ResourceUploadModal';
import './index.less';

const { Text } = Typography;

const PAGE_SIZE_DEFAULT = 20;

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const typeColorMap: Record<string, 'blue' | 'green' | 'grey'> = {
  '安装包': 'blue',
  '文档': 'green',
  '其他': 'grey',
};

const ResourcesTab = () => {
  const { t } = useTranslation();
  usePlatformOpsData();

  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [uploadVisible, setUploadVisible] = useState(false);

  const all = getResources();
  const filtered = useMemo(
    () => all.filter((r) => !keyword || r.resourceName.toLowerCase().includes(keyword.toLowerCase())),
    [all, keyword],
  );
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDownload = (item: DownloadableResource) => {
    if (!item.fileUrl || item.fileUrl === '#') {
      Toast.info(`${t('operations.platformOperations.resources.actions.download')}：${item.fileName}`);
      return;
    }
    const a = document.createElement('a');
    a.href = item.fileUrl;
    a.download = item.fileName;
    a.click();
  };

  const handleDelete = (item: DownloadableResource) => {
    Modal.confirm({
      title: t('operations.platformOperations.resources.confirm.deleteTitle'),
      content: t('operations.platformOperations.resources.confirm.deleteContent'),
      onOk: () => {
        deleteResource(item.id);
        Toast.success(t('operations.platformOperations.resources.toast.deleted'));
      },
    });
  };

  const typeLabel = (v: string) => {
    if (v === '安装包') return t('operations.platformOperations.resources.types.installer');
    if (v === '文档') return t('operations.platformOperations.resources.types.document');
    return t('operations.platformOperations.resources.types.other');
  };

  const columns = [
    {
      title: t('operations.platformOperations.resources.columns.resourceName'),
      dataIndex: 'resourceName',
      ellipsis: { showTitle: true },
    },
    {
      title: t('operations.platformOperations.resources.columns.fileName'),
      dataIndex: 'fileName',
      ellipsis: { showTitle: true },
    },
    {
      title: t('operations.platformOperations.resources.columns.fileSize'),
      dataIndex: 'fileSize',
      width: 110,
      render: (v: number) => formatSize(v),
    },
    {
      title: t('operations.platformOperations.resources.columns.resourceType'),
      dataIndex: 'resourceType',
      width: 110,
      render: (v: string) => <Tag color={typeColorMap[v] ?? 'grey'} size="small">{typeLabel(v)}</Tag>,
    },
    {
      title: t('operations.platformOperations.resources.columns.description'),
      dataIndex: 'description',
      ellipsis: { showTitle: true },
      render: (v?: string) => v || '—',
    },
    {
      title: t('operations.platformOperations.resources.columns.uploadedBy'),
      dataIndex: 'uploadedBy',
      width: 120,
    },
    {
      title: t('operations.platformOperations.resources.columns.createdAt'),
      dataIndex: 'createdAt',
      width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: t('operations.platformOperations.resources.columns.actions'),
      width: 120,
      render: (_: unknown, item: DownloadableResource) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <Button
            theme="borderless"
            type="primary"
            size="small"
            icon={<Download size={14} strokeWidth={2} />}
            onClick={() => handleDownload(item)}
          >
            {t('operations.platformOperations.resources.actions.download')}
          </Button>
          <Button
            theme="borderless"
            type="danger"
            size="small"
            icon={<Trash2 size={14} strokeWidth={2} />}
            onClick={() => handleDelete(item)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="platform-ops-resources-tab">
      <div className="tab-toolbar">
        <Input
          placeholder={t('operations.platformOperations.resources.searchPlaceholder')}
          value={keyword}
          onChange={(v) => { setKeyword(v); setPage(1); }}
          prefix={<IconSearchStroked />}
          showClear
          style={{ width: 320 }}
        />
        <Button
          theme="solid"
          type="primary"
          icon={<UploadIcon size={14} strokeWidth={2} />}
          onClick={() => setUploadVisible(true)}
        >
          {t('operations.platformOperations.resources.upload')}
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
              description={keyword ? t('common.noResult') : t('operations.platformOperations.resources.empty')}
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

      <ResourceUploadModal visible={uploadVisible} onClose={() => setUploadVisible(false)} />
    </div>
  );
};

export default ResourcesTab;
