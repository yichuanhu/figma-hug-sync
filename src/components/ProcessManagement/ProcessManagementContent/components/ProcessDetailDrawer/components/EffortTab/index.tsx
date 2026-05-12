import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, InputNumber, Tag, Table, Toast, Tooltip, Typography, Modal, Popconfirm } from '@douyinfe/semi-ui';
import { Plus, AlertTriangle, Clock, Pencil, Trash2 } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import EffortEntryModal from './EffortEntryModal';
import { getEffort, putEstimate, deleteEntry, EffortError, type EffortSnapshot, CURRENT_USER_ID } from '../../../../mocks/effortStore';
import type { LYProcessEffortEntry } from '@/api';
import './index.less';

const { Text } = Typography;

interface Props {
  processId: string;
  creatorId: string;
}

const formatNumber = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return '-';
  return Number(n).toFixed(1).replace(/\.0$/, '');
};

const formatDateTime = (s: string | null | undefined): string => {
  if (!s) return '-';
  return s.replace('T', ' ').substring(0, 16);
};

const EffortTab = ({ processId, creatorId }: Props) => {
  const { t } = useTranslation();
  const isCreator = creatorId === CURRENT_USER_ID;

  const [snapshot, setSnapshot] = useState<EffortSnapshot>(() => getEffort(processId));
  const [estimateInput, setEstimateInput] = useState<number | null>(snapshot.estimate);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LYProcessEffortEntry | null>(null);

  useEffect(() => {
    const s = getEffort(processId);
    setSnapshot(s);
    setEstimateInput(s.estimate);
  }, [processId]);

  const refresh = useCallback(() => {
    setSnapshot(getEffort(processId));
  }, [processId]);

  const handleEstimateBlur = useCallback(() => {
    if (!isCreator) return;
    if (estimateInput === snapshot.estimate) return;
    try {
      const next = putEstimate(processId, creatorId, estimateInput);
      setSnapshot(next);
      Toast.success(t('development.processDevelopment.detail.effort.estimateSaved'));
    } catch (e) {
      if (e instanceof EffortError) {
        Toast.error(t(`development.processDevelopment.detail.effort.errors.${e.code}`));
      }
      setEstimateInput(snapshot.estimate);
    }
  }, [estimateInput, snapshot.estimate, isCreator, processId, creatorId, t]);

  const overTime = useMemo(() => {
    if (snapshot.estimate === null || snapshot.actual === null) return 0;
    return Math.round((snapshot.actual - snapshot.estimate) * 10) / 10;
  }, [snapshot.estimate, snapshot.actual]);

  const columns = useMemo(
    () => [
      {
        title: t('development.processDevelopment.detail.effort.table.workDate'),
        dataIndex: 'work_date',
        width: 120,
      },
      {
        title: t('development.processDevelopment.detail.effort.table.delta'),
        dataIndex: 'delta_days',
        width: 110,
        render: (v: number) => (
          <Text strong style={{ color: v < 0 ? 'var(--semi-color-warning)' : 'var(--semi-color-text-0)' }}>
            {v > 0 ? `+${formatNumber(v)}` : formatNumber(v)} {t('development.processDevelopment.detail.effort.unit')}
          </Text>
        ),
      },
      {
        title: t('development.processDevelopment.detail.effort.table.note'),
        dataIndex: 'note',
        render: (v: string | null) => (
          <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 280 }}>
            {v || '-'}
          </Text>
        ),
      },
      {
        title: t('development.processDevelopment.detail.effort.table.creator'),
        dataIndex: 'created_by_name',
        width: 130,
        render: (name: string | null, row: typeof snapshot.entries[number]) =>
          name ? <UserNameWithCard name={name} userId={row.created_by} /> : '-',
      },
      {
        title: t('development.processDevelopment.detail.effort.table.createdAt'),
        dataIndex: 'created_at',
        width: 150,
        render: (v: string) => <Text type="tertiary">{formatDateTime(v)}</Text>,
      },
    ],
    [t],
  );

  return (
    <div className="effort-tab">
      <div className="effort-tab-cards">
        <div className="effort-tab-card">
          <div className="effort-tab-card-label">
            {t('development.processDevelopment.detail.effort.estimateLabel')}
            {isCreator && <span className="effort-tab-card-required">*</span>}
          </div>
          <div className="effort-tab-card-value">
            {isCreator ? (
              <InputNumber
                value={estimateInput ?? undefined}
                onChange={(v) => setEstimateInput(v === '' || v === undefined ? null : Number(v))}
                onBlur={handleEstimateBlur}
                onEnterPress={handleEstimateBlur}
                precision={1}
                step={0.5}
                min={0}
                max={9999}
                style={{ width: '100%' }}
                suffix={t('development.processDevelopment.detail.effort.unit')}
                placeholder={t('development.processDevelopment.detail.effort.estimatePlaceholder')}
              />
            ) : (
              <div className="effort-tab-card-readonly">
                {snapshot.estimate !== null ? (
                  <>
                    <span className="effort-tab-card-num">{formatNumber(snapshot.estimate)}</span>
                    <span className="effort-tab-card-unit">{t('development.processDevelopment.detail.effort.unit')}</span>
                  </>
                ) : (
                  <Text type="tertiary">{t('development.processDevelopment.detail.effort.notSet')}</Text>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="effort-tab-card">
          <div className="effort-tab-card-label">
            {t('development.processDevelopment.detail.effort.actualLabel')}
          </div>
          <div className="effort-tab-card-value effort-tab-card-readonly">
            {snapshot.actual !== null ? (
              <>
                <span className="effort-tab-card-num">{formatNumber(snapshot.actual)}</span>
                <span className="effort-tab-card-unit">{t('development.processDevelopment.detail.effort.unit')}</span>
                {overTime > 0 && (
                  <Tooltip content={t('development.processDevelopment.detail.effort.overTimeTip', { delta: formatNumber(overTime) })}>
                    <Tag color="red" type="light" prefixIcon={<AlertTriangle size={12} strokeWidth={2} />} style={{ marginLeft: 8 }}>
                      {t('development.processDevelopment.detail.effort.overTimeTag', { delta: formatNumber(overTime) })}
                    </Tag>
                  </Tooltip>
                )}
              </>
            ) : (
              <Text type="tertiary">{t('development.processDevelopment.detail.effort.noEntries')}</Text>
            )}
          </div>
          {snapshot.updated_at && (
            <div className="effort-tab-card-sub">
              <Clock size={12} strokeWidth={2} />
              <span>{t('development.processDevelopment.detail.effort.lastUpdated', { time: formatDateTime(snapshot.updated_at) })}</span>
            </div>
          )}
        </div>
      </div>

      <div className="effort-tab-section">
        <div className="effort-tab-section-header">
          <Text className="effort-tab-section-title">
            {t('development.processDevelopment.detail.effort.entriesTitle')}
            <Text type="tertiary" size="small" style={{ marginLeft: 8 }}>
              ({snapshot.entries.length})
            </Text>
          </Text>
          {isCreator ? (
            <Button
              icon={<Plus size={14} strokeWidth={2} />}
              theme="solid"
              size="small"
              onClick={() => setModalVisible(true)}
            >
              {t('development.processDevelopment.detail.effort.addEntry')}
            </Button>
          ) : (
            <Tooltip content={t('development.processDevelopment.detail.effort.errors.forbidden')}>
              <Button icon={<Plus size={14} strokeWidth={2} />} theme="solid" size="small" disabled>
                {t('development.processDevelopment.detail.effort.addEntry')}
              </Button>
            </Tooltip>
          )}
        </div>

        {snapshot.entries.length === 0 ? (
          <div className="effort-tab-empty">
            <EmptyState description={t('development.processDevelopment.detail.effort.noEntries')} size={100} />
          </div>
        ) : (
          <Table
            size="small"
            columns={columns}
            dataSource={snapshot.entries}
            rowKey="id"
            pagination={snapshot.entries.length > 20 ? { pageSize: 20 } : false}
          />
        )}
      </div>

      <EffortEntryModal
        visible={modalVisible}
        processId={processId}
        creatorId={creatorId}
        onCancel={() => setModalVisible(false)}
        onSuccess={refresh}
      />
    </div>
  );
};

export default EffortTab;
