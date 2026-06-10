import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Tag,
  Input,
  Tooltip,
  Toast,
  Modal,
  Typography,
} from '@douyinfe/semi-ui';
import { IconDeleteStroked } from '@douyinfe/semi-icons';
import { Download, Trash2, Upload as UploadIcon } from 'lucide-react';

import UserNameWithCard from '@/components/layout/UserNameWithCard';
import EmptyState from '@/components/EmptyState';
import FilterPopover, { type FilterSection } from '@/components/FilterPopover';
import {
  PROCESS_DOCUMENT_TYPE_COLOR,
  PROCESS_DOCUMENT_TYPE_LABEL,
  PROCESS_LEVEL_VERSION_FILTER,
  deleteProcessDocument,
  listProcessDocuments,
  type ProcessDocument,
  type ProcessDocumentType,
} from '@/mocks/processDocuments';
import { useProcessDocumentPermission } from '@/hooks/useProcessDocumentPermission';

import UploadDocumentModal from '../UploadDocumentModal';
import './index.less';

const { Text } = Typography;

interface VersionOption {
  id: string;
  version: string;
}

export interface DocumentsTabProps {
  processId: string;
  processName: string;
  versions: VersionOption[];
  onCountChange?: (count: number) => void;
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTime = (iso: string): string => iso.replace('T', ' ').substring(0, 19);

const DocumentsTab = ({
  processId,
  processName,
  versions,
  onCountChange,
}: DocumentsTabProps) => {
  const permission = useProcessDocumentPermission(processId);
  const [keyword, setKeyword] = useState('');
  const [documentTypes, setDocumentTypes] = useState<ProcessDocumentType[]>([]);
  const [applicableVersionIds, setApplicableVersionIds] = useState<string[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const documents = useMemo(
    () =>
      listProcessDocuments(processId, processName, {
        documentTypes,
        applicableVersionIds,
        keyword,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [processId, processName, documentTypes, applicableVersionIds, keyword, refreshTick],
  );

  useEffect(() => {
    onCountChange?.(documents.length);
  }, [documents.length, onCountChange]);

  const handleDelete = useCallback(
    (doc: ProcessDocument) => {
      Modal.confirm({
        title: '删除资料',
        icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
        content: `确定要删除「${doc.file_name}」吗？删除后不可恢复。`,
        okType: 'danger',
        onOk: () => {
          deleteProcessDocument(processId, doc.id);
          setRefreshTick((v) => v + 1);
          Toast.success('删除成功');
        },
      });
    },
    [processId],
  );

  const handleDownload = useCallback((doc: ProcessDocument) => {
    Toast.info(`开始下载 ${doc.file_name}`);
    setTimeout(() => Toast.success('下载成功'), 500);
  }, []);

  const filterSections: FilterSection[] = useMemo(
    () => [
      {
        key: 'documentType',
        label: '资料类型',
        type: 'checkbox',
        value: documentTypes,
        options: (Object.keys(PROCESS_DOCUMENT_TYPE_LABEL) as ProcessDocumentType[]).map((v) => ({
          value: v,
          label: PROCESS_DOCUMENT_TYPE_LABEL[v],
        })),
      },
      {
        key: 'applicableVersion',
        label: '适用版本',
        type: 'checkbox',
        value: applicableVersionIds,
        options: [
          { value: PROCESS_LEVEL_VERSION_FILTER, label: '流程级' },
          ...versions.map((v) => ({ value: v.id, label: v.version })),
        ],
      },
    ],
    [documentTypes, applicableVersionIds, versions],
  );

  const handleFilterConfirm = (values: Record<string, unknown>) => {
    setDocumentTypes((values.documentType as ProcessDocumentType[]) || []);
    setApplicableVersionIds((values.applicableVersion as string[]) || []);
    setFilterVisible(false);
  };

  const columns = useMemo(
    () => [
      {
        title: '资料名称',
        dataIndex: 'file_name',
        key: 'file_name',
        ellipsis: { showTitle: false },
        render: (text: string, record: ProcessDocument) =>
          permission.canDownload ? (
            <a
              onClick={(e) => {
                e.preventDefault();
                handleDownload(record);
              }}
              style={{ cursor: 'pointer' }}
            >
              {text}
            </a>
          ) : (
            text
          ),
      },
      {
        title: '资料类型',
        dataIndex: 'document_type',
        key: 'document_type',
        width: 110,
        render: (v: ProcessDocumentType) => (
          <Tag color={PROCESS_DOCUMENT_TYPE_COLOR[v]} type="light" size="small">
            {PROCESS_DOCUMENT_TYPE_LABEL[v]}
          </Tag>
        ),
      },
      {
        title: '适用版本',
        dataIndex: 'applicable_version_label',
        key: 'applicable_version_label',
        width: 130,
        render: (label: string | undefined) =>
          label ? (
            <Tag color="blue" type="light" size="small">
              {label}
            </Tag>
          ) : (
            <Text type="tertiary" size="small">
              流程级
            </Text>
          ),
      },
      {
        title: '大小',
        dataIndex: 'file_size',
        key: 'file_size',
        width: 90,
        render: (v: number) => formatSize(v),
      },
      {
        title: '上传人',
        dataIndex: 'uploader_name',
        key: 'uploader_name',
        width: 120,
        render: (name: string, record: ProcessDocument) => (
          <UserNameWithCard name={name} userId={record.uploader_id} />
        ),
      },
      {
        title: '上传时间',
        dataIndex: 'uploaded_at',
        key: 'uploaded_at',
        width: 160,
        render: (v: string) => formatTime(v),
      },
      {
        title: '操作',
        fixed: 'right' as const,
        align: 'center' as const,
        key: 'actions',
        width: 90,
        render: (_: unknown, record: ProcessDocument) => (
          <span className="documents-tab-row-actions">
            {permission.canDownload && (
              <Tooltip content="下载">
                <Button
                  icon={<Download size={14} strokeWidth={2} />}
                  theme="borderless"
                  type="tertiary"
                  size="small"
                  onClick={() => handleDownload(record)}
                />
              </Tooltip>
            )}
            {permission.canDelete && (
              <Tooltip content="删除">
                <Button
                  icon={
                    <Trash2 size={14} strokeWidth={2} color="var(--semi-color-danger)" />
                  }
                  theme="borderless"
                  type="tertiary"
                  size="small"
                  onClick={() => handleDelete(record)}
                />
              </Tooltip>
            )}
          </span>
        ),
      },
    ],
    [permission, handleDelete, handleDownload],
  );

  if (!permission.canView) {
    return (
      <div className="documents-tab-empty">
        <EmptyState variant="noAccess" description="您暂无查看资料的权限" size={120} />
      </div>
    );
  }

  const isEmpty =
    documents.length === 0 &&
    !keyword &&
    documentTypes.length === 0 &&
    applicableVersionIds.length === 0;

  return (
    <div className="documents-tab">
      <div className="documents-tab-toolbar">
        <div className="documents-tab-toolbar-left">
          <Input
            value={keyword}
            onChange={setKeyword}
            placeholder="搜索资料名称"
            showClear
            style={{ width: 320 }}
          />
          <FilterPopover
            sections={filterSections}
            visible={filterVisible}
            onVisibleChange={setFilterVisible}
            onConfirm={handleFilterConfirm}
          />
        </div>
        {permission.canUpload && (
          <Button
            icon={<UploadIcon size={14} strokeWidth={2} />}
            theme="solid"
            type="primary"
            onClick={() => setUploadVisible(true)}
          >
            上传资料
          </Button>
        )}
      </div>

      {isEmpty ? (
        <div className="documents-tab-empty">
          <EmptyState description="暂无流程资料" size={120} />
          {permission.canUpload && (
            <Button
              icon={<UploadIcon size={14} strokeWidth={2} />}
              theme="solid"
              style={{ marginTop: 16 }}
              onClick={() => setUploadVisible(true)}
            >
              上传资料
            </Button>
          )}
        </div>
      ) : (
        <Table
          size="small"
          columns={columns}
          dataSource={documents}
          rowKey="id"
          pagination={false}
          empty={<EmptyState description="无匹配资料" variant="noResult" size={100} />}
        />
      )}

      <UploadDocumentModal
        visible={uploadVisible}
        onClose={() => setUploadVisible(false)}
        onSuccess={() => setRefreshTick((v) => v + 1)}
        processId={processId}
        processName={processName}
        versions={versions}
      />
    </div>
  );
};

export default DocumentsTab;
