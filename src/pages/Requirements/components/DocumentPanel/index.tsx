import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Table,
  Tag,
  Button,
} from '@douyinfe/semi-ui';
import { IconFile, IconDownload } from '@douyinfe/semi-icons';
import EmptyState from '@/components/EmptyState';

import './index.less';

const { Title, Text } = Typography;

interface DocumentItem {
  id: string;
  name: string;
  type: 'PRD' | 'SDD' | 'TEST_PLAN' | 'USER_GUIDE' | 'CHANGE_LOG';
  version: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface DocumentPanelProps {
  requirementId: string;
}

const generateMockDocuments = (requirementId: string): DocumentItem[] => {
  const seed = requirementId.charCodeAt(requirementId.length - 1) % 10;
  if (seed < 3) return [];

  const docs: DocumentItem[] = [];
  const templates: Array<Omit<DocumentItem, 'id'>> = [
    { name: 'Product Requirements Document v2.1', type: 'PRD', version: 'v2.1', size: '2.4 MB', uploadedBy: 'Sarah Chen', uploadedAt: '2026-03-08T10:00:00Z' },
    { name: 'System Design Document', type: 'SDD', version: 'v1.0', size: '5.1 MB', uploadedBy: 'James Wilson', uploadedAt: '2026-03-10T14:30:00Z' },
    { name: 'Test Plan and Cases', type: 'TEST_PLAN', version: 'v1.2', size: '1.8 MB', uploadedBy: 'Emily Zhang', uploadedAt: '2026-03-12T09:15:00Z' },
    { name: 'User Operation Guide', type: 'USER_GUIDE', version: 'v1.0', size: '3.2 MB', uploadedBy: 'Michael Brown', uploadedAt: '2026-03-14T16:00:00Z' },
    { name: 'Change Log - Sprint 3', type: 'CHANGE_LOG', version: 'v3.0', size: '0.5 MB', uploadedBy: 'Lisa Wang', uploadedAt: '2026-03-15T11:30:00Z' },
  ];

  const count = Math.min((seed % 4) + 1, templates.length);
  for (let i = 0; i < count; i++) {
    docs.push({ ...templates[i], id: `doc-${requirementId}-${i}` });
  }
  return docs;
};

const DocumentPanel: React.FC<DocumentPanelProps> = ({ requirementId }) => {
  const { t } = useTranslation();
  const documents = useMemo(() => generateMockDocuments(requirementId), [requirementId]);

  const docTypeConfig: Record<string, { color: 'blue' | 'green' | 'orange' | 'cyan' | 'grey'; i18nKey: string }> = {
    PRD: { color: 'blue', i18nKey: 'requirement.document.typePRD' },
    SDD: { color: 'green', i18nKey: 'requirement.document.typeSDD' },
    TEST_PLAN: { color: 'orange', i18nKey: 'requirement.document.typeTestPlan' },
    USER_GUIDE: { color: 'cyan', i18nKey: 'requirement.document.typeUserGuide' },
    CHANGE_LOG: { color: 'grey', i18nKey: 'requirement.document.typeChangeLog' },
  };

  if (documents.length === 0) {
    return (
      <div className="document-panel-empty">
        <EmptyState
          variant="noData"
          description={t('requirement.document.noDocumentDesc')}
        />
      </div>
    );
  }

  const columns = [
    {
      title: t('requirement.document.docName'),
      dataIndex: 'name',
      ellipsis: true,
      render: (name: string) => (
        <span className="document-panel-name">
          <IconFile style={{ marginRight: 6, color: 'var(--semi-color-text-2)' }} />
          {name}
        </span>
      ),
    },
    {
      title: t('requirement.document.docType'),
      dataIndex: 'type',
      width: 120,
      render: (type: string) => {
        const cfg = docTypeConfig[type];
        return cfg ? <Tag color={cfg.color}>{t(cfg.i18nKey)}</Tag> : '-';
      },
    },
    {
      title: t('requirement.document.version'),
      dataIndex: 'version',
      width: 80,
    },
    {
      title: t('requirement.document.fileSize'),
      dataIndex: 'size',
      width: 80,
    },
    {
      title: t('requirement.document.uploadedBy'),
      dataIndex: 'uploadedBy',
      width: 120,
    },
    {
      title: t('requirement.document.uploadedAt'),
      dataIndex: 'uploadedAt',
      width: 160,
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: t('common.actions'),
      width: 60,
      render: () => (
        <Button icon={<IconDownload />} theme="borderless" size="small" type="tertiary" />
      ),
    },
  ];

  return (
    <div className="document-panel">
      <div className="document-panel-section">
        <Title heading={6} className="document-panel-section-title">
          <span className="document-panel-section-indicator" />
          {t('requirement.document.allDocuments')}
          <Tag size="small" style={{ marginLeft: 8 }}>{documents.length}</Tag>
        </Title>
        <Table
          columns={columns}
          dataSource={documents}
          pagination={false}
          size="small"
          rowKey="id"
        />
      </div>
    </div>
  );
};

export default DocumentPanel;
