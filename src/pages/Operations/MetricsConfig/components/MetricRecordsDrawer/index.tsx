import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Tag, Table, Pagination, Spin, Banner } from '@douyinfe/semi-ui';
import ReactECharts from 'echarts-for-react';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import {
  listMetricRecords,
  getAllRecords,
  getMetricSnapshot,
} from '@/mocks/operationsMetrics/service';
import type {
  CustomMetricWithSnapshot,
  MetricRecord,
  MetricType,
} from '@/mocks/operationsMetrics/types';
import MetricsEmptyState from '../MetricsEmptyState';
import './index.less';

const { Title, Text } = Typography;

interface Props {
  visible: boolean;
  metric: CustomMetricWithSnapshot | null;
  onClose: () => void;
}

const TYPE_COLOR: Record<MetricType, 'blue' | 'violet' | 'teal'> = {
  COUNTER: 'blue',
  ACCUMULATOR: 'violet',
  LATEST: 'teal',
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const MetricRecordsDrawer = ({ visible, metric, onClose }: Props) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [records, setRecords] = useState<MetricRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !metric) return;
    setPage(1);
  }, [visible, metric]);

  useEffect(() => {
    if (!visible || !metric) return;
    setLoading(true);
    listMetricRecords(metric.id, { page, pageSize })
      .then((res) => {
        setRecords(res.records);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [visible, metric, page, pageSize]);

  const allRecords = useMemo(
    () => (metric ? getAllRecords(metric.id) : []),
    [metric, total],
  );
  const hasAnyRecords = allRecords.length > 0;

  const trendOption = useMemo(() => {
    if (!metric) return null;
    if (metric.metricType === 'LATEST') return null;
    if (!hasAnyRecords) return null;
    const byDay = new Map<string, number>();
    allRecords.forEach((r) => {
      const day = r.timestamp.slice(0, 10);
      byDay.set(day, typeof r.value === 'number' ? r.value : 0);
    });
    const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#E5E7EB',
        textStyle: { color: '#374151', fontSize: 12 },
        extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 8px;',
      },
      grid: { left: 56, right: 16, top: 16, bottom: 32 },
      xAxis: {
        type: 'category',
        data: days.map(([d]) => d.slice(5)),
        axisLabel: { fontSize: 11, color: '#9CA3AF' },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#E5E7EB' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 11, color: '#9CA3AF' },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          data: days.map(([, v]) => v),
          lineStyle: { width: 2.5, color: '#3B82F6' },
          itemStyle: { color: '#3B82F6' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59,130,246,0.25)' },
                { offset: 1, color: 'rgba(59,130,246,0)' },
              ],
            },
          },
        },
      ],
    };
  }, [metric, allRecords, hasAnyRecords]);

  const columns = [
    {
      title: t('metricsConfig.records.time'),
      dataIndex: 'timestamp',
      width: 160,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: t('metricsConfig.records.operator'),
      dataIndex: 'operator',
      width: 120,
      render: (v: string) => <Tag type="light" color="blue">{v}</Tag>,
    },
    {
      title: t('metricsConfig.records.delta'),
      dataIndex: 'delta',
      width: 100,
      render: (v: number, row: MetricRecord) => {
        if (row.operator === 'LATEST' || row.operator === 'SET') return '-';
        return `+${v.toLocaleString()}`;
      },
    },
    {
      title: t('metricsConfig.records.value'),
      dataIndex: 'value',
      width: 140,
      render: (v: number | string) =>
        typeof v === 'number' ? v.toLocaleString() : v,
    },
    {
      title: t('metricsConfig.records.executionId'),
      dataIndex: 'executionId',
      width: 140,
      render: (v: string) => <Text code>{v}</Text>,
    },
  ];

  if (!metric) return null;

  const snap = getMetricSnapshot(metric.id);

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={onClose}
      title={`${metric.displayName} (${metric.code})`}
      dataList={[]}
      currentId={metric.id}
      onNavigate={() => {}}
      showNavigation={false}
      defaultWidth={900}
      minWidth={720}
      storageKey="metricRecordsDrawerWidth"
    >
      <div className="metric-records-drawer-content">
        <div className="metric-records-summary">
          <div className="summary-item">
            <Text type="tertiary" size="small">{t('metricsConfig.col.type')}</Text>
            <Tag color={TYPE_COLOR[metric.metricType]} type="light">
              {t(`metricsConfig.type.${metric.metricType}`)}
            </Tag>
          </div>
          <div className="summary-item">
            <Text type="tertiary" size="small">{t('metricsConfig.col.currentValue')}</Text>
            <Title heading={4} style={{ margin: 0 }}>
              {snap
                ? typeof snap.currentValue === 'number'
                  ? snap.currentValue.toLocaleString()
                  : snap.currentValue || '-'
                : '-'}
              {metric.unit ? (
                <Text type="tertiary" size="small">{` ${metric.unit}`}</Text>
              ) : null}
            </Title>
          </div>
          <div className="summary-item">
            <Text type="tertiary" size="small">{t('metricsConfig.col.lastUpdated')}</Text>
            <Text>{formatDateTime(snap?.lastUpdatedAt)}</Text>
          </div>
        </div>

        {trendOption && (
          <div className="metric-records-section">
            <Text strong>{t('metricsConfig.records.trendTitle')}</Text>
            <ReactECharts option={trendOption} style={{ height: 220, marginTop: 8 }} opts={{ renderer: 'svg' }} />
          </div>
        )}

        <div className="metric-records-section">
          <Text strong>{t('metricsConfig.records.tableTitle')}</Text>
          <Spin spinning={loading}>
            <Table
              rowKey="id"
              dataSource={records}
              columns={columns}
              size="small"
              pagination={false}
              empty={
                <Empty
                  image={<img src={noDataImg} alt="" style={{ width: 110 }} />}
                  title={t('metricsConfig.records.emptyTitle')}
                  description={t('metricsConfig.records.emptyDesc')}
                  style={{ padding: '32px 0' }}
                />
              }
              style={{ marginTop: 8 }}
            />
          </Spin>
          {!loading && !hasAnyRecords && (
            <Banner
              type="info"
              fullMode={false}
              closeIcon={null}
              description={t('metricsConfig.records.deletableHint')}
              style={{ marginTop: 12 }}
            />
          )}
          {total > 0 && (
            <div className="list-pagination">
              <Text type="tertiary">
                {t('common.showingRecords', {
                  start: (page - 1) * pageSize + 1,
                  end: Math.min(page * pageSize, total),
                  total,
                })}
              </Text>
              <Pagination
                total={total}
                currentPage={page}
                pageSize={pageSize}
                showSizeChanger
                pageSizeOpts={[10, 20, 50]}
                onPageChange={setPage}
                onPageSizeChange={(s: number) => {
                  setPageSize(s);
                  setPage(1);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </DetailDrawerWrapper>
  );
};

export default MetricRecordsDrawer;
