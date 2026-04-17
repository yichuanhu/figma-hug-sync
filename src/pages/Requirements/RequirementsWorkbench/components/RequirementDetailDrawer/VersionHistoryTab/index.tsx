import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Empty, Tag, Typography, Button } from '@douyinfe/semi-ui';
import { History } from 'lucide-react';
import type { RequirementItem, VersionSnapshot } from '../../../types';
import './index.less';

const { Text, Title } = Typography;

interface Props {
  data: RequirementItem;
}

const VersionHistoryTab = ({ data }: Props) => {
  const { t } = useTranslation();
  const versions = data.historyVersions ?? [];
  const sorted = [...versions].sort((a, b) => b.version - a.version);
  const [selected, setSelected] = useState<VersionSnapshot | null>(sorted[0] ?? null);
  const [compareMode, setCompareMode] = useState(false);

  if (versions.length === 0) {
    return (
      <div className="version-tab-empty">
        <Empty
          image={<History size={48} strokeWidth={1.5} color="var(--semi-color-text-2)" />}
          title={t('requirements.versionHistory.empty')}
          description={t('requirements.versionHistory.emptyDesc')}
        />
      </div>
    );
  }

  const renderField = (label: string, oldVal?: string, newVal?: string) => {
    const changed = compareMode && oldVal !== newVal;
    return (
      <div className={`version-field ${changed ? 'version-field-changed' : ''}`}>
        <Text type="tertiary" size="small" className="version-field-label">{label}</Text>
        {compareMode ? (
          <div className="version-field-compare">
            <div className="version-field-compare-cell">
              <Text type="tertiary" size="small">{t('requirements.versionHistory.snapshot')}</Text>
              <Text>{oldVal || '-'}</Text>
            </div>
            <div className="version-field-compare-cell">
              <Text type="tertiary" size="small">{t('requirements.versionHistory.current')}</Text>
              <Text>{newVal || '-'}</Text>
            </div>
          </div>
        ) : (
          <Text>{oldVal || '-'}</Text>
        )}
      </div>
    );
  };

  return (
    <div className="version-tab-content">
      <div className="version-timeline">
        <Text strong className="version-timeline-title">
          {t('requirements.versionHistory.timeline')}
        </Text>
        {sorted.map((v) => {
          const active = selected?.version === v.version;
          return (
            <div
              key={v.version}
              className={`version-timeline-item ${active ? 'version-timeline-item-active' : ''}`}
              onClick={() => { setSelected(v); setCompareMode(false); }}
            >
              <div className="version-timeline-dot" />
              <div className="version-timeline-body">
                <div className="version-timeline-row">
                  <Tag color={active ? 'blue' : 'grey'} type="light" size="small">v{v.version}</Tag>
                  <Text size="small" type="tertiary">
                    {v.createdAt.replace('T', ' ').substring(0, 16)}
                  </Text>
                </div>
                <Text size="small" strong>{v.actorName}</Text>
                <Text size="small" type="tertiary" ellipsis={{ showTooltip: true }}>{v.summary}</Text>
              </div>
            </div>
          );
        })}
      </div>

      <div className="version-detail">
        {selected && (
          <>
            <div className="version-detail-header">
              <Title heading={5} style={{ margin: 0 }}>v{selected.version}</Title>
              <Button
                size="small"
                theme={compareMode ? 'solid' : 'borderless'}
                onClick={() => setCompareMode((p) => !p)}
              >
                {compareMode
                  ? t('requirements.versionHistory.exitCompare')
                  : t('requirements.versionHistory.compareCurrent')}
              </Button>
            </div>
            {renderField(
              t('requirements.versionHistory.fields.title'),
              selected.snapshot.title,
              data.title,
            )}
            {renderField(
              t('requirements.versionHistory.fields.description'),
              selected.snapshot.description,
              data.description,
            )}
            {renderField(
              t('requirements.versionHistory.fields.priority'),
              selected.snapshot.priority,
              data.priority,
            )}
            {renderField(
              t('requirements.versionHistory.fields.status'),
              selected.snapshot.status,
              data.status,
            )}
            {renderField(
              t('requirements.versionHistory.fields.netScore'),
              selected.snapshot.detailedAssessment?.netScore !== undefined
                ? String(selected.snapshot.detailedAssessment.netScore)
                : undefined,
              data.detailedAssessment?.netScore !== undefined
                ? String(data.detailedAssessment.netScore)
                : undefined,
            )}
            {renderField(
              t('requirements.versionHistory.fields.totalCost'),
              selected.snapshot.costEstimate ? `¥${selected.snapshot.costEstimate.totalCost.toLocaleString()}` : undefined,
              data.costEstimate ? `¥${data.costEstimate.totalCost.toLocaleString()}` : undefined,
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VersionHistoryTab;
