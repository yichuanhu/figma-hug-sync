import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Table,
  Tag,
} from '@douyinfe/semi-ui';
import { IconTickCircle, IconClock, IconClose } from '@douyinfe/semi-icons';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import EmptyState from '@/components/EmptyState';

import './index.less';

const { Title, Text } = Typography;

interface AcceptanceRecord {
  id: string;
  stage: string;
  result: 'PASSED' | 'FAILED' | 'PENDING';
  score?: number;
  reviewer: string;
  reviewerId: string;
  comment: string;
  reviewedAt: string;
}

interface AcceptancePanelProps {
  requirementId: string;
}

const generateMockAcceptance = (requirementId: string): AcceptanceRecord[] => {
  const seed = requirementId.charCodeAt(requirementId.length - 1) % 10;
  if (seed < 3) return [];

  const stages = [
    'Functional Testing',
    'Performance Testing',
    'UAT Sign-off',
    'Security Review',
    'Go-Live Approval',
  ];
  const reviewers = [
    { name: 'David Lee', id: 'user-1' },
    { name: 'Anna Kim', id: 'user-2' },
    { name: 'Robert Chen', id: 'user-3' },
    { name: 'Sophie Liu', id: 'user-4' },
    { name: 'Tom Harris', id: 'user-5' },
  ];
  const comments = [
    'All test cases passed. No critical defects found.',
    'Response time within SLA. Throughput meets target.',
    'Business users confirmed workflow matches requirements.',
    'Passed security scan. No vulnerabilities detected.',
    'Approved for production deployment.',
  ];

  const count = Math.min((seed % 4) + 2, stages.length);
  const records: AcceptanceRecord[] = [];
  for (let i = 0; i < count; i++) {
    const result: AcceptanceRecord['result'] = i < count - 1 ? 'PASSED' : (seed % 3 === 0 ? 'FAILED' : i === count - 1 && seed % 2 === 0 ? 'PENDING' : 'PASSED');
    records.push({
      id: `accept-${requirementId}-${i}`,
      stage: stages[i],
      result,
      score: result === 'PENDING' ? undefined : (result === 'PASSED' ? 85 + (seed + i) % 15 : 45 + seed % 20),
      reviewer: reviewers[i % reviewers.length].name,
      reviewerId: reviewers[i % reviewers.length].id,
      comment: result === 'PENDING' ? 'Awaiting review.' : comments[i],
      reviewedAt: `2026-03-${String(10 + i * 2).padStart(2, '0')}T${String(9 + i).padStart(2, '0')}:00:00Z`,
    });
  }
  return records;
};

const AcceptancePanel: React.FC<AcceptancePanelProps> = ({ requirementId }) => {
  const { t } = useTranslation();
  const records = useMemo(() => generateMockAcceptance(requirementId), [requirementId]);

  const resultConfig: Record<string, { color: 'green' | 'red' | 'orange'; icon: React.ReactNode; i18nKey: string }> = {
    PASSED: { color: 'green', icon: <IconTickCircle />, i18nKey: 'requirement.acceptance.resultPassed' },
    FAILED: { color: 'red', icon: <IconClose />, i18nKey: 'requirement.acceptance.resultFailed' },
    PENDING: { color: 'orange', icon: <IconClock />, i18nKey: 'requirement.acceptance.resultPending' },
  };

  if (records.length === 0) {
    return (
      <div className="acceptance-panel-empty">
        <EmptyState
          variant="noData"
          description={t('requirement.acceptance.noRecordDesc')}
        />
      </div>
    );
  }

  const passedCount = records.filter(r => r.result === 'PASSED').length;
  const totalCount = records.length;

  const columns = [
    {
      title: t('requirement.acceptance.stage'),
      dataIndex: 'stage',
      width: 180,
    },
    {
      title: t('requirement.acceptance.result'),
      dataIndex: 'result',
      width: 100,
      render: (result: string) => {
        const cfg = resultConfig[result];
        return cfg ? <Tag color={cfg.color} prefixIcon={cfg.icon}>{t(cfg.i18nKey)}</Tag> : '-';
      },
    },
    {
      title: t('requirement.acceptance.score'),
      dataIndex: 'score',
      width: 80,
      render: (score?: number) => score != null ? (
        <Text style={{ color: score >= 80 ? 'var(--semi-color-success)' : score >= 60 ? 'var(--semi-color-warning)' : 'var(--semi-color-danger)' }}>
          {score}
        </Text>
      ) : '-',
    },
    {
      title: t('requirement.acceptance.reviewer'),
      dataIndex: 'reviewer',
      width: 120,
      render: (name: string, record: AcceptanceRecord) => (
        <UserNameWithCard name={name} userId={record.reviewerId} />
      ),
    },
    {
      title: t('requirement.acceptance.comment'),
      dataIndex: 'comment',
      ellipsis: true,
    },
    {
      title: t('requirement.acceptance.reviewedAt'),
      dataIndex: 'reviewedAt',
      width: 160,
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
  ];

  return (
    <div className="acceptance-panel">
      {/* Progress summary */}
      <div className="acceptance-panel-summary">
        <div className="acceptance-panel-summary-stat">
          <Text style={{ fontSize: 24, fontWeight: 600 }}>{passedCount}/{totalCount}</Text>
          <Text size="small" type="tertiary">{t('requirement.acceptance.stagesPassed')}</Text>
        </div>
        <div className="acceptance-panel-summary-bar">
          <div
            className="acceptance-panel-summary-bar-fill"
            style={{ width: `${(passedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="acceptance-panel-section">
        <Title heading={6} className="acceptance-panel-section-title">
          <span className="acceptance-panel-section-indicator" />
          {t('requirement.acceptance.allRecords')}
        </Title>
        <Table
          columns={columns}
          dataSource={records}
          pagination={false}
          size="small"
          rowKey="id"
        />
      </div>
    </div>
  );
};

export default AcceptancePanel;
