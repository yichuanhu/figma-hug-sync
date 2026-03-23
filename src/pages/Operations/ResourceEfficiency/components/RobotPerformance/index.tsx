import { useMemo } from 'react';
import { Table, Tag } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import type { ResourceEfficiencyData, RobotDetail } from '@/pages/Operations/types';
import './index.less';

interface Props {
  data: ResourceEfficiencyData;
}

/* ECharts default theme colors */
const ECHARTS_COLORS = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderColor: '#e0e0e0',
  borderWidth: 1,
  textStyle: { color: '#333', fontSize: 12 },
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
      progress: { show: true, width: 14, roundCap: true, itemStyle: { color: ECHARTS_COLORS[0] } },
      axisLine: { lineStyle: { width: 14, color: [[1, '#e0e0e0']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { show: false },
      title: { show: true, offsetCenter: [0, '30%'], fontSize: 13, color: '#999' },
      detail: {
        valueAnimation: true,
        offsetCenter: [0, '-5%'],
        fontSize: 32,
        fontWeight: 700,
        color: ECHARTS_COLORS[0],
        formatter: '{value}%',
      },
      data: [{ value: data.overallUtilization, name: t('operations.resourceEfficiency.overallUtilization') }],
    }],
  }), [data.overallUtilization, t]);

  // Pie option - robot type distribution
  const pieOption = useMemo(() => ({
    color: ECHARTS_COLORS,
    tooltip: { ...TOOLTIP_STYLE, trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 12, color: '#666' }, itemWidth: 12, itemHeight: 12 },
    series: [{
      type: 'pie',
      radius: ['42%', '72%'],
      center: ['50%', '42%'],
      data: [
        { name: t('operations.dashboard.interactiveRobot'), value: data.interactiveTotal },
        { name: t('operations.dashboard.unattendedRobot'), value: data.unattendedTotal },
      ],
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 11, color: '#666' },
      labelLine: { length: 12, length2: 8 },
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.12)' } },
    }],
  }), [data, t]);

  // Line option - utilization trend
  const trendOption = useMemo(() => ({
    color: ECHARTS_COLORS,
    tooltip: { ...TOOLTIP_STYLE, trigger: 'axis' },
    grid: { left: 48, right: 16, top: 16, bottom: 32 },
    xAxis: {
      type: 'category',
      data: data.utilizationTrend.map(d => d.month),
      axisLabel: { fontSize: 11, color: '#666' },
      axisLine: { lineStyle: { color: '#ccc' } },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%', fontSize: 11, color: '#666' },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
    },
    series: [{
      type: 'line',
      data: data.utilizationTrend.map(d => d.utilization),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2.5 },
      areaStyle: { opacity: 0.1 },
    }],
  }), [data.utilizationTrend]);

  // Bar option - group utilization
  const barOption = useMemo(() => ({
    color: ECHARTS_COLORS,
    tooltip: { ...TOOLTIP_STYLE, trigger: 'axis', formatter: (p: any) =>
      `<div style="font-weight:600;margin-bottom:4px">${p[0].name}</div>` +
      `<div>${t('operations.resourceEfficiency.utilization')}: <b>${p[0].value}%</b></div>`
    },
    grid: { left: 48, right: 16, top: 16, bottom: 32 },
    xAxis: {
      type: 'category',
      data: data.groupUtilization.map(g => g.group),
      axisLabel: { fontSize: 11, color: '#666' },
      axisLine: { lineStyle: { color: '#ccc' } },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%', fontSize: 11, color: '#666' },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
    },
    series: [{
      type: 'bar',
      data: data.groupUtilization.map(g => ({
        value: g.utilization,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      })),
      barMaxWidth: 36,
    }],
  }), [data.groupUtilization, t]);

  // Sparkline renderer
  const renderSparkline = (trend: number[]) => {
    const option = {
      color: ECHARTS_COLORS,
      grid: { left: 0, right: 0, top: 2, bottom: 2 },
      xAxis: { type: 'category', show: false, data: trend.map((_, i) => i) },
      yAxis: { type: 'value', show: false },
      series: [{
        type: 'line',
        data: trend,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 1.5 },
        areaStyle: { opacity: 0.15 },
      }],
    };
    return (
      <div className="sparkline-cell">
        <ReactECharts option={option} style={{ width: 80, height: 28 }} opts={{ renderer: 'svg' }} />
      </div>
    );
  };

  const getUtilColor = (v: number) => v >= 80 ? '#91cc75' : v >= 50 ? '#5470c6' : '#fac858';

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
          <div className="status-value" style={{ color: '#91cc75' }}>{data.working}</div>
        </div>
        <div className="robot-status-card">
          <div className="status-label">{t('operations.resourceEfficiency.statusIdle')}</div>
          <div className="status-value" style={{ color: '#fac858' }}>{data.idle}</div>
        </div>
        <div className="robot-status-card">
          <div className="status-label">{t('operations.resourceEfficiency.statusOffline')}</div>
          <div className="status-value" style={{ color: '#ee6666' }}>{data.offline}</div>
        </div>
        <div className="robot-status-card">
          <div className="status-label">{t('operations.resourceEfficiency.statusMaintenance')}</div>
          <div className="status-value" style={{ color: '#5470c6' }}>{data.maintenance}</div>
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
