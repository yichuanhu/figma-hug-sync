import { useMemo } from 'react';
import { Table } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import type { DepartmentRoiDetail } from '@/pages/Operations/types';
import './index.less';

interface Props {
  data: DepartmentRoiDetail[];
}

const DepartmentRoiSection = ({ data }: Props) => {
  const { t } = useTranslation();

  const columns = [
    { title: t('operations.dashboard.departmentName'), dataIndex: 'department', width: 130 },
    { title: t('operations.roiAnalysis.investmentCost'), dataIndex: 'investmentCost', width: 120,
      render: (v: number) => `$${(v / 1000).toFixed(0)}K` },
    { title: t('operations.roiAnalysis.savedCost'), dataIndex: 'savedCost', width: 120,
      render: (v: number) => `$${(v / 1000).toFixed(0)}K` },
    { title: 'ROI', dataIndex: 'roi', width: 80, render: (v: number) => `${v}%` },
    { title: t('operations.roiAnalysis.reqCount'), dataIndex: 'requirementCount', width: 80 },
    { title: t('operations.roiAnalysis.robotCount'), dataIndex: 'robotCount', width: 80 },
  ];

  // Bar chart - dept comparison
  const barOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: [t('operations.roiAnalysis.investmentCost'), t('operations.roiAnalysis.savedCost')], bottom: 0, textStyle: { fontSize: 12 } },
    grid: { left: 60, right: 20, top: 16, bottom: 40 },
    xAxis: { type: 'category', data: data.map(d => d.department), axisLabel: { fontSize: 11, rotate: data.length > 4 ? 15 : 0 } },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `$${(v / 1000).toFixed(0)}K`, fontSize: 11 } },
    series: [
      { name: t('operations.roiAnalysis.investmentCost'), type: 'bar', data: data.map(d => d.investmentCost), barWidth: 20, itemStyle: { color: '#FF7D00', borderRadius: [3, 3, 0, 0] } },
      { name: t('operations.roiAnalysis.savedCost'), type: 'bar', data: data.map(d => d.savedCost), barWidth: 20, itemStyle: { color: '#00B42A', borderRadius: [3, 3, 0, 0] } },
    ],
  }), [data, t]);

  // Multi-line trend chart
  const trendOption = useMemo(() => {
    const maxLen = Math.max(...data.map(d => d.trend.length));
    const months = Array.from({ length: maxLen }, (_, i) => `M${i + 1}`);
    const colors = ['#165DFF', '#00B42A', '#FF7D00', '#F53F3F', '#722ED1'];
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: data.map(d => d.department), bottom: 0, textStyle: { fontSize: 12 } },
      grid: { left: 50, right: 20, top: 16, bottom: 40 },
      xAxis: { type: 'category', data: months, axisLabel: { fontSize: 11 } },
      yAxis: { type: 'value', axisLabel: { formatter: '{value}%', fontSize: 11 } },
      series: data.map((d, i) => ({
        name: d.department,
        type: 'line',
        data: d.trend,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2, color: colors[i % colors.length] },
        itemStyle: { color: colors[i % colors.length] },
      })),
    };
  }, [data]);

  return (
    <div className="department-roi-section dashboard-card">
      <div className="dashboard-card-header">
        <span className="dashboard-card-title">{t('operations.roiAnalysis.departmentRoi')}</span>
      </div>
      <div className="department-roi-content">
        <div className="department-roi-left">
          <div className="chart-subtitle">{t('operations.roiAnalysis.deptComparison')}</div>
          <ReactECharts option={barOption} style={{ height: 260 }} opts={{ renderer: 'svg' }} />
          <Table columns={columns} dataSource={data} rowKey="department" size="small" pagination={false} style={{ marginTop: 12 }} />
        </div>
        <div className="department-roi-right">
          <div className="chart-subtitle">{t('operations.roiAnalysis.deptTrend')}</div>
          <ReactECharts option={trendOption} style={{ height: 300 }} opts={{ renderer: 'svg' }} />
        </div>
      </div>
    </div>
  );
};

export default DepartmentRoiSection;
