import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import type { ResourceEfficiencyData } from '@/pages/Operations/types';
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
};

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderColor: '#E5E7EB',
  borderWidth: 1,
  textStyle: { color: '#374151', fontSize: 12 },
  padding: [10, 14],
  extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 8px;',
};

const TaskExecutionSection = ({ data }: Props) => {
  const { t } = useTranslation();

  const formatMinutes = (minutes: number) => {
    if (minutes >= 60000) return `${(minutes / 60000).toFixed(1)}${t('operations.dashboard.tenThousandHours')}`;
    if (minutes >= 60) return `${(minutes / 60).toFixed(0)}${t('operations.dashboard.hours')}`;
    return `${minutes}${t('operations.dashboard.minutes')}`;
  };

  const statCards = [
    { label: t('operations.resourceEfficiency.totalExecuted'), value: data.taskStats.total, color: COLORS.primary },
    { label: t('operations.resourceEfficiency.successCount'), value: data.taskStats.success, color: COLORS.success },
    { label: t('operations.resourceEfficiency.failedCount'), value: data.taskStats.failed, color: COLORS.danger },
    { label: t('operations.resourceEfficiency.runningCount'), value: data.taskStats.running, color: COLORS.warning },
    { label: t('operations.resourceEfficiency.timeoutCount'), value: data.taskStats.timeout, color: COLORS.purple },
  ];

  // Success rate trend
  const trendOption = useMemo(() => ({
    tooltip: { ...TOOLTIP_STYLE, trigger: 'axis', formatter: (p: any) =>
      `<div style="font-weight:600;margin-bottom:4px">${p[0].name}</div>` +
      `<div>${t('operations.resourceEfficiency.successRate')}: <b>${p[0].value}%</b></div>`
    },
    grid: { left: 48, right: 16, top: 16, bottom: 32 },
    xAxis: {
      type: 'category',
      data: data.successRateTrend.map(d => d.month),
      axisLabel: { fontSize: 11, color: '#9CA3AF' },
      axisLine: { lineStyle: { color: '#E5E7EB' } },
    },
    yAxis: {
      type: 'value',
      min: 80,
      max: 100,
      axisLabel: { formatter: '{value}%', fontSize: 11, color: '#9CA3AF' },
      splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
    },
    series: [{
      type: 'line',
      data: data.successRateTrend.map(d => d.rate),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2.5, color: COLORS.success },
      itemStyle: { color: COLORS.success },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
        { offset: 0, color: 'rgba(16,185,129,0.15)' },
        { offset: 1, color: 'rgba(16,185,129,0.02)' },
      ]}},
    }],
  }), [data.successRateTrend, t]);

  return (
    <div className="task-execution-section dashboard-card">
      <div className="dashboard-card-header">
        <span className="dashboard-card-title">{t('operations.resourceEfficiency.taskExecution')}</span>
      </div>

      {/* Summary cards */}
      <div className="task-stats-cards">
        {statCards.map((card) => (
          <div key={card.label} className="task-stat-card">
            <div className="stat-label">{card.label}</div>
            <div className="stat-value" style={{ color: card.color }}>{card.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="task-exec-charts-row">
        <div className="task-exec-chart-card">
          <div className="chart-subtitle">{t('operations.resourceEfficiency.todayCumulative')}</div>
          <div className="task-today-stats">
            <div className="today-stat-item">
              <div className="today-label">{t('operations.dashboard.todayTasks')}</div>
              <div className="today-value">{data.todayTasks.toLocaleString()}</div>
            </div>
            <div className="today-stat-item">
              <div className="today-label">{t('operations.dashboard.totalTasks')}</div>
              <div className="today-value">{data.totalTasks.toLocaleString()}</div>
            </div>
            <div className="today-stat-item">
              <div className="today-label">{t('operations.dashboard.todayRuntime')}</div>
              <div className="today-value">{formatMinutes(data.todayRunMinutes)}</div>
            </div>
            <div className="today-stat-item">
              <div className="today-label">{t('operations.dashboard.totalRuntime')}</div>
              <div className="today-value">{formatMinutes(data.totalRunMinutes)}</div>
            </div>
            <div className="today-stat-item">
              <div className="today-label">{t('operations.resourceEfficiency.successRateToday')}</div>
              <div className="today-value" style={{ color: COLORS.success }}>{data.successRateToday}%</div>
            </div>
            <div className="today-stat-item">
              <div className="today-label">{t('operations.resourceEfficiency.successRateTotal')}</div>
              <div className="today-value" style={{ color: COLORS.primary }}>{data.successRateTotal}%</div>
            </div>
          </div>
        </div>
        <div className="task-exec-chart-card">
          <div className="chart-subtitle">{t('operations.resourceEfficiency.successRateTrend')}</div>
          <ReactECharts option={trendOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
        </div>
      </div>
    </div>
  );
};

export default TaskExecutionSection;
