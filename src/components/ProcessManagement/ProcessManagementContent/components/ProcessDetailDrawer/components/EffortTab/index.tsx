import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, InputNumber, Tag, Table, Toast, Tooltip, Typography } from '@douyinfe/semi-ui';
import { Plus, AlertTriangle, Clock } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import EffortEntryModal from './EffortEntryModal';
import { getEffort, putEffort, EffortError, type EffortSnapshot } from '../../../../mocks/effortStore';
import type { LYProcessEffortEntry } from '@/api';
import './index.less';

const { Text } = Typography;

interface Props {
  processId: string;
  creatorId: string;
  readOnly?: boolean;
}


const formatNumber = (n: number | null | undefined, decimals = 2): string => {
  if (n === null || n === undefined) return '--';
  return Number(n).toFixed(decimals).replace(/\.?0+$/, '') || '0';
};

const formatDateTime = (s: string | null | undefined): string => {
  if (!s) return '-';
  return s.replace('T', ' ').substring(0, 16);
};

const EffortTab = ({ processId, creatorId, readOnly = false }: Props) => {
  const { t } = useTranslation();
  const canEdit = !readOnly;


  const [snapshot, setSnapshot] = useState<EffortSnapshot>(() => getEffort(processId));
  const [estimateInput, setEstimateInput] = useState<number | null>(snapshot.estimate);
  const [remainingInput, setRemainingInput] = useState<number | null>(snapshot.remaining);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const s = getEffort(processId);
    setSnapshot(s);
    setEstimateInput(s.estimate);
    setRemainingInput(s.remaining);
  }, [processId]);

  const refresh = useCallback(() => {
    const s = getEffort(processId);
    setSnapshot(s);
    setEstimateInput(s.estimate);
    setRemainingInput(s.remaining);
  }, [processId]);

  const handleEstimateBlur = useCallback(() => {
    if (!canEdit) return;
    if (estimateInput === snapshot.estimate) return;
    if (estimateInput === null) return; // 单字段不更新 = 不传
    try {
      const next = putEffort(processId, creatorId, { estimate: estimateInput });
      setSnapshot(next);
      setRemainingInput(next.remaining);
      Toast.success(t('development.processDevelopment.detail.effort.estimateSaved'));
    } catch (e) {
      if (e instanceof EffortError) {
        Toast.error(t(`development.processDevelopment.detail.effort.errors.${e.code}`));
      }
      setEstimateInput(snapshot.estimate);
    }
  }, [estimateInput, snapshot.estimate, canEdit, processId, creatorId, t]);

  const handleRemainingBlur = useCallback(() => {
    if (!canEdit) return;
    if (remainingInput === snapshot.remaining) return;
    if (remainingInput === null) return;
    try {
      const next = putEffort(processId, creatorId, { remaining: remainingInput });
      setSnapshot(next);
      Toast.success(t('development.processDevelopment.detail.effort.remainingSaved'));
    } catch (e) {
      if (e instanceof EffortError) {
        Toast.error(t(`development.processDevelopment.detail.effort.errors.${e.code}`));
      }
      setRemainingInput(snapshot.remaining);
    }
  }, [remainingInput, snapshot.remaining, canEdit, processId, creatorId, t]);

  const isOver = snapshot.is_overrun;
  const variance = snapshot.variance_days;
  const progressPct = snapshot.progress_rate !== null ? Math.round(snapshot.progress_rate * 100) : null;

  const columns = [
    {
      title: t('development.processDevelopment.detail.effort.table.workDate'),
      dataIndex: 'work_date',
      width: 120,
    },
    {
      title: t('development.processDevelopment.detail.effort.table.delta'),
      dataIndex: 'delta_days',
      width: 130,
      render: (v: number) => {
        const sign = v > 0 ? '+' : '';
        const colorVar = v < 0 ? 'var(--semi-color-warning)' : 'var(--semi-color-text-0)';
        return (
          <span style={{ color: colorVar, fontVariantNumeric: 'tabular-nums' }}>
            {sign}{formatNumber(v)}
          </span>
        );
      },
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
      render: (name: string | null, row: LYProcessEffortEntry) =>
        name ? <UserNameWithCard name={name} userId={row.created_by} /> : '-',
    },
    {
      title: t('development.processDevelopment.detail.effort.table.createdAt'),
      dataIndex: 'created_at',
      width: 150,
      render: (v: string) => <Text type="tertiary">{formatDateTime(v)}</Text>,
    },
  ];

  const renderMetric = (label: string, content: React.ReactNode, extra?: React.ReactNode) => (
    <div className="effort-tab-metric">
      <div className="effort-tab-metric-label">{label}</div>
      <div className="effort-tab-metric-value">{content}</div>
      {extra && <div className="effort-tab-metric-extra">{extra}</div>}
    </div>
  );

  return (
    <div className="effort-tab">
      <div className="effort-tab-summary">
        {/* 预估工时 */}
        {renderMetric(
          t('development.processDevelopment.detail.effort.estimateLabel'),
          canEdit ? (
            <InputNumber
              value={estimateInput ?? undefined}
              onChange={(v) => setEstimateInput(v === '' || v === undefined ? null : Number(v))}
              onBlur={handleEstimateBlur}
              onEnterPress={handleEstimateBlur}
              precision={2}
              step={0.5}
              min={0}
              max={9999.99}
              style={{ width: 140 }}
              placeholder={t('development.processDevelopment.detail.effort.estimatePlaceholder')}
            />
          ) : (
            <span className="effort-tab-metric-text">
              {snapshot.estimate !== null ? formatNumber(snapshot.estimate) : '--'}
            </span>
          ),
        )}

        {/* 已登记工时（actual，只读，超预估高亮） */}
        {renderMetric(
          t('development.processDevelopment.detail.effort.actualLabel'),
          <span className={`effort-tab-metric-text ${isOver ? 'is-over' : ''}`}>
            {snapshot.actual !== null ? formatNumber(snapshot.actual) : '0'}
            {isOver && (
              <Tooltip content={t('development.processDevelopment.detail.effort.overTimeTip', { delta: formatNumber(variance ?? 0) })}>
                <Tag color="red" type="light" prefixIcon={<AlertTriangle size={12} strokeWidth={2} />} style={{ marginLeft: 8 }}>
                  {t('development.processDevelopment.detail.effort.overTimeTag', { delta: formatNumber(variance ?? 0) })}
                </Tag>
              </Tooltip>
            )}
          </span>,
        )}

        {/* 剩余工时 */}
        {renderMetric(
          t('development.processDevelopment.detail.effort.remainingLabel'),
          canEdit ? (
            <InputNumber
              value={remainingInput ?? undefined}
              onChange={(v) => setRemainingInput(v === '' || v === undefined ? null : Number(v))}
              onBlur={handleRemainingBlur}
              onEnterPress={handleRemainingBlur}
              precision={2}
              step={0.5}
              min={0}
              max={9999.99}
              style={{ width: 140 }}
              placeholder={t('development.processDevelopment.detail.effort.remainingPlaceholder')}
            />
          ) : (
            <span className="effort-tab-metric-text">
              {snapshot.remaining !== null ? formatNumber(snapshot.remaining) : '--'}
            </span>
          ),
        )}

        {/* 工时进度 */}
        {renderMetric(
          t('development.processDevelopment.detail.effort.progressLabel'),
          <div className="effort-tab-progress">
            {progressPct !== null ? (
              <>
                <div className="effort-tab-progress-track">
                  <div
                    className={`effort-tab-progress-fill ${isOver ? 'is-over' : ''}`}
                    style={{ width: `${Math.min(100, progressPct)}%` }}
                  />
                </div>
                <span className="effort-tab-progress-text">{progressPct}%</span>
              </>
            ) : (
              <span className="effort-tab-metric-text">--</span>
            )}
          </div>,
        )}

        {/* 预估偏差 */}
        {renderMetric(
          t('development.processDevelopment.detail.effort.varianceLabel'),
          <span
            className={`effort-tab-metric-text ${variance === null ? '' : variance > 0 ? 'is-negative' : variance < 0 ? 'is-positive' : ''}`}
          >
            {variance === null
              ? '--'
              : `${variance > 0 ? '+' : ''}${formatNumber(variance)} ${t('development.processDevelopment.detail.effort.unit')}`}
          </span>,
        )}
      </div>

      {snapshot.updated_at && (
        <div className="effort-tab-updated">
          <Clock size={12} strokeWidth={2} />
          <span>{t('development.processDevelopment.detail.effort.lastUpdated', { time: formatDateTime(snapshot.updated_at) })}</span>
        </div>
      )}

      <div className="effort-tab-section">
        <div className="effort-tab-section-header">
          <Text className="effort-tab-section-title">
            {t('development.processDevelopment.detail.effort.entriesTitle')}
            <Text type="tertiary" size="small" style={{ marginLeft: 8 }}>
              ({snapshot.entries.length})
            </Text>
          </Text>
          {canEdit && (
            <Button
              icon={<Plus size={14} strokeWidth={2} />}
              theme="solid"
              onClick={() => setModalVisible(true)}
            >
              {t('development.processDevelopment.detail.effort.addEntry')}
            </Button>
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
