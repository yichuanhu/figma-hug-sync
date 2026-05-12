import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Select, Button, Spin, Toast, Progress, Tooltip } from '@douyinfe/semi-ui';
import ReactECharts from 'echarts-for-react';
import { RefreshCw, ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import {
  getBusinessOutcomes,
  mockDepartments,
  mockBusinessTypes,
  mockClassifications,
} from '@/pages/Operations/mockData';
import type { BusinessOutcomesFilter } from '@/pages/Operations/types';
import MetricLabel from './components/MetricLabel';
import './index.less';

const { Title } = Typography;

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  teal: '#14B8A6',
  funnel: ['#3B82F6', '#6366F1', '#8B5CF6', '#10B981', '#14B8A6'],
  pie: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#14B8A6', '#EF4444'],
};

const TOOLTIP = {
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderColor: '#E5E7EB',
  borderWidth: 1,
  textStyle: { color: '#374151', fontSize: 12 },
  padding: [10, 14],
  extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 8px;',
};

const BusinessOutcomes = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<BusinessOutcomesFilter>({
    timeRange: 'thisMonth',
    departments: [],
    businessTypes: [],
    classifications: [],
    timeDimension: 'cumulative',
  });
  const [seed, setSeed] = useState(1);
  const [loading, setLoading] = useState(false);
  const [rankSortDesc, setRankSortDesc] = useState(true);
  const [rankFilterTypes, setRankFilterTypes] = useState<string[]>([]);

  const data = useMemo(() => getBusinessOutcomes(filter, seed), [filter, seed]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setSeed(Date.now() & 0xffffffff);
      setLoading(false);
      Toast.success(t('operations.businessOutcomes.refreshed'));
    }, 600);
  };

  const timeOptions = [
    { value: 'thisMonth', label: t('operations.dashboard.thisMonth') },
    { value: 'lastMonth', label: t('operations.dashboard.lastMonth') },
    { value: 'thisQuarter', label: t('operations.dashboard.thisQuarter') },
    { value: 'thisYear', label: t('operations.dashboard.thisYear') },
    { value: 'all', label: t('operations.dashboard.allTime') },
  ];
  const timeDimensionOptions = [
    { value: 'cumulative', label: t('operations.businessOutcomes.timeDimCumulative') },
    { value: 'today', label: t('operations.businessOutcomes.timeDimToday') },
  ];
  const deptOptions = useMemo(
    () => mockDepartments.filter(d => d.value !== 'all').map(d => ({ value: d.value, label: d.label })),
    [],
  );
  const bizOptions = useMemo(
    () => mockBusinessTypes.filter(d => d.value !== 'all').map(d => ({ value: d.value, label: d.label })),
    [],
  );
  const classificationOptions = useMemo(
    () => mockClassifications.filter(c => c.value !== 'all').map(c => ({ value: c.value, label: c.label })),
    [],
  );

  // ============ Funnel: 标注转化率 ============
  const funnelOption = useMemo(() => ({
    tooltip: { ...TOOLTIP, trigger: 'item', formatter: (p: any) =>
      `<div style="font-weight:600">${p.name}</div>` +
      `<div>${t('operations.dashboard.count')}: <b>${p.value}</b></div>` +
      (p.data.conversionRate != null ? `<div>${t('operations.businessOutcomes.conversion')}: <b>${p.data.conversionRate}%</b></div>` : '')
    },
    series: [{
      type: 'funnel',
      left: '5%', right: '5%', top: 16, bottom: 8, width: '90%',
      min: 0, minSize: '30%', sort: 'descending', gap: 4,
      label: {
        show: true, position: 'inside', color: '#fff', fontWeight: 600, fontSize: 12,
        formatter: (p: any) => p.data.conversionRate != null
          ? `${p.name}  ${p.value}  (${p.data.conversionRate}%)`
          : `${p.name}  ${p.value}`,
      },
      labelLine: { length: 12, lineStyle: { width: 1, type: 'solid' } },
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      emphasis: { label: { fontSize: 13 } },
      data: data.funnel.map((s, i) => ({ ...s, itemStyle: { color: COLORS.funnel[i % COLORS.funnel.length] } })),
    }],
  }), [data.funnel, t]);

  // ============ Type share pie ============
  const pieOption = useMemo(() => ({
    tooltip: { ...TOOLTIP, trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 12, color: '#6B7280' }, itemWidth: 12, itemHeight: 12 },
    series: [{
      type: 'pie', radius: ['42%', '72%'], center: ['50%', '42%'],
      data: data.businessTypeShare,
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 11, color: '#6B7280' },
      labelLine: { length: 12, length2: 8, lineStyle: { color: '#D1D5DB' } },
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      color: COLORS.pie,
    }],
  }), [data.businessTypeShare]);

  // ============ Volume trend bar ============
  const volumeOption = useMemo(() => ({
    tooltip: { ...TOOLTIP, trigger: 'axis' },
    grid: { left: 56, right: 16, top: 20, bottom: 32 },
    xAxis: {
      type: 'category', data: data.volumeTrend.map(d => d.month),
      axisLabel: { fontSize: 11, color: '#9CA3AF' },
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11, color: '#9CA3AF' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
    },
    series: [{
      type: 'bar', data: data.volumeTrend.map(d => d.volume), barMaxWidth: 32,
      itemStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
          { offset: 0, color: '#60A5FA' }, { offset: 1, color: '#3B82F6' },
        ]},
        borderRadius: [4, 4, 0, 0],
      },
    }],
  }), [data.volumeTrend]);

  // ============ Time saved: 趋势 + 累计 (双系列) ============
  const hoursOption = useMemo(() => ({
    tooltip: { ...TOOLTIP, trigger: 'axis' },
    legend: {
      bottom: 0, itemWidth: 12, itemHeight: 12, textStyle: { fontSize: 12, color: '#6B7280' },
      data: [t('operations.businessOutcomes.hoursSaved'), t('operations.businessOutcomes.cumulativeCurve')],
    },
    grid: { left: 56, right: 56, top: 20, bottom: 44 },
    xAxis: {
      type: 'category', data: data.timeSavedTrend.map(d => d.month),
      axisLabel: { fontSize: 11, color: '#9CA3AF' },
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      axisTick: { show: false },
    },
    yAxis: [
      { type: 'value', axisLabel: { fontSize: 11, color: '#9CA3AF' }, axisLine: { show: false }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } } },
      { type: 'value', axisLabel: { fontSize: 11, color: '#9CA3AF' }, axisLine: { show: false }, splitLine: { show: false } },
    ],
    series: [
      {
        name: t('operations.businessOutcomes.hoursSaved'),
        type: 'bar', barMaxWidth: 24, yAxisIndex: 0,
        data: data.timeSavedTrend.map(d => d.hours),
        itemStyle: { color: COLORS.success, borderRadius: [4, 4, 0, 0] },
      },
      {
        name: t('operations.businessOutcomes.cumulativeCurve'),
        type: 'line', smooth: true, yAxisIndex: 1,
        data: data.timeSavedTrend.map(d => d.cumulative ?? 0),
        symbol: 'circle', symbolSize: 6,
        lineStyle: { width: 2.5, color: COLORS.primary },
        itemStyle: { color: COLORS.primary },
      },
    ],
  }), [data.timeSavedTrend, t]);

  // ============ Department hours compare ============
  const deptHoursOption = useMemo(() => ({
    tooltip: { ...TOOLTIP, trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (p: any) => `<div style="font-weight:600">${p[0].name}</div><div>${t('operations.businessOutcomes.hoursSaved')}: <b>${p[0].value.toLocaleString()} h</b></div>`
    },
    grid: { left: 64, right: 16, top: 16, bottom: 32 },
    xAxis: {
      type: 'category', data: data.departmentOutcomes.map(d => d.department),
      axisLabel: { fontSize: 11, color: '#9CA3AF', rotate: 0 },
      axisLine: { lineStyle: { color: '#E5E7EB' } }, axisTick: { show: false },
    },
    yAxis: {
      type: 'value', axisLabel: { formatter: (v: number) => `${(v/1000).toFixed(0)}k`, fontSize: 11, color: '#9CA3AF' },
      axisLine: { show: false }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
    },
    series: [{
      type: 'bar', barMaxWidth: 36,
      data: data.departmentOutcomes.map(d => d.hoursSaved),
      itemStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
          { offset: 0, color: '#34D399' }, { offset: 1, color: '#10B981' },
        ]},
        borderRadius: [4, 4, 0, 0],
      },
    }],
  }), [data.departmentOutcomes, t]);

  // ============ Trend analysis: 双 Y 轴 业务增长率 vs 工时节省 ============
  const trendAnalysisOption = useMemo(() => ({
    tooltip: { ...TOOLTIP, trigger: 'axis' },
    legend: {
      bottom: 0, itemWidth: 16, itemHeight: 3, textStyle: { fontSize: 12, color: '#6B7280' },
      data: [t('operations.businessOutcomes.growthRateSeries'), t('operations.businessOutcomes.hoursSavedSeries')],
    },
    grid: { left: 56, right: 56, top: 24, bottom: 44 },
    xAxis: {
      type: 'category', data: data.growthVsHours.map(d => d.month), boundaryGap: false,
      axisLabel: { fontSize: 11, color: '#9CA3AF' },
      axisLine: { lineStyle: { color: '#E5E7EB' } }, axisTick: { show: false },
    },
    yAxis: [
      { type: 'value', name: t('operations.businessOutcomes.growthRateAxis'),
        nameTextStyle: { fontSize: 11, color: '#9CA3AF' },
        axisLabel: { formatter: '{value}%', fontSize: 11, color: '#9CA3AF' },
        axisLine: { show: false }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } } },
      { type: 'value', name: t('operations.businessOutcomes.hoursSavedAxis'),
        nameTextStyle: { fontSize: 11, color: '#9CA3AF' },
        axisLabel: { fontSize: 11, color: '#9CA3AF' },
        axisLine: { show: false }, splitLine: { show: false } },
    ],
    series: [
      {
        name: t('operations.businessOutcomes.growthRateSeries'), type: 'line',
        smooth: true, yAxisIndex: 0, symbol: 'circle', symbolSize: 6,
        data: data.growthVsHours.map(d => d.growthRate),
        lineStyle: { width: 2.5, color: COLORS.primary }, itemStyle: { color: COLORS.primary },
      },
      {
        name: t('operations.businessOutcomes.hoursSavedSeries'), type: 'line',
        smooth: true, yAxisIndex: 1, symbol: 'circle', symbolSize: 6,
        data: data.growthVsHours.map(d => d.hoursSaved),
        lineStyle: { width: 2.5, color: COLORS.success }, itemStyle: { color: COLORS.success },
      },
    ],
  }), [data.growthVsHours, t]);

  // ============ FEAT-023 预估准确率散点图 ============
  const accuracyScatterOption = useMemo(() => {
    const points = data.devCapacity.accuracyScatter;
    const max = Math.ceil(Math.max(...points.map(p => Math.max(p.estimatedHours, p.actualHours))) * 1.1 / 10) * 10;
    return {
      tooltip: { ...TOOLTIP, trigger: 'item', formatter: (p: any) =>
        `<div style="font-weight:600;margin-bottom:4px">${p.data[2]}</div>` +
        `<div>${t('operations.businessOutcomes.estVsActualX')}: <b>${p.data[0]} h</b></div>` +
        `<div>${t('operations.businessOutcomes.estVsActualY')}: <b>${p.data[1]} h</b></div>`
      },
      grid: { left: 56, right: 24, top: 24, bottom: 40 },
      xAxis: {
        type: 'value', name: t('operations.businessOutcomes.estVsActualX'), max,
        nameTextStyle: { fontSize: 11, color: '#9CA3AF' },
        axisLabel: { fontSize: 11, color: '#9CA3AF' },
        splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
      },
      yAxis: {
        type: 'value', name: t('operations.businessOutcomes.estVsActualY'), max,
        nameTextStyle: { fontSize: 11, color: '#9CA3AF' },
        axisLabel: { fontSize: 11, color: '#9CA3AF' },
        splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
      },
      series: [
        {
          type: 'line', name: t('operations.businessOutcomes.diagonal'), showSymbol: false,
          data: [[0, 0], [max, max]],
          lineStyle: { color: '#9CA3AF', type: 'dashed', width: 1 },
          tooltip: { show: false }, silent: true,
        },
        {
          type: 'scatter', symbolSize: 14,
          data: points.map(p => [p.estimatedHours, p.actualHours, p.processName]),
          itemStyle: {
            color: (params: any) => {
              const dev = (params.data[1] - params.data[0]) / params.data[0];
              if (Math.abs(dev) <= 0.1) return COLORS.success;
              if (Math.abs(dev) <= 0.25) return COLORS.warning;
              return COLORS.danger;
            },
            opacity: 0.85, borderColor: '#fff', borderWidth: 1.5,
          },
        },
      ],
    };
  }, [data.devCapacity.accuracyScatter, t]);

  // ============ FEAT-023 产能时间线 ============
  const capacityTimelineOption = useMemo(() => ({
    tooltip: { ...TOOLTIP, trigger: 'axis' },
    legend: {
      bottom: 0, itemWidth: 16, itemHeight: 3, textStyle: { fontSize: 12, color: '#6B7280' },
      data: [t('operations.businessOutcomes.delivered'), t('operations.businessOutcomes.planned')],
    },
    grid: { left: 48, right: 16, top: 20, bottom: 44 },
    xAxis: {
      type: 'category', data: data.devCapacity.capacityTimeline.map(d => d.period), boundaryGap: false,
      axisLabel: { fontSize: 11, color: '#9CA3AF' },
      axisLine: { lineStyle: { color: '#E5E7EB' } }, axisTick: { show: false },
    },
    yAxis: {
      type: 'value', axisLabel: { fontSize: 11, color: '#9CA3AF' },
      axisLine: { show: false }, splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
    },
    series: [
      { name: t('operations.businessOutcomes.delivered'), type: 'line', smooth: true,
        data: data.devCapacity.capacityTimeline.map(d => d.delivered),
        symbol: 'circle', symbolSize: 6,
        lineStyle: { width: 2.5, color: COLORS.success }, itemStyle: { color: COLORS.success } },
      { name: t('operations.businessOutcomes.planned'), type: 'line', smooth: true,
        data: data.devCapacity.capacityTimeline.map(d => d.planned),
        symbol: 'circle', symbolSize: 6,
        lineStyle: { width: 2, color: COLORS.primary, type: 'dashed' }, itemStyle: { color: COLORS.primary } },
    ],
  }), [data.devCapacity.capacityTimeline, t]);

  // 需求开发进度三段拆分
  const rp = data.requirementProgress;
  const pendingCount = rp.submitted + rp.approved;
  const developingCount = rp.developing;
  const liveCount = rp.running + rp.completed;
  const completionRate = rp.total > 0 ? Math.round(((rp.running + rp.completed) / rp.total) * 100) : 0;
  const deviation = rp.estimatedHours > 0
    ? Math.round(((rp.actualHours - rp.estimatedHours) / rp.estimatedHours) * 100)
    : 0;

  // 业务量排行 - 保留全量 max 用于 bar 宽度参考(切换时视觉一致)
  const rankMax = Math.max(...data.volumeRanking.map(r => r.volume), 1);
  const rankTypeOptions = useMemo(
    () => data.volumeRanking.map(r => ({ value: r.name, label: r.name })),
    [data.volumeRanking],
  );
  const displayedRanking = useMemo(() => {
    const filtered = rankFilterTypes.length === 0
      ? data.volumeRanking
      : data.volumeRanking.filter(r => rankFilterTypes.includes(r.name));
    return [...filtered].sort((a, b) => rankSortDesc ? b.volume - a.volume : a.volume - b.volume);
  }, [data.volumeRanking, rankFilterTypes, rankSortDesc]);

  // 人年换算
  const personYears = (data.totalHoursSaved / data.hoursPerYearFactor).toFixed(1);

  // FEAT-023 6 KPI
  const kpi = data.devCapacity.kpi;
  const capacityKpis = [
    { key: 'totalEst', label: t('operations.businessOutcomes.estimatedHours'), value: `${kpi.totalEstimatedHours} h`, color: COLORS.primary, tip: t('operations.businessOutcomes.tips.estimatedHours') },
    { key: 'totalAct', label: t('operations.businessOutcomes.actualHours'), value: `${kpi.totalActualHours} h`, color: COLORS.purple, tip: t('operations.businessOutcomes.tips.actualHours') },
    { key: 'compRate', label: t('operations.businessOutcomes.completionRatePct'), value: `${kpi.completionRate}%`, color: COLORS.success, tip: t('operations.businessOutcomes.tips.completionRate') },
    { key: 'unreg', label: t('operations.businessOutcomes.unregisteredProcess'), value: kpi.unregisteredProcessCount.toString(), color: COLORS.warning, tip: t('operations.businessOutcomes.tips.unregisteredProcess') },
    { key: 'devs', label: t('operations.businessOutcomes.activeDeveloperCount'), value: kpi.activeDeveloperCount.toString(), color: COLORS.teal, tip: t('operations.businessOutcomes.tips.activeDeveloperCount') },
    { key: 'timeout', label: t('operations.businessOutcomes.timeoutProcessCount'), value: kpi.timeoutProcessCount.toString(), color: COLORS.danger, tip: t('operations.businessOutcomes.tips.timeoutProcessCount') },
  ];

  return (
    <div className="business-outcomes-page">
      <Title heading={3} style={{ marginBottom: 16 }}>{t('operations.businessOutcomes.title')}</Title>

      {/* Filter */}
      <div className="bo-filter">
        <div className="bo-filter-items">
          <div className="bo-filter-item">
            <span className="bo-filter-label">{t('operations.dashboard.timeRange')}</span>
            <Select value={filter.timeRange} optionList={timeOptions}
              onChange={(v) => setFilter({ ...filter, timeRange: v as string })} style={{ width: 120 }} />
          </div>
          <div className="bo-filter-item">
            <span className="bo-filter-label">{t('operations.dashboard.department')}</span>
            <Select
              multiple maxTagCount={2}
              value={filter.departments} optionList={deptOptions}
              placeholder={t('operations.dashboard.selectAll')}
              onChange={(v) => setFilter({ ...filter, departments: (v as string[]) || [] })}
              style={{ minWidth: 180, maxWidth: 320 }} />
          </div>
          <div className="bo-filter-item">
            <span className="bo-filter-label">{t('operations.businessOutcomes.businessType')}</span>
            <Select
              multiple maxTagCount={2}
              value={filter.businessTypes} optionList={bizOptions}
              placeholder={t('operations.dashboard.selectAll')}
              onChange={(v) => setFilter({ ...filter, businessTypes: (v as string[]) || [] })}
              style={{ minWidth: 180, maxWidth: 320 }} />
          </div>
          <div className="bo-filter-item">
            <span className="bo-filter-label">{t('operations.businessOutcomes.classification')}</span>
            <Select
              multiple maxTagCount={2}
              value={filter.classifications} optionList={classificationOptions}
              placeholder={t('operations.dashboard.selectAll')}
              onChange={(v) => setFilter({ ...filter, classifications: (v as string[]) || [] })}
              style={{ minWidth: 180, maxWidth: 320 }} />
          </div>
          <div className="bo-filter-item">
            <span className="bo-filter-label">{t('operations.businessOutcomes.timeDimension')}</span>
            <Select value={filter.timeDimension} optionList={timeDimensionOptions}
              onChange={(v) => setFilter({ ...filter, timeDimension: v as string })} style={{ width: 110 }} />
          </div>
        </div>
        <Button icon={<RefreshCw size={16} strokeWidth={2} />} onClick={handleRefresh}>
          {t('common.refresh')}
        </Button>
      </div>

      <Spin spinning={loading}>
      {/* 1 & 2. 漏斗图 + 需求开发进度 横向并排 */}
      <div className="bo-row cols-2" style={{ marginBottom: 20 }}>
        <div className="dashboard-card" style={{ marginBottom: 0 }}>
          <div className="dashboard-card-header">
            <span className="dashboard-card-title">
              <MetricLabel label={t('operations.businessOutcomes.funnelTitle')} tip={t('operations.businessOutcomes.tips.funnel')} size="medium" />
            </span>
          </div>
          <ReactECharts option={funnelOption} style={{ height: 320 }} opts={{ renderer: 'svg' }} />
        </div>

        <div className="dashboard-card" style={{ marginBottom: 0 }}>
          <div className="dashboard-card-header">
            <span className="dashboard-card-title">
              <MetricLabel label={t('operations.businessOutcomes.progressTitle')} tip={t('operations.businessOutcomes.tips.progressBuckets')} size="medium" />
            </span>
            <span style={{ fontSize: 12, color: 'var(--semi-color-text-2)' }}>
              {t('operations.businessOutcomes.totalRequirements')}: <b style={{ color: 'var(--semi-color-text-0)' }}>{rp.total}</b>
            </span>
          </div>

          <div className="bo-progress-grid bo-progress-grid-3">
            <div className="bo-progress-item">
              <div className="lbl">{t('operations.businessOutcomes.progressBucketPending')}</div>
              <div className="val" style={{ color: COLORS.primary }}>{pendingCount}</div>
            </div>
            <div className="bo-progress-item">
              <div className="lbl">{t('operations.businessOutcomes.progressBucketDeveloping')}</div>
              <div className="val" style={{ color: COLORS.warning }}>{developingCount}</div>
            </div>
            <div className="bo-progress-item">
              <div className="lbl">{t('operations.businessOutcomes.progressBucketLive')}</div>
              <div className="val" style={{ color: COLORS.success }}>{liveCount}</div>
            </div>
          </div>

          {/* 完成率进度条 */}
          <div className="bo-completion-row">
            <div className="bo-completion-label">
              <MetricLabel label={t('operations.businessOutcomes.completionRate')} tip={t('operations.businessOutcomes.tips.completionRate')} />
            </div>
            <Progress percent={completionRate} stroke={COLORS.success} aria-label="completion" style={{ flex: 1 }} />
            <div className="bo-completion-value">{completionRate}%</div>
          </div>

          {/* 工时块: 预估/实际/偏差 */}
          <div className="bo-hours-grid">
            <div className="bo-hours-item">
              <div className="lbl"><MetricLabel label={t('operations.businessOutcomes.estimatedHours')} tip={t('operations.businessOutcomes.tips.estimatedHours')} /></div>
              <div className="val">{rp.estimatedHours.toLocaleString()} h</div>
            </div>
            <div className="bo-hours-item">
              <div className="lbl"><MetricLabel label={t('operations.businessOutcomes.actualHours')} tip={t('operations.businessOutcomes.tips.actualHours')} /></div>
              <div className="val">{rp.actualHours.toLocaleString()} h</div>
            </div>
            <div className="bo-hours-item">
              <div className="lbl"><MetricLabel label={t('operations.businessOutcomes.deviation')} tip={t('operations.businessOutcomes.tips.deviation')} /></div>
              <div className="val" style={{ color: deviation > 0 ? COLORS.danger : COLORS.success }}>
                {deviation > 0 ? '+' : ''}{deviation}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 业务量统计: KPI 3 卡 + 趋势 + 排行榜 */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">{t('operations.businessOutcomes.volumeTrendTitle')}</span>
        </div>
        <div className="bo-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="bo-kpi-card">
            <div className="bo-kpi-label">
              <MetricLabel label={t('operations.businessOutcomes.todayVolume')} tip={t('operations.businessOutcomes.tips.todayVolume')} />
            </div>
            <div className="bo-kpi-value">{data.todayVolume.toLocaleString()}</div>
            <div className="bo-kpi-sub">{t('operations.dashboard.count')}</div>
          </div>
          <div className="bo-kpi-card">
            <div className="bo-kpi-label">
              <MetricLabel label={t('operations.businessOutcomes.totalVolume')} tip={t('operations.businessOutcomes.tips.totalVolume')} />
            </div>
            <div className="bo-kpi-value">{data.totalVolume.toLocaleString()}</div>
            <div className="bo-kpi-sub">{t('operations.dashboard.count')}</div>
          </div>
          <div className="bo-kpi-card">
            <div className="bo-kpi-label">
              <MetricLabel label={t('operations.businessOutcomes.volumeGrowthMoM')} tip={t('operations.businessOutcomes.tips.volumeGrowthMoM')} />
            </div>
            <div className="bo-kpi-value" style={{ color: data.volumeGrowthMoM >= 0 ? COLORS.success : COLORS.danger }}>
              {data.volumeGrowthMoM >= 0 ? '+' : ''}{data.volumeGrowthMoM}%
            </div>
          </div>
        </div>

        <div className="bo-row cols-2" style={{ marginTop: 16 }}>
          <div>
            <div className="chart-subtitle">{t('operations.businessOutcomes.volumeTrendTitle')}</div>
            <ReactECharts option={volumeOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
          </div>
          <div>
            <div className="chart-subtitle">
              <MetricLabel label={t('operations.businessOutcomes.typeShareTitle')} tip={t('operations.businessOutcomes.tips.typeShare')} />
            </div>
            <ReactECharts option={pieOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="bo-ranking-header">
            <div className="chart-subtitle" style={{ marginBottom: 0 }}>
              <MetricLabel label={t('operations.businessOutcomes.volumeRankingTitle')} tip={t('operations.businessOutcomes.tips.volumeRanking')} />
            </div>
            <div className="bo-ranking-controls">
              <Select
                multiple
                maxTagCount={1}
                value={rankFilterTypes}
                optionList={rankTypeOptions}
                placeholder={t('operations.businessOutcomes.rankFilterPlaceholder')}
                onChange={(v) => setRankFilterTypes((v as string[]) || [])}
                style={{ width: 200 }}
              />
              <Tooltip content={rankSortDesc ? t('operations.businessOutcomes.rankSortDesc') : t('operations.businessOutcomes.rankSortAsc')}>
                <Button
                  icon={rankSortDesc
                    ? <ArrowDownWideNarrow size={16} strokeWidth={2} />
                    : <ArrowUpNarrowWide size={16} strokeWidth={2} />}
                  onClick={() => setRankSortDesc(v => !v)}
                />
              </Tooltip>
            </div>
          </div>
          <div className="bo-ranking-list">
            {displayedRanking.length === 0 ? (
              <div className="bo-ranking-empty">{t('operations.businessOutcomes.rankEmpty')}</div>
            ) : displayedRanking.map((r, i) => (
              <div key={r.name} className="bo-ranking-item">
                <span className={`rank rank-${i + 1}`}>{i + 1}</span>
                <div className="info">
                  <div className="name">{r.name}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(r.volume / rankMax) * 100}%` }} />
                  </div>
                </div>
                <div className="value">{r.volume.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. 节省工时: KPI 3 卡 (含人年) + 累计曲线 + 部门对比 */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">{t('operations.businessOutcomes.timeSavedTitle')}</span>
        </div>
        <div className="bo-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="bo-kpi-card">
            <div className="bo-kpi-label">
              <MetricLabel label={t('operations.businessOutcomes.todayHoursSaved')} tip={t('operations.businessOutcomes.tips.todayHoursSaved')} />
            </div>
            <div className="bo-kpi-value">{data.todayHoursSaved.toLocaleString()} h</div>
          </div>
          <div className="bo-kpi-card">
            <div className="bo-kpi-label">
              <MetricLabel label={t('operations.businessOutcomes.totalHoursSaved')} tip={t('operations.businessOutcomes.tips.totalHoursSaved')} />
            </div>
            <div className="bo-kpi-value">{data.totalHoursSaved.toLocaleString()} h</div>
          </div>
          <div className="bo-kpi-card">
            <div className="bo-kpi-label">
              <MetricLabel label={t('operations.businessOutcomes.personYears')} tip={t('operations.businessOutcomes.tips.personYears')} />
            </div>
            <div className="bo-kpi-value" style={{ color: COLORS.purple }}>{personYears}</div>
            <div className="bo-kpi-sub">{t('operations.businessOutcomes.perYearFactor', { factor: data.hoursPerYearFactor })}</div>
          </div>
        </div>

        <div className="bo-row cols-2" style={{ marginTop: 16 }}>
          <div>
            <div className="chart-subtitle">
              <MetricLabel label={t('operations.businessOutcomes.cumulativeCurve')} tip={t('operations.businessOutcomes.tips.cumulativeCurve')} />
            </div>
            <ReactECharts option={hoursOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
          </div>
          <div>
            <div className="chart-subtitle">
              <MetricLabel label={t('operations.businessOutcomes.deptHoursCompare')} tip={t('operations.businessOutcomes.tips.deptHoursCompare')} />
            </div>
            <ReactECharts option={deptHoursOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
          </div>
        </div>
      </div>

      {/* 5. 趋势分析: 双 Y 轴折线 */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">
            <MetricLabel label={t('operations.businessOutcomes.trendAnalysisTitle')} tip={t('operations.businessOutcomes.tips.growthVsHours')} size="medium" />
          </span>
        </div>
        <ReactECharts option={trendAnalysisOption} style={{ height: 320 }} opts={{ renderer: 'svg' }} />
      </div>

      {/* 6. FEAT-023 开发产能仪表盘: 6 KPI + 散点 + 时间线 */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">{t('operations.businessOutcomes.capacityKpiTitle')}</span>
        </div>
        <div className="bo-kpi-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
          {capacityKpis.map(c => (
            <div key={c.key} className="bo-kpi-card">
              <div className="bo-kpi-label"><MetricLabel label={c.label} tip={c.tip} /></div>
              <div className="bo-kpi-value" style={{ color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        <div className="bo-row cols-2" style={{ marginTop: 16 }}>
          <div>
            <div className="chart-subtitle">
              <MetricLabel label={t('operations.businessOutcomes.accuracyScatterTitle')} tip={t('operations.businessOutcomes.tips.accuracyScatter')} />
            </div>
            <ReactECharts option={accuracyScatterOption} style={{ height: 320 }} opts={{ renderer: 'svg' }} />
          </div>
          <div>
            <div className="chart-subtitle">
              <MetricLabel label={t('operations.businessOutcomes.capacityTimelineTitle')} tip={t('operations.businessOutcomes.tips.capacityTimeline')} />
            </div>
            <ReactECharts option={capacityTimelineOption} style={{ height: 320 }} opts={{ renderer: 'svg' }} />
          </div>
        </div>
      </div>
      </Spin>
    </div>
  );
};

export default BusinessOutcomes;
