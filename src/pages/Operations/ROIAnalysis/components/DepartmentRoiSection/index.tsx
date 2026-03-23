import { useMemo } from 'react';
import { Table } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import type { DepartmentRoiDetail } from '@/pages/Operations/types';
import './index.less';

interface Props {
  data: DepartmentRoiDetail[];
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderColor: '#E5E7EB',
  borderWidth: 1,
  textStyle: { color: '#374151', fontSize: 12 },
  padding: [10, 14],
  extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 8px;',
};

const TREND_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const DepartmentRoiSection = ({ data }: Props) => {
  const { t } = useTranslation();

  const columns = [
    { title: t('operations.dashboard.departmentName'), dataIndex: 'department', width: 130 },
    { title: t('operations.roiAnalysis.investmentCost'), dataIndex: 'investmentCost', width: 120,
      render: (v: number) => `$${(v / 1000).toFixed(0)}K` },
    { title: t('operations.roiAnalysis.savedCost'), dataIndex: 'savedCost', width: 120,
      render: (v: number) => `$${(v / 1000).toFixed(0)}K` },
    { title: 'ROI', dataIndex: 'roi', width: 80, render: (v: number) => (
      <span style={{ color: v >= 200 ? '#10B981' : v >= 100 ? '#3B82F6' : '#F59E0B', fontWeight: 600 }}>{v}%</span>
    )},
    { title: t('operations.roiAnalysis.reqCount'), dataIndex: 'requirementCount', width: 80 },
    { title: t('operations.roiAnalysis.robotCount'), dataIndex: 'robotCount', width: 80 },
  ];

  // Bar chart
  const barOption = useMemo(() => ({
    tooltip: { ...TOOLTIP_STYLE, trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(59,130,246,0.04)' } } },
    legend: {
      data: [t('operations.roiAnalysis.investmentCost'), t('operations.roiAnalysis.savedCost')],
      bottom: 0, textStyle: { fontSize: 12, color: '#6B7280' }, itemWidth: 12, itemHeight: 12, itemGap: 20,
    },
    grid: { left: 64, right: 20, top: 20, bottom: 44 },
    xAxis: {
      type: 'category', data: data.map(d => d.department),
      axisLabel: { fontSize: 11, color: '#9CA3AF', rotate: data.length > 4 ? 15 : 0 },
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => `$${(v / 1000).toFixed(0)}K`, fontSize: 11, color: '#9CA3AF' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
    },
    series: [
      {
        name: t('operations.roiAnalysis.investmentCost'), type: 'bar', data: data.map(d => d.investmentCost),
        barWidth: 18, barGap: '30%',
        itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#60A5FA' }, { offset: 1, color: '#3B82F6' }] }, borderRadius: [4, 4, 0, 0] },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(59,130,246,0.2)' } },
      },
      {
        name: t('operations.roiAnalysis.savedCost'), type: 'bar', data: data.map(d => d.savedCost),
        barWidth: 18,
        itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#34D399' }, { offset: 1, color: '#10B981' }] }, borderRadius: [4, 4, 0, 0] },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(16,185,129,0.2)' } },
      },
    ],
  }), [data, t]);

  // Multi-line trend
  const trendOption = useMemo(() => {
    const maxLen = Math.max(...data.map(d => d.trend.length));
    const months = Array.from({ length: maxLen }, (_, i) => `M${i + 1}`);
    return {
      tooltip: {
        ...TOOLTIP_STYLE, trigger: 'axis',
        axisPointer: { type: 'cross', crossStyle: { color: '#D1D5DB' }, lineStyle: { color: '#D1D5DB', type: 'dashed' } },
      },
      legend: {
        data: data.map(d => d.department), bottom: 0,
        textStyle: { fontSize: 12, color: '#6B7280' }, itemWidth: 16, itemHeight: 3, itemGap: 16,
      },
      grid: { left: 50, right: 20, top: 20, bottom: 44 },
      xAxis: {
        type: 'category', data: months, boundaryGap: false,
        axisLabel: { fontSize: 11, color: '#9CA3AF' },
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: '{value}%', fontSize: 11, color: '#9CA3AF' },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
      },
      series: data.map((d, i) => ({
        name: d.department,
        type: 'line',
        data: d.trend,
        smooth: 0.4,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        lineStyle: { width: 2.5, color: TREND_COLORS[i % TREND_COLORS.length] },
        itemStyle: { color: TREND_COLORS[i % TREND_COLORS.length], borderWidth: 2, borderColor: '#fff' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: TREND_COLORS[i % TREND_COLORS.length] + '18' }, { offset: 1, color: TREND_COLORS[i % TREND_COLORS.length] + '02' }] } },
        emphasis: { focus: 'series', lineStyle: { width: 3 } },
      })),
    };
  }, [data]);

  return (
    <div className="department-roi-section dashboard-card">
      <div className="dashboard-card-header">
        <span className="dashboard-card-title">{t('operations.roiAnalysis.departmentRoi')}</span>
      </div>
      <div className="department-roi-content">
        <div className="department-roi-charts-row">
          <div className="department-roi-chart-item">
            <div className="chart-subtitle">{t('operations.roiAnalysis.deptComparison')}</div>
            <ReactECharts option={barOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
          </div>
          <div className="department-roi-chart-item">
            <div className="chart-subtitle">{t('operations.roiAnalysis.deptTrend')}</div>
            <ReactECharts option={trendOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
          </div>
        </div>
        <div className="department-roi-table">
          <Table columns={columns} dataSource={data} rowKey="department" size="small" pagination={false} />
        </div>
      </div>
    </div>
  );
};

export default DepartmentRoiSection;
