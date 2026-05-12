import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Tag, Typography, Tooltip } from '@douyinfe/semi-ui';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag/interface';
import { AlertTriangle, Info } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import type { RequirementItem, LinkedProcess } from '../../../types';
import { getRequirementEffortSummary } from '../../../mockData';
import { linkedProcessStatusConfig } from '../../../utils/aggregateLinkedStatus';
import './index.less';

const { Text } = Typography;

const fmt = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return '--';
  return Number(n).toFixed(1).replace(/\.0$/, '');
};

interface Props {
  data: RequirementItem;
}

const EffortTab = ({ data }: Props) => {
  const { t } = useTranslation();
  const summary = useMemo(() => getRequirementEffortSummary(data), [data]);

  if (summary.total_process_count === 0) {
    return (
      <div className="req-effort-tab-empty">
        <EmptyState description={t('requirements.detail.effort.empty')} size={120} />
      </div>
    );
  }

  const overTotal = summary.effort_actual_total - summary.effort_estimate_total;
  const isOver = overTotal > 0 && summary.effort_estimate_total > 0;
  const completionPct = Math.round(summary.completion_rate * 100);

  const columns = [
    {
      title: t('requirements.detail.effort.table.process'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 280 }}>
          {name}
        </Text>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: LinkedProcess['status']) => {
        const cfg = linkedProcessStatusConfig[s];
        return cfg ? (
          <Tag size="small" color={cfg.color as TagColor} type="light">
            {t(cfg.i18nKey)}
          </Tag>
        ) : (
          '-'
        );
      },
    },
    {
      title: t('requirements.detail.effort.table.estimate'),
      dataIndex: 'effort_estimate_days',
      key: 'effort_estimate_days',
      width: 120,
      align: 'right' as const,
      render: (v: number | null | undefined) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {v === null || v === undefined ? <Text type="tertiary">--</Text> : `${fmt(v)} ${t('requirements.detail.effort.unit')}`}
        </span>
      ),
    },
    {
      title: t('requirements.detail.effort.table.actual'),
      dataIndex: 'effort_actual_days',
      key: 'effort_actual_days',
      width: 120,
      align: 'right' as const,
      render: (v: number | null | undefined) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {v === null || v === undefined ? <Text type="tertiary">--</Text> : `${fmt(v)} ${t('requirements.detail.effort.unit')}`}
        </span>
      ),
    },
    {
      title: t('requirements.detail.effort.table.overrun'),
      dataIndex: '_overrun',
      key: '_overrun',
      width: 110,
      align: 'right' as const,
      render: (_: unknown, row: LinkedProcess) => {
        if (row.effort_estimate_days === null || row.effort_estimate_days === undefined) {
          return <Text type="tertiary">--</Text>;
        }
        const actual = row.effort_actual_days ?? 0;
        const delta = Math.round((actual - row.effort_estimate_days) * 10) / 10;
        if (delta > 0) {
          return (
            <Tag size="small" color="red" type="light">
              +{fmt(delta)}
            </Tag>
          );
        }
        return <Text type="tertiary">--</Text>;
      },
    },
  ];

  return (
    <div className="req-effort-tab">
      <div className="req-effort-tab-kpi">
        <div className="req-effort-tab-kpi-cell">
          <Text type="tertiary" size="small">
            {t('requirements.detail.effort.kpi.estimateTotal')}
          </Text>
          <span className="req-effort-tab-kpi-cell-value">
            {fmt(summary.effort_estimate_total)} <Text type="tertiary" size="small">{t('requirements.detail.effort.unit')}</Text>
          </span>
        </div>
        <div className="req-effort-tab-kpi-cell">
          <Text type="tertiary" size="small">
            {t('requirements.detail.effort.kpi.actualTotal')}
          </Text>
          <span className={`req-effort-tab-kpi-cell-value ${isOver ? 'is-over' : ''}`}>
            {fmt(summary.effort_actual_total)} <Text type="tertiary" size="small">{t('requirements.detail.effort.unit')}</Text>
            {isOver && (
              <Tooltip content={t('requirements.detail.effort.overTip', { delta: fmt(overTotal) })}>
                <Tag color="red" type="light" prefixIcon={<AlertTriangle size={12} strokeWidth={2} />}>
                  +{fmt(overTotal)}
                </Tag>
              </Tooltip>
            )}
          </span>
        </div>
        <div className="req-effort-tab-kpi-cell">
          <Text type="tertiary" size="small">
            {t('requirements.detail.effort.kpi.completionRate')}
          </Text>
          <span className="req-effort-tab-kpi-cell-value">{completionPct}%</span>
          <Text className="req-effort-tab-kpi-cell-meta">
            {t('requirements.detail.effort.kpi.completionMeta', {
              published: summary.published_process_count,
              denom: summary.total_process_count,
            })}
          </Text>
        </div>
      </div>

      {summary.unestimated_process_count > 0 && (
        <div className="req-effort-tab-warning">
          <Info size={14} strokeWidth={2} />
          <span>
            {t('requirements.detail.effort.unestimatedWarning', { count: summary.unestimated_process_count })}
          </span>
        </div>
      )}

      <div>
        <div className="req-effort-tab-section-title">
          {t('requirements.detail.effort.processListTitle')}
        </div>
        <Table
          size="small"
          columns={columns}
          dataSource={summary.processes}
          rowKey="id"
          pagination={false}
        />
      </div>
    </div>
  );
};

export default EffortTab;
