import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Select, Button, Table } from '@douyinfe/semi-ui';
import ReactECharts from 'echarts-for-react';
import { RefreshCw } from 'lucide-react';
import {
  mockBusinessOutcomes,
  mockDepartments,
  mockBusinessTypes,
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
  const data = mockBusinessOutcomes;

  const [filter, setFilter] = useState<BusinessOutcomesFilter>({
    timeRange: 'thisMonth',
    department: 'all',
    businessType: 'all',
  });

  const timeOptions = [
    { value: 'thisMonth', label: t('operations.dashboard.thisMonth') },
    { value: 'lastMonth', label: t('operations.dashboard.lastMonth') },
    { value: 'thisQuarter', label: t('operations.dashboard.thisQuarter') },
    { value: 'thisYear', label: t('operations.dashboard.thisYear') },
    { value: 'all', label: t('operations.dashboard.allTime') },
  ];
  const deptOptions = useMemo(
    () => mockDepartments.map(d => d.value === 'all' ? { ...d, label: t('operations.dashboard.selectAll') } : d),
    [t],
  );
  const bizOptions = useMemo(
    () => mockBusinessTypes.map(d => d.value === 'all' ? { ...d, label: t('operations.dashboard.selectAll') } : d),
    [t],
  );

  // Funnel
  const funnelOption = useMemo(() => ({
    tooltip: { ...TOOLTIP, trigger: 'item', formatter: '{b}: {c}' },
    series: [{
      type: 'funnel',
      left: '5%',
      right: '5%',
      top: 16,
      bottom: 8,
      width: '90%',
      min: 0,
      sort: 'descending',
      gap: 4,
      label: { show: true, position: 'inside', color: '#fff', fontWeight: 600 },
      labelLine: { length: 12, lineStyle: { width: 1, type: 'solid' } },
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      emphasis: { label: { fontSize: 14 } },
      data: data.funnel.map((s, i) => ({ ...s, itemStyle: { color: COLORS.funnel[i % COLORS.funnel.length] } })),
    }],
  }), [data.funnel]);

  // Pie - business type share
  const pieOption = useMemo(() => ({
    tooltip: { ...TOOLTIP, trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 12, color: '#6B7280' }, itemWidth: 12, itemHeight: 12 },
    series: [{
      type: 'pie',
      radius: ['42%', '72%'],
      center: ['50%', '42%'],
      data: data.businessTypeShare,
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 11, color: '#6B7280' },
      labelLine: { length: 12, length2: 8, lineStyle: { color: '#D1D5DB' } },
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      color: COLORS.pie,
    }],
  }), [data.businessTypeShare]);

  // Volume trend (bar)
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
      type: 'bar',
      data: data.volumeTrend.map(d => d.volume),
      barMaxWidth: 32,
      itemStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
          { offset: 0, color: '#60A5FA' }, { offset: 1, color: '#3B82F6' },
        ]},
        borderRadius: [4, 4, 0, 0],
      },
    }],
  }), [data.volumeTrend]);

  // Time saved trend (line)
  const hoursOption = useMemo(() => ({
    tooltip: { ...TOOLTIP, trigger: 'axis', formatter: (p: any) =>
      `<div style="font-weight:600;margin-bottom:4px">${p[0].name}</div>` +
      `<div>${t('operations.businessOutcomes.hoursSaved')}: <b>${p[0].value.toLocaleString()} h</b></div>`
    },
    grid: { left: 56, right: 16, top: 20, bottom: 32 },
    xAxis: {
      type: 'category', data: data.timeSavedTrend.map(d => d.month),
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
      type: 'line', smooth: true,
      data: data.timeSavedTrend.map(d => d.hours),
      symbol: 'circle', symbolSize: 6,
      lineStyle: { width: 2.5, color: COLORS.success },
      itemStyle: { color: COLORS.success },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
        { offset: 0, color: 'rgba(16,185,129,0.18)' }, { offset: 1, color: 'rgba(16,185,129,0.02)' },
      ]}},
    }],
  }), [data.timeSavedTrend, t]);

  // Dev capacity dual series
  const capacityOption = useMemo(() => ({
    tooltip: { ...TOOLTIP, trigger: 'axis' },
    legend: {
      bottom: 0,
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { fontSize: 12, color: '#6B7280' },
      data: [t('operations.businessOutcomes.trendRequirement'), t('operations.businessOutcomes.trendProcess')],
    },
    grid: { left: 48, right: 16, top: 20, bottom: 48 },
    xAxis: {
      type: 'category', data: data.devCapacity.capacityTrend.map(d => d.month),
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
    series: [
      {
        name: t('operations.businessOutcomes.trendRequirement'),
        type: 'bar',
        data: data.devCapacity.capacityTrend.map(d => d.requirement),
        barMaxWidth: 24,
        itemStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
            { offset: 0, color: '#A78BFA' }, { offset: 1, color: '#8B5CF6' },
          ]},
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: t('operations.businessOutcomes.trendProcess'),
        type: 'bar',
        data: data.devCapacity.capacityTrend.map(d => d.process),
        barMaxWidth: 24,
        itemStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
            { offset: 0, color: '#60A5FA' }, { offset: 1, color: '#3B82F6' },
          ]},
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  }), [data.devCapacity, t]);

  const deptColumns = [
    { title: t('operations.dashboard.departmentName'), dataIndex: 'department', width: 160 },
    {
      title: <MetricLabel label={t('operations.businessOutcomes.requirementCount')} tip={t('operations.businessOutcomes.tips.deptRequirementCount')} />,
      dataIndex: 'requirementCount', width: 140,
    },
    {
      title: <MetricLabel label={t('operations.businessOutcomes.runningCount')} tip={t('operations.businessOutcomes.tips.deptRunningCount')} />,
      dataIndex: 'runningCount', width: 120,
    },
    {
      title: <MetricLabel label={t('operations.businessOutcomes.hoursSaved')} tip={t('operations.businessOutcomes.tips.deptHoursSaved')} />,
      dataIndex: 'hoursSaved', width: 140,
      render: (v: number) => `${v.toLocaleString()} h`,
    },
    {
      title: <MetricLabel label={t('operations.businessOutcomes.costSaved')} tip={t('operations.businessOutcomes.tips.deptCostSaved')} />,
      dataIndex: 'costSaved', width: 150,
      render: (v: number) => `¥${(v / 10000).toFixed(1)}万`,
    },
  ];

  const progressItems = [
    { key: 'submitted', color: COLORS.primary },
    { key: 'approved', color: COLORS.purple },
    { key: 'developing', color: COLORS.warning },
    { key: 'running', color: COLORS.success },
    { key: 'completed', color: '#14B8A6' },
  ];

  return (
    <div className="business-outcomes-page">
      <Title heading={3} style={{ marginBottom: 16 }}>{t('operations.businessOutcomes.title')}</Title>

      {/* Filter */}
      <div className="bo-filter">
        <div className="bo-filter-items">
          <div className="bo-filter-item">
            <span className="bo-filter-label">{t('operations.dashboard.timeRange')}</span>
            <Select size="small" value={filter.timeRange} optionList={timeOptions}
              onChange={(v) => setFilter({ ...filter, timeRange: v as string })} style={{ width: 120 }} />
          </div>
          <div className="bo-filter-item">
            <span className="bo-filter-label">{t('operations.dashboard.department')}</span>
            <Select size="small" value={filter.department} optionList={deptOptions}
              onChange={(v) => setFilter({ ...filter, department: v as string })} style={{ width: 140 }} />
          </div>
          <div className="bo-filter-item">
            <span className="bo-filter-label">{t('operations.businessOutcomes.businessType')}</span>
            <Select size="small" value={filter.businessType} optionList={bizOptions}
              onChange={(v) => setFilter({ ...filter, businessType: v as string })} style={{ width: 140 }} />
          </div>
        </div>
        <Button icon={<RefreshCw size={16} strokeWidth={2} />} size="small">{t('common.refresh')}</Button>
      </div>

      {/* Top KPIs */}
      <div className="dashboard-card">
        <div className="bo-kpi-grid">
          <div className="bo-kpi-card">
            <div className="bo-kpi-label">{t('operations.businessOutcomes.todayVolume')}</div>
            <div className="bo-kpi-value">{data.todayVolume.toLocaleString()}</div>
            <div className="bo-kpi-sub">{t('operations.dashboard.count')}</div>
          </div>
          <div className="bo-kpi-card">
            <div className="bo-kpi-label">{t('operations.businessOutcomes.totalVolume')}</div>
            <div className="bo-kpi-value">{data.totalVolume.toLocaleString()}</div>
            <div className="bo-kpi-sub">{t('operations.dashboard.count')}</div>
          </div>
          <div className="bo-kpi-card">
            <div className="bo-kpi-label">{t('operations.businessOutcomes.todayHoursSaved')}</div>
            <div className="bo-kpi-value">{data.todayHoursSaved.toLocaleString()} h</div>
          </div>
          <div className="bo-kpi-card">
            <div className="bo-kpi-label">{t('operations.businessOutcomes.totalHoursSaved')}</div>
            <div className="bo-kpi-value">{data.totalHoursSaved.toLocaleString()} h</div>
          </div>
        </div>
      </div>

      {/* Funnel + Type share */}
      <div className="bo-row cols-2" style={{ marginBottom: 20 }}>
        <div className="dashboard-card" style={{ marginBottom: 0 }}>
          <div className="dashboard-card-header">
            <span className="dashboard-card-title">{t('operations.businessOutcomes.funnelTitle')}</span>
          </div>
          <ReactECharts option={funnelOption} style={{ height: 320 }} opts={{ renderer: 'svg' }} />
        </div>
        <div className="dashboard-card" style={{ marginBottom: 0 }}>
          <div className="dashboard-card-header">
            <span className="dashboard-card-title">{t('operations.businessOutcomes.typeShareTitle')}</span>
          </div>
          <ReactECharts option={pieOption} style={{ height: 320 }} opts={{ renderer: 'svg' }} />
        </div>
      </div>

      {/* Requirement progress */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">{t('operations.businessOutcomes.progressTitle')}</span>
          <span style={{ fontSize: 12, color: 'var(--semi-color-text-2)' }}>
            {t('operations.businessOutcomes.totalRequirements')}: <b style={{ color: 'var(--semi-color-text-0)' }}>{data.requirementProgress.total}</b>
          </span>
        </div>
        <div className="bo-progress-grid">
          {progressItems.map(it => (
            <div key={it.key} className="bo-progress-item">
              <div className="lbl">{t(`operations.businessOutcomes.progress.${it.key}`)}</div>
              <div className="val" style={{ color: it.color }}>
                {(data.requirementProgress as any)[it.key]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Volume + Hours trends */}
      <div className="bo-row cols-2" style={{ marginBottom: 20 }}>
        <div className="dashboard-card" style={{ marginBottom: 0 }}>
          <div className="dashboard-card-header">
            <span className="dashboard-card-title">{t('operations.businessOutcomes.volumeTrendTitle')}</span>
          </div>
          <ReactECharts option={volumeOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
        </div>
        <div className="dashboard-card" style={{ marginBottom: 0 }}>
          <div className="dashboard-card-header">
            <span className="dashboard-card-title">{t('operations.businessOutcomes.hoursTrendTitle')}</span>
          </div>
          <ReactECharts option={hoursOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
        </div>
      </div>

      {/* Department outcomes table */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">{t('operations.businessOutcomes.departmentTitle')}</span>
        </div>
        <Table columns={deptColumns} dataSource={data.departmentOutcomes} rowKey="department" size="small" pagination={false} />
      </div>

      {/* Dev capacity */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">{t('operations.businessOutcomes.capacityTitle')}</span>
        </div>
        <div className="bo-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
          <div className="bo-kpi-card">
            <div className="bo-kpi-label">{t('operations.businessOutcomes.monthlyDelivered')}</div>
            <div className="bo-kpi-value">{data.devCapacity.monthlyDelivered}</div>
          </div>
          <div className="bo-kpi-card">
            <div className="bo-kpi-label">{t('operations.businessOutcomes.avgCycleDays')}</div>
            <div className="bo-kpi-value">{data.devCapacity.avgCycleDays} d</div>
          </div>
          <div className="bo-kpi-card">
            <div className="bo-kpi-label">{t('operations.businessOutcomes.developerCount')}</div>
            <div className="bo-kpi-value">{data.devCapacity.developerCount}</div>
          </div>
        </div>
        <div className="chart-subtitle">{t('operations.businessOutcomes.capacityTrend')}</div>
        <ReactECharts option={capacityOption} style={{ height: 240 }} opts={{ renderer: 'svg' }} />
      </div>
    </div>
  );
};

export default BusinessOutcomes;
