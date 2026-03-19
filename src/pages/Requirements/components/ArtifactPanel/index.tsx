import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Table,
  Tag,
  Empty,
  Avatar,
  AvatarGroup,
  Tooltip,
} from '@douyinfe/semi-ui';
import { IconLink, IconServer, IconKey, IconSetting } from '@douyinfe/semi-icons';

import './index.less';

const { Title, Text } = Typography;

interface ArtifactItem {
  id: string;
  type: 'process' | 'worker' | 'credential' | 'integration';
  name: string;
  status: 'active' | 'inactive' | 'draft';
  linkedAt: string;
  linkedBy: string;
}

interface ArtifactPanelProps {
  requirementId: string;
}

const generateMockArtifacts = (requirementId: string): ArtifactItem[] => {
  const seed = requirementId.charCodeAt(requirementId.length - 1) % 10;
  if (seed < 2) return [];

  const items: ArtifactItem[] = [];
  const types: ArtifactItem['type'][] = ['process', 'worker', 'credential', 'integration'];
  const processNames = ['Invoice Processing Bot', 'Data Migration Pipeline', 'Report Generator', 'Order Fulfillment Flow'];
  const workerNames = ['Worker-PRD-01', 'Worker-PRD-02', 'Worker-STG-01'];
  const credentialNames = ['SAP Production Credential', 'Email Service Account', 'Database Read-Only Access'];
  const integrationNames = ['SAP ERP Connector', 'Salesforce API', 'SharePoint Integration'];
  const people = ['James Wilson', 'Emily Zhang', 'Michael Brown', 'Lisa Wang'];

  const count = (seed % 4) + 2;
  for (let i = 0; i < count; i++) {
    const type = types[i % 4];
    const namePool = type === 'process' ? processNames : type === 'worker' ? workerNames : type === 'credential' ? credentialNames : integrationNames;
    items.push({
      id: `artifact-${requirementId}-${i}`,
      type,
      name: namePool[i % namePool.length],
      status: i % 3 === 0 ? 'active' : i % 3 === 1 ? 'inactive' : 'draft',
      linkedAt: `2026-03-${String(10 + i).padStart(2, '0')}T09:00:00Z`,
      linkedBy: people[i % people.length],
    });
  }
  return items;
};

const ArtifactPanel: React.FC<ArtifactPanelProps> = ({ requirementId }) => {
  const { t } = useTranslation();
  const artifacts = useMemo(() => generateMockArtifacts(requirementId), [requirementId]);

  const typeConfig: Record<string, { icon: React.ReactNode; color: string; i18nKey: string }> = {
    process: { icon: <IconFlow />, color: 'blue', i18nKey: 'requirement.artifact.typeProcess' },
    worker: { icon: <IconServer />, color: 'cyan', i18nKey: 'requirement.artifact.typeWorker' },
    credential: { icon: <IconKey />, color: 'orange', i18nKey: 'requirement.artifact.typeCredential' },
    integration: { icon: <IconLink />, color: 'green', i18nKey: 'requirement.artifact.typeIntegration' },
  };

  const statusConfig: Record<string, { color: 'green' | 'grey' | 'orange'; i18nKey: string }> = {
    active: { color: 'green', i18nKey: 'requirement.artifact.statusActive' },
    inactive: { color: 'grey', i18nKey: 'requirement.artifact.statusInactive' },
    draft: { color: 'orange', i18nKey: 'requirement.artifact.statusDraft' },
  };

  if (artifacts.length === 0) {
    return (
      <div className="artifact-panel-empty">
        <Empty
          title={t('requirement.artifact.noArtifact')}
          description={t('requirement.artifact.noArtifactDesc')}
        />
      </div>
    );
  }

  // Group summary
  const typeCounts = artifacts.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {});

  const columns = [
    {
      title: t('requirement.artifact.artifactType'),
      dataIndex: 'type',
      width: 120,
      render: (type: string) => {
        const cfg = typeConfig[type];
        return cfg ? (
          <Tag color={cfg.color as any} prefixIcon={cfg.icon}>
            {t(cfg.i18nKey)}
          </Tag>
        ) : '-';
      },
    },
    {
      title: t('requirement.artifact.artifactName'),
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const cfg = statusConfig[status];
        return cfg ? <Tag color={cfg.color}>{t(cfg.i18nKey)}</Tag> : '-';
      },
    },
    {
      title: t('requirement.artifact.linkedBy'),
      dataIndex: 'linkedBy',
      width: 120,
    },
    {
      title: t('requirement.artifact.linkedAt'),
      dataIndex: 'linkedAt',
      width: 160,
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
  ];

  return (
    <div className="artifact-panel">
      {/* Summary */}
      <div className="artifact-panel-summary">
        {Object.entries(typeCounts).map(([type, count]) => {
          const cfg = typeConfig[type];
          return cfg ? (
            <div key={type} className="artifact-panel-summary-item">
              <span className="artifact-panel-summary-icon">{cfg.icon}</span>
              <Text size="small">{t(cfg.i18nKey)}</Text>
              <Tag size="small" color={cfg.color as any}>{count}</Tag>
            </div>
          ) : null;
        })}
      </div>

      {/* Table */}
      <div className="artifact-panel-section">
        <Title heading={6} className="artifact-panel-section-title">
          <span className="artifact-panel-section-indicator" />
          {t('requirement.artifact.allArtifacts')}
        </Title>
        <Table
          columns={columns}
          dataSource={artifacts}
          pagination={false}
          size="small"
          rowKey="id"
        />
      </div>
    </div>
  );
};

export default ArtifactPanel;
