import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import type { ResourceEfficiencyData } from '@/pages/Operations/types';
import BusyIdleTopX from '../BusyIdleTopX';
import './index.less';

interface Props {
  data: ResourceEfficiencyData;
}


const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  teal: '#14B8A6',
};

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderColor: '#E5E7EB',
  borderWidth: 1,
  textStyle: { color: '#374151', fontSize: 12 },
  padding: [10, 14],
  extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 8px;',
};

const RobotPerformance = ({ data }: Props) => {
  const { t } = useTranslation();

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
      axisLine: { lineStyle: { width: 14, color: [[1, '#E5E7EB']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { show: false },
      title: { show: true, offsetCenter: [0, '30%'], fontSize: 13, color: '#6B7280' },
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

  // Line option - utilization trend
  const trendOption = useMemo(() => ({
    tooltip: { ...TOOLTIP_STYLE, trigger: 'axis' },
    grid: { left: 48, right: 16, top: 16, bottom: 32 },
    xAxis: {
      type: 'category',
      data: data.utilizationTrend.map(d => d.month),
      axisLabel: { fontSize: 11, color: '#9CA3AF' },
      axisLine: { lineStyle: { color: '#E5E7EB' } },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%', fontSize: 11, color: '#9CA3AF' },
      splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
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
        { offset: 0, color: 'rgba(59,130,246,0.15)' },
        { offset: 1, color: 'rgba(59,130,246,0.02)' },
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
      axisLabel: { fontSize: 11, color: '#9CA3AF' },
      axisLine: { lineStyle: { color: '#E5E7EB' } },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%', fontSize: 11, color: '#9CA3AF' },
      splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
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

  return (
    <div className="robot-performance-section dashboard-card">
      <div className="dashboard-card-header">
        <span className="dashboard-card-title">{t('operations.resourceEfficiency.robotPerformance')}</span>
      </div>

      {/* 状态分布 5 卡: 总数/工作中/空闲/离线/维护 */}
      <div className="robot-status-summary">
        <div className="robot-status-card">
          <div className="status-label">{t('operations.resourceEfficiency.totalRobots')}</div>
          <div className="status-value" style={{ color: COLORS.primary }}>{data.totalRobots}</div>
        </div>
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
          <div className="status-value" style={{ color: COLORS.purple }}>{data.maintenance}</div>
        </div>
      </div>

      {/* 类型分布 4 卡：无人值守授权 / 无人值守授权占用 / 人机交互授权 / 人机交互授权占用 */}
      <div className="robot-status-summary" style={{ marginTop: 12 }}>
        <div className="robot-status-card">
          <div className="status-label">{t('operations.resourceEfficiency.unattendedLicensed')}</div>
          <div className="status-value" style={{ color: COLORS.success }}>{data.unattendedTotal}</div>
        </div>
        <div className="robot-status-card">
          <div className="status-label">{t('operations.resourceEfficiency.unattendedOnline')}</div>
          <div className="status-value" style={{ color: COLORS.success }}>{data.unattendedOnline}</div>
        </div>
        <div className="robot-status-card">
          <div className="status-label">{t('operations.resourceEfficiency.interactiveLicensed')}</div>
          <div className="status-value" style={{ color: COLORS.primary }}>{data.interactiveTotal}</div>
        </div>
        <div className="robot-status-card">
          <div className="status-label">{t('operations.resourceEfficiency.interactiveOnline')}</div>
          <div className="status-value" style={{ color: COLORS.primary }}>{data.interactiveOnline}</div>
        </div>
      </div>

      {/* Charts row 1: Gauge + Trend */}
      <div className="robot-perf-charts-row">
        <div className="robot-perf-chart-card">
          <div className="chart-subtitle">{t('operations.resourceEfficiency.overallUtilization')}</div>
          <ReactECharts option={gaugeOption} style={{ height: 240 }} opts={{ renderer: 'svg' }} />
        </div>
        <div className="robot-perf-chart-card">
          <div className="chart-subtitle">{t('operations.resourceEfficiency.utilizationTrend')}</div>
          <ReactECharts option={trendOption} style={{ height: 240 }} opts={{ renderer: 'svg' }} />
        </div>
      </div>

      {/* Charts row 2: Group comparison (full width) */}
      <div className="robot-perf-charts-row" style={{ gridTemplateColumns: '1fr' }}>
        <div className="robot-perf-chart-card">
          <div className="chart-subtitle">{t('operations.resourceEfficiency.groupComparison')}</div>
          <ReactECharts option={barOption} style={{ height: 260 }} opts={{ renderer: 'svg' }} />
        </div>
      </div>

      {/* Busy / Idle TopX */}
      <div className="robot-perf-charts-row" style={{ marginBottom: 0 }}>
        <BusyIdleTopX robots={data.robotDetails} mode="busy" />
        <BusyIdleTopX robots={data.robotDetails} mode="idle" />
      </div>
    </div>
  );
};

export default RobotPerformance;
