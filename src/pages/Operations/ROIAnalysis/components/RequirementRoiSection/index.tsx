import { useMemo } from 'react';
import { Table, Tag } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import type { RequirementRoiDetail } from '@/pages/Operations/types';
import './index.less';

interface Props {
  data: RequirementRoiDetail[];
}

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
    { title: 'ROI', dataIndex: 'roi', width: 80, render: (v: number) => `${v}%` },
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

  // Pie chart - ROI distribution by range
  const pieOption = useMemo(() => {
    const ranges = [
      { name: '0-100%', min: 0, max: 100 },
      { name: '100-200%', min: 100, max: 200 },
      { name: '200-300%', min: 200, max: 300 },
      { name: '300%+', min: 300, max: Infinity },
    ];
    const pieData = ranges.map(r => ({
      name: r.name,
      value: data.filter(d => d.roi >= r.min && d.roi < r.max).length,
    })).filter(d => d.value > 0);

    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, textStyle: { fontSize: 12 } },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        data: pieData,
        label: { show: true, formatter: '{b}\n{d}%', fontSize: 11 },
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        color: ['#165DFF', '#00B42A', '#FF7D00', '#F53F3F'],
      }],
    };
  }, [data]);

  // Scatter chart - Investment vs Savings
  const scatterOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => `${p.data[3]}<br/>${t('operations.roiAnalysis.investmentCost')}: $${(p.data[0] / 1000).toFixed(0)}K<br/>${t('operations.roiAnalysis.savedCost')}: $${(p.data[1] / 1000).toFixed(0)}K<br/>ROI: ${p.data[2]}%`,
    },
    grid: { left: 60, right: 20, top: 20, bottom: 40 },
    xAxis: {
      name: t('operations.roiAnalysis.investmentCost'),
      nameTextStyle: { fontSize: 11 },
      axisLabel: { formatter: (v: number) => `$${(v / 1000).toFixed(0)}K`, fontSize: 11 },
    },
    yAxis: {
      name: t('operations.roiAnalysis.savedCost'),
      nameTextStyle: { fontSize: 11 },
      axisLabel: { formatter: (v: number) => `$${(v / 1000).toFixed(0)}K`, fontSize: 11 },
    },
    series: [{
      type: 'scatter',
      data: data.map(d => [d.investmentCost, d.savedCost, d.roi, d.name]),
      symbolSize: (val: number[]) => Math.max(10, Math.min(val[2] / 8, 40)),
      itemStyle: { color: '#165DFF', opacity: 0.7 },
    }],
  }), [data, t]);

  return (
    <div className="requirement-roi-section dashboard-card">
      <div className="dashboard-card-header">
        <span className="dashboard-card-title">{t('operations.roiAnalysis.requirementRoi')}</span>
      </div>
      <div className="requirement-roi-content">
        <div className="requirement-roi-table">
          <Table columns={columns} dataSource={data} rowKey="id" size="small" pagination={false} />
        </div>
        <div className="requirement-roi-charts">
          <div className="requirement-roi-chart-item">
            <div className="chart-subtitle">{t('operations.roiAnalysis.roiDistribution')}</div>
            <ReactECharts option={pieOption} style={{ height: 220 }} opts={{ renderer: 'svg' }} />
          </div>
          <div className="requirement-roi-chart-item">
            <div className="chart-subtitle">{t('operations.roiAnalysis.investVsSaved')}</div>
            <ReactECharts option={scatterOption} style={{ height: 220 }} opts={{ renderer: 'svg' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequirementRoiSection;
