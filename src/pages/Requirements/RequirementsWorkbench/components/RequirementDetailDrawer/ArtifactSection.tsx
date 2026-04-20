import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Button,
  Modal,
  Table,
  Tag,
  Toast,
} from '@douyinfe/semi-ui';
import { Link } from 'react-router-dom';
import type { RequirementItem, RequirementArtifact, ArtifactType, LinkedProcess } from '../../types';
import { Trash2, ExternalLink } from 'lucide-react';
import { aggregateLinkedStatus, linkedProcessStatusConfig } from '../../utils/aggregateLinkedStatus';

const { Text } = Typography;

const PROCESS_DETAIL_BASE = '/dev-center/automation-process';

interface ArtifactSectionProps {
  data: RequirementItem;
  onArtifactsChange?: (artifacts: RequirementArtifact[]) => void;
  canManageProcesses?: boolean;
  onProcessesChanged?: () => void;
}

const artifactTypeConfig: Record<ArtifactType, { labelKey: string; color: string }> = {
  PROCESS: { labelKey: 'requirements.artifact.typeProcess', color: 'blue' },
  ADP_APP: { labelKey: 'requirements.artifact.typeAdpApp', color: 'purple' },
  AGENT: { labelKey: 'requirements.artifact.typeAgent', color: 'cyan' },
  HUMAN_COLLAB: { labelKey: 'requirements.artifact.typeHumanCollab', color: 'orange' },
};

interface UnifiedRow {
  rowKey: string;
  source: 'process' | 'artifact';
  artifactType: ArtifactType;
  artifactId: string;
  artifactName: string;
  contribution?: number;
  description?: string;
  ownerName?: string;
  processStatus?: LinkedProcess['status'];
  rawArtifact?: RequirementArtifact;
}

const ArtifactSection = ({
  data,
  onArtifactsChange,
}: ArtifactSectionProps) => {
  const { t } = useTranslation();
  const [artifacts, setArtifacts] = useState<RequirementArtifact[]>(data.artifacts || []);

  const linkedProcesses = data.linkedProcesses ?? [];
  const canEdit = ['DEVELOPING', 'DEVELOPED', 'ASSESSING', 'APPROVED'].includes(data.status);
  const agg = aggregateLinkedStatus(linkedProcesses);

  // 合并：流程类来自 linkedProcesses；非流程来自 artifacts
  const rows: UnifiedRow[] = useMemo(() => {
    const processRows: UnifiedRow[] = linkedProcesses.map((p) => {
      const matchedArtifact = artifacts.find(
        (a) => a.artifactType === 'PROCESS' && a.artifactId === p.id,
      );
      return {
        rowKey: `process-${p.id}`,
        source: 'process',
        artifactType: 'PROCESS',
        artifactId: p.id,
        artifactName: p.name,
        ownerName: p.ownerName,
        processStatus: p.status,
        contribution: matchedArtifact?.contribution,
        description: matchedArtifact?.description,
        rawArtifact: matchedArtifact,
      };
    });
    const otherRows: UnifiedRow[] = artifacts
      .filter((a) => a.artifactType !== 'PROCESS')
      .map((a) => ({
        rowKey: `artifact-${a.id}`,
        source: 'artifact',
        artifactType: a.artifactType,
        artifactId: a.artifactId,
        artifactName: a.artifactName,
        contribution: a.contribution,
        description: a.description,
        rawArtifact: a,
      }));
    return [...processRows, ...otherRows];
  }, [linkedProcesses, artifacts]);

  const handleRemove = (row: UnifiedRow) => {
    if (row.source === 'process') {
      Toast.warning(t('requirements.linkedProcesses.readonlyHint'));
      return;
    }
    Modal.confirm({
      title: t('requirements.artifact.removeConfirmTitle'),
      content: t('requirements.artifact.removeConfirmContent'),
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        const updated = artifacts.filter((a) => a.id !== row.rawArtifact?.id);
        setArtifacts(updated);
        onArtifactsChange?.(updated);
        Toast.success(t('requirements.artifact.removeSuccess'));
      },
    });
  };

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
      render: (name: string, row: UnifiedRow) => {
        if (row.source === 'process') {
          return (
            <Link
              to={`${PROCESS_DETAIL_BASE}?processId=${row.artifactId}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--semi-color-link)' }}
              title={name}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              <ExternalLink size={12} strokeWidth={2} />
            </Link>
          );
        }
        return <Text ellipsis={{ showTooltip: true }}>{name}</Text>;
      },
    },
    {
      title: t('requirements.artifact.colStatus'),
      dataIndex: 'processStatus',
      key: 'processStatus',
      width: 100,
      render: (status: LinkedProcess['status'] | undefined) => {
        if (!status) return <Text type="tertiary" size="small">-</Text>;
        const cfg = linkedProcessStatusConfig[status];
        return (
          <Tag size="small" color={cfg.color} type="light">
            {t(cfg.i18nKey)}
          </Tag>
        );
      },
    },
    {
      title: t('requirements.artifact.colContribution'),
      dataIndex: 'contribution',
      key: 'contribution',
      width: 90,
      render: (v: number | undefined) => (typeof v === 'number' ? `${Math.round(v * 100)}%` : '-'),
    },
    {
      title: t('requirements.artifact.colDescription'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 160,
      render: (v: string | undefined) => v || '-',
    },
    ...(canEdit
      ? [
          {
            title: t('common.actions'),
            dataIndex: 'action',
            key: 'action',
            width: 60,
            render: (_: unknown, record: UnifiedRow) => {
              // 流程类（来自 linkedProcesses）只读，不允许在需求中心侧解除关联
              if (record.source === 'process') return null;
              return (
                <Button
                  icon={<Trash2 size={16} strokeWidth={2} />}
                  theme="borderless"
                  size="small"
                  type="danger"
                  onClick={() => handleRemove(record)}
                />
              );
            },
          },
        ]
      : []),
  ];

  return (
    <div className="requirement-detail-section">
      <div className="requirement-detail-section-header" style={{ justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Text strong>{t('requirements.artifact.title')}</Text>
          {linkedProcesses.length > 0 && (
            <Tag size="small" color={agg.color} type="light">
              {t('requirements.linkedProcesses.count', { online: agg.online, total: agg.total })}
            </Tag>
          )}
        </span>
      </div>

      {rows.length > 0 ? (
        <>
          <Text type="tertiary" size="small" style={{ marginBottom: 8, display: 'block' }}>
            {t('requirements.artifact.totalCount', { count: rows.length })}
          </Text>
          <Table
            columns={columns}
            dataSource={rows}
            rowKey="rowKey"
            size="small"
            pagination={false}
          />
          <Text type="tertiary" size="small" style={{ marginTop: 8, display: 'block' }}>
            {t('requirements.artifact.contributionHint')}
          </Text>
        </>
      ) : (
        <Text type="tertiary" size="small" style={{ padding: '16px 0', display: 'block', textAlign: 'center' }}>
          {t('requirements.artifact.empty')}
        </Text>
      )}

      {linkedProcesses.length === 0 && (
        <Text type="tertiary" size="small" style={{ marginTop: 8, display: 'block' }}>
          {t('requirements.linkedProcesses.readonlyHint')}
        </Text>
      )}
    </div>
  );
};

export default ArtifactSection;
