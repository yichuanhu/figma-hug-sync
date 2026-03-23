import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import type { RoiTrendPoint } from '@/pages/Operations/types';
import './index.less';

interface RoiTrendChartProps {
  data: RoiTrendPoint[];
}

/* ECharts default theme colors */
const ECHARTS_COLORS = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];

const RoiTrendChart = ({ data }: RoiTrendChartProps) => {
  const { t } = useTranslation();

  const option = useMemo(() => ({
    color: ECHARTS_COLORS,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', crossStyle: { color: '#ccc' }, lineStyle: { color: '#ccc', type: 'dashed' } },
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e0e0e0',
      borderWidth: 1,
      textStyle: { color: '#333', fontSize: 12 },
      padding: [10, 14],
      extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 8px;',
    },
    legend: {
      data: [
        t('operations.dashboard.roiPercent'),
        t('operations.dashboard.investmentCostLabel'),
        t('operations.dashboard.savedCostLabel'),
      ],
      bottom: 0,
      textStyle: { fontSize: 12, color: '#666' },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 20,
    },
    grid: {
      left: 60,
      right: 60,
      top: 16,
      bottom: 40,
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.month),
      axisLabel: { fontSize: 12, color: '#666' },
      axisLine: { lineStyle: { color: '#ccc' } },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        name: 'ROI%',
        nameTextStyle: { color: '#999', fontSize: 11 },
        position: 'left',
        axisLabel: { formatter: '{value}%', fontSize: 12, color: '#666' },
        axisLine: { show: false },
        splitLine: { lineStyle: { type: 'dashed', color: '#f0f0f0' } },
      },
      {
        type: 'value',
        name: t('operations.dashboard.amountUnit'),
        nameTextStyle: { color: '#999', fontSize: 11 },
        position: 'right',
        axisLabel: {
          formatter: (val: number) => `${(val / 10000).toFixed(0)}${t('operations.dashboard.tenThousandUnit')}`,
          fontSize: 12,
          color: '#666',
        },
        axisLine: { show: false },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: t('operations.dashboard.roiPercent'),
        type: 'line',
        yAxisIndex: 0,
        data: data.map((d) => d.roi),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.5 },
        itemStyle: { borderWidth: 2, borderColor: '#fff' },
        areaStyle: { opacity: 0.08 },
      },
      {
        name: t('operations.dashboard.investmentCostLabel'),
        type: 'bar',
        yAxisIndex: 1,
        data: data.map((d) => d.investmentCost),
        barWidth: 16,
        itemStyle: { borderRadius: [3, 3, 0, 0] },
      },
      {
        name: t('operations.dashboard.savedCostLabel'),
        type: 'bar',
        yAxisIndex: 1,
        data: data.map((d) => d.savedCost),
        barWidth: 16,
        itemStyle: { borderRadius: [3, 3, 0, 0] },
      },
    ],
  }), [data, t]);

  return (
    <div className="roi-trend-chart">
      <div className="roi-trend-chart-title">{t('operations.dashboard.roiTrend')}</div>
      <ReactECharts option={option} style={{ height: 320, minHeight: 250 }} notMerge opts={{ renderer: 'svg' }} />
    </div>
  );
};

export default RoiTrendChart;
