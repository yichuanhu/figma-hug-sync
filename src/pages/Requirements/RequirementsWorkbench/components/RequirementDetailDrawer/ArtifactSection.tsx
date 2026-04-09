import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  Table,
  Tag,
  Toast,
  Input,
} from '@douyinfe/semi-ui';
import type { RequirementItem, RequirementArtifact, ArtifactType } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

const { Text } = Typography;

// Mock 可关联的流程/应用列表
const mockArtifacts = [
  { id: 'proc-001', name: 'Procurement Approval Process', type: 'PROCESS' as ArtifactType },
  { id: 'proc-002', name: 'Vendor Review Process', type: 'PROCESS' as ArtifactType },
  { id: 'proc-003', name: 'Invoice Processing Flow', type: 'PROCESS' as ArtifactType },
  { id: 'adp-001', name: 'Invoice Recognition App', type: 'ADP_APP' as ArtifactType },
  { id: 'adp-002', name: 'Contract Review App', type: 'ADP_APP' as ArtifactType },
  { id: 'agent-001', name: 'Customer Service Agent', type: 'AGENT' as ArtifactType },
  { id: 'agent-002', name: 'Data Entry Agent', type: 'AGENT' as ArtifactType },
  { id: 'hc-001', name: 'Exception Handling Collaboration', type: 'HUMAN_COLLAB' as ArtifactType },
];

interface ArtifactSectionProps {
  data: RequirementItem;
  onArtifactsChange?: (artifacts: RequirementArtifact[]) => void;
}

const artifactTypeConfig: Record<ArtifactType, { labelKey: string; color: string }> = {
  PROCESS: { labelKey: 'requirements.artifact.typeProcess', color: 'blue' },
  ADP_APP: { labelKey: 'requirements.artifact.typeAdpApp', color: 'purple' },
  AGENT: { labelKey: 'requirements.artifact.typeAgent', color: 'cyan' },
  HUMAN_COLLAB: { labelKey: 'requirements.artifact.typeHumanCollab', color: 'orange' },
};

const ArtifactSection = ({ data, onArtifactsChange }: ArtifactSectionProps) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [artifacts, setArtifacts] = useState<RequirementArtifact[]>(data.artifacts || []);

  const canEdit = ['DEVELOPING', 'DEVELOPED', 'ASSESSING', 'APPROVED'].includes(data.status);

  const handleAdd = (values: Record<string, unknown>) => {
    const selectedArtifact = mockArtifacts.find((a) => a.id === values.artifactId);
    if (!selectedArtifact) return;

    // Check duplicate
    if (artifacts.some((a) => a.artifactId === selectedArtifact.id)) {
      Toast.warning(t('requirements.artifact.duplicateError'));
      return;
    }

    const newArtifact: RequirementArtifact = {
      id: `artifact-${Date.now()}`,
      requirementId: data.id,
      artifactType: values.artifactType as ArtifactType,
      artifactId: selectedArtifact.id,
      artifactName: selectedArtifact.name,
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

  const handleRemove = (artifactId: string) => {
    Modal.confirm({
      title: t('requirements.artifact.removeConfirmTitle'),
      content: t('requirements.artifact.removeConfirmContent'),
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: () => {
        const updated = artifacts.filter((a) => a.id !== artifactId);
        setArtifacts(updated);
        onArtifactsChange?.(updated);
        Toast.success(t('requirements.artifact.removeSuccess'));
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
      width: 120,
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
    },
    {
      title: t('requirements.artifact.colContribution'),
      dataIndex: 'contribution',
      key: 'contribution',
      width: 80,
      render: (v: number) => `${Math.round(v * 100)}%`,
    },
    {
      title: t('requirements.artifact.colDescription'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 160,
      render: (v: string) => v || '-',
    },
    ...(canEdit
      ? [
          {
            title: t('common.actions'),
            dataIndex: 'action',
            key: 'action',
            width: 60,
            render: (_: unknown, record: RequirementArtifact) => (
              <Button
                icon={<Trash2 size={16} strokeWidth={2} />}
                theme="borderless"
                size="small"
                type="danger"
                onClick={() => handleRemove(record.id)}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="requirement-detail-section">
      <div className="requirement-detail-section-header" style={{ justifyContent: 'space-between' }}>
        <Text strong>{t('requirements.artifact.title')}</Text>
        {canEdit && (
          <Button
            icon={<Plus size={16} strokeWidth={2} />}
            size="small"
            theme="borderless"
            onClick={() => setModalVisible(true)}
          >
            {t('requirements.artifact.addNew')}
          </Button>
        )}
      </div>

      {artifacts.length > 0 ? (
        <>
          <Text type="tertiary" size="small" style={{ marginBottom: 8, display: 'block' }}>
            {t('requirements.artifact.totalCount', { count: artifacts.length })}
          </Text>
          <Table
            columns={columns}
            dataSource={artifacts}
            rowKey="id"
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
          <Form.Select
            field="artifactType"
            label={t('requirements.artifact.selectType')}
            rules={[{ required: true, message: t('requirements.artifact.typeRequired') }]}
            optionList={typeOptions}
            trigger={['blur', 'change']}
            style={{ width: '100%' }}
          />

          {/* artifactId depends on type, simplified here */}
          <Form.Select
            field="artifactId"
            label={t('requirements.artifact.selectArtifact')}
            rules={[{ required: true, message: t('requirements.artifact.artifactRequired') }]}
            optionList={mockArtifacts.map((a) => ({
              value: a.id,
              label: `${a.name}`,
              otherKey: a.type,
            }))}
            filter
            trigger={['blur', 'change']}
            style={{ width: '100%' }}
          />

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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--semi-color-border)' }}>
            <Button theme="light" onClick={() => setModalVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button htmlType="submit" theme="solid" type="primary">
              {t('requirements.artifact.confirm')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ArtifactSection;
