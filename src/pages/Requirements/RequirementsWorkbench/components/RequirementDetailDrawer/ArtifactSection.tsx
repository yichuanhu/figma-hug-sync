import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Button,
  Modal,
  Form,
  Table,
  Tag,
  Toast,
} from '@douyinfe/semi-ui';
import { Link } from 'react-router-dom';
import type { RequirementItem, RequirementArtifact, ArtifactType, LinkedProcess } from '../../types';
import { Plus, Trash2, ExternalLink, Settings } from 'lucide-react';
import { addLinkedProcesses, removeLinkedProcess, MOCK_PROCESS_POOL } from '../../mockData';
import { aggregateLinkedStatus, linkedProcessStatusConfig } from '../../utils/aggregateLinkedStatus';
import ManageLinkedProcessesModal from '../ManageLinkedProcessesModal';

const { Text } = Typography;

const PROCESS_DETAIL_BASE = '/dev-center/automation-process';

// Mock 可关联的非流程类交付物（流程类来自 MOCK_PROCESS_POOL）
const mockNonProcessArtifacts = [
  { id: 'adp-001', name: 'Invoice Recognition App', type: 'ADP_APP' as ArtifactType },
  { id: 'adp-002', name: 'Contract Review App', type: 'ADP_APP' as ArtifactType },
  { id: 'agent-001', name: 'Customer Service Agent', type: 'AGENT' as ArtifactType },
  { id: 'agent-002', name: 'Data Entry Agent', type: 'AGENT' as ArtifactType },
  { id: 'hc-001', name: 'Exception Handling Collaboration', type: 'HUMAN_COLLAB' as ArtifactType },
];

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
  canManageProcesses = false,
  onProcessesChanged,
}: ArtifactSectionProps) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [manageProcessesVisible, setManageProcessesVisible] = useState(false);
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

  const handleAdd = async (values: Record<string, unknown>) => {
    const type = values.artifactType as ArtifactType;
    const artifactId = values.artifactId as string;

    if (type === 'PROCESS') {
      // 走流程关联通道
      if (linkedProcesses.some((p) => p.id === artifactId)) {
        Toast.warning(t('requirements.artifact.duplicateError'));
        return;
      }
      try {
        await addLinkedProcesses(data.id, [artifactId]);
        Toast.success(t('requirements.artifact.addSuccess'));
        setModalVisible(false);
        onProcessesChanged?.();
      } catch (e) {
        Toast.error((e as Error).message);
      }
      return;
    }

    const selected = mockNonProcessArtifacts.find((a) => a.id === artifactId);
    if (!selected) return;
    if (artifacts.some((a) => a.artifactId === selected.id)) {
      Toast.warning(t('requirements.artifact.duplicateError'));
      return;
    }
    const newArtifact: RequirementArtifact = {
      id: `artifact-${Date.now()}`,
      requirementId: data.id,
      artifactType: type,
      artifactId: selected.id,
      artifactName: selected.name,
      contribution: values.contribution as number,
      description: (values.description as string) || '',
      createdAt: new Date().toISOString(),
    };
    const updated = [...artifacts, newArtifact];
    setArtifacts(updated);
    onArtifactsChange?.(updated);
    setModalVisible(false);
    Toast.success(t('requirements.artifact.addSuccess'));
  };

  const handleRemove = (row: UnifiedRow) => {
    Modal.confirm({
      title: t('requirements.artifact.removeConfirmTitle'),
      content: t('requirements.artifact.removeConfirmContent'),
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        if (row.source === 'process') {
          try {
            await removeLinkedProcess(data.id, row.artifactId);
            Toast.success(t('requirements.artifact.removeSuccess'));
            onProcessesChanged?.();
          } catch (e) {
            Toast.error((e as Error).message);
          }
        } else {
          const updated = artifacts.filter((a) => a.id !== row.rawArtifact?.id);
          setArtifacts(updated);
          onArtifactsChange?.(updated);
          Toast.success(t('requirements.artifact.removeSuccess'));
        }
      },
    });
  };

  const typeOptions = [
    { value: 'PROCESS', label: t('requirements.artifact.typeProcess') },
    { value: 'ADP_APP', label: t('requirements.artifact.typeAdpApp') },
    { value: 'AGENT', label: t('requirements.artifact.typeAgent') },
    { value: 'HUMAN_COLLAB', label: t('requirements.artifact.typeHumanCollab') },
  ];

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
    ...((canEdit || canManageProcesses)
      ? [
          {
            title: t('common.actions'),
            dataIndex: 'action',
            key: 'action',
            width: 60,
            render: (_: unknown, record: UnifiedRow) => {
              const allow =
                record.source === 'process' ? canManageProcesses : canEdit;
              if (!allow) return null;
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
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {canManageProcesses && (
            <Button
              icon={<Settings size={14} strokeWidth={2} />}
              theme="borderless"
              size="small"
              type="tertiary"
              onClick={() => setManageProcessesVisible(true)}
            >
              {t('requirements.linkedProcesses.manage')}
            </Button>
          )}
          {(canEdit || canManageProcesses) && (
            <Button
              icon={<Plus size={16} strokeWidth={2} />}
              size="small"
              theme="borderless"
              onClick={() => setModalVisible(true)}
            >
              {t('requirements.artifact.addNew')}
            </Button>
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

      {/* 关联弹窗 */}
      <Modal
        title={t('requirements.artifact.addTitle')}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={520}
        centered
        maskClosable={false}
      >
        <Form onSubmit={handleAdd} labelPosition="top" initValues={{ contribution: 0.3 }}>
          {({ formState }) => {
            const selectedType = formState.values.artifactType as ArtifactType | undefined;
            const optionList =
              selectedType === 'PROCESS'
                ? MOCK_PROCESS_POOL
                    .filter((p) => !linkedProcesses.some((lp) => lp.id === p.id))
                    .map((p) => ({ value: p.id, label: p.name }))
                : mockNonProcessArtifacts
                    .filter((a) => !selectedType || a.type === selectedType)
                    .map((a) => ({ value: a.id, label: a.name }));
            return (
              <>
                <Form.Select
                  field="artifactType"
                  label={t('requirements.artifact.selectType')}
                  rules={[{ required: true, message: t('requirements.artifact.typeRequired') }]}
                  optionList={typeOptions}
                  trigger={['blur', 'change']}
                  style={{ width: '100%' }}
                />

                <Form.Select
                  field="artifactId"
                  label={t('requirements.artifact.selectArtifact')}
                  rules={[{ required: true, message: t('requirements.artifact.artifactRequired') }]}
                  optionList={optionList}
                  filter
                  trigger={['blur', 'change']}
                  style={{ width: '100%' }}
                />

                {selectedType !== 'PROCESS' && (
                  <>
                    <Form.InputNumber
                      field="contribution"
                      label={t('requirements.artifact.contributionLabel')}
                      rules={[
                        { required: true, message: t('requirements.artifact.contributionRequired') },
                      ]}
                      min={0}
                      max={1}
                      step={0.1}
                      precision={1}
                      style={{ width: '100%' }}
                    />
                    <Text type="tertiary" size="small" style={{ marginTop: -12, marginBottom: 16, display: 'block' }}>
                      {t('requirements.artifact.contributionDesc')}
                    </Text>

                    <Form.TextArea
                      field="description"
                      label={`${t('requirements.artifact.descriptionLabel')}${t('requirements.form.optionalSuffix')}`}
                      placeholder={t('requirements.artifact.descriptionPlaceholder')}
                      autosize={{ minRows: 2, maxRows: 4 }}
                      maxCount={500}
                    />
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--semi-color-border)' }}>
                  <Button theme="light" onClick={() => setModalVisible(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button htmlType="submit" theme="solid" type="primary">
                    {t('requirements.artifact.confirm')}
                  </Button>
                </div>
              </>
            );
          }}
        </Form>
      </Modal>

      {/* 流程批量管理弹窗 */}
      {canManageProcesses && (
        <ManageLinkedProcessesModal
          visible={manageProcessesVisible}
          requirementId={data.id}
          linked={linkedProcesses}
          onClose={() => setManageProcessesVisible(false)}
          onChanged={() => onProcessesChanged?.()}
        />
      )}
    </div>
  );
};

export default ArtifactSection;
