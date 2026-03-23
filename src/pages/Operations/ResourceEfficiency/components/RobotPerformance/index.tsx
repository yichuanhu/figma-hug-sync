import { useMemo } from 'react';
import { Table, Tag } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import type { ResourceEfficiencyData, RobotDetail } from '@/pages/Operations/types';
import './index.less';

interface Props {
  data: ResourceEfficiencyData;
}

/* Semi Design color palette */
const COLORS = {
  primary: '#165DFF',
  success: '#00B42A',
  warning: '#FF7D00',
  danger: '#F53F3F',
  purple: '#722ED1',
  teal: '#0FC6C2',
};

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderColor: '#E5E8EF',
  borderWidth: 1,
  textStyle: { color: '#1D2129', fontSize: 12 },
  padding: [10, 14],
  extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 8px;',
};

const RobotPerformance = ({ data }: Props) => {
  const { t } = useTranslation();

  const statusMap: Record<string, { label: string; color: string }> = {
    working: { label: t('operations.resourceEfficiency.statusWorking'), color: 'green' },
    idle: { label: t('operations.resourceEfficiency.statusIdle'), color: 'orange' },
    offline: { label: t('operations.resourceEfficiency.statusOffline'), color: 'grey' },
    maintenance: { label: t('operations.resourceEfficiency.statusMaintenance'), color: 'blue' },
  };

  // Gauge option
  const gaugeOption = useMemo(() => ({
    series: [{
      type: 'gauge',
      startAngle: 210,
      endAngle: -30,
      min: 0,
      max: 100,
      radius: '90%',
      progress: { show: true, width: 14, roundCap: true, itemStyle: { color: COLORS.primary } },
      axisLine: { lineStyle: { width: 14, color: [[1, '#E5E8EF']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { show: false },
      title: { show: true, offsetCenter: [0, '30%'], fontSize: 13, color: '#86909C' },
      detail: {
        valueAnimation: true,
        offsetCenter: [0, '-5%'],
        fontSize: 32,
        fontWeight: 700,
        color: COLORS.primary,
        formatter: '{value}%',
      },
      data: [{ value: data.overallUtilization, name: t('operations.resourceEfficiency.overallUtilization') }],
    }],
  }), [data.overallUtilization, t]);

  // Pie option - robot type distribution
  const pieOption = useMemo(() => ({
    tooltip: { ...TOOLTIP_STYLE, trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 12, color: '#86909C' }, itemWidth: 12, itemHeight: 12 },
    series: [{
      type: 'pie',
      radius: ['42%', '72%'],
      center: ['50%', '42%'],
      data: [
        { name: t('operations.dashboard.interactiveRobot'), value: data.interactiveTotal },
        { name: t('operations.dashboard.unattendedRobot'), value: data.unattendedTotal },
      ],
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 11, color: '#86909C' },
      labelLine: { length: 12, length2: 8, lineStyle: { color: '#C9CDD4' } },
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      color: [COLORS.primary, COLORS.success],
      emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.12)' } },
    }],
  }), [data, t]);

  // Line option - utilization trend
  const trendOption = useMemo(() => ({
    tooltip: { ...TOOLTIP_STYLE, trigger: 'axis' },
    grid: { left: 48, right: 16, top: 16, bottom: 32 },
    xAxis: {
      type: 'category',
      data: data.utilizationTrend.map(d => d.month),
      axisLabel: { fontSize: 11, color: '#86909C' },
      axisLine: { lineStyle: { color: '#E5E8EF' } },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%', fontSize: 11, color: '#86909C' },
      splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
    },
    series: [{
      type: 'line',
      data: data.utilizationTrend.map(d => d.utilization),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2.5, color: COLORS.primary },
      itemStyle: { color: COLORS.primary },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
        { offset: 0, color: 'rgba(22,93,255,0.15)' },
        { offset: 1, color: 'rgba(22,93,255,0.02)' },
      ]}},
    }],
  }), [data.utilizationTrend]);

  // Bar option - group utilization
  const barOption = useMemo(() => ({
    tooltip: { ...TOOLTIP_STYLE, trigger: 'axis', formatter: (p: any) =>
      `<div style="font-weight:600;margin-bottom:4px">${p[0].name}</div>` +
      `<div>${t('operations.resourceEfficiency.utilization')}: <b>${p[0].value}%</b></div>`
    },
    grid: { left: 48, right: 16, top: 16, bottom: 32 },
    xAxis: {
      type: 'category',
      data: data.groupUtilization.map(g => g.group),
      axisLabel: { fontSize: 11, color: '#86909C' },
      axisLine: { lineStyle: { color: '#E5E8EF' } },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%', fontSize: 11, color: '#86909C' },
      splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
    },
    series: [{
      type: 'bar',
      data: data.groupUtilization.map(g => ({
        value: g.utilization,
        itemStyle: {
          color: g.utilization >= 80 ? COLORS.success : g.utilization >= 50 ? COLORS.primary : COLORS.warning,
          borderRadius: [4, 4, 0, 0],
        },
      })),
      barMaxWidth: 36,
    }],
  }), [data.groupUtilization, t]);

  // Sparkline renderer
  const renderSparkline = (trend: number[]) => {
    const option = {
      grid: { left: 0, right: 0, top: 2, bottom: 2 },
      xAxis: { type: 'category', show: false, data: trend.map((_, i) => i) },
      yAxis: { type: 'value', show: false },
      series: [{
        type: 'line',
        data: trend,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 1.5, color: COLORS.primary },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
          { offset: 0, color: 'rgba(22,93,255,0.2)' },
          { offset: 1, color: 'rgba(22,93,255,0)' },
        ]}},
      }],
    };
    return (
      <div className="sparkline-cell">
        <ReactECharts option={option} style={{ width: 80, height: 28 }} opts={{ renderer: 'svg' }} />
      </div>
    );
  };

  const getUtilColor = (v: number) => v >= 80 ? COLORS.success : v >= 50 ? COLORS.primary : COLORS.warning;

  const columns = [
    { title: t('operations.resourceEfficiency.robotName'), dataIndex: 'name', width: 160 },
    { title: t('operations.resourceEfficiency.robotType'), dataIndex: 'type', width: 120,
      render: (v: string) => v === 'interactive' ? t('operations.dashboard.interactiveRobot') : t('operations.dashboard.unattendedRobot') },
    { title: t('operations.resourceEfficiency.group'), dataIndex: 'group', width: 100 },
    { title: t('common.status'), dataIndex: 'status', width: 100,
      render: (s: string) => {
        const info = statusMap[s] || { label: s, color: 'grey' };
        return <Tag color={info.color as any} size="small">{info.label}</Tag>;
      }
    },
    { title: t('operations.resourceEfficiency.utilization'), dataIndex: 'utilization', width: 160,
      render: (v: number) => (
        <div className="utilization-bar">
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${v}%`, backgroundColor: getUtilColor(v) }} />
          </div>
          <span className="bar-value" style={{ color: getUtilColor(v) }}>{v}%</span>
        </div>
      )
    },
    { title: t('operations.resourceEfficiency.monthlyTasks'), dataIndex: 'monthlyTasks', width: 100,
      render: (v: number) => v.toLocaleString() },
    { title: t('operations.resourceEfficiency.trendLabel'), dataIndex: 'trend', width: 120,
      render: (trend: number[]) => renderSparkline(trend) },
  ];

  return (
    <div className="robot-performance-section dashboard-card">
      <div className="dashboard-card-header">
        <span className="dashboard-card-title">{t('operations.resourceEfficiency.robotPerformance')}</span>
      </div>

      {/* Status summary */}
      <div className="robot-status-summary">
        <div className="robot-status-card">
          <div className="status-label">{t('operations.resourceEfficiency.statusWorking')}</div>
          <div className="status-value" style={{ color: COLORS.success }}>{data.working}</div>
        </div>
        <div className="robot-status-card">
          <div className="status-label">{t('operations.resourceEfficiency.statusIdle')}</div>
          <div className="status-value" style={{ color: COLORS.warning }}>{data.idle}</div>
        </div>
        <div className="robot-status-card">
          <div className="status-label">{t('operations.resourceEfficiency.statusOffline')}</div>
          <div className="status-value" style={{ color: COLORS.danger }}>{data.offline}</div>
        </div>
        <div className="robot-status-card">
          <div className="status-label">{t('operations.resourceEfficiency.statusMaintenance')}</div>
          <div className="status-value" style={{ color: COLORS.primary }}>{data.maintenance}</div>
        </div>
      </div>

      {/* Charts row 1: Gauge + Pie */}
      <div className="robot-perf-charts-row">
        <div className="robot-perf-chart-card">
          <div className="chart-subtitle">{t('operations.resourceEfficiency.overallUtilization')}</div>
          <ReactECharts option={gaugeOption} style={{ height: 240, width: '100%' }} notMerge opts={{ renderer: 'svg' }} />
        </div>
        <div className="robot-perf-chart-card">
          <div className="chart-subtitle">{t('operations.resourceEfficiency.typeDistribution')}</div>
          <ReactECharts option={pieOption} style={{ height: 240, width: '100%' }} notMerge opts={{ renderer: 'svg' }} />
        </div>
      </div>

      {/* Charts row 2: Trend + Group comparison */}
      <div className="robot-perf-charts-row">
        <div className="robot-perf-chart-card">
          <div className="chart-subtitle">{t('operations.resourceEfficiency.utilizationTrend')}</div>
          <ReactECharts option={trendOption} style={{ height: 240, width: '100%' }} notMerge opts={{ renderer: 'svg' }} />
        </div>
        <div className="robot-perf-chart-card">
          <div className="chart-subtitle">{t('operations.resourceEfficiency.groupComparison')}</div>
          <ReactECharts option={barOption} style={{ height: 240, width: '100%' }} notMerge opts={{ renderer: 'svg' }} />
        </div>
      </div>

      {/* Robot detail table */}
      <Table
        columns={columns}
        dataSource={data.robotDetails}
        rowKey="id"
        size="small"
        pagination={false}
      />
    </div>
  );
};

export default RobotPerformance;
