import { useMemo } from 'react';
import { Table } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import type { DepartmentRoiDetail } from '@/pages/Operations/types';
import './index.less';

interface Props {
  data: DepartmentRoiDetail[];
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

const DepartmentRoiSection = ({ data }: Props) => {
  const { t } = useTranslation();

  const columns = [
    { title: t('operations.dashboard.departmentName'), dataIndex: 'department', width: 130 },
    { title: t('operations.roiAnalysis.investmentCost'), dataIndex: 'investmentCost', width: 120,
      render: (v: number) => `$${(v / 1000).toFixed(0)}K` },
    { title: t('operations.roiAnalysis.savedCost'), dataIndex: 'savedCost', width: 120,
      render: (v: number) => `$${(v / 1000).toFixed(0)}K` },
    { title: 'ROI', dataIndex: 'roi', width: 80, render: (v: number) => (
      <span style={{ color: v >= 200 ? '#91cc75' : v >= 100 ? '#5470c6' : '#fac858', fontWeight: 600 }}>{v}%</span>
    )},
    { title: t('operations.roiAnalysis.reqCount'), dataIndex: 'requirementCount', width: 80 },
    { title: t('operations.roiAnalysis.robotCount'), dataIndex: 'robotCount', width: 80 },
  ];

  // Bar chart
  const barOption = useMemo(() => ({
    color: ECHARTS_COLORS,
    tooltip: { ...TOOLTIP_STYLE, trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: [t('operations.roiAnalysis.investmentCost'), t('operations.roiAnalysis.savedCost')],
      bottom: 0, textStyle: { fontSize: 12, color: '#666' }, itemWidth: 12, itemHeight: 12, itemGap: 20,
    },
    grid: { left: 64, right: 20, top: 20, bottom: 44 },
    xAxis: {
      type: 'category', data: data.map(d => d.department),
      axisLabel: { fontSize: 11, color: '#666', rotate: data.length > 4 ? 15 : 0 },
      axisLine: { lineStyle: { color: '#ccc' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => `$${(v / 1000).toFixed(0)}K`, fontSize: 11, color: '#666' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
    },
    series: [
      {
        name: t('operations.roiAnalysis.investmentCost'), type: 'bar', data: data.map(d => d.investmentCost),
        barWidth: 18, barGap: '30%',
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
      {
        name: t('operations.roiAnalysis.savedCost'), type: 'bar', data: data.map(d => d.savedCost),
        barWidth: 18,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
    ],
  }), [data, t]);

  // Multi-line trend
  const trendOption = useMemo(() => {
    const maxLen = Math.max(...data.map(d => d.trend.length));
    const months = Array.from({ length: maxLen }, (_, i) => `M${i + 1}`);
    return {
      color: ECHARTS_COLORS,
      tooltip: {
        ...TOOLTIP_STYLE, trigger: 'axis',
        axisPointer: { type: 'cross', crossStyle: { color: '#ccc' }, lineStyle: { color: '#ccc', type: 'dashed' } },
      },
      legend: {
        data: data.map(d => d.department), bottom: 0,
        textStyle: { fontSize: 12, color: '#666' }, itemWidth: 16, itemHeight: 3, itemGap: 16,
      },
      grid: { left: 50, right: 20, top: 20, bottom: 44 },
      xAxis: {
        type: 'category', data: months, boundaryGap: false,
        axisLabel: { fontSize: 11, color: '#666' },
        axisLine: { lineStyle: { color: '#ccc' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: '{value}%', fontSize: 11, color: '#666' },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
      },
      series: data.map((d, i) => ({
        name: d.department,
        type: 'line',
        data: d.trend,
        smooth: 0.4,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        lineStyle: { width: 2.5 },
        itemStyle: { borderWidth: 2, borderColor: '#fff' },
        areaStyle: { opacity: 0.08 },
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
            <ReactECharts option={barOption} style={{ height: 280, width: '100%' }} notMerge opts={{ renderer: 'svg' }} />
          </div>
          <div className="department-roi-chart-item">
            <div className="chart-subtitle">{t('operations.roiAnalysis.deptTrend')}</div>
            <ReactECharts option={trendOption} style={{ height: 280, width: '100%' }} notMerge opts={{ renderer: 'svg' }} />
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
