import { useMemo } from 'react';
import { Table, Tag } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import type { RequirementRoiDetail } from '@/pages/Operations/types';
import './index.less';

interface Props {
  data: RequirementRoiDetail[];
}

/* ECharts default theme colors */
const ECHARTS_COLORS = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderColor: '#E5E7EB',
  borderWidth: 1,
  textStyle: { color: '#333', fontSize: 12 },
  padding: [10, 14],
  extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 8px;',
};

const RequirementRoiSection = ({ data }: Props) => {
  const { t } = useTranslation();

  const statusMap: Record<string, { label: string; color: string }> = {
    running: { label: t('operations.dashboard.statusRunning'), color: 'green' },
    completed: { label: t('operations.dashboard.statusCompleted'), color: 'blue' },
    developing: { label: t('operations.dashboard.statusDeveloping'), color: 'orange' },
  };

  const columns = [
    { title: '#', dataIndex: 'id', width: 50, render: (_: string, __: RequirementRoiDetail, idx: number) => (
      <span className={`roi-rank-badge ${idx < 3 ? 'top' : ''}`}>{idx + 1}</span>
    )},
    { title: t('operations.roiAnalysis.reqName'), dataIndex: 'name', width: 220 },
    { title: t('operations.dashboard.departmentName'), dataIndex: 'department', width: 120 },
    { title: 'ROI', dataIndex: 'roi', width: 80, render: (v: number) => (
      <span style={{ color: v >= 200 ? '#91cc75' : v >= 100 ? '#5470c6' : '#fac858', fontWeight: 600 }}>{v}%</span>
    )},
    { title: t('operations.roiAnalysis.investmentCost'), dataIndex: 'investmentCost', width: 120,
      render: (v: number) => `$${(v / 1000).toFixed(0)}K` },
    { title: t('operations.roiAnalysis.savedCost'), dataIndex: 'savedCost', width: 120,
      render: (v: number) => `$${(v / 1000).toFixed(0)}K` },
    { title: t('common.status'), dataIndex: 'status', width: 100,
      render: (s: string) => {
        const info = statusMap[s] || { label: s, color: 'grey' };
        return <Tag color={info.color as any} size="small">{info.label}</Tag>;
      }
    },
  ];

  // Pie chart - ROI distribution
  const pieOption = useMemo(() => {
    const ranges = [
      { name: '0–100%', min: 0, max: 100 },
      { name: '100–200%', min: 100, max: 200 },
      { name: '200–300%', min: 200, max: 300 },
      { name: '300%+', min: 300, max: Infinity },
    ];
    const pieData = ranges.map(r => ({
      name: r.name,
      value: data.filter(d => d.roi >= r.min && d.roi < r.max).length,
    })).filter(d => d.value > 0);

    return {
      color: ECHARTS_COLORS,
      tooltip: { ...TOOLTIP_STYLE, trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, textStyle: { fontSize: 12, color: '#666' }, itemWidth: 12, itemHeight: 12, itemGap: 16 },
      series: [{
        type: 'pie',
        radius: ['42%', '72%'],
        center: ['50%', '42%'],
        data: pieData,
        label: { show: true, formatter: '{b}\n{d}%', fontSize: 11, color: '#666' },
        labelLine: { length: 12, length2: 8 },
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        emphasis: {
          itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.12)' },
          label: { fontSize: 13, fontWeight: 600 },
        },
        animationType: 'scale',
        animationEasing: 'cubicOut',
      }],
    };
  }, [data]);

  // Scatter chart - Investment vs Savings
  const scatterOption = useMemo(() => ({
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'item',
      formatter: (p: any) =>
        `<div style="font-weight:600;margin-bottom:4px">${p.data[3]}</div>` +
        `<div style="display:flex;justify-content:space-between;gap:16px"><span style="color:#999">${t('operations.roiAnalysis.investmentCost')}</span><span style="font-weight:500">$${(p.data[0] / 1000).toFixed(0)}K</span></div>` +
        `<div style="display:flex;justify-content:space-between;gap:16px"><span style="color:#999">${t('operations.roiAnalysis.savedCost')}</span><span style="font-weight:500">$${(p.data[1] / 1000).toFixed(0)}K</span></div>` +
        `<div style="display:flex;justify-content:space-between;gap:16px"><span style="color:#999">ROI</span><span style="font-weight:600;color:${p.data[2] >= 200 ? '#91cc75' : '#5470c6'}">${p.data[2]}%</span></div>`,
    },
    grid: { left: 64, right: 24, top: 24, bottom: 44 },
    xAxis: {
      name: t('operations.roiAnalysis.investmentCost'),
      nameTextStyle: { fontSize: 11, color: '#999' },
      axisLabel: { formatter: (v: number) => `$${(v / 1000).toFixed(0)}K`, fontSize: 11, color: '#999' },
      axisLine: { lineStyle: { color: '#ccc' } },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
    },
    yAxis: {
      name: t('operations.roiAnalysis.savedCost'),
      nameTextStyle: { fontSize: 11, color: '#999' },
      axisLabel: { formatter: (v: number) => `$${(v / 1000).toFixed(0)}K`, fontSize: 11, color: '#999' },
      axisLine: { lineStyle: { color: '#ccc' } },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
    },
    series: [{
      type: 'scatter',
      data: data.map(d => [d.investmentCost, d.savedCost, d.roi, d.name]),
      symbolSize: (val: number[]) => Math.max(12, Math.min(val[2] / 6, 44)),
      itemStyle: {
        color: (params: any) => {
          const roi = params.data[2];
          if (roi >= 300) return ECHARTS_COLORS[1]; // green
          if (roi >= 200) return ECHARTS_COLORS[0]; // blue
          if (roi >= 100) return ECHARTS_COLORS[2]; // yellow
          return ECHARTS_COLORS[3]; // red
        },
        opacity: 0.75,
        shadowBlur: 6,
        shadowColor: 'rgba(0,0,0,0.08)',
      },
      emphasis: {
        itemStyle: { opacity: 1, shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.15)', borderColor: '#fff', borderWidth: 2 },
      },
      animationDelay: (idx: number) => idx * 80,
    }],
  }), [data, t]);

  return (
    <div className="requirement-roi-section dashboard-card">
      <div className="dashboard-card-header">
        <span className="dashboard-card-title">{t('operations.roiAnalysis.requirementRoi')}</span>
      </div>
      <div className="requirement-roi-content">
        <div className="requirement-roi-charts-row">
          <div className="requirement-roi-chart-item">
            <div className="chart-subtitle">{t('operations.roiAnalysis.roiDistribution')}</div>
            <ReactECharts option={pieOption} style={{ height: 260, width: '100%' }} notMerge opts={{ renderer: 'svg' }} />
          </div>
          <div className="requirement-roi-chart-item">
            <div className="chart-subtitle">{t('operations.roiAnalysis.investVsSaved')}</div>
            <ReactECharts option={scatterOption} style={{ height: 260, width: '100%' }} notMerge opts={{ renderer: 'svg' }} />
          </div>
        </div>
        <div className="requirement-roi-table">
          <Table columns={columns} dataSource={data} rowKey="id" size="small" pagination={false} />
        </div>
      </div>
    </div>
  );
};

export default RequirementRoiSection;
