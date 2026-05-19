import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Tag } from '@douyinfe/semi-ui';
import ReactECharts from 'echarts-for-react';
import { ArrowRight, Plus, RefreshCw } from 'lucide-react';
import {
  listMetrics,
  getAllRecords,
  subscribeMetricsMockMode,
} from '@/mocks/operationsMetrics/service';
import type {
  CustomMetricWithSnapshot,
} from '@/mocks/operationsMetrics/types';
import MetricsEmptyState from '@/pages/Operations/MetricsConfig/components/MetricsEmptyState';
import MetricsSkeleton from '@/pages/Operations/MetricsConfig/components/MetricsSkeleton';
import './index.less';

const { Text } = Typography;

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#14B8A6', '#EF4444'];

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const CustomMetricsSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<CustomMetricWithSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    listMetrics({ visible: true })
      .then((list) => {
        setMetrics(list);
        setError(null);
      })
      .catch(() => {
        setMetrics([]);
        setError('NETWORK');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    // 切换 mock 模式时自动重拉
    return subscribeMetricsMockMode(() => fetchData());
  }, [fetchData]);

  const numericMetrics = useMemo(
    () => metrics.filter((m) => m.metricType !== 'LATEST'),
    [metrics],
  );
  const latestMetrics = useMemo(
    () => metrics.filter((m) => m.metricType === 'LATEST'),
    [metrics],
  );

  // 趋势图：每个 numeric 指标一条线（按日聚合，取每日最后值）
  const trendOption = useMemo(() => {
    if (numericMetrics.length === 0) return null;
    const limited = numericMetrics.slice(0, 4);
    // 取最近 30 天日期
    const days: string[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(`${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')}`);
    }
    const series = limited.map((m, idx) => {
      const all = getAllRecords(m.id);
      const byDay = new Map<string, number>();
      all.forEach((r) => {
        const d = new Date(r.timestamp);
        const key = `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')}`;
        byDay.set(key, typeof r.value === 'number' ? r.value : 0);
      });
      // 前向填充
      let last = 0;
      const data = days.map((day) => {
        const v = byDay.get(day);
        if (v !== undefined) last = v;
        return last;
      });
      return {
        name: m.displayName,
        type: 'line' as const,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        data,
        lineStyle: { width: 2, color: CHART_COLORS[idx % CHART_COLORS.length] },
        itemStyle: { color: CHART_COLORS[idx % CHART_COLORS.length] },
      };
    });
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#E5E7EB',
        textStyle: { color: '#374151', fontSize: 12 },
        extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 8px;',
      },
      legend: {
        bottom: 0,
        itemWidth: 14,
        itemHeight: 3,
        textStyle: { fontSize: 12, color: '#6B7280' },
      },
      grid: { left: 56, right: 16, top: 16, bottom: 44 },
      xAxis: {
        type: 'category',
        data: days,
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
      series,
    };
  }, [numericMetrics]);

  if (loading) {
    return (
      <div className="dashboard-card custom-metrics-section">
        <Spin spinning style={{ display: 'block', padding: 40, textAlign: 'center' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card custom-metrics-section">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">
            {t('operations.businessOutcomes.customMetrics.title')}
          </span>
        </div>
        <Empty
          image={<AlertTriangle size={48} strokeWidth={1.5} color="var(--semi-color-danger)" />}
          title={t('operations.businessOutcomes.customMetrics.errorTitle')}
          description={t('operations.businessOutcomes.customMetrics.errorDesc')}
          style={{ padding: '32px 0' }}
        >
          <Button
            theme="solid"
            type="primary"
            icon={<RefreshCw size={14} strokeWidth={2} />}
            onClick={fetchData}
          >
            {t('common.refresh')}
          </Button>
        </Empty>
      </div>
    );
  }


  if (metrics.length === 0) {
    return (
      <div className="dashboard-card custom-metrics-section">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">
            {t('operations.businessOutcomes.customMetrics.title')}
          </span>
          <Button
            icon={<ArrowRight size={14} strokeWidth={2} />}
            iconPosition="right"
            theme="borderless"
            type="primary"
            onClick={() => navigate('/operations/metrics-config')}
          >
            {t('operations.businessOutcomes.customMetrics.manage')}
          </Button>
        </div>
        <Empty
          image={<Gauge size={48} strokeWidth={1.5} color="#9CA3AF" />}
          title={t('operations.businessOutcomes.customMetrics.emptyTitle')}
          description={t('operations.businessOutcomes.customMetrics.emptyDesc')}
          style={{ padding: '32px 0' }}
        >
          <Button
            theme="solid"
            type="primary"
            onClick={() => navigate('/operations/metrics-config')}
          >
            {t('operations.businessOutcomes.customMetrics.goConfig')}
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="dashboard-card custom-metrics-section">
      <div className="dashboard-card-header">
        <span className="dashboard-card-title">
          {t('operations.businessOutcomes.customMetrics.title')}
          <Text type="tertiary" size="small" style={{ marginLeft: 8 }}>
            {t('operations.businessOutcomes.customMetrics.totalCount', { count: metrics.length })}
          </Text>
        </span>
        <Button
          icon={<ArrowRight size={14} strokeWidth={2} />}
          iconPosition="right"
          theme="borderless"
          type="primary"
          onClick={() => navigate('/operations/metrics-config')}
        >
          {t('operations.businessOutcomes.customMetrics.manage')}
        </Button>
      </div>

      {/* KPI 网格 */}
      <div className="custom-metrics-grid">
        {metrics.map((m) => (
          <div key={m.id} className="custom-metric-card">
            <div className="custom-metric-card-label">
              <Text type="tertiary" size="small">{m.displayName}</Text>
              <Tag size="small" type="ghost" color="grey">{m.code}</Tag>
            </div>
            <div className="custom-metric-card-value">
              {m.currentValue === null || m.currentValue === ''
                ? '-'
                : typeof m.currentValue === 'number'
                  ? m.currentValue.toLocaleString()
                  : m.currentValue}
              {m.unit && typeof m.currentValue === 'number' && (
                <span className="unit"> {m.unit}</span>
              )}
            </div>
            <Text type="tertiary" size="small">
              {t('operations.businessOutcomes.customMetrics.updatedAt', {
                time: formatDateTime(m.lastUpdatedAt),
              })}
            </Text>
          </div>
        ))}
      </div>

      {/* 趋势图 + LATEST 列表 */}
      <div className="custom-metrics-detail">
        {trendOption && (
          <div className="custom-metrics-trend">
            <div className="chart-subtitle">
              {t('operations.businessOutcomes.customMetrics.trendTitle')}
              {numericMetrics.length > 4 && (
                <Text type="tertiary" size="small" style={{ marginLeft: 8 }}>
                  {t('operations.businessOutcomes.customMetrics.trendLimit')}
                </Text>
              )}
            </div>
            <ReactECharts option={trendOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
          </div>
        )}
        {latestMetrics.length > 0 && (
          <div className="custom-metrics-latest">
            <div className="chart-subtitle">
              {t('operations.businessOutcomes.customMetrics.latestTitle')}
            </div>
            <div className="custom-metrics-latest-list">
              {latestMetrics.map((m) => (
                <div key={m.id} className="latest-item">
                  <div className="latest-item-name">
                    <Text>{m.displayName}</Text>
                    <Text type="tertiary" size="small">
                      {formatDateTime(m.lastUpdatedAt)}
                    </Text>
                  </div>
                  <Tag color="teal" type="light" size="large">
                    {m.currentValue || '-'}
                  </Tag>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomMetricsSection;
