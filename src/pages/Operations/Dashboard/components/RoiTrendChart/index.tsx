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
      axisPointer: { type: 'cross', crossStyle: { color: '#C9CDD4' }, lineStyle: { color: '#C9CDD4', type: 'dashed' } },
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#E5E8EF',
      borderWidth: 1,
      textStyle: { color: '#1D2129', fontSize: 12 },
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
      textStyle: { fontSize: 12, color: '#86909C' },
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
      axisLabel: { fontSize: 12, color: '#86909C' },
      axisLine: { lineStyle: { color: '#E5E8EF' } },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        name: 'ROI%',
        nameTextStyle: { color: '#86909C', fontSize: 11 },
        position: 'left',
        axisLabel: { formatter: '{value}%', fontSize: 12, color: '#86909C' },
        axisLine: { show: false },
        splitLine: { lineStyle: { type: 'dashed', color: '#F2F3F5' } },
      },
      {
        type: 'value',
        name: t('operations.dashboard.amountUnit'),
        nameTextStyle: { color: '#86909C', fontSize: 11 },
        position: 'right',
        axisLabel: {
          formatter: (val: number) => `${(val / 10000).toFixed(0)}${t('operations.dashboard.tenThousandUnit')}`,
          fontSize: 12,
          color: '#86909C',
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
        lineStyle: { width: 2.5, color: '#94BFFF' },
        itemStyle: { color: '#94BFFF', borderWidth: 2, borderColor: '#fff' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
          { offset: 0, color: 'rgba(148,191,255,0.10)' },
          { offset: 1, color: 'rgba(148,191,255,0.01)' },
        ]}},
      },
      {
        name: t('operations.dashboard.investmentCostLabel'),
        type: 'bar',
        yAxisIndex: 1,
        data: data.map((d) => d.investmentCost),
        barWidth: 16,
        itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#FFCF8B' }, { offset: 1, color: '#F7BA6A' }] }, borderRadius: [3, 3, 0, 0] },
        emphasis: { itemStyle: { shadowBlur: 6, shadowColor: 'rgba(255,207,139,0.3)' } },
      },
      {
        name: t('operations.dashboard.savedCostLabel'),
        type: 'bar',
        yAxisIndex: 1,
        data: data.map((d) => d.savedCost),
        barWidth: 16,
        itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#7BE188' }, { offset: 1, color: '#5DC96A' }] }, borderRadius: [3, 3, 0, 0] },
        emphasis: { itemStyle: { shadowBlur: 6, shadowColor: 'rgba(123,225,136,0.3)' } },
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
