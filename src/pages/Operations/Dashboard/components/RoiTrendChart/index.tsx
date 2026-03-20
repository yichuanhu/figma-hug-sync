import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import type { RoiTrendPoint } from '@/pages/Operations/types';
import './index.less';

interface RoiTrendChartProps {
  data: RoiTrendPoint[];
}

const RoiTrendChart = ({ data }: RoiTrendChartProps) => {
  const { t } = useTranslation();

  const option = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: [
        t('operations.dashboard.roiPercent'),
        t('operations.dashboard.investmentCostLabel'),
        t('operations.dashboard.savedCostLabel'),
      ],
      bottom: 0,
      textStyle: { fontSize: 12 },
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
      axisLabel: { fontSize: 12 },
    },
    yAxis: [
      {
        type: 'value',
        name: 'ROI%',
        position: 'left',
        axisLabel: { formatter: '{value}%', fontSize: 12 },
        splitLine: { lineStyle: { type: 'dashed', color: '#f0f0f0' } },
      },
      {
        type: 'value',
        name: t('operations.dashboard.amountUnit'),
        position: 'right',
        axisLabel: {
          formatter: (val: number) => `${(val / 10000).toFixed(0)}万`,
          fontSize: 12,
        },
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
        lineStyle: { width: 2.5, color: '#165DFF' },
        itemStyle: { color: '#165DFF' },
      },
      {
        name: t('operations.dashboard.investmentCostLabel'),
        type: 'bar',
        yAxisIndex: 1,
        data: data.map((d) => d.investmentCost),
        barWidth: 16,
        itemStyle: { color: '#FF7D00', borderRadius: [3, 3, 0, 0] },
      },
      {
        name: t('operations.dashboard.savedCostLabel'),
        type: 'bar',
        yAxisIndex: 1,
        data: data.map((d) => d.savedCost),
        barWidth: 16,
        itemStyle: { color: '#00B42A', borderRadius: [3, 3, 0, 0] },
      },
    ],
  }), [data, t]);

  return (
    <div className="roi-trend-chart">
      <div className="roi-trend-chart-title">{t('operations.dashboard.roiTrend')}</div>
      <ReactECharts option={option} style={{ height: 320 }} notMerge />
    </div>
  );
};

export default RoiTrendChart;
