import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Table, Tag } from '@douyinfe/semi-ui';
import { Link } from 'react-router-dom';
import type { RequirementItem, ArtifactType, LinkedProcess } from '../../types';
import { ExternalLink } from 'lucide-react';
import { bucketLinkedProcesses, linkedProcessStatusConfig } from '../../utils/aggregateLinkedStatus';

const { Text } = Typography;

const PROCESS_DETAIL_BASE = '/dev-center/automation-process';
const PROJECT_DETAIL_BASE = '/requirements/projects';
const WORKSPACE_DETAIL_BASE = '/requirements/projects';

interface ArtifactSectionProps {
  data: RequirementItem;
}

const artifactTypeConfig: Record<ArtifactType, { labelKey: string; color: string }> = {
  PROCESS: { labelKey: 'requirements.artifact.typeProcess', color: 'blue' },
  ADP_APP: { labelKey: 'requirements.artifact.typeAdpApp', color: 'purple' },
  AGENT: { labelKey: 'requirements.artifact.typeAgent', color: 'cyan' },
  HUMAN_COLLAB: { labelKey: 'requirements.artifact.typeHumanCollab', color: 'orange' },
};

interface ProcessRow {
  rowKey: string;
  artifactType: ArtifactType;
  artifactId: string;
  artifactName: string;
  processStatus: LinkedProcess['status'];
}

const ArtifactSection = ({ data }: ArtifactSectionProps) => {
  const { t } = useTranslation();
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [offlineReason, setOfflineReason] = useState('');

  const linkedProcesses = data.linkedProcesses ?? [];
  const buckets = bucketLinkedProcesses(linkedProcesses);
  const totalAttributed = linkedProcesses.length;
  const isOnline = data.status === 'LAUNCHED';

  const rows: ProcessRow[] = useMemo(
    () =>
      linkedProcesses.map((p) => ({
        rowKey: `process-${p.id}`,
        artifactType: 'PROCESS',
        artifactId: p.id,
        artifactName: p.name,
        processStatus: p.status,
      })),
    [linkedProcesses],
  );

  const columns = [
    {
      title: t('requirements.artifact.colType'),
      dataIndex: 'artifactType',
      key: 'artifactType',
      width: 110,
      render: (type: ArtifactType) => {
        const cfg = artifactTypeConfig[type];
        return (
          <Tag color={cfg?.color as 'blue'} type="light" size="small">
            {t(cfg?.labelKey || '')}
          </Tag>
        );
      },
    },
    {
      title: t('requirements.artifact.colName'),
      dataIndex: 'artifactName',
      key: 'artifactName',
      ellipsis: true,
      render: (name: string, row: ProcessRow) => (
        <Link
          to={`${PROCESS_DETAIL_BASE}?processId=${row.artifactId}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--semi-color-link)' }}
          title={name}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          <ExternalLink size={12} strokeWidth={2} />
        </Link>
      ),
    },
    {
      title: t('requirements.artifact.colStatus'),
      dataIndex: 'processStatus',
      key: 'processStatus',
      width: 100,
      render: (status: LinkedProcess['status']) => {
        const cfg = linkedProcessStatusConfig[status];
        return (
          <Tag size="small" color={cfg.color} type="light">
            {t(cfg.i18nKey)}
          </Tag>
        );
      },
    },
  ];

  const handleOfflineConfirm = () => {
    if (!offlineReason.trim()) {
      Toast.warning(t('requirements.delivery.offlineConfirm.placeholder'));
      return;
    }
    Toast.success(t('requirements.delivery.offlineConfirm.success'));
    setOfflineOpen(false);
    setOfflineReason('');
  };

  const renderLinkRow = (
    label: string,
    target?: { id: string; name: string },
    base?: string,
  ) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', minHeight: 28 }}>
      <Text type="tertiary" size="small" style={{ width: 96, flexShrink: 0 }}>{label}</Text>
      {target ? (
        <Link
          to={`${base}?id=${target.id}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--semi-color-link)' }}
        >
          <span>{target.name}</span>
          <ExternalLink size={12} strokeWidth={2} />
        </Link>
      ) : (
        <Text type="tertiary" size="small">{t('requirements.delivery.emptyLink')}</Text>
      )}
    </div>
  );

  return (
    <div className="requirement-detail-section">
      <div className="requirement-detail-section-header" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Text strong>{t('requirements.delivery.title')}</Text>
        </div>
        {isOnline && (
          <Button
            size="small"
            type="danger"
            theme="borderless"
            icon={<PowerOff size={14} strokeWidth={2} />}
            onClick={() => setOfflineOpen(true)}
          >
            {t('requirements.delivery.offline')}
          </Button>
        )}
      </div>

      {/* 关联项目 / 工作空间 / 关联方式 */}
      <div style={{ marginBottom: 16 }}>
        {renderLinkRow(t('requirements.delivery.linkedProject'), data.linkedProject, PROJECT_DETAIL_BASE)}
        {renderLinkRow(t('requirements.delivery.linkedWorkspace'), data.linkedWorkspace, WORKSPACE_DETAIL_BASE)}
      </div>

      {/* 聚合摘要 chip 行 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <Text size="small">{t('requirements.delivery.processCount', { count: totalAttributed })}</Text>
        <Tag size="small" color="green" type="light">
          {t('requirements.delivery.bucketOnline', { count: buckets.online })}
        </Tag>
        <Tag size="small" color="blue" type="light">
          {t('requirements.delivery.bucketDeveloping', { count: buckets.developing })}
        </Tag>
        <Tag size="small" color="grey" type="light">
          {t('requirements.delivery.bucketStopped', { count: buckets.stopped })}
        </Tag>
      </div>

      {(data.unboundProcessCount ?? 0) > 0 && (
        <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 8 }}>
          {t('requirements.delivery.unboundHint', { count: data.unboundProcessCount })}
        </Text>
      )}

      {/* 流程清单 */}
      {rows.length > 0 ? (
        <Table
          columns={columns}
          dataSource={rows}
          rowKey="rowKey"
          size="small"
          pagination={false}
        />
      ) : (
        <Text type="tertiary" size="small" style={{ padding: '16px 0', display: 'block', textAlign: 'center' }}>
          {t('requirements.linkedProcesses.empty')}
        </Text>
      )}

      <Modal
        title={t('requirements.delivery.offlineConfirm.title')}
        visible={offlineOpen}
        onCancel={() => setOfflineOpen(false)}
        onOk={handleOfflineConfirm}
        okText={t('requirements.delivery.offlineConfirm.ok')}
        cancelText={t('requirements.delivery.offlineConfirm.cancel')}
        okButtonProps={{ type: 'danger' }}
        width={480}
      >
        <div>
          <Text size="small" style={{ display: 'block', marginBottom: 8 }}>
            {t('requirements.delivery.offlineConfirm.reason')}
          </Text>
          <TextArea
            placeholder={t('requirements.delivery.offlineConfirm.placeholder')}
            value={offlineReason}
            onChange={(v) => setOfflineReason(v)}
            maxCount={500}
            showClear
            autosize={{ minRows: 3, maxRows: 6 }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ArtifactSection;
