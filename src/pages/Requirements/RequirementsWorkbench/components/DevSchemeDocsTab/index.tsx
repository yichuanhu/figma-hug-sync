import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal, Spin, Table, Tag, Toast, Tooltip, Typography } from '@douyinfe/semi-ui';
import { Download, FileText, Plus, Trash2 } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import RelativeTime from '../RelativeTime';
import type { RequirementItem } from '../../types';
import type { RequirementDevSchemeDoc } from '../../types';
import { listDevSchemeDocs, deleteDevSchemeDoc, mockCreators } from '../../mockData';
import { useDevSchemeDocPermission } from '../../hooks/useDevSchemeDocPermission';
import DevSchemeDocUploadModal from '../DevSchemeDocUploadModal';
import './index.less';

const { Text } = Typography;

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

interface Props {
  requirement: RequirementItem;
  onChange?: () => void;
}

const DevSchemeDocsTab = ({ requirement, onChange }: Props) => {
  const { t } = useTranslation();
  const [docs, setDocs] = useState<RequirementDevSchemeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const perm = useDevSchemeDocPermission(requirement.id, refreshKey);

  const reload = useCallback(() => {
    setLoading(true);
    listDevSchemeDocs(requirement.id)
      .then(setDocs)
      .finally(() => setLoading(false));
  }, [requirement.id]);

  useEffect(() => { reload(); }, [reload, refreshKey]);

  const nextVersion = useMemo(
    () => docs.reduce((m, d) => Math.max(m, d.version), 0) + 1,
    [docs],
  );

  const ownerName = requirement.owner_name;
  const creatorName = mockCreators[requirement.creatorId]?.name ?? requirement.creatorName;

  const handleDelete = (doc: RequirementDevSchemeDoc) => {
    Modal.confirm({
      title: t('requirements.devScheme.delete.title', { version: doc.version }),
      content: t('requirements.devScheme.delete.content'),
      okType: 'danger',
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await deleteDevSchemeDoc(requirement.id, doc.version);
          Toast.success(t('requirements.devScheme.delete.success'));
          setRefreshKey((k) => k + 1);
          onChange?.();
        } catch (e) {
          Toast.error(t('requirements.devScheme.error.generic'));
        }
      },
    });
  };

  const handleDownload = (doc: RequirementDevSchemeDoc) => {
    // mock：简单提示
    Toast.info(t('requirements.devScheme.download.started', { fileName: doc.fileName }));
  };

  const columns = [
    {
      title: t('requirements.devScheme.col.version'),
      dataIndex: 'version',
      width: 80,
      render: (v: number) => <Tag color="blue" className="version-tag">v{v}</Tag>,
    },
    {
      title: t('requirements.devScheme.col.fileName'),
      dataIndex: 'fileName',
      render: (name: string, doc: RequirementDevSchemeDoc) => (
        <span className="file-cell">
          <FileText size={14} strokeWidth={2} color="var(--semi-color-text-2)" />
          <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 220 }}>{name}</Text>
          <Tag size="small" color="grey">{doc.fileType}</Tag>
        </span>
      ),
    },
    {
      title: t('requirements.devScheme.col.size'),
      dataIndex: 'fileSize',
      width: 100,
      render: (s: number) => <Text type="tertiary">{formatSize(s)}</Text>,
    },
    {
      title: t('requirements.devScheme.col.uploader'),
      dataIndex: 'uploaderName',
      width: 130,
      render: (_: string, doc: RequirementDevSchemeDoc) => (
        <UserNameWithCard userId={doc.uploadedBy} userName={doc.uploaderName} />
      ),
    },
    {
      title: t('requirements.devScheme.col.uploadedAt'),
      dataIndex: 'uploadedAt',
      width: 140,
      render: (v: string) => <RelativeTime time={v} />,
    },
    {
      title: t('requirements.devScheme.col.note'),
      dataIndex: 'note',
      render: (n?: string) => n
        ? <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 240 }}>{n}</Text>
        : <Text type="tertiary">—</Text>,
    },
    {
      title: t('requirements.devScheme.col.actions'),
      width: 120,
      render: (_: unknown, doc: RequirementDevSchemeDoc) => (
        <span className="row-actions">
          <Tooltip content={t('common.download')} position="top">
            <Button
              theme="borderless"
              size="small"
              icon={<Download size={14} strokeWidth={2} />}
              onClick={() => handleDownload(doc)}
            />
          </Tooltip>
          {perm.canManage && (
            <Tooltip content={t('common.delete')} position="top">
              <Button
                theme="borderless"
                size="small"
                type="danger"
                icon={<Trash2 size={14} strokeWidth={2} />}
                onClick={() => handleDelete(doc)}
              />
            </Tooltip>
          )}
        </span>
      ),
    },
  ];

  const uploadButton = (
    <Button
      theme="solid"
      type="primary"
      icon={<Plus size={14} strokeWidth={2} />}
      disabled={!perm.canManage}
      onClick={() => setUploadOpen(true)}
    >
      {t('requirements.devScheme.uploadButton')}
    </Button>
  );

  return (
    <div className="dev-scheme-docs-tab">
      <div className="dev-scheme-docs-tab-header">
        <span className="header-count">
          {t('requirements.devScheme.totalCount', { count: docs.length })}
        </span>
        {perm.canManage ? (
          uploadButton
        ) : (
          <Tooltip content={perm.disabledReasonKey ? t(perm.disabledReasonKey) : ''} position="left">
            <span>{uploadButton}</span>
          </Tooltip>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}><Spin /></div>
      ) : docs.length === 0 ? (
        <EmptyState variant="noData" description={t('requirements.devScheme.empty')} />
      ) : (
        <Table
          size="small"
          columns={columns}
          dataSource={docs}
          rowKey="id"
          pagination={false}
        />
      )}

      <DevSchemeDocUploadModal
        visible={uploadOpen}
        requirementId={requirement.id}
        ownerName={ownerName}
        creatorName={creatorName}
        nextVersion={nextVersion}
        onCancel={() => setUploadOpen(false)}
        onSuccess={() => {
          setUploadOpen(false);
          setRefreshKey((k) => k + 1);
          onChange?.();
        }}
      />
    </div>
  );
};

export default DevSchemeDocsTab;
